package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func tieredSetting() *LotterySetting {
	return &LotterySetting{
		Enabled:             true,
		Mode:                LotteryModeTiered,
		FirstThresholdQuota: 1000,
		ThresholdStepQuota:  500,
		TierPrizes: []LotteryPrize{
			{Quota: 10, Weight: 70},
			{Quota: 50, Weight: 25},
			{Quota: 200, Weight: 5},
		},
		TierPrizeStep: 10,
		TierPrizeMax:  60,
	}
}

func TestTierThresholdQuotaGrowsPerDraw(t *testing.T) {
	setting := tieredSetting()

	assert.Equal(t, 1000, setting.TierThresholdQuota(1))
	assert.Equal(t, 1500, setting.TierThresholdQuota(2))
	assert.Equal(t, 2000, setting.TierThresholdQuota(3))
}

func TestTierThresholdQuotaClampsInvalidIndex(t *testing.T) {
	setting := tieredSetting()

	assert.Equal(t, 1000, setting.TierThresholdQuota(0), "档位小于 1 时按第一档处理")
	assert.Equal(t, 1000, setting.TierThresholdQuota(-5))
}

func TestTierThresholdQuotaDoesNotOverflowOnHugeIndex(t *testing.T) {
	setting := tieredSetting()
	setting.ThresholdStepQuota = int(^uint(0) >> 1)

	// 必须收敛到正数，不能因乘法溢出变成负数
	assert.Positive(t, setting.TierThresholdQuota(1_000_000))
	assert.Positive(t, setting.TierThresholdQuota(1<<62))
}

func TestTierPrizePoolGrowsAndRespectsCeiling(t *testing.T) {
	// 基础奖池必须不超过封顶值，否则第一档就会被削平
	setting := &LotterySetting{
		Mode: LotteryModeTiered,
		TierPrizes: []LotteryPrize{
			{Quota: 10, Weight: 70},
			{Quota: 50, Weight: 25},
			{Quota: 60, Weight: 5},
		},
		TierPrizeStep: 10,
		TierPrizeMax:  70,
	}

	first := setting.TierPrizePoolFor(1)
	assert.Equal(t, []LotteryPrize{
		{Quota: 10, Weight: 70},
		{Quota: 50, Weight: 25},
		{Quota: 60, Weight: 5},
	}, first)

	// 第二档每档 +10
	assert.Equal(t, []LotteryPrize{
		{Quota: 20, Weight: 70},
		{Quota: 60, Weight: 25},
		{Quota: 70, Weight: 5},
	}, setting.TierPrizePoolFor(2))

	// 第三档 +20，但封顶 70：30、70、70
	assert.Equal(t, []LotteryPrize{
		{Quota: 30, Weight: 70},
		{Quota: 70, Weight: 25},
		{Quota: 70, Weight: 5},
	}, setting.TierPrizePoolFor(3))

	// 权重必须原样保留，否则概率会被阶梯改变
	assert.Equal(t, first[0].Weight, setting.TierPrizePoolFor(3)[0].Weight)
	assert.Equal(t, first[2].Weight, setting.TierPrizePoolFor(3)[2].Weight)
}

func TestTierPrizePoolWithoutCeilingKeepsGrowing(t *testing.T) {
	setting := tieredSetting()
	setting.TierPrizeMax = 0

	pool := setting.TierPrizePoolFor(0)
	assert.Equal(t, 10, pool[0].Quota, "档位小于 1 时按第一档处理")
	assert.Equal(t, 200, pool[2].Quota)

	assert.Equal(t, 10+3*10, setting.TierPrizePoolFor(4)[0].Quota)
}

func TestEarnedDrawsForRoundsDown(t *testing.T) {
	setting := &LotterySetting{Mode: LotteryModeSegment, SegmentConsumeQuota: 10}

	assert.Equal(t, 0, setting.EarnedDrawsFor(0))
	assert.Equal(t, 0, setting.EarnedDrawsFor(9))
	assert.Equal(t, 1, setting.EarnedDrawsFor(10))
	assert.Equal(t, 3, setting.EarnedDrawsFor(35), "余数不结转，只按整档计")
	assert.Equal(t, 0, setting.EarnedDrawsFor(-100))
}

func TestPrizePoolForFollowsMode(t *testing.T) {
	setting := tieredSetting()
	setting.Mode = LotteryModeSegment
	setting.SegmentConsumeQuota = 10
	setting.SegmentPrizes = []LotteryPrize{{Quota: 7, Weight: 1}}

	assert.Equal(t, []LotteryPrize{{Quota: 7, Weight: 1}}, setting.PrizePoolFor(1))
	assert.Equal(t, []LotteryPrize{{Quota: 7, Weight: 1}}, setting.PrizePoolFor(9), "分段式奖池不随档位变化")
	assert.Equal(t, 30, setting.ThresholdQuotaFor(3))
}

func TestPickLotteryPrizeReturnsConfiguredPrize(t *testing.T) {
	pool := []LotteryPrize{{Quota: 123, Weight: 5}}

	for i := 0; i < 50; i++ {
		prize, err := PickLotteryPrize(pool)
		require.NoError(t, err)
		assert.Equal(t, 123, prize)
	}
}

func TestPickLotteryPrizeAlwaysReturnsAPoolValue(t *testing.T) {
	pool := []LotteryPrize{
		{Quota: 10, Weight: 70},
		{Quota: 50, Weight: 25},
		{Quota: 200, Weight: 5},
	}
	allowed := map[int]bool{10: true, 50: true, 200: true}

	for i := 0; i < 200; i++ {
		prize, err := PickLotteryPrize(pool)
		require.NoError(t, err)
		assert.True(t, allowed[prize], "抽到未配置的奖品额度 %d", prize)
	}
}

func TestPickLotteryPrizeRejectsInvalidPool(t *testing.T) {
	_, err := PickLotteryPrize(nil)
	assert.Error(t, err)

	_, err = PickLotteryPrize([]LotteryPrize{{Quota: 10, Weight: 0}})
	assert.Error(t, err, "权重为 0 的档位无法命中，属于配置错误")

	_, err = PickLotteryPrize([]LotteryPrize{{Quota: 0, Weight: 10}})
	assert.Error(t, err, "额度为 0 的奖品没有意义")

	_, err = PickLotteryPrize([]LotteryPrize{{Quota: -5, Weight: 10}})
	assert.Error(t, err)
}

func TestPickLotteryPrizeStaysInsideTheRange(t *testing.T) {
	pool := []LotteryPrize{{Quota: 100, QuotaMax: 200, Weight: 5}}
	seen := map[int]bool{}

	for i := 0; i < 300; i++ {
		prize, err := PickLotteryPrize(pool)
		require.NoError(t, err)
		require.GreaterOrEqual(t, prize, 100)
		require.LessOrEqual(t, prize, 200)
		seen[prize] = true
	}

	// 固定区间会退化成一个点；真区间应当落在多个不同取值上。
	assert.Greater(t, len(seen), 10, "区间档位应当在区间内取值，而不是固定值")
}

func TestPickLotteryPrizeKeepsFixedTierFixed(t *testing.T) {
	// 上限缺省（升级前的配置形态）与上限等于下限都必须发固定额度
	for _, pool := range [][]LotteryPrize{
		{{Quota: 321, Weight: 1}},
		{{Quota: 321, QuotaMax: 321, Weight: 1}},
		{{Quota: 321, QuotaMax: 100, Weight: 1}}, // 上限小于下限时按下限兜底
	} {
		for i := 0; i < 20; i++ {
			prize, err := PickLotteryPrize(pool)
			require.NoError(t, err)
			assert.Equal(t, 321, prize)
		}
	}
}

func TestTierPrizePoolForRaisesBothBounds(t *testing.T) {
	setting := &LotterySetting{
		Enabled:       true,
		Mode:          LotteryModeTiered,
		TierPrizes:    []LotteryPrize{{Quota: 100, QuotaMax: 200, Weight: 1}},
		TierPrizeStep: 10,
	}

	assert.Equal(t, []LotteryPrize{
		{Quota: 100, QuotaMax: 200, Weight: 1},
	}, setting.TierPrizePoolFor(1), "第一档不加步长")
	assert.Equal(t, []LotteryPrize{
		{Quota: 110, QuotaMax: 210, Weight: 1},
	}, setting.TierPrizePoolFor(2), "上下限一起抬高，区间宽度不变")
}

func TestTierPrizePoolForDoesNotInventARange(t *testing.T) {
	setting := &LotterySetting{
		Enabled:       true,
		Mode:          LotteryModeTiered,
		TierPrizes:    []LotteryPrize{{Quota: 100, Weight: 1}},
		TierPrizeStep: 10,
	}

	// 固定额度的档位不能因为 step 变成 [100+step, ...] 的区间
	assert.Equal(t, []LotteryPrize{
		{Quota: 110, Weight: 1},
	}, setting.TierPrizePoolFor(2))
}

func TestTierPrizeMaxCapsTheUpperBound(t *testing.T) {
	setting := &LotterySetting{
		Enabled:       true,
		Mode:          LotteryModeTiered,
		TierPrizes:    []LotteryPrize{{Quota: 100, QuotaMax: 900, Weight: 1}},
		TierPrizeStep: 100,
		TierPrizeMax:  500,
	}

	assert.Equal(t, []LotteryPrize{
		{Quota: 200, QuotaMax: 500, Weight: 1},
	}, setting.TierPrizePoolFor(2), "上限被封顶单独收敛，下限不受影响")

	assert.Equal(t, []LotteryPrize{
		{Quota: 500, QuotaMax: 500, Weight: 1},
	}, setting.TierPrizePoolFor(5), "下限超过封顶时区间收敛成一个点")
}

func TestValidatePrizeTierRejectsInvertedRange(t *testing.T) {
	assert.NoError(t, ValidatePrizeTier(LotteryPrize{Quota: 100, Weight: 1}))
	assert.NoError(t, ValidatePrizeTier(LotteryPrize{Quota: 100, QuotaMax: 200, Weight: 1}))

	assert.Error(t, ValidatePrizeTier(LotteryPrize{Quota: 200, QuotaMax: 100, Weight: 1}),
		"上限低于下限属于配置错误")
	assert.Error(t, ValidatePrizeTier(LotteryPrize{Quota: 100, QuotaMax: -1, Weight: 1}),
		"上限不能为负数")
	assert.Error(t, ValidatePrizeTier(LotteryPrize{Quota: 0, QuotaMax: 10, Weight: 1}))
	assert.Error(t, ValidatePrizeTier(LotteryPrize{Quota: 100, Weight: 0}))
}

func TestValidateLotterySettingChecksTheRangeCeiling(t *testing.T) {
	setting := &LotterySetting{
		Enabled:             true,
		Mode:                LotteryModeTiered,
		FirstThresholdQuota: 1000,
		ThresholdStepQuota:  500,
		TierPrizes:          []LotteryPrize{{Quota: 100, QuotaMax: 900, Weight: 1}},
		TierPrizeMax:        500,
	}

	assert.Error(t, ValidateLotterySetting(setting),
		"奖池上限超过阶梯封顶时应当被拦下")
}

func TestValidateLotterySettingAcceptsDefaults(t *testing.T) {
	setting := GetLotterySetting()
	assert.NoError(t, ValidateLotterySetting(setting))
}

func TestValidateLotterySettingRejectsBadTiered(t *testing.T) {
	setting := tieredSetting()
	setting.FirstThresholdQuota = 0
	assert.Error(t, ValidateLotterySetting(setting))

	setting = tieredSetting()
	setting.ThresholdStepQuota = 0
	assert.Error(t, ValidateLotterySetting(setting))

	setting = tieredSetting()
	setting.TierPrizeStep = -1
	assert.Error(t, ValidateLotterySetting(setting))

	setting = tieredSetting()
	setting.TierPrizeMax = -1
	assert.Error(t, ValidateLotterySetting(setting))

	setting = tieredSetting()
	setting.TierPrizes = nil
	assert.Error(t, ValidateLotterySetting(setting))

	setting = tieredSetting()
	setting.TierPrizes[0].Quota = setting.TierPrizeMax + 1
	assert.Error(t, ValidateLotterySetting(setting), "奖品额度不应超过阶梯封顶值")
}

func TestValidateLotterySettingRejectsBadSegment(t *testing.T) {
	setting := &LotterySetting{
		Enabled:             true,
		Mode:                LotteryModeSegment,
		SegmentConsumeQuota: 10,
		SegmentPrizes:       []LotteryPrize{{Quota: 5, Weight: 1}},
	}
	assert.NoError(t, ValidateLotterySetting(setting))

	setting.SegmentConsumeQuota = 0
	assert.Error(t, ValidateLotterySetting(setting))

	setting = &LotterySetting{
		Enabled:             true,
		Mode:                LotteryModeSegment,
		SegmentConsumeQuota: 10,
		SegmentPrizes:       []LotteryPrize{{Quota: 5, Weight: 0}},
	}
	assert.Error(t, ValidateLotterySetting(setting))
}

func TestValidateLotterySettingRejectsUnknownMode(t *testing.T) {
	setting := tieredSetting()
	setting.Mode = "banana"

	assert.Error(t, ValidateLotterySetting(setting))
}
