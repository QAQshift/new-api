package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func withDisabledPayMethods(t *testing.T, methods []string, notice string) {
	t.Helper()
	originalMethods := paymentSetting.DisabledMethods
	originalNotice := paymentSetting.DisabledNotice
	t.Cleanup(func() {
		paymentSetting.DisabledMethods = originalMethods
		paymentSetting.DisabledNotice = originalNotice
	})
	paymentSetting.DisabledMethods = methods
	paymentSetting.DisabledNotice = notice
}

func TestIsPayMethodDisabledIgnoresCaseAndSurroundingSpaces(t *testing.T) {
	withDisabledPayMethods(t, []string{" alipay ", "WXPAY"}, "")

	assert.True(t, IsPayMethodDisabled("alipay"))
	assert.True(t, IsPayMethodDisabled("wxpay"))
	assert.False(t, IsPayMethodDisabled("custom1"))
	assert.False(t, IsPayMethodDisabled(""))
}

func TestDisabledPaymentNoticeHiddenWhenNoMethodDisabled(t *testing.T) {
	withDisabledPayMethods(t, nil, "支付宝维护中")

	assert.Empty(t, GetDisabledPaymentNotice())
}

func TestDisabledPaymentNoticeReturnedWhenMethodDisabled(t *testing.T) {
	withDisabledPayMethods(t, []string{"alipay"}, "  支付宝维护中  ")

	assert.Equal(t, "支付宝维护中", GetDisabledPaymentNotice())
}

func TestDisabledPaymentNoticeEmptyWhenNoticeNotConfigured(t *testing.T) {
	withDisabledPayMethods(t, []string{"alipay"}, "")

	assert.Empty(t, GetDisabledPaymentNotice())
}
