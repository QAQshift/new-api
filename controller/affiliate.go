package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

const affiliateOptionPrefix = "affiliate_setting."

// validateAffiliateOptionUpdate 校验邀请返利配置的单个字段更新。
//
// 与抽奖配置同样的做法：先把新值套用到当前配置的副本上，再对整体做一致性校验。
// 这样跨字段的约束（档位次数必须递增、最多一个兜底档、启用时必须有兜底档）在
// 管理员逐字段保存时也能被拦住，而不是等到用户充值才暴露。
//
// 关闭状态允许保存不完整配置，避免管理员必须先填完整才能关闭入口。
func validateAffiliateOptionUpdate(key string, raw string) error {
	current := operation_setting.GetAffiliateSetting()
	draft := *current
	draft.Tiers = append([]operation_setting.AffiliateTier(nil), current.Tiers...)

	field := strings.TrimPrefix(key, affiliateOptionPrefix)
	trimmed := strings.TrimSpace(raw)

	switch field {
	case "enabled":
		parsed, err := strconv.ParseBool(trimmed)
		if err != nil {
			return errors.New("返利开关必须是 true 或 false")
		}
		draft.Enabled = parsed
	case "cooldown_days":
		parsed, err := strconv.Atoi(trimmed)
		if err != nil {
			return errors.New("冷却天数必须是整数")
		}
		draft.CooldownDays = parsed
	case "max_rebate_per_invitee":
		parsed, err := strconv.Atoi(trimmed)
		if err != nil {
			return errors.New("单个被邀请人返利上限必须是整数")
		}
		draft.MaxRebatePerInvitee = parsed
	case "tiers":
		if err := json.Unmarshal([]byte(trimmed), &draft.Tiers); err != nil {
			return errors.New(`返利档位必须是 [{"times":次数,"rate_bp":万分比}] 形式的 JSON 数组，例：[{"times":3,"rate_bp":500},{"times":0,"rate_bp":300}]`)
		}
	default:
		return nil
	}

	return operation_setting.ValidateAffiliateSetting(draft)
}

// AffiliateTierView 是暴露给用户端的档位说明（已经换算成百分比，前端不再算）。
type AffiliateTierView struct {
	Times       int     `json:"times"`
	From        int     `json:"from"`
	To          int     `json:"to"`
	RatePercent float64 `json:"rate_percent"`
	Fallback    bool    `json:"fallback"`
}

// buildAffiliateTierViews 把配置里的万分比档位换算成可读的百分比区间。
func buildAffiliateTierViews(setting *operation_setting.AffiliateSetting) []AffiliateTierView {
	views := make([]AffiliateTierView, 0, len(setting.Tiers))

	// 兜底档统一挪到末尾再计算区间，避免它出现在数组中部时把起始次数算错。
	ordered := make([]operation_setting.AffiliateTier, 0, len(setting.Tiers))
	var fallback *operation_setting.AffiliateTier
	for index := range setting.Tiers {
		tier := setting.Tiers[index]
		if tier.Times <= 0 {
			if fallback == nil {
				fallback = &setting.Tiers[index]
			}
			continue
		}
		ordered = append(ordered, tier)
	}
	if fallback != nil {
		ordered = append(ordered, *fallback)
	}

	from := 1
	for _, tier := range ordered {
		view := AffiliateTierView{
			Times:       tier.Times,
			From:        from,
			RatePercent: float64(tier.RateBp) / 100,
		}
		if tier.Times > 0 {
			view.To = tier.Times
			from = tier.Times + 1
		} else {
			view.Fallback = true
		}
		views = append(views, view)
	}
	return views
}

// maskInviteeName 对邀请名单里的用户名做部分遮蔽。
//
// 邀请人认识自己拉来的人，所以保留前几个字符以便辨认；但不在接口里完整暴露
// 他人的用户名。
func maskInviteeName(name string) string {
	runes := []rune(name)
	if len(runes) <= 4 {
		return name
	}
	return string(runes[:3]) + "***"
}

// GetAffiliateOverview 返回当前用户的推广数据：返利档位、三种金额、邀请名单与转化漏斗。
func GetAffiliateOverview(c *gin.Context) {
	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	setting := operation_setting.GetAffiliateSetting()

	overview, err := model.GetAffiliateOverview(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	invitees := make([]gin.H, 0, len(overview.Invitees))
	for _, invitee := range overview.Invitees {
		invitees = append(invitees, gin.H{
			"user_id":       invitee.UserId,
			"username":      maskInviteeName(invitee.Username),
			"created_at":    invitee.CreatedAt,
			"topup_count":   invitee.TopupCount,
			"used_quota":    invitee.UsedQuota,
			"request_count": invitee.RequestCount,
			"rebate_quota":  invitee.RebateQuota,
		})
	}

	registered := overview.Funnel.Registered
	activeRate := 0.0
	conversionRate := 0.0
	if registered > 0 {
		activeRate = float64(overview.Funnel.Active) / float64(registered)
		conversionRate = float64(overview.Funnel.ToppedUp) / float64(registered)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"enabled":            setting.Enabled,
			"cooldown_days":      setting.CooldownDays,
			"tiers":              buildAffiliateTierViews(setting),
			"pending_quota":      user.AffPendingQuota,
			"transferable_quota": user.AffQuota,
			"total_quota":        user.AffHistoryQuota,
			"aff_count":          user.AffCount,
			"funnel": gin.H{
				"registered":      overview.Funnel.Registered,
				"active":          overview.Funnel.Active,
				"topped_up":       overview.Funnel.ToppedUp,
				"active_rate":     activeRate,
				"conversion_rate": conversionRate,
			},
			"invitees":           invitees,
			"invitees_truncated": overview.InviteesTruncated,
		},
	})
}
