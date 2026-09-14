package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"gorm.io/gorm"
)

// 活动状态
const (
	WelfareActivityDisabled = "disabled"
	WelfareActivityUpcoming = "upcoming"
	WelfareActivityActive   = "active"
	WelfareActivityEnded    = "ended"
)

const (
	// maxWelfareActivityTitleLength 活动标题长度上限
	maxWelfareActivityTitleLength = 128
	// maxWelfareActivityPrizes 单个活动的奖池档数上限
	maxWelfareActivityPrizes = 50
)

// WelfareActivity 限时活动定义。
//
// 与抽奖不同：抽奖是长期存在、按消费门槛逐级解锁；限时活动是运营层面的
// 一次性活动，有明确的时间窗，可以单独开关，并把参与次数限制在总量/每日上。
type WelfareActivity struct {
	Id          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Title       string `json:"title" gorm:"type:varchar(128);not null"`
	Description string `json:"description" gorm:"type:text"`
	// StartsAt / EndsAt 为 Unix 秒，0 表示该侧不限制
	StartsAt int64 `json:"starts_at" gorm:"bigint;not null;default:0"`
	EndsAt   int64 `json:"ends_at" gorm:"bigint;not null;default:0"`
	// MinConsumeQuota 参与门槛：用户累计消费需达到该额度，0 表示无门槛
	MinConsumeQuota int `json:"min_consume_quota" gorm:"not null;default:0"`
	// TotalLimit 每人总参与次数上限，0 表示不限
	TotalLimit int `json:"total_limit" gorm:"not null;default:0"`
	// DailyLimit 每人每日参与次数上限，0 表示不限
	DailyLimit int `json:"daily_limit" gorm:"not null;default:0"`
	// Prizes 奖池，存储为 [{"quota":额度,"weight":权重}] 的 JSON 字符串
	Prizes string `json:"-" gorm:"type:text;not null"`
	// Enabled 上线开关，允许先配好活动再开放
	Enabled   bool  `json:"enabled" gorm:"not null;default:false"`
	CreatedAt int64 `json:"created_at" gorm:"bigint"`
	UpdatedAt int64 `json:"updated_at" gorm:"bigint"`
}

func (WelfareActivity) TableName() string {
	return "welfare_activities"
}

// WelfareActivityEntry 参与记录。
//
// 两个唯一索引分别兜住两类上限，避免并发请求同时通过计数检查：
//   - (activity_id, user_id, entry_index) —— 每人总次数
//   - (activity_id, user_id, entry_date, day_index) —— 每人每日次数
type WelfareActivityEntry struct {
	Id         int    `json:"id" gorm:"primaryKey;autoIncrement"`
	ActivityId int    `json:"activity_id" gorm:"not null;uniqueIndex:idx_welfare_entry_total,priority:1;uniqueIndex:idx_welfare_entry_daily,priority:1"`
	UserId     int    `json:"user_id" gorm:"not null;uniqueIndex:idx_welfare_entry_total,priority:2;uniqueIndex:idx_welfare_entry_daily,priority:2"`
	EntryIndex int    `json:"entry_index" gorm:"not null;uniqueIndex:idx_welfare_entry_total,priority:3"`
	EntryDate  string `json:"entry_date" gorm:"type:varchar(10);not null;uniqueIndex:idx_welfare_entry_daily,priority:3"`
	DayIndex   int    `json:"day_index" gorm:"not null;uniqueIndex:idx_welfare_entry_daily,priority:4"`
	PrizeQuota int    `json:"prize_quota" gorm:"not null"`
	CreatedAt  int64  `json:"created_at" gorm:"bigint;index"`
}

func (WelfareActivityEntry) TableName() string {
	return "welfare_activity_entries"
}

// StatusAt 返回活动在 now（Unix 秒）时刻的状态。
// 关闭优先级最高：即使还在时间窗内，未开启的活动也不对外可见。
func (a *WelfareActivity) StatusAt(now int64) string {
	if !a.Enabled {
		return WelfareActivityDisabled
	}
	if a.StartsAt > 0 && now < a.StartsAt {
		return WelfareActivityUpcoming
	}
	if a.EndsAt > 0 && now > a.EndsAt {
		return WelfareActivityEnded
	}
	return WelfareActivityActive
}

// PrizePool 解析奖池，返回错误而不是空池，避免静默按空池处理。
func (a *WelfareActivity) PrizePool() ([]operation_setting.LotteryPrize, error) {
	if strings.TrimSpace(a.Prizes) == "" {
		return nil, errors.New("活动奖池为空")
	}
	var pool []operation_setting.LotteryPrize
	if err := json.Unmarshal([]byte(a.Prizes), &pool); err != nil {
		return nil, errors.New("活动奖池格式无效")
	}
	return pool, nil
}

// ValidateWelfareActivity 校验活动配置，返回可直接展示给管理员的错误。
func ValidateWelfareActivity(a *WelfareActivity) error {
	if a == nil {
		return errors.New("活动配置不能为空")
	}
	title := strings.TrimSpace(a.Title)
	if title == "" {
		return errors.New("活动名称不能为空")
	}
	if len([]rune(title)) > maxWelfareActivityTitleLength {
		return fmt.Errorf("活动名称不能超过 %d 个字符", maxWelfareActivityTitleLength)
	}
	if a.StartsAt < 0 || a.EndsAt < 0 {
		return errors.New("活动时间不能为负数")
	}
	if a.StartsAt > 0 && a.EndsAt > 0 && a.EndsAt <= a.StartsAt {
		return errors.New("结束时间必须晚于开始时间")
	}
	if a.MinConsumeQuota < 0 {
		return errors.New("参与门槛不能为负数")
	}
	if a.TotalLimit < 0 || a.DailyLimit < 0 {
		return errors.New("参与次数上限不能为负数")
	}
	if a.TotalLimit > 0 && a.DailyLimit > a.TotalLimit {
		return errors.New("每日次数上限不能高于总次数上限")
	}

	pool, err := a.PrizePool()
	if err != nil {
		return err
	}
	if len(pool) == 0 {
		return errors.New("活动至少需要配置一档奖品")
	}
	if len(pool) > maxWelfareActivityPrizes {
		return fmt.Errorf("活动最多支持 %d 档奖品", maxWelfareActivityPrizes)
	}
	totalWeight := int64(0)
	for i, prize := range pool {
		if prize.Quota <= 0 {
			return fmt.Errorf("第 %d 档的奖品额度必须大于 0", i+1)
		}
		if prize.Quota > common.MaxWalletQuota {
			return fmt.Errorf("第 %d 档的奖品额度超过单次发放上限", i+1)
		}
		if prize.Weight <= 0 {
			return fmt.Errorf("第 %d 档的权重必须大于 0", i+1)
		}
		totalWeight += int64(prize.Weight)
		if totalWeight <= 0 {
			return errors.New("奖池权重之和超出范围")
		}
	}
	return nil
}

// MarshalPrizes 把奖池序列化为存储格式。
func MarshalPrizes(pool []operation_setting.LotteryPrize) (string, error) {
	bytes, err := json.Marshal(pool)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func countWelfareActivityEntries(tx *gorm.DB, activityId, userId int, date string) (int, error) {
	query := tx.Model(&WelfareActivityEntry{}).
		Where("activity_id = ? AND user_id = ?", activityId, userId)
	if date != "" {
		query = query.Where("entry_date = ?", date)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return int(count), nil
}

func GetWelfareActivityById(id int) (*WelfareActivity, error) {
	var activity WelfareActivity
	if err := DB.Where("id = ?", id).First(&activity).Error; err != nil {
		return nil, err
	}
	return &activity, nil
}

// WelfareActivityView 用户端活动视图，包含该用户当前能否参与。
type WelfareActivityView struct {
	Id              int                              `json:"id"`
	Title           string                           `json:"title"`
	Description     string                           `json:"description"`
	Status          string                           `json:"status"`
	StartsAt        int64                            `json:"starts_at"`
	EndsAt          int64                            `json:"ends_at"`
	MinConsumeQuota int                              `json:"min_consume_quota"`
	TotalLimit      int                              `json:"total_limit"`
	DailyLimit      int                              `json:"daily_limit"`
	Prizes          []operation_setting.LotteryPrize `json:"prizes"`
	// UsedQuota 用户当前累计消费，方便前端展示门槛进度
	UsedQuota int `json:"used_quota"`
	// EnteredCount / EnteredToday 已参与次数
	EnteredCount int `json:"entered_count"`
	EnteredToday int `json:"entered_today"`
	// RemainingTotal / RemainingToday 剩余次数，-1 表示不限
	RemainingTotal int `json:"remaining_total"`
	RemainingToday int `json:"remaining_today"`
	ThresholdMet   bool `json:"threshold_met"`
	CanEnter       bool `json:"can_enter"`
}

// ListWelfareActivitiesForUser 返回对所有用户可见的活动（未开启的不返回），
// 并附带当前用户的参与状态。
func ListWelfareActivitiesForUser(userId int) ([]WelfareActivityView, error) {
	var activities []WelfareActivity
	if err := DB.Where("enabled = ?", true).
		Order("starts_at desc, id desc").
		Find(&activities).Error; err != nil {
		return nil, err
	}

	usedQuota, err := GetUserUsedQuota(userId)
	if err != nil {
		return nil, err
	}
	today := time.Now().Format("2006-01-02")
	now := time.Now().Unix()

	views := make([]WelfareActivityView, 0, len(activities))
	for _, activity := range activities {
		pool, err := activity.PrizePool()
		if err != nil {
			// 配置损坏的活动只跳过，不影响其它活动
			common.SysError(fmt.Sprintf("welfare activity %d has invalid prize pool: %s", activity.Id, err.Error()))
			continue
		}

		enteredCount, err := countWelfareActivityEntries(DB, activity.Id, userId, "")
		if err != nil {
			return nil, err
		}
		enteredToday, err := countWelfareActivityEntries(DB, activity.Id, userId, today)
		if err != nil {
			return nil, err
		}

		remainingTotal := -1
		if activity.TotalLimit > 0 {
			remainingTotal = activity.TotalLimit - enteredCount
			if remainingTotal < 0 {
				remainingTotal = 0
			}
		}
		remainingToday := -1
		if activity.DailyLimit > 0 {
			remainingToday = activity.DailyLimit - enteredToday
			if remainingToday < 0 {
				remainingToday = 0
			}
		}

		status := activity.StatusAt(now)
		thresholdMet := activity.MinConsumeQuota <= 0 || usedQuota >= activity.MinConsumeQuota
		canEnter := status == WelfareActivityActive &&
			thresholdMet &&
			remainingTotal != 0 &&
			remainingToday != 0

		views = append(views, WelfareActivityView{
			Id:              activity.Id,
			Title:           activity.Title,
			Description:     activity.Description,
			Status:          status,
			StartsAt:        activity.StartsAt,
			EndsAt:          activity.EndsAt,
			MinConsumeQuota: activity.MinConsumeQuota,
			TotalLimit:      activity.TotalLimit,
			DailyLimit:      activity.DailyLimit,
			Prizes:          pool,
			UsedQuota:       usedQuota,
			EnteredCount:    enteredCount,
			EnteredToday:    enteredToday,
			RemainingTotal:  remainingTotal,
			RemainingToday:  remainingToday,
			ThresholdMet:    thresholdMet,
			CanEnter:        canEnter,
		})
	}
	return views, nil
}

// UserEnterWelfareActivity 参与一次限时活动并发放奖品额度。
//
// 记账与抽奖一致：额度发放走 creditTopUpQuota（同一条 UPDATE 内完成钱包封顶
// 判断与加额度），事务提交后再同步缓存。
func UserEnterWelfareActivity(userId, activityId int) (*WelfareActivityEntry, error) {
	activity, err := GetWelfareActivityById(activityId)
	if err != nil {
		return nil, errors.New("活动不存在")
	}
	if err := ValidateWelfareActivity(activity); err != nil {
		common.SysError(fmt.Sprintf("invalid welfare activity %d: %s", activityId, err.Error()))
		return nil, errors.New("活动配置无效，请联系管理员")
	}

	now := time.Now().Unix()
	switch activity.StatusAt(now) {
	case WelfareActivityDisabled:
		return nil, errors.New("活动未开启")
	case WelfareActivityUpcoming:
		return nil, errors.New("活动尚未开始")
	case WelfareActivityEnded:
		return nil, errors.New("活动已结束")
	}

	usedQuota, err := GetUserUsedQuota(userId)
	if err != nil {
		return nil, err
	}
	if activity.MinConsumeQuota > 0 && usedQuota < activity.MinConsumeQuota {
		return nil, fmt.Errorf("累计消费未达到参与门槛（需 %d，当前 %d）", activity.MinConsumeQuota, usedQuota)
	}

	today := time.Now().Format("2006-01-02")
	enteredCount, err := countWelfareActivityEntries(DB, activityId, userId, "")
	if err != nil {
		return nil, err
	}
	enteredToday, err := countWelfareActivityEntries(DB, activityId, userId, today)
	if err != nil {
		return nil, err
	}
	if activity.TotalLimit > 0 && enteredCount >= activity.TotalLimit {
		return nil, errors.New("参与次数已用完")
	}
	if activity.DailyLimit > 0 && enteredToday >= activity.DailyLimit {
		return nil, errors.New("今日参与次数已用完")
	}

	pool, err := activity.PrizePool()
	if err != nil {
		return nil, err
	}
	prizeQuota, err := operation_setting.PickLotteryPrize(pool)
	if err != nil {
		return nil, err
	}
	if prizeQuota <= 0 {
		return nil, errors.New("奖品额度无效")
	}
	if err := common.ValidateWalletQuota(prizeQuota); err != nil {
		return nil, err
	}

	entry := &WelfareActivityEntry{
		ActivityId: activityId,
		UserId:     userId,
		EntryIndex: enteredCount + 1,
		EntryDate:  today,
		DayIndex:   enteredToday + 1,
		PrizeQuota: prizeQuota,
		CreatedAt:  now,
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		// 唯一索引兜底：并发请求即使都通过了计数检查，多出来的那次也会被拒绝
		if err := tx.Create(entry).Error; err != nil {
			return errors.New("参与失败，请重试")
		}
		return creditTopUpQuota(tx, userId, prizeQuota, nil)
	})
	if err != nil {
		return nil, err
	}

	syncCreditUserQuotaCache(userId, prizeQuota, "welfare-activity")
	RecordLog(userId, LogTypeTopup, fmt.Sprintf("参与限时活动「%s」获得额度 %s（第 %d 次）",
		activity.Title, logger.LogQuota(prizeQuota), entry.EntryIndex))
	return entry, nil
}

// AdminWelfareActivityView 管理端活动视图，附带发放统计。
type AdminWelfareActivityView struct {
	WelfareActivity
	Prizes          []operation_setting.LotteryPrize `json:"prizes" gorm:"-"`
	ParticipantCount int                             `json:"participant_count" gorm:"-"`
	TotalPrizeQuota  int                             `json:"total_prize_quota" gorm:"-"`
}

type welfareActivityStat struct {
	ActivityId       int
	ParticipantCount int
	TotalPrizeQuota  int
}

// ListWelfareActivitiesForAdmin 返回全部活动（含未开启），并附带发放统计。
func ListWelfareActivitiesForAdmin() ([]AdminWelfareActivityView, error) {
	var activities []WelfareActivity
	if err := DB.Order("id desc").Find(&activities).Error; err != nil {
		return nil, err
	}

	stats := make([]welfareActivityStat, 0)
	if err := DB.Model(&WelfareActivityEntry{}).
		Select("activity_id, COUNT(DISTINCT user_id) as participant_count, COALESCE(SUM(prize_quota), 0) as total_prize_quota").
		Group("activity_id").
		Scan(&stats).Error; err != nil {
		return nil, err
	}
	statById := make(map[int]welfareActivityStat, len(stats))
	for _, stat := range stats {
		statById[stat.ActivityId] = stat
	}

	views := make([]AdminWelfareActivityView, 0, len(activities))
	for _, activity := range activities {
		pool, _ := activity.PrizePool()
		stat := statById[activity.Id]
		views = append(views, AdminWelfareActivityView{
			WelfareActivity:  activity,
			Prizes:           pool,
			ParticipantCount: stat.ParticipantCount,
			TotalPrizeQuota:  stat.TotalPrizeQuota,
		})
	}
	return views, nil
}

func CreateWelfareActivity(activity *WelfareActivity) error {
	if err := ValidateWelfareActivity(activity); err != nil {
		return err
	}
	activity.Title = strings.TrimSpace(activity.Title)
	now := time.Now().Unix()
	activity.CreatedAt = now
	activity.UpdatedAt = now
	return DB.Create(activity).Error
}

func UpdateWelfareActivity(activity *WelfareActivity) error {
	if err := ValidateWelfareActivity(activity); err != nil {
		return err
	}
	activity.Title = strings.TrimSpace(activity.Title)
	activity.UpdatedAt = time.Now().Unix()
	return DB.Model(&WelfareActivity{}).Where("id = ?", activity.Id).Updates(map[string]interface{}{
		"title":             activity.Title,
		"description":       activity.Description,
		"starts_at":         activity.StartsAt,
		"ends_at":           activity.EndsAt,
		"min_consume_quota": activity.MinConsumeQuota,
		"total_limit":       activity.TotalLimit,
		"daily_limit":       activity.DailyLimit,
		"prizes":            activity.Prizes,
		"enabled":           activity.Enabled,
		"updated_at":        activity.UpdatedAt,
	}).Error
}

// DeleteWelfareActivity 删除活动。参与记录保留，保证已发放奖品的审计链路完整。
func DeleteWelfareActivity(id int) error {
	result := DB.Where("id = ?", id).Delete(&WelfareActivity{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("活动不存在")
	}
	return nil
}
