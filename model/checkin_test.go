package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// withCheckinSetting 临时覆盖签到配置，并在用例结束后还原。
func withCheckinSetting(t *testing.T, mutate func(setting *operation_setting.CheckinSetting)) {
	t.Helper()
	setting := operation_setting.GetCheckinSetting()
	original := *setting
	t.Cleanup(func() { *setting = original })
	mutate(setting)
}

func insertConsumeLogs(t *testing.T, userId int, count int, createdAt int64) {
	t.Helper()
	for i := 0; i < count; i++ {
		require.NoError(t, LOG_DB.Create(&Log{
			UserId:    userId,
			Type:      LogTypeConsume,
			CreatedAt: createdAt,
		}).Error)
	}
}

func TestCountTodayConsumeLogsCountsOnlyTodaysConsume(t *testing.T) {
	truncateTables(t)
	userId := 9003
	today := time.Now().Unix()
	yesterday := time.Now().AddDate(0, 0, -1).Unix()

	insertConsumeLogs(t, userId, 2, today)
	insertConsumeLogs(t, userId, 5, yesterday)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:    userId,
		Type:      LogTypeTopup,
		CreatedAt: today,
	}).Error)

	count, err := CountTodayConsumeLogs(userId)

	require.NoError(t, err)
	assert.Equal(t, int64(2), count)
}

func TestUserCheckinRejectsWhenDailyCallThresholdNotMet(t *testing.T) {
	truncateTables(t)
	userId := 9001
	require.NoError(t, DB.Create(&User{Id: userId, Username: "checkin-gate", Quota: 0}).Error)
	withCheckinSetting(t, func(setting *operation_setting.CheckinSetting) {
		setting.Enabled = true
		setting.MinQuota = 100
		setting.MaxQuota = 100
		setting.MinDailyCalls = 3
	})

	insertConsumeLogs(t, userId, 2, time.Now().Unix())
	_, err := UserCheckin(userId)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "今日调用次数不足")
	checked, err := HasCheckedInToday(userId)
	require.NoError(t, err)
	assert.False(t, checked, "门槛未达成时不应留下签到记录")
}

func TestUserCheckinAllowsOnceDailyCallThresholdMet(t *testing.T) {
	truncateTables(t)
	userId := 9004
	require.NoError(t, DB.Create(&User{Id: userId, Username: "checkin-pass", Quota: 0}).Error)
	withCheckinSetting(t, func(setting *operation_setting.CheckinSetting) {
		setting.Enabled = true
		setting.MinQuota = 100
		setting.MaxQuota = 100
		setting.MinDailyCalls = 3
	})

	insertConsumeLogs(t, userId, 3, time.Now().Unix())
	checkin, err := UserCheckin(userId)

	require.NoError(t, err)
	assert.Equal(t, 100, checkin.QuotaAwarded)
	checked, err := HasCheckedInToday(userId)
	require.NoError(t, err)
	assert.True(t, checked)
}

func TestUserCheckinSkipsGateWhenThresholdDisabled(t *testing.T) {
	truncateTables(t)
	userId := 9002
	require.NoError(t, DB.Create(&User{Id: userId, Username: "checkin-open", Quota: 0}).Error)
	withCheckinSetting(t, func(setting *operation_setting.CheckinSetting) {
		setting.Enabled = true
		setting.MinQuota = 100
		setting.MaxQuota = 100
		setting.MinDailyCalls = 0
	})

	_, err := UserCheckin(userId)

	require.NoError(t, err)
}
