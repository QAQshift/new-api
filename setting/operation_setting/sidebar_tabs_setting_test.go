package operation_setting

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func tabsSetting(categories ...SidebarTabCategory) *SidebarCustomTabsSetting {
	return &SidebarCustomTabsSetting{Categories: categories}
}

func linkItem(id, title, content string) SidebarTabItem {
	return SidebarTabItem{Id: id, Title: title, Type: SidebarTabTypeLink, Content: content}
}

func TestParseSidebarCustomTabsSettingDegradesOnBadInput(t *testing.T) {
	// 空值：等价于"没有自定义项"，且不能报错
	for _, raw := range []string{"", "   ", "\n"} {
		setting, err := ParseSidebarCustomTabsSetting(raw)
		require.NoError(t, err)
		assert.Empty(t, setting.Categories)
	}

	// 非法 JSON：返回空配置 + error，调用方据此拒绝保存
	setting, err := ParseSidebarCustomTabsSetting("{not json")
	assert.Error(t, err)
	assert.Empty(t, setting.Categories, "解析失败必须退化为空配置，而不是半截数据")
}

func TestParseSidebarCustomTabsSettingReadsCategories(t *testing.T) {
	raw := `{"categories":[{"id":"cat-1","title":"帮助中心","items":[{"id":"pg-1","title":"文档","type":"link","content":"https://example.com/docs"}]}]}`

	setting, err := ParseSidebarCustomTabsSetting(raw)
	require.NoError(t, err)
	require.Len(t, setting.Categories, 1)
	assert.Equal(t, "帮助中心", setting.Categories[0].Title)
	require.Len(t, setting.Categories[0].Items, 1)
	assert.Equal(t, "https://example.com/docs", setting.Categories[0].Items[0].Content)
	assert.NoError(t, ValidateSidebarCustomTabs(setting))
}

func TestValidateSidebarCustomTabsAcceptsEmpty(t *testing.T) {
	assert.NoError(t, ValidateSidebarCustomTabs(nil))
	assert.NoError(t, ValidateSidebarCustomTabs(tabsSetting()))
	// 主题存在但暂时没有页面：允许保存中间状态
	assert.NoError(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心"},
	)))
}

func TestValidateSidebarCustomTabsAcceptsAllThreeTypes(t *testing.T) {
	setting := tabsSetting(SidebarTabCategory{
		Id:    "cat-1",
		Title: "帮助中心",
		Items: []SidebarTabItem{
			linkItem("pg-link", "外部文档", "https://example.com"),
			{Id: "pg-iframe", Title: "嵌入页", Type: SidebarTabTypeIframe, Content: "https://example.com/embed"},
			{Id: "pg-html", Title: "公告", Type: SidebarTabTypeHTML, Content: "<p>hello</p>"},
		},
	})

	assert.NoError(t, ValidateSidebarCustomTabs(setting))
}

func TestValidateSidebarCustomTabsRequiresTitles(t *testing.T) {
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "  "},
	)), "主题名不能为空")

	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心", Items: []SidebarTabItem{
			linkItem("pg-1", "", "https://example.com"),
		}},
	)), "页面名不能为空")
}

func TestValidateSidebarCustomTabsRejectsDuplicateTitles(t *testing.T) {
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心"},
		SidebarTabCategory{Id: "cat-2", Title: "帮助中心"},
	)), "两个同名主题在侧边栏上无法分辨")
}

func TestValidateSidebarCustomTabsRequiresUniqueItemIds(t *testing.T) {
	// 页面 id 会出现在站内路由里，重复会让两个条目指向同一个页面
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "A", Items: []SidebarTabItem{
			linkItem("pg-1", "一", "https://example.com"),
		}},
		SidebarTabCategory{Id: "cat-2", Title: "B", Items: []SidebarTabItem{
			linkItem("pg-1", "二", "https://example.com"),
		}},
	)))
}

func TestValidateSidebarCustomTabsRejectsUnsafeIds(t *testing.T) {
	// id 会被拼进 URL，斜杠/点号/空格都会造成路由歧义
	for _, id := range []string{"", "pg/1", "pg.1", "pg 1", "页面", strings.Repeat("a", MaxSidebarTabIDLength+1)} {
		setting := tabsSetting(SidebarTabCategory{
			Id:    "cat-1",
			Title: "帮助中心",
			Items: []SidebarTabItem{linkItem(id, "文档", "https://example.com")},
		})
		assert.Error(t, ValidateSidebarCustomTabs(setting), "id 应被拒绝：%q", id)
	}
}

func TestValidateSidebarCustomTabsRejectsDangerousSchemes(t *testing.T) {
	// 只允许 http/https：javascript: 与 data: 会被当成外链点击执行
	for _, content := range []string{
		"javascript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"//example.com",
		"example.com",
		"ftp://example.com",
	} {
		setting := tabsSetting(SidebarTabCategory{
			Id:    "cat-1",
			Title: "帮助中心",
			Items: []SidebarTabItem{
				{Id: "pg-1", Title: "文档", Type: SidebarTabTypeLink, Content: content},
			},
		})
		assert.Error(t, ValidateSidebarCustomTabs(setting), "网址应被拒绝：%q", content)
	}
}

func TestValidateSidebarCustomTabsRejectsUnknownType(t *testing.T) {
	setting := tabsSetting(SidebarTabCategory{
		Id:    "cat-1",
		Title: "帮助中心",
		Items: []SidebarTabItem{
			{Id: "pg-1", Title: "文档", Type: "video", Content: "https://example.com"},
		},
	})

	assert.Error(t, ValidateSidebarCustomTabs(setting))
}

func TestValidateSidebarCustomTabsEnforcesSizeLimits(t *testing.T) {
	// 主题数量
	tooManyCategories := make([]SidebarTabCategory, 0, MaxSidebarTabCategories+1)
	for i := 0; i <= MaxSidebarTabCategories; i++ {
		tooManyCategories = append(tooManyCategories, SidebarTabCategory{Id: "cat", Title: string(rune('A' + i))})
	}
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(tooManyCategories...)))

	// 单主题页面数
	tooManyItems := make([]SidebarTabItem, 0, MaxSidebarTabItemsPerCategory+1)
	for i := 0; i <= MaxSidebarTabItemsPerCategory; i++ {
		tooManyItems = append(tooManyItems, linkItem("pg-"+string(rune('a'+i%26))+string(rune('a'+i/26)), "页", "https://example.com"))
	}
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心", Items: tooManyItems},
	)))

	// 超长标题
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: strings.Repeat("长", MaxSidebarTabTitleLength+1)},
	)))

	// 超长 HTML
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心", Items: []SidebarTabItem{
			{Id: "pg-1", Title: "公告", Type: SidebarTabTypeHTML,
				Content: strings.Repeat("x", MaxSidebarTabHTMLLength+1)},
		}},
	)))

	// 超长网址
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心", Items: []SidebarTabItem{
			linkItem("pg-1", "文档", "https://example.com/"+strings.Repeat("x", MaxSidebarTabURLLength)),
		}},
	)))

	// 空内容
	assert.Error(t, ValidateSidebarCustomTabs(tabsSetting(
		SidebarTabCategory{Id: "cat-1", Title: "帮助中心", Items: []SidebarTabItem{
			linkItem("pg-1", "文档", "  "),
		}},
	)))
}
