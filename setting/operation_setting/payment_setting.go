package operation_setting

import (
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

type PaymentSetting struct {
	AmountOptions  []int           `json:"amount_options"`
	AmountDiscount map[int]float64 `json:"amount_discount"` // 充值金额对应的折扣，例如 100 元 0.9 表示 100 元充值享受 9 折优惠

	// EnableCustomTopup 控制是否允许用户在充值页面手动输入任意金额。
	// 为 true 时显示自定义金额输入框；为 false 时隐藏，仅允许使用预设金额。
	EnableCustomTopup bool `json:"enable_custom_topup"`

	// DisabledMethods 被临时停用的支付方式 type 列表（例如 alipay、wxpay）。
	// 命中的方式不会下发给前端，服务端也会拒绝该方式的支付请求；
	// 这样可以在个人免签通道被风控时随时下架，而不必删掉渠道配置。
	DisabledMethods []string `json:"disabled_methods"`
	// DisabledNotice 支付方式被停用时在充值页展示的说明文案；留空则不展示。
	DisabledNotice string `json:"disabled_notice"`

	ComplianceConfirmed    bool   `json:"compliance_confirmed"`
	ComplianceTermsVersion string `json:"compliance_terms_version"`
	ComplianceConfirmedAt  int64  `json:"compliance_confirmed_at"`
	ComplianceConfirmedBy  int    `json:"compliance_confirmed_by"`
	ComplianceConfirmedIP  string `json:"compliance_confirmed_ip"`
}

const CurrentComplianceTermsVersion = "v1"

// 默认配置
var paymentSetting = PaymentSetting{
	AmountOptions:     []int{10, 20, 50, 100, 200, 500},
	AmountDiscount:    map[int]float64{},
	EnableCustomTopup: true,
	DisabledMethods:   []string{},
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("payment_setting", &paymentSetting)
}

func GetPaymentSetting() *PaymentSetting {
	return &paymentSetting
}

// IsPayMethodDisabled 判断某个支付方式是否被管理员临时停用。
func IsPayMethodDisabled(method string) bool {
	method = strings.TrimSpace(method)
	if method == "" {
		return false
	}
	for _, disabled := range paymentSetting.DisabledMethods {
		if strings.EqualFold(strings.TrimSpace(disabled), method) {
			return true
		}
	}
	return false
}

// GetDisabledPaymentNotice 返回支付方式停用公告；未配置停用项时始终返回空串，
// 避免管理员只填了文案却忘记选择停用方式时误弹公告。
func GetDisabledPaymentNotice() string {
	if len(paymentSetting.DisabledMethods) == 0 {
		return ""
	}
	return strings.TrimSpace(paymentSetting.DisabledNotice)
}

func IsPaymentComplianceConfirmed() bool {
	return paymentSetting.ComplianceConfirmed &&
		paymentSetting.ComplianceTermsVersion == CurrentComplianceTermsVersion
}
