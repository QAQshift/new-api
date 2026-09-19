package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// 展示开关默认必须为开启。
//
// 一旦默认值翻转，升级到新版本后所有站点都会静默隐藏奖池/中奖概率，而管理员不会
// 收到任何提示 —— 这是"看起来正常、实际改变了线上展示"的典型回归，必须钉住。
func TestDisplaySwitchesDefaultToOn(t *testing.T) {
	welfare := GetWelfareSetting()
	assert.True(t, welfare.ShowActivityPrizePool, "活动的奖池展示默认必须开启")
	assert.True(t, welfare.ShowActivityProbability, "活动的概率展示默认必须开启")

	lottery := GetLotterySetting()
	assert.True(t, lottery.ShowPrizePool, "抽奖的奖池展示默认必须开启")
	assert.True(t, lottery.ShowPrizeProbability, "抽奖的概率展示默认必须开启")
	assert.True(t, lottery.ShowLotteryHistory, "抽奖记录展示默认必须开启")
}

// 抽奖与活动的展示开关必须彼此独立。
//
// 这两组开关曾经共用一份配置：改一处两边同时生效。现在按子模块拆开 —— 管理员
// 关掉活动的概率展示，不应该连带把抽奖的概率也藏起来。
func TestLotteryAndActivitySwitchesAreIndependent(t *testing.T) {
	welfare := GetWelfareSetting()
	lottery := GetLotterySetting()

	originalActivity := welfare.ShowActivityProbability
	originalLottery := lottery.ShowPrizeProbability
	t.Cleanup(func() {
		welfare.ShowActivityProbability = originalActivity
		lottery.ShowPrizeProbability = originalLottery
	})

	// 把两个开关设成相反的值：如果它们其实是同一份配置（曾经就是这样），
	// 下面必然有一条断言失败 —— 这比"只设置一个再看另一个"更能证明独立性。
	welfare.ShowActivityProbability = false
	lottery.ShowPrizeProbability = true

	assert.False(t, GetWelfareSetting().ShowActivityProbability,
		"活动的概率展示应为关闭")
	assert.True(t, GetLotterySetting().ShowPrizeProbability,
		"抽奖的概率展示应为开启，不受活动影响")

	// 反过来再验一次，排除"恰好一方是默认值"造成的假通过
	welfare.ShowActivityProbability = true
	lottery.ShowPrizeProbability = false

	assert.True(t, GetWelfareSetting().ShowActivityProbability,
		"活动的概率展示应为开启")
	assert.False(t, GetLotterySetting().ShowPrizeProbability,
		"抽奖的概率展示应为关闭，不受活动影响")
}
