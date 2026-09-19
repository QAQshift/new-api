package operation_setting

import (
	"fmt"

	"github.com/QuantumNous/new-api/setting/config"
)

// MaxWelfareRulesBytes 玩法说明的长度上限（字节）。
//
// 这段内容会随 /api/status 下发给每一个用户（status 是每次打开页面都会取的
// 接口），因此必须在写入时就卡住大小，而不是等渲染时兜底。取 32KB 是为了容纳
// 一段带少量样式与表格的说明，同时不至于让 status 响应体失控。
const MaxWelfareRulesBytes = 32 * 1024

// ValidateWelfareRulesContent 校验玩法说明的长度。
func ValidateWelfareRulesContent(raw string) error {
	if len(raw) > MaxWelfareRulesBytes {
		return fmt.Errorf("玩法说明超过 %d KB", MaxWelfareRulesBytes/1024)
	}
	return nil
}

// WelfareSetting 福利中心自己的设置。
//
// 福利中心是个容器，它的三个子模块各有归属：
//   - 签到 → checkin_setting
//   - 抽奖 → lottery_setting
//   - 限时活动 → 这里（活动是数据行，没有一个能表达"模块是否可用"的字段，
//     所以总开关只能单独放）
//
// 每个模块的展示开关都跟着该模块走：管理员进"活动设置"就能看到关于活动的全部
// 开关，不必跑到别处找。只有不属于任何子模块的东西（整个福利中心顶部的玩法
// 说明）才留在这一层。
type WelfareSetting struct {
	// ActivitiesEnabled 限时活动模块总开关
	ActivitiesEnabled bool `json:"activities_enabled"`
	// ShowActivityPrizePool 是否在用户端展示活动的奖池。
	//
	// 关闭后活动不再出现奖池区域，只保留门槛进度与参与按钮 —— 给"不想让用户
	// 看到具体奖什么"的运营留的口子。与抽奖的同名开关相互独立。
	ShowActivityPrizePool bool `json:"show_activity_prize_pool"`
	// ShowActivityProbability 是否展示活动各档位的中奖概率。
	// 仅在展示奖池时有意义：奖池整体隐藏时它无从体现。
	ShowActivityProbability bool `json:"show_activity_probability"`
	// ShowWinnerList 是否在用户端展示活动的中奖名单。
	//
	// 默认关闭：公开（即使已遮蔽的）他人昵称属于新增的隐私暴露，不应在升级时
	// 自动对所有站点生效 —— 与限时活动模块默认关闭同理，由管理员主动开启。
	ShowWinnerList bool `json:"show_winner_list"`
	// RulesContent 福利中心顶部展示的玩法说明。
	//
	// 它显示在所有标签页顶部，因此不属于任何子模块，而是福利中心这一层的东西。
	// 支持 HTML 与 Markdown，前端按内容形态自动判定渲染方式。留空即不展示说明块
	// —— 因此不需要额外的开关。
	RulesContent string `json:"rules_content"`
}

// 活动模块默认关闭：升级后不会突然对所有站点开放。
// 活动侧的展示开关默认开启，与"加开关之前用户端总是展示"的行为一致。
// 玩法说明默认留空，升级后不会凭空多出一块内容。
var welfareSetting = WelfareSetting{
	ActivitiesEnabled:       false,
	ShowActivityPrizePool:   true,
	ShowActivityProbability: true,
	ShowWinnerList:          false,
	RulesContent:            "",
}

func init() {
	config.GlobalConfig.Register("welfare_setting", &welfareSetting)
}

func GetWelfareSetting() *WelfareSetting {
	return &welfareSetting
}
