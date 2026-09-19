package model

import (
	"errors"
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"gorm.io/gorm"
)

// lotteryRecordLimit 状态接口返回的近期抽奖记录条数。
const lotteryRecordLimit = 20

// LotteryDraw 抽奖记录。
//
// 一张表同时承担两个职责：
//  1. 发奖凭证与审计依据；
//  2. 推算用户下一档位 —— (user_id, mode, draw_index) 的唯一索引让同一档位
//     只可能被写入一次，因此并发抽奖会被数据库直接挡掉，无需额外加锁。
type LotteryDraw struct {
	Id         int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId     int    `json:"user_id" gorm:"not null;uniqueIndex:idx_lottery_user_mode_index,priority:1"`
	Mode       string `json:"mode" gorm:"type:varchar(20);not null;uniqueIndex:idx_lottery_user_mode_index,priority:2"`
	DrawIndex  int    `json:"draw_index" gorm:"not null;uniqueIndex:idx_lottery_user_mode_index,priority:3"`
	PrizeQuota int    `json:"prize_quota" gorm:"not null"`
	CreatedAt  int64  `json:"created_at" gorm:"bigint;index"`
}

func (LotteryDraw) TableName() string {
	return "lottery_draws"
}

// LotteryStatus 抽奖状态，供用户端展示。
type LotteryStatus struct {
	Enabled       bool                              `json:"enabled"`
	Mode          string                            `json:"mode"`
	UsedQuota     int                               `json:"used_quota"`
	DrawnCount    int                               `json:"drawn_count"`
	DrawableCount int                               `json:"drawable_count"`
	NextThreshold int                               `json:"next_threshold"`
	NextPrizes    []operation_setting.LotteryPrize  `json:"next_prizes"`
	Records       []LotteryDraw                     `json:"records"`
	// 以下三个展示开关都由福利中心统一持有（与限时活动共用同一份配置），
	// 用户端据此决定奖池、中奖概率与抽奖记录是否出现
	ShowPrizePool   bool `json:"show_prize_pool"`
	ShowProbability bool `json:"show_probability"`
	ShowHistory     bool `json:"show_history"`
}

func countUserLotteryDraws(userId int, mode string) (int, error) {
	var count int64
	err := DB.Model(&LotteryDraw{}).
		Where("user_id = ? AND mode = ?", userId, mode).
		Count(&count).Error
	return int(count), err
}

// GetUserLotteryStatus 汇总用户的抽奖进度。
// 抽奖未启用时返回 Enabled=false 的空状态，而不是报错，便于前端直接隐藏入口。
func GetUserLotteryStatus(userId int) (*LotteryStatus, error) {
	setting := operation_setting.GetLotterySetting()
	if !setting.Enabled {
		return &LotteryStatus{Enabled: false}, nil
	}
	usedQuota, err := GetUserUsedQuota(userId)
	if err != nil {
		return nil, err
	}
	drawnCount, err := countUserLotteryDraws(userId, setting.Mode)
	if err != nil {
		return nil, err
	}
	nextIndex := drawnCount + 1

	drawableCount := 0
	if setting.Mode == operation_setting.LotteryModeTiered {
		// 阶梯式是逐级解锁的：只判断下一档是否已达标
		if usedQuota >= setting.TierThresholdQuota(nextIndex) {
			drawableCount = 1
		}
	} else {
		drawableCount = setting.EarnedDrawsFor(usedQuota) - drawnCount
		if drawableCount < 0 {
			drawableCount = 0
		}
	}

	records := make([]LotteryDraw, 0, lotteryRecordLimit)
	if err := DB.Where("user_id = ? AND mode = ?", userId, setting.Mode).
		Order("draw_index desc").
		Limit(lotteryRecordLimit).
		Find(&records).Error; err != nil {
		return nil, err
	}

	return &LotteryStatus{
		Enabled:       true,
		Mode:          setting.Mode,
		UsedQuota:     usedQuota,
		DrawnCount:    drawnCount,
		DrawableCount: drawableCount,
		NextThreshold: setting.ThresholdQuotaFor(nextIndex),
		NextPrizes:    setting.PrizePoolFor(nextIndex),
		Records: records,

		ShowPrizePool:   setting.ShowPrizePool,
		ShowProbability: setting.ShowPrizeProbability,
		ShowHistory:     setting.ShowLotteryHistory,
	}, nil
}

// UserDrawLottery 执行一次抽奖并发放奖品额度。
//
// 记账安全：额度发放统一走 creditTopUpQuota，它在同一条 UPDATE 里完成
// 「钱包封顶判断 + 加额度」，与充值/兑换码链路一致，避免并发超发；
// 事务提交后再同步 Redis 缓存，否则新到账的额度在缓存过期前对预扣不可见。
func UserDrawLottery(userId int) (*LotteryDraw, error) {
	setting := operation_setting.GetLotterySetting()
	if !setting.Enabled {
		return nil, errors.New("抽奖功能未启用")
	}
	if err := operation_setting.ValidateLotterySetting(setting); err != nil {
		common.SysError("invalid lottery setting: " + err.Error())
		return nil, errors.New("抽奖配置无效，请联系管理员")
	}

	usedQuota, err := GetUserUsedQuota(userId)
	if err != nil {
		return nil, err
	}
	drawnCount, err := countUserLotteryDraws(userId, setting.Mode)
	if err != nil {
		return nil, err
	}
	nextIndex := drawnCount + 1

	if setting.Mode == operation_setting.LotteryModeTiered {
		required := setting.TierThresholdQuota(nextIndex)
		if usedQuota < required {
			return nil, fmt.Errorf("累计消费未达到第 %d 次抽奖门槛（需 %d，当前 %d）", nextIndex, required, usedQuota)
		}
	} else if setting.EarnedDrawsFor(usedQuota) < nextIndex {
		return nil, errors.New("暂无可用抽奖机会，继续使用后会自动累积")
	}

	prizeQuota, err := operation_setting.PickLotteryPrize(setting.PrizePoolFor(nextIndex))
	if err != nil {
		return nil, err
	}
	if prizeQuota <= 0 {
		return nil, errors.New("奖品额度无效")
	}
	if err := common.ValidateWalletQuota(prizeQuota); err != nil {
		return nil, err
	}

	draw := &LotteryDraw{
		UserId:     userId,
		Mode:       setting.Mode,
		DrawIndex:  nextIndex,
		PrizeQuota: prizeQuota,
		CreatedAt:  time.Now().Unix(),
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		// 唯一索引兜底：两个并发请求即使都通过了上面的门槛判断，
		// 也只可能有一个写成功。
		if err := tx.Create(draw).Error; err != nil {
			return errors.New("抽奖失败，请重试")
		}
		return creditTopUpQuota(tx, userId, prizeQuota, nil)
	})
	if err != nil {
		return nil, err
	}

	syncCreditUserQuotaCache(userId, prizeQuota, "lottery")
	RecordLog(userId, LogTypeTopup, fmt.Sprintf("抽奖获得额度 %s（%s，第 %d 次）",
		logger.LogQuota(prizeQuota), setting.Mode, nextIndex))
	return draw, nil
}
