package controller

import (
	"errors"

	"github.com/QuantumNous/new-api/setting/operation_setting"
)

// sidebarCustomTabsOptionKey 是自定义侧边栏 tab 的配置键。
//
// 与 SidebarModulesAdmin 一样，它以 JSON 字符串的形式存放在 options 表里，
// 不通过 config.GlobalConfig 注册；服务端只负责校验与透传，解析在前端完成。
const sidebarCustomTabsOptionKey = "SidebarCustomTabs"

// validateSidebarCustomTabsOption 校验管理员提交的自定义 tab 配置。
//
// 必须在写入时校验而不是渲染时兜底：这份配置会下发给所有已登录用户，并直接
// 决定侧边栏内容。一旦存入脏数据（重复的页面 id、非 http 协议的网址、超长内容），
// 影响面是全站用户，而且前端很难分辨"这个条目有问题"还是"整个功能坏了"。
func validateSidebarCustomTabsOption(raw string) error {
	setting, err := operation_setting.ParseSidebarCustomTabsSetting(raw)
	if err != nil {
		return errors.New("自定义侧边栏配置必须是合法的 JSON")
	}
	return operation_setting.ValidateSidebarCustomTabs(setting)
}
