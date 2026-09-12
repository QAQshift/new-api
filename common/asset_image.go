package common

import (
	"os"
	"path/filepath"
	"strings"
)

// AssetImageURLPrefix is the public URL prefix for uploaded images. The
// official container runs with WORKDIR /data and mounts ./data:/data, so the
// default relative directory below is persisted across restarts and upgrades.
const AssetImageURLPrefix = "/assets/images"

const (
	defaultAssetImageDir = "assets/images"
	assetImageDirEnv     = "ASSET_IMAGE_DIR"
)

// GetAssetImageDir returns the on-disk directory that stores uploaded images.
// ASSET_IMAGE_DIR overrides it for deployments with a different writable
// volume layout.
func GetAssetImageDir() string {
	if dir := strings.TrimSpace(os.Getenv(assetImageDirEnv)); dir != "" {
		return dir
	}
	return defaultAssetImageDir
}

// EnsureAssetImageDir creates the asset image directory when missing and
// returns its path.
func EnsureAssetImageDir() (string, error) {
	dir := GetAssetImageDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

// AssetImagePath resolves a validated file name inside the asset directory.
func AssetImagePath(name string) string {
	return filepath.Join(GetAssetImageDir(), name)
}
