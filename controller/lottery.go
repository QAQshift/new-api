package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

const lotteryOptionPrefix = "lottery_setting."

// GetLotteryStatus 返回当前用户的抽奖进度、下一档奖池与近期记录
func GetLotteryStatus(c *gin.Context) {
	userId := c.GetInt("id")
	status, err := model.GetUserLotteryStatus(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": status})
}

// DrawLottery 执行一次抽奖
func DrawLottery(c *gin.Context) {
	userId := c.GetInt("id")
	draw, err := model.UserDrawLottery(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "抽奖成功",
		"data": gin.H{
			"mode":        draw.Mode,
			"draw_index":  draw.DrawIndex,
			"prize_quota": draw.PrizeQuota,
			"created_at":  draw.CreatedAt,
		},
	})
}

func parseLotteryInt(key, raw string) (int, error) {
	parsed, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil {
		return 0, fmt.Errorf("%s 必须是整数", lotteryFieldLabel(key))
	}
	return parsed, nil
}

func lotteryFieldLabel(key string) string {
	switch strings.TrimPrefix(key, lotteryOptionPrefix) {
	case "segment_consume_quota":
		return "分段式的每档消费额度"
	case "first_threshold_quota":
		return "阶梯式的首档门槛"
	case "threshold_step_quota":
		return "阶梯式的每档递增步长"
	case "tier_prize_step":
		return "阶梯式的奖品递增步长"
	case "tier_prize_max":
		return "阶梯式的奖品封顶"
	default:
		return key
	}
}

// validateLotteryOptionUpdate 校验抽奖配置更新。
//
// 先把新值套用到当前配置的副本上，再对整体做一致性校验，
// 这样管理员能在保存时就拿到具体错误，而不是等到用户抽奖时才失败。
func validateLotteryOptionUpdate(key string, raw string) error {
	current := operation_setting.GetLotterySetting()
	draft := *current
	draft.SegmentPrizes = append([]operation_setting.LotteryPrize(nil), current.SegmentPrizes...)
	draft.TierPrizes = append([]operation_setting.LotteryPrize(nil), current.TierPrizes...)

	field := strings.TrimPrefix(key, lotteryOptionPrefix)

	switch field {
	case "enabled":
		parsed, err := strconv.ParseBool(strings.TrimSpace(raw))
		if err != nil {
			return errors.New("抽奖开关必须是 true 或 false")
		}
		draft.Enabled = parsed
	case "mode":
		draft.Mode = strings.TrimSpace(raw)
	case "segment_consume_quota", "first_threshold_quota", "threshold_step_quota",
		"tier_prize_step", "tier_prize_max":
		parsed, err := parseLotteryInt(key, raw)
		if err != nil {
			return err
		}
		switch field {
		case "segment_consume_quota":
			draft.SegmentConsumeQuota = parsed
		case "first_threshold_quota":
			draft.FirstThresholdQuota = parsed
		case "threshold_step_quota":
			draft.ThresholdStepQuota = parsed
		case "tier_prize_step":
			draft.TierPrizeStep = parsed
		case "tier_prize_max":
			draft.TierPrizeMax = parsed
		}
	case "segment_prizes":
		if err := json.Unmarshal([]byte(raw), &draft.SegmentPrizes); err != nil {
			return errors.New(`分段式奖池必须是 [{"quota":额度下限,"quota_max":额度上限,"weight":权重}] 形式的 JSON 数组`)
		}
	case "tier_prizes":
		if err := json.Unmarshal([]byte(raw), &draft.TierPrizes); err != nil {
			return errors.New(`阶梯式奖池必须是 [{"quota":额度下限,"quota_max":额度上限,"weight":权重}] 形式的 JSON 数组`)
		}
	default:
		return nil
	}

	// 关闭状态下允许保存不完整配置，避免管理员必须先填完才能关闭入口
	if !draft.Enabled {
		return nil
	}
	return operation_setting.ValidateLotterySetting(&draft)
}
