package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// 概率展示开关默认必须为开启。
//
// 一旦默认值翻转，升级到新版本后所有站点都会静默隐藏中奖概率，而管理员不会收到
// 任何提示 —— 这是"看起来正常、实际改变了线上展示"的典型回归，必须钉住。
func TestShowPrizeProbabilityDefaultsToOn(t *testing.T) {
	assert.True(t, GetWelfareSetting().ShowPrizeProbability,
		"概率展示开关默认必须开启")
}

// 抽奖与限时活动共用同一个开关：这里钉住"同一个结构体字段"这个事实，
// 防止将来有人给抽奖单独加一份副本，导致两处展示不一致。
func TestPrizeProbabilitySwitchIsSingleSource(t *testing.T) {
	welfare := GetWelfareSetting()
	original := welfare.ShowPrizeProbability
	t.Cleanup(func() { welfare.ShowPrizeProbability = original })

	// 关掉后，任何再调用 GetWelfareSetting() 的地方都必须立刻读到 false
	welfare.ShowPrizeProbability = false
	assert.False(t, GetWelfareSetting().ShowPrizeProbability)

	welfare.ShowPrizeProbability = true
	assert.True(t, GetWelfareSetting().ShowPrizeProbability)
}
