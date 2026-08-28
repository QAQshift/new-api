package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUpdateOptionRejectsRetiredFrontendTheme(t *testing.T) {
	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest(
		http.MethodPut,
		"/api/option/",
		strings.NewReader(`{"key":"theme.frontend","value":"classic"}`),
	)

	UpdateOption(context)

	assert.Equal(t, http.StatusOK, response.Code)
	assert.JSONEq(t, `{"success":false,"message":"Classic 前端已移除，主题只能设置为 default"}`, response.Body.String())
}

func TestGetStatusAdvertisesDefaultDashboard(t *testing.T) {
	previousMap := common.OptionMap
	common.OptionMap = map[string]string{}
	t.Cleanup(func() { common.OptionMap = previousMap })
	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest(http.MethodGet, "/api/status", nil)

	GetStatus(context)

	var payload struct {
		Success bool           `json:"success"`
		Data    map[string]any `json:"data"`
	}
	require.NoError(t, common.Unmarshal(response.Body.Bytes(), &payload))
	assert.True(t, payload.Success)
	assert.Equal(t, "default", payload.Data["theme"])
	themeCustomization, ok := payload.Data["theme_customization"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "default", themeCustomization["preset"])
	assert.Equal(t, "default", themeCustomization["font"])
	assert.Equal(t, "default", themeCustomization["radius"])
	assert.Equal(t, "default", themeCustomization["scale"])
	assert.Equal(t, "full", themeCustomization["content_layout"])
	assert.Equal(t, "", themeCustomization["background"])
}

func TestGetStatusReturnsAdministratorThemeCustomization(t *testing.T) {
	previousMap := common.OptionMap
	common.OptionMap = map[string]string{
		"UIThemePreset":        "forest-whisper",
		"UIThemeFont":          "serif",
		"UIThemeRadius":        "lg",
		"UIThemeScale":         "sm",
		"UIThemeContentLayout": "centered",
	}
	t.Cleanup(func() { common.OptionMap = previousMap })

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Request = httptest.NewRequest(http.MethodGet, "/api/status", nil)
	GetStatus(context)

	var payload struct {
		Success bool `json:"success"`
		Data    struct {
			ThemeCustomization map[string]string `json:"theme_customization"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(response.Body.Bytes(), &payload))
	assert.True(t, payload.Success)
	assert.Equal(t, map[string]string{
		"preset":         "forest-whisper",
		"font":           "serif",
		"radius":         "lg",
		"scale":          "sm",
		"content_layout": "centered",
		"background":     "",
	}, payload.Data.ThemeCustomization)
}

func TestUpdateOptionRejectsInvalidThemeCustomization(t *testing.T) {
	tests := []struct {
		name  string
		key   string
		value string
	}{
		{name: "preset", key: "UIThemePreset", value: "unknown"},
		{name: "font", key: "UIThemeFont", value: "comic-sans"},
		{name: "radius", key: "UIThemeRadius", value: "huge"},
		{name: "scale", key: "UIThemeScale", value: "tiny"},
		{name: "content layout", key: "UIThemeContentLayout", value: "sidebar"},
		{name: "background", key: "UIThemeBackground", value: "javascript:alert(1)"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(response)
			context.Request = httptest.NewRequest(
				http.MethodPut,
				"/api/option/",
				strings.NewReader(`{"key":"`+test.key+`","value":"`+test.value+`"}`),
			)

			UpdateOption(context)

			assert.Equal(t, http.StatusOK, response.Code)
			assert.Contains(t, response.Body.String(), `"success":false`)
		})
	}
}
