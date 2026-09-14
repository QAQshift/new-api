package model

import (
	"fmt"
	"sync"
	"testing"

	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// withLotterySetting 临时覆盖抽奖配置，并在用例结束后还原（含奖池切片的深拷贝）。
func withLotterySetting(t *testing.T, mutate func(setting *operation_setting.LotterySetting)) {
	t.Helper()
	setting := operation_setting.GetLotterySetting()
	original := *setting
	original.SegmentPrizes = append([]operation_setting.LotteryPrize(nil), setting.SegmentPrizes...)
	original.TierPrizes = append([]operation_setting.LotteryPrize(nil), setting.TierPrizes...)
	t.Cleanup(func() { *setting = original })
	mutate(setting)
}

func seedTestUser(t *testing.T, userId int, usedQuota int) {
	t.Helper()
	require.NoError(t, DB.Create(&User{
		Id:        userId,
		Username:  fmt.Sprintf("lottery-%d", userId),
		Quota:     0,
		UsedQuota: usedQuota,
	}).Error)
}

func testUserQuota(t *testing.T, userId int) int {
	t.Helper()
	var user User
	require.NoError(t, DB.Where("id = ?", userId).First(&user).Error)
	return user.Quota
}

func TestUserDrawLotteryTieredRequiresThreshold(t *testing.T) {
	truncateTables(t)
	userId := 9101
	seedTestUser(t, userId, 999)
	withLotterySetting(t, func(setting *operation_setting.LotterySetting) {
		setting.Enabled = true
		setting.Mode = operation_setting.LotteryModeTiered
		setting.FirstThresholdQuota = 1000
		setting.ThresholdStepQuota = 1000
		setting.TierPrizes = []operation_setting.LotteryPrize{{Quota: 100, Weight: 1}}
		setting.TierPrizeStep = 0
		setting.TierPrizeMax = 0
	})

	_, err := UserDrawLottery(userId)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "门槛")

	require.NoError(t, DB.Model(&User{}).Where("id = ?", userId).Update("used_quota", 1000).Error)
	draw, err := UserDrawLottery(userId)
	require.NoError(t, err)
	assert.Equal(t, 1, draw.DrawIndex)
	assert.Equal(t, 100, draw.PrizeQuota)
	assert.Equal(t, 100, testUserQuota(t, userId))

	// 第二档门槛递增到 2000
	_, err = UserDrawLottery(userId)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "第 2 次")
}

func TestUserDrawLotterySegmentGatesByConsumption(t *testing.T) {
	truncateTables(t)
	userId := 9102
	seedTestUser(t, userId, 350)
	withLotterySetting(t, func(setting *operation_setting.LotterySetting) {
		setting.Enabled = true
		setting.Mode = operation_setting.LotteryModeSegment
		setting.SegmentConsumeQuota = 100
		setting.SegmentPrizes = []operation_setting.LotteryPrize{{Quota: 10, Weight: 1}}
	})

	for expected := 1; expected <= 3; expected++ {
		draw, err := UserDrawLottery(userId)
		require.NoError(t, err)
		assert.Equal(t, expected, draw.DrawIndex)
	}

	_, err := UserDrawLottery(userId)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "抽奖机会")
	assert.Equal(t, 30, testUserQuota(t, userId))
}

func TestUserDrawLotteryRejectedWhenDisabled(t *testing.T) {
	truncateTables(t)
	userId := 9104
	seedTestUser(t, userId, 100000)
	withLotterySetting(t, func(setting *operation_setting.LotterySetting) {
		setting.Enabled = false
	})

	_, err := UserDrawLottery(userId)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "未启用")
}

// 并发抽奖的核心资金不变量：每一档位只能产生一条记录，
// 且用户实际到账额度必须严格等于抽奖记录之和（不能多发）。
func TestUserDrawLotteryConcurrentDrawsNeverDoubleCredit(t *testing.T) {
	truncateTables(t)
	userId := 9103
	seedTestUser(t, userId, 1_000_000)
	withLotterySetting(t, func(setting *operation_setting.LotterySetting) {
		setting.Enabled = true
		setting.Mode = operation_setting.LotteryModeTiered
		setting.FirstThresholdQuota = 1
		setting.ThresholdStepQuota = 1
		setting.TierPrizes = []operation_setting.LotteryPrize{
			{Quota: 10, Weight: 70},
			{Quota: 50, Weight: 30},
		}
		setting.TierPrizeStep = 5
		setting.TierPrizeMax = 0
	})

	const attempts = 6
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			_, _ = UserDrawLottery(userId)
		}()
	}
	close(start)
	wg.Wait()

	var draws []LotteryDraw
	require.NoError(t, DB.Where("user_id = ?", userId).Find(&draws).Error)
	require.NotEmpty(t, draws, "并发至少应有一次成功")

	seen := make(map[int]bool, len(draws))
	credited := 0
	for _, draw := range draws {
		assert.False(t, seen[draw.DrawIndex], "档位 %d 出现了重复记录", draw.DrawIndex)
		seen[draw.DrawIndex] = true
		credited += draw.PrizeQuota
	}
	assert.Equal(t, credited, testUserQuota(t, userId), "到账额度必须等于抽奖记录之和")
}

func TestGetUserLotteryStatusReportsProgress(t *testing.T) {
	truncateTables(t)
	userId := 9105
	seedTestUser(t, userId, 250)
	withLotterySetting(t, func(setting *operation_setting.LotterySetting) {
		setting.Enabled = true
		setting.Mode = operation_setting.LotteryModeSegment
		setting.SegmentConsumeQuota = 100
		setting.SegmentPrizes = []operation_setting.LotteryPrize{{Quota: 10, Weight: 1}}
	})

	status, err := GetUserLotteryStatus(userId)
	require.NoError(t, err)
	assert.True(t, status.Enabled)
	assert.Equal(t, 250, status.UsedQuota)
	assert.Equal(t, 0, status.DrawnCount)
	assert.Equal(t, 2, status.DrawableCount)
	assert.Equal(t, 100, status.NextThreshold)

	_, err = UserDrawLottery(userId)
	require.NoError(t, err)

	status, err = GetUserLotteryStatus(userId)
	require.NoError(t, err)
	assert.Equal(t, 1, status.DrawnCount)
	assert.Equal(t, 1, status.DrawableCount)
	assert.Len(t, status.Records, 1)
}

func TestGetUserLotteryStatusDisabledIsNotAnError(t *testing.T) {
	truncateTables(t)
	withLotterySetting(t, func(setting *operation_setting.LotterySetting) {
		setting.Enabled = false
	})

	status, err := GetUserLotteryStatus(9106)
	require.NoError(t, err)
	assert.False(t, status.Enabled)
}
