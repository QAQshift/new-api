package operation_setting

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWelfareRulesDefaultToEmpty(t *testing.T) {
	// 默认必须是空的：升级后不能凭空在福利中心多出一块说明内容
	assert.Empty(t, GetWelfareSetting().RulesContent)
}

func TestValidateWelfareRulesContent(t *testing.T) {
	assert.NoError(t, ValidateWelfareRulesContent(""))
	assert.NoError(t, ValidateWelfareRulesContent("<p>签到即可领取额度</p>"))
	assert.NoError(t, ValidateWelfareRulesContent(strings.Repeat("a", MaxWelfareRulesBytes)))

	// 上限按字节计：这段内容会随 status 下发给每个用户，必须卡住大小
	assert.Error(t, ValidateWelfareRulesContent(strings.Repeat("a", MaxWelfareRulesBytes+1)))
	// 中文按 UTF-8 多字节计算，同样受同一上限约束
	assert.Error(t, ValidateWelfareRulesContent(strings.Repeat("福", MaxWelfareRulesBytes)))
}

func TestShowWinnerListDefaultsToOff(t *testing.T) {
	// 公开他人（即使已遮蔽的）昵称属于新增的隐私暴露，默认必须是关的；
	// 否则一次升级就会把所有站点的用户名单摊开给所有人看。
	assert.False(t, GetWelfareSetting().ShowWinnerList)
}
