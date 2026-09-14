package operation_setting

import (
	"math"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
)

// bblabu 口径：前 3 次充值返 5%，第 4 次起永久返 3%
func bblabuSetting() *AffiliateSetting {
	return &AffiliateSetting{
		Enabled: true,
		Tiers: []AffiliateTier{
			{Times: 3, RateBp: 500},
			{Times: 0, RateBp: 300},
		},
		CooldownDays: 7,
	}
}

func TestTierRateBpFollowsLadder(t *testing.T) {
	s := bblabuSetting()

	assert.Equal(t, 500, s.TierRateBp(1))
	assert.Equal(t, 500, s.TierRateBp(2))
	assert.Equal(t, 500, s.TierRateBp(3))
	// 第 4 次起落到兜底档，且永久有效
	assert.Equal(t, 300, s.TierRateBp(4))
	assert.Equal(t, 300, s.TierRateBp(50))
	assert.Equal(t, 300, s.TierRateBp(100000))
}

// 只配了前 N 次而没有兜底档时，超出次数的充值不返利
func TestTierRateBpWithoutFallbackReturnsZero(t *testing.T) {
	s := &AffiliateSetting{
		Enabled: true,
		Tiers:   []AffiliateTier{{Times: 2, RateBp: 1000}},
	}
	assert.Equal(t, 1000, s.TierRateBp(1))
	assert.Equal(t, 1000, s.TierRateBp(2))
	assert.Equal(t, 0, s.TierRateBp(3))
}

func TestTierRateBpHandlesEdgeInputs(t *testing.T) {
	var nilSetting *AffiliateSetting
	assert.Equal(t, 0, nilSetting.TierRateBp(1), "nil 配置不能 panic")
	assert.Equal(t, 0, (&AffiliateSetting{}).TierRateBp(1), "没有档位时不返利")

	s := bblabuSetting()
	assert.Equal(t, 500, s.TierRateBp(0), "次数 0 应按第 1 次处理")
	assert.Equal(t, 500, s.TierRateBp(-5), "非法次数应按第 1 次处理")
}

// 比例上限必须收敛：返利不得超过产生它的充值额度本身
func TestTierRateBpClampsAboveHundredPercent(t *testing.T) {
	s := &AffiliateSetting{
		Enabled: true,
		Tiers:   []AffiliateTier{{Times: 0, RateBp: 50000}},
	}
	assert.Equal(t, maxAffiliateRateBp, s.TierRateBp(1))
}

func TestCalcRebateQuotaUsesIntegerMath(t *testing.T) {
	s := bblabuSetting()

	assert.Equal(t, 50000, s.CalcRebateQuota(1000000, 1), "1000000 的 5%")
	assert.Equal(t, 30000, s.CalcRebateQuota(1000000, 4), "1000000 的 3%")
	// 除法向下取整：33333 × 500 / 10000 = 1666.65 → 1666，绝不多给
	assert.Equal(t, 1666, s.CalcRebateQuota(33333, 1))
}

// 极端输入必须饱和而不是溢出成负数
func TestCalcRebateQuotaSaturates(t *testing.T) {
	s := bblabuSetting()
	assert.Equal(t, 0, s.CalcRebateQuota(0, 1))
	assert.Equal(t, 0, s.CalcRebateQuota(-100, 1), "负数基数不产生返利")

	full := &AffiliateSetting{
		Enabled: true,
		Tiers:   []AffiliateTier{{Times: 0, RateBp: maxAffiliateRateBp}},
	}
	got := full.CalcRebateQuota(math.MaxInt64/2, 1)
	assert.Greater(t, got, 0, "饱和乘不能产出负数")
	assert.LessOrEqual(t, got, common.MaxWalletQuota, "返利不得超过钱包上限")
}

func TestValidateAffiliateSetting(t *testing.T) {
	assert.NoError(t, ValidateAffiliateSetting(*bblabuSetting()))

	// 关闭状态允许保存「不完整」配置：否则管理员必须先填完整才能关闭入口。
	// 注意「不完整」不等于「非法」—— 乱序档位在任何状态下都必须被拒绝。
	assert.NoError(t, ValidateAffiliateSetting(AffiliateSetting{Enabled: false}))
	assert.NoError(t, ValidateAffiliateSetting(AffiliateSetting{
		Enabled:      false,
		CooldownDays: 3,
		Tiers:        []AffiliateTier{{Times: 3, RateBp: 500}, {Times: 0, RateBp: 300}},
	}))
}

func TestValidateAffiliateSettingRejectsBadConfig(t *testing.T) {
	cases := []struct {
		name    string
		setting AffiliateSetting
	}{
		{
			name:    "启用但没有档位",
			setting: AffiliateSetting{Enabled: true},
		},
		{
			name: "档位次数不严格递增",
			setting: AffiliateSetting{
				Enabled: true,
				Tiers:   []AffiliateTier{{Times: 3, RateBp: 500}, {Times: 3, RateBp: 300}, {Times: 0, RateBp: 100}},
			},
		},
		{
			name: "档位次数倒序",
			setting: AffiliateSetting{
				Enabled: true,
				Tiers:   []AffiliateTier{{Times: 5, RateBp: 500}, {Times: 3, RateBp: 300}, {Times: 0, RateBp: 100}},
			},
		},
		{
			name: "档位乱序（即使未启用也必须拒绝，否则分档解析会出错）",
			setting: AffiliateSetting{
				Enabled: false,
				Tiers:   []AffiliateTier{{Times: 9, RateBp: 100}, {Times: 5, RateBp: 100}},
			},
		},
		{
			name: "存在两个兜底档",
			setting: AffiliateSetting{
				Enabled: true,
				Tiers:   []AffiliateTier{{Times: 3, RateBp: 500}, {Times: 0, RateBp: 300}, {Times: 0, RateBp: 100}},
			},
		},
		{
			name: "启用但没有兜底档",
			setting: AffiliateSetting{
				Enabled: true,
				Tiers:   []AffiliateTier{{Times: 3, RateBp: 500}},
			},
		},
		{
			name: "比例超过 100%",
			setting: AffiliateSetting{
				Enabled: true,
				Tiers:   []AffiliateTier{{Times: 0, RateBp: 20000}},
			},
		},
		{
			name: "比例为负",
			setting: AffiliateSetting{
				Enabled: true,
				Tiers:   []AffiliateTier{{Times: 0, RateBp: -1}},
			},
		},
		{
			name:    "冷却天数为负",
			setting: AffiliateSetting{Enabled: false, CooldownDays: -1},
		},
		{
			name:    "返利上限为负",
			setting: AffiliateSetting{Enabled: false, MaxRebatePerInvitee: -1},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Error(t, ValidateAffiliateSetting(tc.setting))
		})
	}
}

// 默认配置本身必须是合法的：管理员一启用就能直接跑
func TestDefaultAffiliateSettingIsValid(t *testing.T) {
	assert.NoError(t, ValidateAffiliateSetting(affiliateSetting))
	assert.False(t, affiliateSetting.Enabled, "默认必须关闭，避免部署后突然对所有站点生效")
}
