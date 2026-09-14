package model

import (
	"fmt"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// withAffiliateSetting 临时覆盖返利配置，并在用例结束后还原（含档位切片的深拷贝）。
func withAffiliateSetting(t *testing.T, mutate func(setting *operation_setting.AffiliateSetting)) {
	t.Helper()
	setting := operation_setting.GetAffiliateSetting()
	original := *setting
	original.Tiers = append([]operation_setting.AffiliateTier(nil), setting.Tiers...)
	t.Cleanup(func() { *setting = original })
	mutate(setting)
}

// enableAffiliate 用最简单的一档配置打开返利（恒定比例）。
func enableAffiliate(t *testing.T, rateBp int, cooldownDays int, cap int) {
	t.Helper()
	withAffiliateSetting(t, func(setting *operation_setting.AffiliateSetting) {
		setting.Enabled = true
		setting.Tiers = []operation_setting.AffiliateTier{{Times: 0, RateBp: rateBp}}
		setting.CooldownDays = cooldownDays
		setting.MaxRebatePerInvitee = cap
	})
}

// seedAffiliatePair 建一个「邀请人 + 被邀请人」组合。
func seedAffiliatePair(t *testing.T, inviterId, inviteeId int) {
	t.Helper()
	require.NoError(t, DB.Create(&User{
		Id:       inviterId,
		Username: fmt.Sprintf("aff-inviter-%d", inviterId),
		AffCode:  fmt.Sprintf("affc%d", inviterId),
	}).Error)
	require.NoError(t, DB.Create(&User{
		Id:        inviteeId,
		Username:  fmt.Sprintf("aff-invitee-%d", inviteeId),
		AffCode:   fmt.Sprintf("affi%d", inviteeId),
		InviterId: inviterId,
	}).Error)
}

// bumpTopupCount 模拟 creditTopUpQuota 完成后的计次自增。
func bumpTopupCount(t *testing.T, userId int, times int) {
	t.Helper()
	var user User
	require.NoError(t, DB.Select("topup_count").Where("id = ?", userId).First(&user).Error)
	require.NoError(t, DB.Model(&User{}).Where("id = ?", userId).
		Update("topup_count", user.TopupCount+times).Error)
}

func testAffiliateQuotas(t *testing.T, userId int) (pending, transferable, history int) {
	t.Helper()
	var user User
	require.NoError(t, DB.Where("id = ?", userId).First(&user).Error)
	return user.AffPendingQuota, user.AffQuota, user.AffHistoryQuota
}

// bblabu 口径：前 3 次 5%，第 4 次起 3%，且返利先进待确认池。
func TestSettleAffiliateRebateFollowsLadder(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9301, 9302
	seedAffiliatePair(t, inviterId, inviteeId)
	withAffiliateSetting(t, func(setting *operation_setting.AffiliateSetting) {
		setting.Enabled = true
		setting.Tiers = []operation_setting.AffiliateTier{
			{Times: 3, RateBp: 500},
			{Times: 0, RateBp: 300},
		}
		setting.CooldownDays = 7
		setting.MaxRebatePerInvitee = 0
	})

	const base = 1000000
	for i := 1; i <= 4; i++ {
		bumpTopupCount(t, inviteeId, 1)
		require.NoError(t, SettleAffiliateRebate(
			inviteeId,
			AffiliateSourceTopUp,
			AffiliateRefId(AffiliateSourceTopUp, fmt.Sprintf("ladder-%d", i)),
			base,
		))
	}

	expected := 3*50000 + 30000
	pending, transferable, history := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, expected, pending)
	assert.Equal(t, 0, transferable, "冷却期内不得进入可转移池")
	assert.Equal(t, expected, history)

	var records []AffiliateRebate
	require.NoError(t, DB.Order("id asc").Find(&records).Error)
	require.Len(t, records, 4)
	assert.Equal(t, 500, records[0].RateBp, "第 1 次按 5%")
	assert.Equal(t, 3, records[2].Ordinal)
	assert.Equal(t, 300, records[3].RateBp, "第 4 次必须降到 3%")
	assert.Equal(t, AffiliateRebateStatusPending, records[0].Status)
}

// 同一次充值重复回调只能产生一条返利。
func TestSettleAffiliateRebateIsIdempotent(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9311, 9312
	seedAffiliatePair(t, inviterId, inviteeId)
	enableAffiliate(t, 500, 0, 0)

	bumpTopupCount(t, inviteeId, 1)
	ref := AffiliateRefId(AffiliateSourceTopUp, "dup-1")
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, ref, 1000000))
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, ref, 1000000))

	var count int64
	require.NoError(t, DB.Model(&AffiliateRebate{}).Count(&count).Error)
	assert.Equal(t, int64(1), count, "重复回调只能产生一条明细")

	pending, _, _ := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 50000, pending, "重复回调不得重复发放")
}

// 关闭开关、没有邀请人、自邀，都不能产生返利。
func TestSettleAffiliateRebateSkips(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9321, 9322
	seedAffiliatePair(t, inviterId, inviteeId)

	// 功能关闭
	withAffiliateSetting(t, func(setting *operation_setting.AffiliateSetting) {
		setting.Enabled = false
		setting.Tiers = []operation_setting.AffiliateTier{{Times: 0, RateBp: 500}}
	})
	bumpTopupCount(t, inviteeId, 1)
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, "off-1", 1000000))
	pending, _, _ := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 0, pending, "功能关闭时不得发放")

	// 没有被邀请人的场景：inviter_id 为 0
	enableAffiliate(t, 500, 0, 0)
	require.NoError(t, DB.Create(&User{
		Id:       9323,
		Username: "aff-lonely-9323",
		AffCode:  "affc-lonely-9323",
	}).Error)
	bumpTopupCount(t, 9323, 1)
	require.NoError(t, SettleAffiliateRebate(9323, AffiliateSourceTopUp, "lonely-1", 1000000))

	var count int64
	require.NoError(t, DB.Model(&AffiliateRebate{}).
		Where("invitee_id = ?", 9323).Count(&count).Error)
	assert.Equal(t, int64(0), count, "没有邀请人的用户不产生返利")
}

// 单个被邀请人的累计返利上限必须生效，且是截断而不是报错。
func TestSettleAffiliateRebateRespectsPerInviteeCap(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9331, 9332
	seedAffiliatePair(t, inviterId, inviteeId)
	enableAffiliate(t, 500, 0, 60000)

	// 第 1 笔返 50000
	bumpTopupCount(t, inviteeId, 1)
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, "cap-1", 1000000))
	// 第 2 笔本应再返 50000，但被上限截断到 10000
	bumpTopupCount(t, inviteeId, 1)
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, "cap-2", 1000000))
	// 第 3 笔已达上限，不再发放
	bumpTopupCount(t, inviteeId, 1)
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, "cap-3", 1000000))

	pending, _, _ := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 60000, pending)

	var count int64
	require.NoError(t, DB.Model(&AffiliateRebate{}).Count(&count).Error)
	assert.Equal(t, int64(2), count, "达到上限后不再产生明细")
}

// 冷却期未满不得释放；释放后待确认清零、可转移增加；重复执行不得重复释放。
func TestReleaseDueAffiliateRebatesRespectsCooldown(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9341, 9342
	seedAffiliatePair(t, inviterId, inviteeId)
	enableAffiliate(t, 500, 7, 0)

	bumpTopupCount(t, inviteeId, 1)
	ref := AffiliateRefId(AffiliateSourceTopUp, "cool-1")
	require.NoError(t, SettleAffiliateRebate(inviteeId, AffiliateSourceTopUp, ref, 1000000))

	released, err := ReleaseDueAffiliateRebates()
	require.NoError(t, err)
	assert.Equal(t, 0, released, "刚产生的返利还在冷却期内")
	pending, transferable, _ := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 50000, pending)
	assert.Equal(t, 0, transferable)

	// 把产生时间往前挪 8 天，模拟冷却期满
	require.NoError(t, DB.Model(&AffiliateRebate{}).
		Where("ref_id = ?", ref).
		Update("created_time", common.GetTimestamp()-8*86400).Error)

	released, err = ReleaseDueAffiliateRebates()
	require.NoError(t, err)
	assert.Equal(t, 1, released)
	pending, transferable, _ = testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 0, pending, "释放后待确认清零")
	assert.Equal(t, 50000, transferable, "释放后进入可转移池")

	released, err = ReleaseDueAffiliateRebates()
	require.NoError(t, err)
	assert.Equal(t, 0, released)
	_, transferable, _ = testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 50000, transferable, "重复执行不得重复释放")
}

// 端到端：真实走一遍易支付充值，验证「计次自增 + 返利产生 + 幂等」。
func TestRechargeEpaySettlesAffiliateRebateOnce(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9351, 9352
	seedAffiliatePair(t, inviterId, inviteeId)
	enableAffiliate(t, 500, 7, 0)

	const tradeNo = "epay-affiliate-1"
	require.NoError(t, DB.Create(&TopUp{
		UserId:          inviteeId,
		Amount:          2,
		Money:           2,
		TradeNo:         tradeNo,
		PaymentMethod:   "alipay",
		PaymentProvider: PaymentProviderEpay,
		Status:          common.TopUpStatusPending,
		CreateTime:      common.GetTimestamp(),
	}).Error)

	alreadyDone, err := RechargeEpay(tradeNo, "alipay", "127.0.0.1")
	require.NoError(t, err)
	assert.False(t, alreadyDone)

	// 到账额度 = Amount × QuotaPerUnit = 2 × 500000 = 1000000，返 5% = 50000
	credited := int(2 * common.QuotaPerUnit)
	expectedRebate := credited * 500 / 10000

	var invitee User
	require.NoError(t, DB.Where("id = ?", inviteeId).First(&invitee).Error)
	assert.Equal(t, credited, invitee.Quota, "充值额度必须到账")
	assert.Equal(t, 1, invitee.TopupCount, "充值成功必须计次")

	pending, _, _ := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, expectedRebate, pending)

	// 重复回调必须是幂等的：不得重复加额度，也不得重复返利
	alreadyDone, err = RechargeEpay(tradeNo, "alipay", "127.0.0.1")
	require.NoError(t, err)
	assert.True(t, alreadyDone, "重复回调应返回 alreadyDone")

	require.NoError(t, DB.Where("id = ?", inviteeId).First(&invitee).Error)
	assert.Equal(t, credited, invitee.Quota, "重复回调不得重复加额度")
	assert.Equal(t, 1, invitee.TopupCount, "重复回调不得重复计次")

	pending, _, _ = testAffiliateQuotas(t, inviterId)
	assert.Equal(t, expectedRebate, pending, "重复回调不得重复返利")
}

// 邀请名单与转化漏斗的统计口径。
func TestGetAffiliateOverviewCountsFunnelAndInvitees(t *testing.T) {
	truncateTables(t)
	inviterId := 9401
	require.NoError(t, DB.Create(&User{
		Id: inviterId, Username: "aff-inviter-9401", AffCode: "affc9401",
	}).Error)

	seedInvitee := func(id int, requestCount int, topupCount int, usedQuota int) {
		require.NoError(t, DB.Create(&User{
			Id:           id,
			Username:     fmt.Sprintf("aff-invitee-%d", id),
			AffCode:      fmt.Sprintf("affi%d", id),
			InviterId:    inviterId,
			RequestCount: requestCount,
			TopupCount:   topupCount,
			UsedQuota:    usedQuota,
		}).Error)
	}
	seedInvitee(9411, 0, 0, 0) // 只注册
	seedInvitee(9412, 5, 0, 100)
	seedInvitee(9413, 9, 2, 500)

	require.NoError(t, DB.Create(&AffiliateRebate{
		InviterId:   inviterId,
		InviteeId:   9413,
		Source:      AffiliateSourceTopUp,
		RefId:       "overview-1",
		Ordinal:     1,
		RateBp:      500,
		BaseQuota:   100000,
		RebateQuota: 5000,
		Status:      AffiliateRebateStatusPending,
		CreatedTime: common.GetTimestamp(),
	}).Error)

	overview, err := GetAffiliateOverview(inviterId)
	require.NoError(t, err)

	assert.Equal(t, int64(3), overview.Funnel.Registered)
	assert.Equal(t, int64(2), overview.Funnel.Active, "发起过请求的算活跃")
	assert.Equal(t, int64(1), overview.Funnel.ToppedUp, "充值过的算充值用户")
	require.Len(t, overview.Invitees, 3)
	assert.False(t, overview.InviteesTruncated)

	// 最新注册的排在最前
	assert.Equal(t, 9413, overview.Invitees[0].UserId)
	assert.Equal(t, 5000, overview.Invitees[0].RebateQuota, "应带出该被邀请人贡献的返利")
	assert.Equal(t, 0, overview.Invitees[2].RebateQuota)
}

// 别人拉来的人不能被算进自己的名单。
func TestGetAffiliateOverviewIgnoresOtherInvitees(t *testing.T) {
	truncateTables(t)
	require.NoError(t, DB.Create(&User{
		Id: 9421, Username: "aff-inviter-9421", AffCode: "affc9421",
	}).Error)
	require.NoError(t, DB.Create(&User{
		Id: 9422, Username: "aff-inviter-9422", AffCode: "affc9422",
	}).Error)
	require.NoError(t, DB.Create(&User{
		Id: 9423, Username: "aff-invitee-9423", AffCode: "affi9423",
		InviterId: 9422, TopupCount: 3,
	}).Error)

	overview, err := GetAffiliateOverview(9421)
	require.NoError(t, err)

	assert.Equal(t, int64(0), overview.Funnel.Registered)
	assert.Equal(t, int64(0), overview.Funnel.ToppedUp)
	assert.Empty(t, overview.Invitees)
}

// 兑换码也计次并产生返利（前提：兑换码只由管理员创建）。
func TestRedemptionSettlesAffiliateRebate(t *testing.T) {
	truncateTables(t)
	inviterId, inviteeId := 9361, 9362
	seedAffiliatePair(t, inviterId, inviteeId)
	enableAffiliate(t, 500, 7, 0)

	redemption := &Redemption{
		Key:    "aff-redemption-key-0001",
		Name:   "affiliate test",
		Quota:  400000,
		Status: common.RedemptionCodeStatusEnabled,
	}
	require.NoError(t, redemption.Insert())

	quota, err := Redeem(redemption.Key, inviteeId)
	require.NoError(t, err)
	assert.Equal(t, 400000, quota)

	var invitee User
	require.NoError(t, DB.Where("id = ?", inviteeId).First(&invitee).Error)
	assert.Equal(t, 1, invitee.TopupCount, "兑换码核销必须计次")

	pending, _, _ := testAffiliateQuotas(t, inviterId)
	assert.Equal(t, 400000*500/10000, pending)
}
