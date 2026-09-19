package operation_setting

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
)

// 自定义侧边栏 tab 的内容形态。
const (
	// SidebarTabTypeLink 外链：点击在新标签打开外部网址，站内不渲染任何页面。
	SidebarTabTypeLink = "link"
	// SidebarTabTypeIframe 站内页面：在站内路由里用 iframe 嵌入该网址。
	SidebarTabTypeIframe = "iframe"
	// SidebarTabTypeHTML 站内页面：直接渲染这段 HTML（前端会做净化）。
	SidebarTabTypeHTML = "html"
)

// 规模上限。这些值同时被后端校验与前端编辑器使用：
// 一个失控的配置会把侧边栏撑爆，或者让 status 接口的响应体异常变大，
// 因此必须在写入时而不是渲染时拦住。
const (
	// MaxSidebarTabCategories 最多允许的分类主题数。
	MaxSidebarTabCategories = 20
	// MaxSidebarTabItemsPerCategory 单个主题下最多允许的页面数。
	MaxSidebarTabItemsPerCategory = 30
	// MaxSidebarTabItems 全部主题加起来的页面数上限。
	MaxSidebarTabItems = 100
	// MaxSidebarTabTitleLength 主题名与页面名的最大长度。
	MaxSidebarTabTitleLength = 60
	// MaxSidebarTabURLLength 外链/iframe 网址的最大长度。
	MaxSidebarTabURLLength = 2000
	// MaxSidebarTabHTMLLength 内嵌 HTML 的最大长度。
	MaxSidebarTabHTMLLength = 20000
	// MaxSidebarTabIDLength 标识符最大长度（会出现在 URL 里）。
	MaxSidebarTabIDLength = 64
)

// SidebarTabItem 一个自定义页面。
type SidebarTabItem struct {
	// Id 稳定标识符，会出现在站内路由 /custom-tab/<id> 中，创建后不应再修改。
	Id string `json:"id"`
	// Title 侧边栏上显示的名字。
	Title string `json:"title"`
	// Type 取 SidebarTabTypeLink / Iframe / HTML。
	Type string `json:"type"`
	// Content 外链与 iframe 时是网址；html 时是一段 HTML。
	Content string `json:"content"`
}

// SidebarTabCategory 一个分类主题，对应侧边栏里的一组条目。
type SidebarTabCategory struct {
	Id    string           `json:"id"`
	Title string           `json:"title"`
	Items []SidebarTabItem `json:"items"`
}

// SidebarCustomTabsSetting 自定义侧边栏 tab 的完整配置。
//
// 存储形态：以 JSON 字符串存在 option `SidebarCustomTabs` 里（与
// SidebarModulesAdmin 相同的做法），因此这里不通过 config.GlobalConfig 注册。
type SidebarCustomTabsSetting struct {
	Categories []SidebarTabCategory `json:"categories"`
}

// ParseSidebarCustomTabsSetting 把存储的 JSON 字符串解析成配置。
// 空值或非法 JSON 返回空配置 + error（调用方通常选择忽略 error 并用空配置）。
func ParseSidebarCustomTabsSetting(raw string) (*SidebarCustomTabsSetting, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return &SidebarCustomTabsSetting{}, nil
	}
	setting := &SidebarCustomTabsSetting{}
	if err := json.Unmarshal([]byte(trimmed), setting); err != nil {
		return &SidebarCustomTabsSetting{}, err
	}
	return setting, nil
}

// isHTTPURL 只接受 http/https，避免 javascript: / data: 这类危险协议被当成外链。
func isHTTPURL(value string) bool {
	parsed, err := url.Parse(value)
	if err != nil {
		return false
	}
	return parsed.Scheme == "http" || parsed.Scheme == "https"
}

// isSafeSidebarTabId 限制标识符字符集：它会拼进 URL，必须避免斜杠、点号、
// 以及任何需要转义的字符。
func isSafeSidebarTabId(id string) bool {
	if id == "" || len(id) > MaxSidebarTabIDLength {
		return false
	}
	for _, r := range id {
		isLower := r >= 'a' && r <= 'z'
		isUpper := r >= 'A' && r <= 'Z'
		isDigit := r >= '0' && r <= '9'
		if !isLower && !isUpper && !isDigit && r != '-' && r != '_' {
			return false
		}
	}
	return true
}

// ValidateSidebarCustomTabs 校验整份自定义 tab 配置。
// 返回的错误会原样展示给管理员，因此措辞要能定位到具体条目。
func ValidateSidebarCustomTabs(setting *SidebarCustomTabsSetting) error {
	if setting == nil {
		return nil
	}
	if len(setting.Categories) > MaxSidebarTabCategories {
		return fmt.Errorf("最多支持 %d 个分类主题", MaxSidebarTabCategories)
	}

	totalItems := 0
	// 页面 id 会出现在 URL 中，全局唯一是硬约束：重复 id 会让两个条目
	// 指向同一个站内页面。
	seenItemIds := map[string]bool{}
	seenCategoryTitles := map[string]bool{}

	for ci, category := range setting.Categories {
		label := fmt.Sprintf("第 %d 个主题", ci+1)
		title := strings.TrimSpace(category.Title)
		if title == "" {
			return fmt.Errorf("%s的名称不能为空", label)
		}
		if len([]rune(title)) > MaxSidebarTabTitleLength {
			return fmt.Errorf("%s的名称超过 %d 个字", label, MaxSidebarTabTitleLength)
		}
		if seenCategoryTitles[title] {
			return fmt.Errorf("主题名称「%s」重复了", title)
		}
		seenCategoryTitles[title] = true

		if len(category.Items) > MaxSidebarTabItemsPerCategory {
			return fmt.Errorf("%s最多支持 %d 个页面", label, MaxSidebarTabItemsPerCategory)
		}

		for ii, item := range category.Items {
			itemLabel := fmt.Sprintf("%s的第 %d 个页面", label, ii+1)
			if !isSafeSidebarTabId(item.Id) {
				return fmt.Errorf("%s缺少合法的标识符（只能是字母、数字、- 和 _，且不超过 %d 个字符）", itemLabel, MaxSidebarTabIDLength)
			}
			if seenItemIds[item.Id] {
				return fmt.Errorf("%s的标识符与其他页面重复了", itemLabel)
			}
			seenItemIds[item.Id] = true

			itemTitle := strings.TrimSpace(item.Title)
			if itemTitle == "" {
				return fmt.Errorf("%s的名称不能为空", itemLabel)
			}
			if len([]rune(itemTitle)) > MaxSidebarTabTitleLength {
				return fmt.Errorf("%s的名称超过 %d 个字", itemLabel, MaxSidebarTabTitleLength)
			}

			content := strings.TrimSpace(item.Content)
			switch item.Type {
			case SidebarTabTypeLink, SidebarTabTypeIframe:
				if content == "" {
					return fmt.Errorf("%s还没有填写网址", itemLabel)
				}
				if len(content) > MaxSidebarTabURLLength {
					return fmt.Errorf("%s的网址过长", itemLabel)
				}
				if !isHTTPURL(content) {
					return fmt.Errorf("%s的网址必须以 http:// 或 https:// 开头", itemLabel)
				}
			case SidebarTabTypeHTML:
				if content == "" {
					return fmt.Errorf("%s还没有填写 HTML 内容", itemLabel)
				}
				if len(content) > MaxSidebarTabHTMLLength {
					return fmt.Errorf("%s的 HTML 内容过长（上限 %d 字符）", itemLabel, MaxSidebarTabHTMLLength)
				}
			default:
				return fmt.Errorf("%s的内容类型不支持：%s", itemLabel, item.Type)
			}
		}

		totalItems += len(category.Items)
	}

	if totalItems > MaxSidebarTabItems {
		return fmt.Errorf("自定义页面总数超过 %d 个", MaxSidebarTabItems)
	}

	return nil
}
