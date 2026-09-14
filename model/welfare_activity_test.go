package model

import (
	"sync"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mustCreateWelfareActivity 建一个默认「进行中、无门槛、不限次」的活动，
// 再用 mutate 覆盖需要断言的字段。
func mustCreateWelfareActivity(
	t *testing.T,
	prizeQuota int,
	mutate func(activity *WelfareActivity),
) *WelfareActivity {
	t.Helper()
	prizes, err := MarshalPrizes([]operation_setting.LotteryPrize{{Quota: prizeQuota, Weight: 1}})
	require.NoError(t, err)

	now := time.Now().Unix()
	activity := &WelfareActivity{
		Title:    "test activity",
		StartsAt: now - 3600,
		EndsAt:   now + 3600,
		Prizes:   prizes,
		Enabled:  true,
	}
	if mutate != nil {
		mutate(activity)
	}
	require.NoError(t, CreateWelfareActivity(activity))
	return activity
}

func TestWelfareActivityStatusAt(t *testing.T) {
	now := time.Now().Unix()
	activity := &WelfareActivity{Enabled: true}

	assert.Equal(t, WelfareActivityActive, activity.StatusAt(now), "未设置时间窗时始终进行中")

	activity.StartsAt = now + 100
	assert.Equal(t, WelfareActivityUpcoming, activity.StatusAt(now))

	activity.StartsAt = 0
	activity.EndsAt = now - 100
	assert.Equal(t, WelfareActivityEnded, activity.StatusAt(now))

	activity.Enabled = false
	assert.Equal(t, WelfareActivityDisabled, activity.StatusAt(now), "关闭优先级高于时间窗")
}

func TestValidateWelfareActivityRejectsBadConfig(t *testing.T) {
	valid := func() *WelfareActivity {
		prizes, err := MarshalPrizes([]operation_setting.LotteryPrize{{Quota: 100, Weight: 1}})
		require.NoError(t, err)
		return &WelfareActivity{Title: "activity", Prizes: prizes}
	}

	require.NoError(t, ValidateWelfareActivity(valid()))

	activity := valid()
	activity.Title = "   "
	assert.Error(t, ValidateWelfareActivity(activity), "名称不能为空白")

	activity = valid()
	activity.StartsAt = 100
	activity.EndsAt = 100
	assert.Error(t, ValidateWelfareActivity(activity), "结束时间必须晚于开始时间")

	activity = valid()
	activity.MinConsumeQuota = -1
	assert.Error(t, ValidateWelfareActivity(activity))

	activity = valid()
	activity.TotalLimit = -1
	assert.Error(t, ValidateWelfareActivity(activity))

	activity = valid()
	activity.TotalLimit = 2
	activity.DailyLimit = 3
	assert.Error(t, ValidateWelfareActivity(activity), "每日上限不应高于总上限")

	activity = valid()
	activity.Prizes = ""
	assert.Error(t, ValidateWelfareActivity(activity))

	activity = valid()
	activity.Prizes = "not json"
	assert.Error(t, ValidateWelfareActivity(activity))

	badQuota, err := MarshalPrizes([]operation_setting.LotteryPrize{{Quota: 0, Weight: 1}})
	require.NoError(t, err)
	activity = valid()
	activity.Prizes = badQuota
	assert.Error(t, ValidateWelfareActivity(activity))

	zeroWeight, err := MarshalPrizes([]operation_setting.LotteryPrize{{Quota: 10, Weight: 0}})
	require.NoError(t, err)
	activity = valid()
	activity.Prizes = zeroWeight
	assert.Error(t, ValidateWelfareActivity(activity))
}

func TestUserEnterWelfareActivityCreditsPrize(t *testing.T) {
	truncateTables(t)
	userId := 9201
	seedTestUser(t, userId, 0)
	activity := mustCreateWelfareActivity(t, 250, nil)

	entry, err := UserEnterWelfareActivity(userId, activity.Id)
	require.NoError(t, err)
	assert.Equal(t, 1, entry.EntryIndex)
	assert.Equal(t, 1, entry.DayIndex)
	assert.Equal(t, 250, entry.PrizeQuota)
	assert.Equal(t, 250, testUserQuota(t, userId), "奖品额度必须到账")
}

func TestUserEnterWelfareActivityEnforcesThreshold(t *testing.T) {
	truncateTables(t)
	userId := 9202
	seedTestUser(t, userId, 99)
	activity := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.MinConsumeQuota = 100
	})

	_, err := UserEnterWelfareActivity(userId, activity.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "门槛")
	assert.Equal(t, 0, testUserQuota(t, userId), "未达标不能发奖")

	require.NoError(t, DB.Model(&User{}).Where("id = ?", userId).Update("used_quota", 100).Error)
	_, err = UserEnterWelfareActivity(userId, activity.Id)
	require.NoError(t, err)
	assert.Equal(t, 100, testUserQuota(t, userId))
}

func TestUserEnterWelfareActivityEnforcesTotalLimit(t *testing.T) {
	truncateTables(t)
	userId := 9203
	seedTestUser(t, userId, 0)
	activity := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.TotalLimit = 2
	})

	for expected := 1; expected <= 2; expected++ {
		entry, err := UserEnterWelfareActivity(userId, activity.Id)
		require.NoError(t, err)
		assert.Equal(t, expected, entry.EntryIndex)
	}

	_, err := UserEnterWelfareActivity(userId, activity.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "次数")
	assert.Equal(t, 200, testUserQuota(t, userId), "超出上限不应再发奖")
}

func TestUserEnterWelfareActivityEnforcesDailyLimit(t *testing.T) {
	truncateTables(t)
	userId := 9204
	seedTestUser(t, userId, 0)
	activity := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.DailyLimit = 1
	})

	_, err := UserEnterWelfareActivity(userId, activity.Id)
	require.NoError(t, err)

	_, err = UserEnterWelfareActivity(userId, activity.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "今日")
	assert.Equal(t, 100, testUserQuota(t, userId))
}

func TestUserEnterWelfareActivityRejectsOutsideWindow(t *testing.T) {
	truncateTables(t)
	userId := 9205
	seedTestUser(t, userId, 0)
	now := time.Now().Unix()

	upcoming := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.StartsAt = now + 3600
		a.EndsAt = now + 7200
	})
	_, err := UserEnterWelfareActivity(userId, upcoming.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "尚未开始")

	ended := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.StartsAt = now - 7200
		a.EndsAt = now - 3600
	})
	_, err = UserEnterWelfareActivity(userId, ended.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "已结束")

	disabled := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.Enabled = false
	})
	_, err = UserEnterWelfareActivity(userId, disabled.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "未开启")

	assert.Equal(t, 0, testUserQuota(t, userId), "窗口外不能发奖")
}

// 并发参与的核心资金不变量：总次数上限为 1 时，
// 无论并发多少请求都只能产生一条记录、只发一次奖。
func TestUserEnterWelfareActivityConcurrentRespectsTotalLimit(t *testing.T) {
	truncateTables(t)
	userId := 9206
	seedTestUser(t, userId, 0)
	activity := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.TotalLimit = 1
	})

	const attempts = 6
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			_, _ = UserEnterWelfareActivity(userId, activity.Id)
		}()
	}
	close(start)
	wg.Wait()

	var entries []WelfareActivityEntry
	require.NoError(t, DB.Where("activity_id = ? AND user_id = ?", activity.Id, userId).
		Find(&entries).Error)
	require.Len(t, entries, 1, "总次数上限为 1 时只应产生一条参与记录")
	assert.Equal(t, 100, testUserQuota(t, userId), "到账额度必须等于参与记录之和")
}

func TestListWelfareActivitiesForUserReportsProgress(t *testing.T) {
	truncateTables(t)
	userId := 9207
	seedTestUser(t, userId, 500)
	activity := mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.MinConsumeQuota = 600
		a.DailyLimit = 2
	})

	views, err := ListWelfareActivitiesForUser(userId)
	require.NoError(t, err)
	require.Len(t, views, 1)
	assert.Equal(t, WelfareActivityActive, views[0].Status)
	assert.False(t, views[0].ThresholdMet)
	assert.False(t, views[0].CanEnter)
	assert.Equal(t, 2, views[0].RemainingToday)
	assert.Equal(t, -1, views[0].RemainingTotal, "未设置总次数上限时以 -1 表示不限")

	require.NoError(t, DB.Model(&User{}).Where("id = ?", userId).Update("used_quota", 600).Error)
	views, err = ListWelfareActivitiesForUser(userId)
	require.NoError(t, err)
	assert.True(t, views[0].ThresholdMet)
	assert.True(t, views[0].CanEnter)

	_, err = UserEnterWelfareActivity(userId, activity.Id)
	require.NoError(t, err)

	views, err = ListWelfareActivitiesForUser(userId)
	require.NoError(t, err)
	assert.Equal(t, 1, views[0].EnteredToday)
	assert.Equal(t, 1, views[0].RemainingToday)
	assert.True(t, views[0].CanEnter)
}

func TestListWelfareActivitiesForUserHidesDisabled(t *testing.T) {
	truncateTables(t)
	userId := 9208
	seedTestUser(t, userId, 0)
	mustCreateWelfareActivity(t, 100, func(a *WelfareActivity) {
		a.Enabled = false
	})

	views, err := ListWelfareActivitiesForUser(userId)
	require.NoError(t, err)
	assert.Empty(t, views, "未开启的活动不应出现在用户端")
}

func TestDeleteWelfareActivityKeepsEntries(t *testing.T) {
	truncateTables(t)
	userId := 9209
	seedTestUser(t, userId, 0)
	activity := mustCreateWelfareActivity(t, 100, nil)

	_, err := UserEnterWelfareActivity(userId, activity.Id)
	require.NoError(t, err)

	require.NoError(t, DeleteWelfareActivity(activity.Id))

	_, err = GetWelfareActivityById(activity.Id)
	assert.Error(t, err)

	var entries []WelfareActivityEntry
	require.NoError(t, DB.Where("activity_id = ?", activity.Id).Find(&entries).Error)
	assert.Len(t, entries, 1, "已发放奖品的记录必须保留，用于审计")
}
