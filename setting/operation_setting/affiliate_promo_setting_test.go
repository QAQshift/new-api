package operation_setting

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateAffiliatePromoTemplatesAcceptsUsableList(t *testing.T) {
	assert.NoError(t, validateAffiliatePromoTemplates(nil))
	assert.NoError(t, validateAffiliatePromoTemplates([]AffiliatePromoTemplate{}))
	assert.NoError(t, validateAffiliatePromoTemplates([]AffiliatePromoTemplate{
		{Label: "简洁推荐", Text: "我在用 {{site}}，注册链接：{{link}}"},
		{Label: "朋友口吻", Text: "试试 {{site}}：{{link}}"},
	}))
}

func TestValidateAffiliatePromoTemplatesRequiresLabelAndText(t *testing.T) {
	assert.Error(t, validateAffiliatePromoTemplates([]AffiliatePromoTemplate{
		{Label: "  ", Text: "有内容"},
	}), "标签不能为空")
	assert.Error(t, validateAffiliatePromoTemplates([]AffiliatePromoTemplate{
		{Label: "标签", Text: "   "},
	}), "文案不能为空")
}

func TestValidateAffiliatePromoTemplatesEnforcesLimits(t *testing.T) {
	tooMany := make([]AffiliatePromoTemplate, 0, MaxAffiliatePromoTemplates+1)
	for i := 0; i <= MaxAffiliatePromoTemplates; i++ {
		tooMany = append(tooMany, AffiliatePromoTemplate{Label: "L", Text: "T"})
	}
	assert.Error(t, validateAffiliatePromoTemplates(tooMany))

	assert.Error(t, validateAffiliatePromoTemplates([]AffiliatePromoTemplate{
		{Label: strings.Repeat("长", MaxAffiliatePromoLabelLength+1), Text: "T"},
	}))
	assert.Error(t, validateAffiliatePromoTemplates([]AffiliatePromoTemplate{
		{Label: "L", Text: strings.Repeat("长", MaxAffiliatePromoTextLength+1)},
	}))
}

func TestValidateAffiliatePosterUrl(t *testing.T) {
	// 留空表示使用内置版式
	assert.NoError(t, validateAffiliatePosterUrl(""))
	assert.NoError(t, validateAffiliatePosterUrl("   "))

	// 同源相对路径是最推荐的形式：不会被跨域污染，导出必定成功
	assert.NoError(t, validateAffiliatePosterUrl("/uploads/poster.png"))
	assert.NoError(t, validateAffiliatePosterUrl("https://cdn.example.com/p.png"))
	assert.NoError(t, validateAffiliatePosterUrl("http://example.com/p.png"))

	// 协议相对地址会被解析到别的域，不是站内路径
	assert.Error(t, validateAffiliatePosterUrl("//evil.example.com/p.png"))
	// 危险协议不能进 <img src>
	assert.Error(t, validateAffiliatePosterUrl("javascript:alert(1)"))
	assert.Error(t, validateAffiliatePosterUrl("data:image/png;base64,AAAA"))
	assert.Error(t, validateAffiliatePosterUrl("ftp://example.com/p.png"))
	assert.Error(t, validateAffiliatePosterUrl(strings.Repeat("a", MaxAffiliatePosterUrlLength+1)))
}

func TestValidateAffiliateSettingChecksPromoFields(t *testing.T) {
	setting := GetAffiliateSetting()
	base := *setting

	bad := base
	bad.PosterBackgroundUrl = "javascript:alert(1)"
	assert.Error(t, ValidateAffiliateSetting(bad))

	bad = base
	bad.PromoTemplates = []AffiliatePromoTemplate{{Label: "", Text: "x"}}
	assert.Error(t, ValidateAffiliateSetting(bad))

	good := base
	good.PromoTemplates = []AffiliatePromoTemplate{{Label: "L", Text: "T"}}
	good.PosterBackgroundUrl = "/uploads/poster.png"
	assert.NoError(t, ValidateAffiliateSetting(good))
}
