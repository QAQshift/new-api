package controller

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/console_setting"
	"github.com/QuantumNous/new-api/setting/model_setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"

	"github.com/gin-gonic/gin"
)

var completionRatioMetaOptionKeys = []string{
	"ModelPrice",
	"ModelRatio",
	"CompletionRatio",
	"CacheRatio",
	"CreateCacheRatio",
	"ImageRatio",
	"AudioRatio",
	"AudioCompletionRatio",
}

func isPaymentComplianceOptionKey(key string) bool {
	return strings.HasPrefix(key, "payment_setting.compliance_")
}

func isPositiveOptionValue(value string) bool {
	intValue, err := strconv.Atoi(strings.TrimSpace(value))
	if err == nil {
		return intValue > 0
	}
	floatValue, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	return err == nil && floatValue > 0
}

func collectModelNamesFromOptionValue(raw string, modelNames map[string]struct{}) {
	if strings.TrimSpace(raw) == "" {
		return
	}

	var parsed map[string]any
	if err := common.UnmarshalJsonStr(raw, &parsed); err != nil {
		return
	}

	for modelName := range parsed {
		modelNames[modelName] = struct{}{}
	}
}

func buildCompletionRatioMetaValue(optionValues map[string]string) string {
	modelNames := make(map[string]struct{})
	for _, key := range completionRatioMetaOptionKeys {
		collectModelNamesFromOptionValue(optionValues[key], modelNames)
	}

	meta := make(map[string]ratio_setting.CompletionRatioInfo, len(modelNames))
	for modelName := range modelNames {
		meta[modelName] = ratio_setting.GetCompletionRatioInfo(modelName)
	}

	jsonBytes, err := common.Marshal(meta)
	if err != nil {
		return "{}"
	}
	return string(jsonBytes)
}

func GetOptions(c *gin.Context) {
	var options []*model.Option
	optionValues := make(map[string]string)
	common.OptionMapRWMutex.Lock()
	for k, v := range common.OptionMap {
		if k == "theme.frontend" {
			continue
		}
		value := common.Interface2String(v)
		isSensitiveKey := strings.HasSuffix(k, "Token") ||
			strings.HasSuffix(k, "Secret") ||
			strings.HasSuffix(k, "Key") ||
			strings.HasSuffix(k, "secret") ||
			strings.HasSuffix(k, "api_key")
		if isSensitiveKey {
			continue
		}
		options = append(options, &model.Option{
			Key:   k,
			Value: value,
		})
		for _, optionKey := range completionRatioMetaOptionKeys {
			if optionKey == k {
				optionValues[k] = value
				break
			}
		}
	}
	common.OptionMapRWMutex.Unlock()
	options = append(options, &model.Option{
		Key:   "CompletionRatioMeta",
		Value: buildCompletionRatioMetaValue(optionValues),
	})
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    options,
	})
}

type OptionUpdateRequest struct {
	Key   string `json:"key"`
	Value any    `json:"value"`
}

const (
	maxLogoDataBytes       = 512 * 1024
	maxBackgroundDataBytes = 4 * 1024 * 1024
	maxDocsCount           = 100
	maxDocTitleLength      = 200
	maxDocSummaryLength    = 500
	maxDocContentLength    = 200_000
)

type managedDocOption struct {
	ID         string           `json:"id"`
	CategoryID string           `json:"categoryId,omitempty"`
	SectionID  string           `json:"sectionId,omitempty"`
	Eyebrow    string           `json:"eyebrow,omitempty"`
	Title      string           `json:"title"`
	Summary    string           `json:"summary"`
	Content    string           `json:"content"`
	Blocks     []map[string]any `json:"blocks,omitempty"`
	Published  bool             `json:"published"`
	Order      int              `json:"order"`
}

type managedDocCategory struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Order int    `json:"order"`
}

func validateManagedCategories(categories []managedDocCategory) error {
	if len(categories) > maxDocsCount {
		return fmt.Errorf("文档分组数量不能超过 %d 个", maxDocsCount)
	}
	seenCategoryIDs := make(map[string]struct{}, len(categories))
	for _, category := range categories {
		id := strings.TrimSpace(category.ID)
		if id == "" {
			return fmt.Errorf("每个文档分组都必须有唯一 ID")
		}
		if _, exists := seenCategoryIDs[id]; exists {
			return fmt.Errorf("文档分组 ID 不能重复: %s", id)
		}
		seenCategoryIDs[id] = struct{}{}
		if strings.TrimSpace(category.Label) == "" || len([]rune(category.Label)) > 100 {
			return fmt.Errorf("文档分组名称不能为空且不能超过 100 个字符")
		}
		if category.Order < 0 {
			return fmt.Errorf("文档分组排序不能为负数")
		}
	}
	return nil
}

func validateDocBlocks(blocks []map[string]any) error {
	for _, block := range blocks {
		blockType, ok := block["type"].(string)
		if !ok {
			return fmt.Errorf("内容块必须包含 type")
		}
		switch blockType {
		case "markdown", "code", "image", "endpoint", "table", "steps",
			"copy", "callout", "card", "downloads":
		default:
			return fmt.Errorf("不支持的内容块类型: %s", blockType)
		}
	}
	return nil
}

type managedAboutDocument struct {
	Version int              `json:"version"`
	Eyebrow string           `json:"eyebrow"`
	Title   string           `json:"title"`
	Summary string           `json:"summary"`
	Blocks  []map[string]any `json:"blocks"`
}

// validateAboutDocument accepts an empty value, which clears the structured
// About page and lets the frontend fall back to the legacy About content or
// the built-in page.
func validateAboutDocument(value string) error {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" || trimmed == "null" {
		return nil
	}
	var document managedAboutDocument
	if err := common.UnmarshalJsonStr(trimmed, &document); err != nil {
		return fmt.Errorf("关于页配置必须是有效的 JSON 对象")
	}
	if len([]rune(document.Eyebrow)) > 100 {
		return fmt.Errorf("关于页标签不能超过 100 个字符")
	}
	if len([]rune(document.Title)) > maxDocTitleLength {
		return fmt.Errorf("关于页标题不能超过 %d 个字符", maxDocTitleLength)
	}
	if len([]rune(document.Summary)) > maxDocSummaryLength {
		return fmt.Errorf("关于页摘要不能超过 %d 个字符", maxDocSummaryLength)
	}
	if len(document.Blocks) > 100 {
		return fmt.Errorf("关于页不能超过 100 个内容块")
	}
	return validateDocBlocks(document.Blocks)
}

func validateManagedDocs(value string) error {
	if strings.TrimSpace(value) == "" || strings.TrimSpace(value) == "null" {
		return fmt.Errorf("文档配置必须是有效的 JSON 数组")
	}
	var raw any
	if err := common.UnmarshalJsonStr(value, &raw); err != nil {
		return fmt.Errorf("文档配置必须是有效的 JSON 数组")
	}
	var categories []managedDocCategory
	docs := make([]managedDocOption, 0)
	switch parsed := raw.(type) {
	case []any:
		bytes, err := common.Marshal(parsed)
		if err != nil || common.Unmarshal(bytes, &docs) != nil {
			return fmt.Errorf("文档配置必须是有效的 JSON 数组")
		}
	case map[string]any:
		sections, ok := parsed["sections"]
		if !ok {
			return fmt.Errorf("文档配置必须包含 sections 数组")
		}
		if rawCategories, ok := parsed["categories"]; ok {
			bytes, err := common.Marshal(rawCategories)
			if err != nil || common.Unmarshal(bytes, &categories) != nil {
				return fmt.Errorf("文档配置的 categories 必须是有效数组")
			}
		}
		bytes, err := common.Marshal(sections)
		if err != nil || common.Unmarshal(bytes, &docs) != nil {
			return fmt.Errorf("文档配置必须包含有效的 sections 数组")
		}
	default:
		return fmt.Errorf("文档配置必须是有效的 JSON 数组")
	}
	if len(categories) > 0 {
		if err := validateManagedCategories(categories); err != nil {
			return err
		}
	}
	categoryIDs := make(map[string]struct{}, len(categories))
	for _, category := range categories {
		categoryIDs[category.ID] = struct{}{}
	}
	if len(docs) > maxDocsCount {
		return fmt.Errorf("文档数量不能超过 %d 篇", maxDocsCount)
	}
	seenIDs := make(map[string]struct{}, len(docs))
	seenSectionIDs := make(map[string]struct{}, len(docs))
	for _, doc := range docs {
		id := strings.TrimSpace(doc.ID)
		if id == "" {
			return fmt.Errorf("每篇文档都必须有唯一 ID")
		}
		if _, exists := seenIDs[id]; exists {
			return fmt.Errorf("文档 ID 不能重复: %s", id)
		}
		seenIDs[id] = struct{}{}
		if doc.CategoryID != "" {
			if _, exists := categoryIDs[doc.CategoryID]; !exists {
				return fmt.Errorf("章节引用了不存在的分组: %s", doc.CategoryID)
			}
		}
		if doc.SectionID != "" {
			if _, exists := seenSectionIDs[doc.SectionID]; exists {
				return fmt.Errorf("内置章节不能重复覆盖: %s", doc.SectionID)
			}
			seenSectionIDs[doc.SectionID] = struct{}{}
		}
		if strings.TrimSpace(doc.Title) == "" || len([]rune(doc.Title)) > maxDocTitleLength {
			return fmt.Errorf("文档标题不能为空且不能超过 %d 个字符", maxDocTitleLength)
		}
		if len([]rune(doc.Summary)) > maxDocSummaryLength {
			return fmt.Errorf("文档摘要不能超过 %d 个字符", maxDocSummaryLength)
		}
		if doc.SectionID == "" && doc.Published && strings.TrimSpace(doc.Content) == "" && len(doc.Blocks) == 0 {
			return fmt.Errorf("已发布文档的内容不能为空")
		}
		if len([]rune(doc.Content)) > maxDocContentLength {
			return fmt.Errorf("文档内容不能超过 %d 个字符", maxDocContentLength)
		}
		if len(doc.Blocks) > 100 {
			return fmt.Errorf("每个章节不能超过 100 个内容块")
		}
		if err := validateDocBlocks(doc.Blocks); err != nil {
			return err
		}
		if doc.Order < 0 {
			return fmt.Errorf("文档排序不能为负数")
		}
	}
	return nil
}

func isValidImageOption(value string, maxDataBytes int) bool {
	if value == "" {
		return true
	}
	if strings.HasPrefix(value, "data:image/") {
		metadata, encoded, ok := strings.Cut(value, ",")
		if !ok || !strings.HasSuffix(metadata, ";base64") {
			return false
		}
		mediaType := strings.TrimPrefix(strings.TrimSuffix(metadata, ";base64"), "data:")
		switch mediaType {
		case "image/gif", "image/jpeg", "image/png", "image/webp":
		default:
			return false
		}
		decoded, err := base64.StdEncoding.DecodeString(encoded)
		return err == nil && len(decoded) > 0 && len(decoded) <= maxDataBytes
	}

	parsed, err := url.ParseRequestURI(value)
	return err == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != ""
}

func UpdateOption(c *gin.Context) {
	var option OptionUpdateRequest
	err := common.DecodeJson(c.Request.Body, &option)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	switch option.Value.(type) {
	case bool:
		option.Value = common.Interface2String(option.Value.(bool))
	case float64:
		option.Value = common.Interface2String(option.Value.(float64))
	case int:
		option.Value = common.Interface2String(option.Value.(int))
	default:
		option.Value = fmt.Sprintf("%v", option.Value)
	}
	switch option.Key {
	case "QuotaForInviter", "QuotaForInvitee":
		if isPositiveOptionValue(option.Value.(string)) && !operation_setting.IsPaymentComplianceConfirmed() {
			common.ApiErrorI18n(c, i18n.MsgPaymentComplianceRequired)
			return
		}
	default:
		if isPaymentComplianceOptionKey(option.Key) {
			common.ApiErrorMsg(c, "合规确认字段不允许通过通用设置接口修改")
			return
		}
	}
	switch option.Key {
	case "GitHubOAuthEnabled":
		if option.Value == "true" && common.GitHubClientId == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用 GitHub OAuth，请先填入 GitHub Client Id 以及 GitHub Client Secret！",
			})
			return
		}
	case "discord.enabled":
		if option.Value == "true" && system_setting.GetDiscordSettings().ClientId == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用 Discord OAuth，请先填入 Discord Client Id 以及 Discord Client Secret！",
			})
			return
		}
	case "oidc.enabled":
		if option.Value == "true" && system_setting.GetOIDCSettings().ClientId == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用 OIDC 登录，请先填入 OIDC Client Id 以及 OIDC Client Secret！",
			})
			return
		}
	case "LinuxDOOAuthEnabled":
		if option.Value == "true" && common.LinuxDOClientId == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用 LinuxDO OAuth，请先填入 LinuxDO Client Id 以及 LinuxDO Client Secret！",
			})
			return
		}
	case "EmailDomainRestrictionEnabled":
		if option.Value == "true" && len(common.EmailDomainWhitelist) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用邮箱域名限制，请先填入限制的邮箱域名！",
			})
			return
		}
	case "WeChatAuthEnabled":
		if option.Value == "true" && common.WeChatServerAddress == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用微信登录，请先填入微信登录相关配置信息！",
			})
			return
		}
	case "TurnstileCheckEnabled":
		if option.Value == "true" && common.TurnstileSiteKey == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用 Turnstile 校验，请先填入 Turnstile 校验相关配置信息！",
			})

			return
		}
	case "TelegramOAuthEnabled":
		if option.Value == "true" && common.TelegramBotToken == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "无法启用 Telegram OAuth，请先填入 Telegram Bot Token！",
			})
			return
		}
	case "theme.frontend":
		if option.Value != "default" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "Classic 前端已移除，主题只能设置为 default",
			})
			return
		}
	case "UIThemePreset":
		allowed := map[string]bool{
			"default": true, "anthropic": true, "simple-large": true,
			"underground": true, "rose-garden": true, "lake-view": true,
			"sunset-glow": true, "forest-whisper": true,
			"ocean-breeze": true, "lavender-dream": true, "glass": true,
		}
		if !allowed[option.Value.(string)] {
			common.ApiErrorMsg(c, "无效的站点配色预设")
			return
		}
	case "UIThemeFont":
		if option.Value != "default" && option.Value != "sans" && option.Value != "serif" {
			common.ApiErrorMsg(c, "无效的站点字体设置")
			return
		}
	case "UIThemeRadius":
		allowed := map[string]bool{"default": true, "none": true, "sm": true, "md": true, "lg": true, "xl": true}
		if !allowed[option.Value.(string)] {
			common.ApiErrorMsg(c, "无效的站点圆角设置")
			return
		}
	case "UIThemeScale":
		if option.Value != "default" && option.Value != "sm" && option.Value != "lg" && option.Value != "xl" {
			common.ApiErrorMsg(c, "无效的界面密度设置")
			return
		}
	case "UIThemeContentLayout":
		if option.Value != "full" && option.Value != "centered" {
			common.ApiErrorMsg(c, "无效的内容宽度设置")
			return
		}
	case "UIThemeBackground":
		value := strings.TrimSpace(option.Value.(string))
		if len(value) > 2048 && !strings.HasPrefix(value, "data:image/") {
			common.ApiErrorMsg(c, "无效的站点背景图片")
			return
		}
		if !isValidImageOption(value, maxBackgroundDataBytes) {
			common.ApiErrorMsg(c, "无效的站点背景图片")
			return
		}
		option.Value = value
	case "Logo":
		if len(option.Value.(string)) > 2048 && !strings.HasPrefix(option.Value.(string), "data:image/") {
			common.ApiErrorMsg(c, "无效的徽标图片")
			return
		}
		if !isValidImageOption(option.Value.(string), maxLogoDataBytes) {
			common.ApiErrorMsg(c, "无效的徽标图片")
			return
		}
	case "GroupRatio":
		err = ratio_setting.CheckGroupRatio(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "gemini.safety_settings":
		err = model_setting.ValidateGeminiSafetySettings(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "claude.default_max_tokens":
		err = model_setting.ValidateClaudeDefaultMaxTokens(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case operation_setting.ToolPriceOptionKey:
		err = operation_setting.ValidateToolPricesJSON(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "ImageRatio":
		err = ratio_setting.UpdateImageRatioByJSONString(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "图片倍率设置失败: " + err.Error(),
			})
			return
		}
	case "AudioRatio":
		err = ratio_setting.UpdateAudioRatioByJSONString(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "音频倍率设置失败: " + err.Error(),
			})
			return
		}
	case "AudioCompletionRatio":
		err = ratio_setting.UpdateAudioCompletionRatioByJSONString(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "音频补全倍率设置失败: " + err.Error(),
			})
			return
		}
	case "CreateCacheRatio":
		err = ratio_setting.UpdateCreateCacheRatioByJSONString(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "缓存创建倍率设置失败: " + err.Error(),
			})
			return
		}
	case "ModelRequestRateLimitGroup":
		err = setting.CheckModelRequestRateLimitGroup(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "AutomaticDisableStatusCodes":
		_, err = operation_setting.ParseHTTPStatusCodeRanges(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "AutomaticRetryStatusCodes":
		_, err = operation_setting.ParseHTTPStatusCodeRanges(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "console_setting.api_info":
		err = console_setting.ValidateConsoleSettings(option.Value.(string), "ApiInfo")
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "console_setting.announcements":
		err = console_setting.ValidateConsoleSettings(option.Value.(string), "Announcements")
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "console_setting.faq":
		err = console_setting.ValidateConsoleSettings(option.Value.(string), "FAQ")
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "console_setting.uptime_kuma_groups":
		err = console_setting.ValidateConsoleSettings(option.Value.(string), "UptimeKumaGroups")
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "console_setting.docs":
		err = validateManagedDocs(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	case "console_setting.about_document":
		err = validateAboutDocument(option.Value.(string))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}
	err = model.UpdateOption(option.Key, option.Value.(string))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// 出于安全考虑只记录被修改的配置项名称，不记录配置值（可能含密钥等敏感信息）。
	recordManageAudit(c, "option.update", map[string]interface{}{
		"key": option.Key,
	})
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
