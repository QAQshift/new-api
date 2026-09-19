package operation_setting

import (
	"github.com/QuantumNous/new-api/setting/config"
)

// WelfareSetting 福利中心的模块总开关。
//
// 签到与抽奖各自已有开关（checkin_setting / lottery_setting），这里只补上
// 「限时活动」需要的总开关：活动本身是数据行（可增删改），无法用一个字段
// 表达"模块是否可用"，因此单独开一个总开关。
type WelfareSetting struct {
	// ActivitiesEnabled 限时活动模块总开关
	ActivitiesEnabled bool `json:"activities_enabled"`
	// ShowPrizeProbability 是否在用户端展示中奖概率。
	//
	// 抽奖与限时活动共用这一个开关：两者都是"按权重抽奖"的奖池，让管理员在一处
	// 控制全部概率展示，避免出现"活动藏着概率、抽奖露着概率"这类不一致。
	// 默认开启，与加开关之前的行为一致（此前用户端总是展示）。
	ShowPrizeProbability bool `json:"show_prize_probability"`
}

// 默认关闭：升级后不会突然对所有站点开放
var welfareSetting = WelfareSetting{
	ActivitiesEnabled:    false,
	ShowPrizeProbability: true,
}

func init() {
	config.GlobalConfig.Register("welfare_setting", &welfareSetting)
}

func GetWelfareSetting() *WelfareSetting {
	return &welfareSetting
}
