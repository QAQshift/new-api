package controller

import (
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

// welfareRulesOptionKey 是福利中心玩法说明的配置键。
//
// 它是 welfare_setting 命名空间下的一个普通字符串字段，本节只需要在写入时
// 拦一下长度。
const welfareRulesOptionKey = "welfare_setting.rules_content"

// validateWelfareRulesContentOption 校验管理员提交的玩法说明。
//
// 必须在写入时校验：这段内容会随 status 接口下发给每个用户，一个失控的大段
// HTML 会拖慢每一次页面加载。
func validateWelfareRulesContentOption(raw string) error {
	return operation_setting.ValidateWelfareRulesContent(raw)
}
