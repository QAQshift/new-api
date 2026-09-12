package controller

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

const (
	maxAssetImageBytes = 8 << 20
	maxAssetImageCount = 500
)

// Raster formats only. An uploaded SVG would run script in the site origin when
// opened directly, so it is deliberately not accepted here.
var assetImageExtensionsByMIME = map[string]string{
	"image/jpeg":               ".jpg",
	"image/png":                ".png",
	"image/gif":                ".gif",
	"image/webp":               ".webp",
	"image/avif":               ".avif",
	"image/bmp":                ".bmp",
	"image/x-icon":             ".ico",
	"image/vnd.microsoft.icon": ".ico",
}

var assetImageNamePattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]*$`)

type assetImageItem struct {
	Name       string `json:"name"`
	URL        string `json:"url"`
	Size       int64  `json:"size"`
	ModifiedAt int64  `json:"modified_at"`
}

// isSafeAssetImageName rejects anything that is not a plain file name, which
// also blocks path traversal through the URL parameter.
func isSafeAssetImageName(name string) bool {
	if name == "" || len(name) > 128 {
		return false
	}
	if strings.Contains(name, "..") {
		return false
	}
	return assetImageNamePattern.MatchString(name)
}

func isSupportedAssetImageFile(name string) bool {
	extension := strings.ToLower(filepath.Ext(name))
	for _, allowed := range assetImageExtensionsByMIME {
		if extension == allowed {
			return true
		}
	}
	return false
}

func listAssetImageFiles() ([]assetImageItem, error) {
	dir, err := common.EnsureAssetImageDir()
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	items := make([]assetImageItem, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !isSafeAssetImageName(name) || !isSupportedAssetImageFile(name) {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		items = append(items, assetImageItem{
			Name:       name,
			URL:        common.AssetImageURLPrefix + "/" + name,
			Size:       info.Size(),
			ModifiedAt: info.ModTime().Unix(),
		})
	}
	sort.SliceStable(items, func(i, j int) bool {
		return items[i].ModifiedAt > items[j].ModifiedAt
	})
	return items, nil
}

// GetAssetImage serves an uploaded image. Uploads are administrator-only, but
// the links themselves are public so they can be embedded in documentation and
// the About page.
func GetAssetImage(c *gin.Context) {
	name := c.Param("filename")
	if !isSafeAssetImageName(name) || !isSupportedAssetImageFile(name) {
		c.Status(http.StatusNotFound)
		return
	}
	path := common.AssetImagePath(name)
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		c.Status(http.StatusNotFound)
		return
	}
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Security-Policy", "default-src 'none'; sandbox")
	c.File(path)
}

func ListAssetImages(c *gin.Context) {
	items, err := listAssetImageFiles()
	if err != nil {
		common.ApiErrorMsg(c, "读取图片目录失败: "+err.Error())
		return
	}
	common.ApiSuccess(c, gin.H{
		"items":       items,
		"url_prefix":  common.AssetImageURLPrefix,
		"max_bytes":   maxAssetImageBytes,
		"max_count":   maxAssetImageCount,
	})
}

func UploadAssetImage(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		common.ApiErrorMsg(c, "请选择要上传的图片文件")
		return
	}
	if fileHeader.Size <= 0 {
		common.ApiErrorMsg(c, "图片文件为空")
		return
	}
	if fileHeader.Size > maxAssetImageBytes {
		common.ApiErrorMsg(c, fmt.Sprintf("图片不能超过 %d MB", maxAssetImageBytes>>20))
		return
	}

	existing, err := listAssetImageFiles()
	if err != nil {
		common.ApiErrorMsg(c, "读取图片目录失败: "+err.Error())
		return
	}
	if len(existing) >= maxAssetImageCount {
		common.ApiErrorMsg(c, fmt.Sprintf("图片数量已达上限（%d 张），请先删除不再使用的图片", maxAssetImageCount))
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		common.ApiErrorMsg(c, "无法读取上传文件")
		return
	}
	defer file.Close()

	header := make([]byte, 512)
	read, err := io.ReadFull(file, header)
	if err != nil && err != io.ErrUnexpectedEOF {
		common.ApiErrorMsg(c, "无法读取上传文件")
		return
	}
	extension, ok := assetImageExtensionsByMIME[http.DetectContentType(header[:read])]
	if !ok {
		common.ApiErrorMsg(c, "仅支持 JPG、PNG、GIF、WebP、AVIF、BMP、ICO 格式的图片")
		return
	}

	dir, err := common.EnsureAssetImageDir()
	if err != nil {
		common.ApiErrorMsg(c, "创建图片目录失败: "+err.Error())
		return
	}
	name := fmt.Sprintf("%s-%s%s", time.Now().Format("20060102-150405"), common.GetRandomString(6), extension)
	destination, err := os.OpenFile(filepath.Join(dir, name), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		common.ApiErrorMsg(c, "写入图片失败: "+err.Error())
		return
	}
	defer destination.Close()

	if _, err := destination.Write(header[:read]); err != nil {
		os.Remove(common.AssetImagePath(name))
		common.ApiErrorMsg(c, "写入图片失败: "+err.Error())
		return
	}
	if _, err := io.Copy(destination, file); err != nil {
		os.Remove(common.AssetImagePath(name))
		common.ApiErrorMsg(c, "写入图片失败: "+err.Error())
		return
	}

	info, err := os.Stat(common.AssetImagePath(name))
	size := fileHeader.Size
	if err == nil {
		size = info.Size()
	}
	common.ApiSuccess(c, assetImageItem{
		Name:       name,
		URL:        common.AssetImageURLPrefix + "/" + name,
		Size:       size,
		ModifiedAt: time.Now().Unix(),
	})
}

func DeleteAssetImage(c *gin.Context) {
	name := c.Param("filename")
	if !isSafeAssetImageName(name) {
		common.ApiErrorMsg(c, "无效的图片名称")
		return
	}
	if err := os.Remove(common.AssetImagePath(name)); err != nil {
		if os.IsNotExist(err) {
			common.ApiErrorMsg(c, "图片不存在或已被删除")
			return
		}
		common.ApiErrorMsg(c, "删除图片失败: "+err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}
