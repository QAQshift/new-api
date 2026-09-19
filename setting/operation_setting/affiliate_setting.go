package operation_setting

import (
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

// 返利比例使用「万分比」（basis point）整数表示，避免浮点数进入计费链路。
// 500 = 5%，10000 = 100%。
const affiliateRateBpScale = 10000

// maxAffiliateRateBp 限制单档返利比例不超过 100%。
// 返利额度不得超过产生它的充值额度本身，否则就变成了凭空造钱。
const maxAffiliateRateBp = affiliateRateBpScale

// AffiliateTier 描述「被邀请人第 N 次充值」适用的返利比例。
//
// 参照 bblabu 的口径：前 3 次充值返 5%，第 4 次起永久返 3%。因此档位是
// 「按次数分档」而不是「按金额分档」：
//
//	Times > 0  该档覆盖第 1..Times 次
//	Times <= 0 兜底档，覆盖其余全部次数（最多只能有一个兜底档）
type AffiliateTier struct {
	Times  int `json:"times"`
	RateBp int `json:"rate_bp"`
}

// AffiliatePromoTemplate 推广页上一条可复制的文案。
// Text 支持 {{site}} 与 {{link}} 两个占位符，由前端替换成实际站点名与邀请链接。
type AffiliatePromoTemplate struct {
	Label string `json:"label"`
	Text  string `json:"text"`
}

// 推广素材与海报的规模上限。这些值会随接口下发给每个用户，因此必须在写入时
// 就限制住，而不是等渲染时兜底。
const (
	// MaxAffiliatePromoTemplates 推广文案条数上限。
	MaxAffiliatePromoTemplates = 10
	// MaxAffiliatePromoLabelLength 文案标签长度上限。
	MaxAffiliatePromoLabelLength = 30
	// MaxAffiliatePromoTextLength 单条文案长度上限。
	MaxAffiliatePromoTextLength = 500
	// MaxAffiliatePosterUrlLength 海报背景图地址长度上限。
	MaxAffiliatePosterUrlLength = 2000
)

// AffiliateSetting 邀请充值返利配置。
//
// 返利额度不直接进入可转移池，而是先进「待确认」池，冷却期结束才释放。
// 这是为了覆盖支付渠道的拒付/争议窗口：本系统没有退款处理，冷却期是唯一
// 的兜底手段。
type AffiliateSetting struct {
	Enabled bool `json:"enabled"`
	// Tiers 必须按 Times 升序排列，兜底档（Times <= 0）放在最后。
	Tiers []AffiliateTier `json:"tiers"`
	// CooldownDays 返利进入待确认池后，多少天后释放为可转移额度。
	CooldownDays int `json:"cooldown_days"`
	// MaxRebatePerInvitee 单个被邀请人累计可产生的返利上限，0 表示不限制。
	MaxRebatePerInvitee int `json:"max_rebate_per_invitee"`
	// PromoTemplates 推广页的可复制文案。留空时前端使用内置的三条默认文案，
	// 因此不配置也不会让推广页变空。
	PromoTemplates []AffiliatePromoTemplate `json:"promo_templates"`
	// PosterBackgroundUrl 海报背景图。
	//
	// 留空时使用内置的纯色版式。图片建议放站内相对路径（如 /uploads/x.png）：
	// 同源图片不会被跨域污染，导出一定成功；跨域图片需要对方返回 CORS 头，
	// 否则前端会自动退回内置版式。
	PosterBackgroundUrl string `json:"poster_background_url"`
}

// 默认档位与 bblabu 对齐：前 3 次 5%，第 4 次起 3%。
// 默认关闭，避免部署后突然对所有站点生效（与签到/抽奖/限时活动保持一致）。
var affiliateSetting = AffiliateSetting{
	Enabled: false,
	Tiers: []AffiliateTier{
		{Times: 3, RateBp: 500},
		{Times: 0, RateBp: 300},
	},
	CooldownDays:        7,
	MaxRebatePerInvitee: 0,
}

func init() {
	config.GlobalConfig.Register("affiliate_setting", &affiliateSetting)
}

func GetAffiliateSetting() *AffiliateSetting {
	return &affiliateSetting
}

func clampAffiliateRateBp(rateBp int) int {
	if rateBp <= 0 {
		return 0
	}
	if rateBp > maxAffiliateRateBp {
		return maxAffiliateRateBp
	}
	return rateBp
}

// TierRateBp 返回第 topupOrdinal 次充值（1-based）适用的返利比例（万分比）。
//
// 没有任何档位覆盖该次数时返回 0，表示这一次不返利（例如只配了前 3 次
// 而没有兜底档）。
func (s *AffiliateSetting) TierRateBp(topupOrdinal int) int {
	if s == nil || len(s.Tiers) == 0 {
		return 0
	}
	if topupOrdinal < 1 {
		topupOrdinal = 1
	}

	fallbackBp := 0
	hasFallback := false
	for _, tier := range s.Tiers {
		if tier.Times <= 0 {
			// 兜底档：记录后继续扫描，保证 Times > 0 的档位优先匹配
			if !hasFallback {
				fallbackBp = tier.RateBp
				hasFallback = true
			}
			continue
		}
		if topupOrdinal <= tier.Times {
			return clampAffiliateRateBp(tier.RateBp)
		}
	}
	if hasFallback {
		return clampAffiliateRateBp(fallbackBp)
	}
	return 0
}

// CalcRebateQuota 计算一次充值的返利额度。
//
// 全程整数运算：先用饱和乘得到 baseQuota × rateBp，再整除 10000。除法向下
// 取整，宁可少给一分也不多给。档位与比例都是管理员配置的，因此乘法必须防
// 溢出（AGENTS.md 计费安全不变量）。
func (s *AffiliateSetting) CalcRebateQuota(baseQuota int, topupOrdinal int) int {
	if s == nil || baseQuota <= 0 {
		return 0
	}
	rateBp := s.TierRateBp(topupOrdinal)
	if rateBp <= 0 {
		return 0
	}

	product := saturatingMul(int64(baseQuota), int64(rateBp))
	rebate := product / affiliateRateBpScale
	if rebate <= 0 {
		return 0
	}
	if rebate > int64(common.MaxWalletQuota) {
		return common.MaxWalletQuota
	}
	return int(rebate)
}

// validateAffiliatePromoTemplates 校验推广文案列表。
func validateAffiliatePromoTemplates(templates []AffiliatePromoTemplate) error {
	if len(templates) > MaxAffiliatePromoTemplates {
		return fmt.Errorf("推广文案最多 %d 条", MaxAffiliatePromoTemplates)
	}
	for i, template := range templates {
		label := strings.TrimSpace(template.Label)
		if label == "" {
			return fmt.Errorf("第 %d 条推广文案的标签不能为空", i+1)
		}
		if len([]rune(label)) > MaxAffiliatePromoLabelLength {
			return fmt.Errorf("第 %d 条推广文案的标签超过 %d 个字", i+1, MaxAffiliatePromoLabelLength)
		}
		text := strings.TrimSpace(template.Text)
		if text == "" {
			return fmt.Errorf("第 %d 条推广文案的内容不能为空", i+1)
		}
		if len([]rune(text)) > MaxAffiliatePromoTextLength {
			return fmt.Errorf("第 %d 条推广文案超过 %d 个字", i+1, MaxAffiliatePromoTextLength)
		}
	}
	return nil
}

// validateAffiliatePosterUrl 校验海报背景图地址。
//
// 允许站内相对路径（以 / 开头），因为同源图片不会被跨域污染，导出必定成功；
// 跨域图片需要对方返回 CORS 头，前端加载失败时会自动退回内置版式。
func validateAffiliatePosterUrl(raw string) error {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil
	}
	if len(trimmed) > MaxAffiliatePosterUrlLength {
		return errors.New("海报背景图地址过长")
	}
	// 排除 "//evil.com" 这种协议相对地址：它不是站内路径
	if strings.HasPrefix(trimmed, "/") && !strings.HasPrefix(trimmed, "//") {
		return nil
	}
	parsed, err := url.Parse(trimmed)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return errors.New("海报背景图地址必须是 http(s) 链接或以 / 开头的站内路径")
	}
	return nil
}

// ValidateAffiliateSetting 校验配置整体一致性，供管理端保存时调用。
//
// 关闭状态下允许保存不完整配置，避免管理员必须先把配置填完整才能关闭入口。
func ValidateAffiliateSetting(s AffiliateSetting) error {
	if s.CooldownDays < 0 {
		return errors.New("冷却天数不能为负数")
	}
	if s.MaxRebatePerInvitee < 0 {
		return errors.New("单个被邀请人返利上限不能为负数")
	}
	if err := validateAffiliatePromoTemplates(s.PromoTemplates); err != nil {
		return err
	}
	if err := validateAffiliatePosterUrl(s.PosterBackgroundUrl); err != nil {
		return err
	}
	if len(s.Tiers) == 0 {
		if s.Enabled {
			return errors.New("启用返利时必须至少配置一个档位")
		}
		return nil
	}

	fallbackCount := 0
	lastTimes := 0
	for i, tier := range s.Tiers {
		if tier.RateBp < 0 || tier.RateBp > maxAffiliateRateBp {
			return fmt.Errorf("第 %d 个档位的返利比例必须在 0%% ~ 100%% 之间", i+1)
		}
		if tier.Times <= 0 {
			fallbackCount++
			continue
		}
		if tier.Times <= lastTimes {
			return errors.New("档位次数必须严格递增，请检查是否有重复或乱序的次数")
		}
		lastTimes = tier.Times
	}
	if fallbackCount > 1 {
		return errors.New("只能配置一个兜底档位（次数留空或填 0）")
	}
	if s.Enabled && fallbackCount == 0 {
		return errors.New("启用返利时必须配置一个兜底档位，否则超出档位次数的充值将不返利")
	}
	return nil
}

// ValidateAffiliateTiersJSON 解析并校验档位 JSON，供管理端单个字段保存时使用。
// ValidateAffiliatePromoTemplatesJSON 解析并校验推广文案 JSON，供管理端单字段保存时使用。
func ValidateAffiliatePromoTemplatesJSON(raw string) error {
	var templates []AffiliatePromoTemplate
	if err := common.UnmarshalJsonStr(raw, &templates); err != nil {
		return fmt.Errorf("推广文案不是合法的 JSON：%v", err)
	}
	return validateAffiliatePromoTemplates(templates)
}

func ValidateAffiliateTiersJSON(raw string) error {
	var tiers []AffiliateTier
	if err := common.UnmarshalJsonStr(raw, &tiers); err != nil {
		return fmt.Errorf("档位配置不是合法的 JSON：%v", err)
	}
	probe := affiliateSetting
	probe.Tiers = tiers
	return ValidateAffiliateSetting(probe)
}
