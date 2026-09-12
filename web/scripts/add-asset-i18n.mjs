import fs from 'node:fs'

const KEYS = {
  'Image library': {
    en: 'Image library',
    zh: '图片库',
    'zh-TW': '圖片庫',
    ja: '画像ライブラリ',
    ru: 'Библиотека изображений',
    vi: 'Thư viện hình ảnh',
    fr: 'Bibliothèque d’images',
  },
  'Upload images to the server and copy a stable link for documentation, the About page, or the site logo and background.':
    {
      en: 'Upload images to the server and copy a stable link for documentation, the About page, or the site logo and background.',
      zh: '把图片上传到服务器，然后复制一个稳定的链接，用于文档、关于页，或站点徽标和背景。',
      'zh-TW':
        '把圖片上傳到伺服器，然後複製一個穩定的連結，用於文件、關於頁，或站點徽標和背景。',
      ja: '画像をサーバーにアップロードし、ドキュメント・アバウトページ・サイトロゴや背景に使える安定したリンクをコピーできます。',
      ru: 'Загрузите изображения на сервер и скопируйте постоянную ссылку для документации, страницы «О нас», логотипа или фона сайта.',
      vi: 'Tải hình ảnh lên máy chủ và sao chép liên kết ổn định để dùng cho tài liệu, trang giới thiệu, logo hoặc nền trang web.',
      fr: 'Téléversez des images sur le serveur et copiez un lien stable pour la documentation, la page À propos, le logo ou l’arrière-plan du site.',
    },
  'Drop images here or click to upload': {
    en: 'Drop images here or click to upload',
    zh: '把图片拖到这里，或点击上传',
    'zh-TW': '把圖片拖到這裡，或點擊上傳',
    ja: 'ここに画像をドロップ、またはクリックしてアップロード',
    ru: 'Перетащите изображения сюда или нажмите для загрузки',
    vi: 'Kéo hình ảnh vào đây hoặc bấm để tải lên',
    fr: 'Déposez des images ici ou cliquez pour téléverser',
  },
  'Supported formats: JPG, PNG, GIF, WebP, AVIF, BMP, ICO. Up to {{size}} MB per image.':
    {
      en: 'Supported formats: JPG, PNG, GIF, WebP, AVIF, BMP, ICO. Up to {{size}} MB per image.',
      zh: '支持格式：JPG、PNG、GIF、WebP、AVIF、BMP、ICO。单张最大 {{size}} MB。',
      'zh-TW':
        '支援格式：JPG、PNG、GIF、WebP、AVIF、BMP、ICO。單張最大 {{size}} MB。',
      ja: '対応形式：JPG、PNG、GIF、WebP、AVIF、BMP、ICO。1 枚あたり最大 {{size}} MB。',
      ru: 'Поддерживаемые форматы: JPG, PNG, GIF, WebP, AVIF, BMP, ICO. До {{size}} МБ на изображение.',
      vi: 'Định dạng hỗ trợ: JPG, PNG, GIF, WebP, AVIF, BMP, ICO. Tối đa {{size}} MB mỗi ảnh.',
      fr: 'Formats pris en charge : JPG, PNG, GIF, WebP, AVIF, BMP, ICO. Jusqu’à {{size}} Mo par image.',
    },
  'Uploading...': {
    en: 'Uploading...',
    zh: '上传中...',
    'zh-TW': '上傳中...',
    ja: 'アップロード中...',
    ru: 'Загрузка...',
    vi: 'Đang tải lên...',
    fr: 'Téléversement...',
  },
  'Images uploaded': {
    en: 'Images uploaded',
    zh: '图片已上传',
    'zh-TW': '圖片已上傳',
    ja: '画像をアップロードしました',
    ru: 'Изображения загружены',
    vi: 'Đã tải hình ảnh lên',
    fr: 'Images téléversées',
  },
  'Upload failed': {
    en: 'Upload failed',
    zh: '上传失败',
    'zh-TW': '上傳失敗',
    ja: 'アップロードに失敗しました',
    ru: 'Не удалось загрузить',
    vi: 'Tải lên thất bại',
    fr: 'Échec du téléversement',
  },
  'No images uploaded yet': {
    en: 'No images uploaded yet',
    zh: '还没有上传任何图片',
    'zh-TW': '還沒有上傳任何圖片',
    ja: 'まだ画像がアップロードされていません',
    ru: 'Изображения ещё не загружены',
    vi: 'Chưa có hình ảnh nào được tải lên',
    fr: 'Aucune image téléversée pour le moment',
  },
  'Copy link': {
    en: 'Copy link',
    zh: '复制链接',
    'zh-TW': '複製連結',
    ja: 'リンクをコピー',
    ru: 'Копировать ссылку',
    vi: 'Sao chép liên kết',
    fr: 'Copier le lien',
  },
  'Copy Markdown': {
    en: 'Copy Markdown',
    zh: '复制 Markdown',
    'zh-TW': '複製 Markdown',
    ja: 'Markdown をコピー',
    ru: 'Копировать Markdown',
    vi: 'Sao chép Markdown',
    fr: 'Copier le Markdown',
  },
  'Link copied': {
    en: 'Link copied',
    zh: '链接已复制',
    'zh-TW': '連結已複製',
    ja: 'リンクをコピーしました',
    ru: 'Ссылка скопирована',
    vi: 'Đã sao chép liên kết',
    fr: 'Lien copié',
  },
  'Markdown copied': {
    en: 'Markdown copied',
    zh: 'Markdown 已复制',
    'zh-TW': 'Markdown 已複製',
    ja: 'Markdown をコピーしました',
    ru: 'Markdown скопирован',
    vi: 'Đã sao chép Markdown',
    fr: 'Markdown copié',
  },
  'Copy failed': {
    en: 'Copy failed',
    zh: '复制失败',
    'zh-TW': '複製失敗',
    ja: 'コピーに失敗しました',
    ru: 'Не удалось скопировать',
    vi: 'Sao chép thất bại',
    fr: 'Échec de la copie',
  },
  'Open image': {
    en: 'Open image',
    zh: '打开图片',
    'zh-TW': '開啟圖片',
    ja: '画像を開く',
    ru: 'Открыть изображение',
    vi: 'Mở hình ảnh',
    fr: 'Ouvrir l’image',
  },
  'Delete image': {
    en: 'Delete image',
    zh: '删除图片',
    'zh-TW': '刪除圖片',
    ja: '画像を削除',
    ru: 'Удалить изображение',
    vi: 'Xóa hình ảnh',
    fr: 'Supprimer l’image',
  },
  'Delete this image? Links using it will break.': {
    en: 'Delete this image? Links using it will break.',
    zh: '确定删除这张图片吗？正在使用它的链接会失效。',
    'zh-TW': '確定刪除這張圖片嗎？正在使用它的連結會失效。',
    ja: 'この画像を削除しますか？使用中のリンクは無効になります。',
    ru: 'Удалить это изображение? Ссылки, использующие его, перестанут работать.',
    vi: 'Xóa hình ảnh này? Các liên kết đang dùng sẽ hỏng.',
    fr: 'Supprimer cette image ? Les liens qui l’utilisent cesseront de fonctionner.',
  },
  'Image deleted': {
    en: 'Image deleted',
    zh: '图片已删除',
    'zh-TW': '圖片已刪除',
    ja: '画像を削除しました',
    ru: 'Изображение удалено',
    vi: 'Đã xóa hình ảnh',
    fr: 'Image supprimée',
  },
  'Failed to delete image': {
    en: 'Failed to delete image',
    zh: '删除图片失败',
    'zh-TW': '刪除圖片失敗',
    ja: '画像の削除に失敗しました',
    ru: 'Не удалось удалить изображение',
    vi: 'Xóa hình ảnh thất bại',
    fr: 'Échec de la suppression de l’image',
  },
}

const LOCALES = ['en', 'zh', 'zh-TW', 'ja', 'ru', 'vi', 'fr']
const LOCALES_DIR = 'src/i18n/locales'

for (const locale of LOCALES) {
  const filePath = `${LOCALES_DIR}/${locale}.json`
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let added = 0
  for (const [key, values] of Object.entries(KEYS)) {
    if (key in json.translation) continue
    json.translation[key] = values[locale] ?? values.en
    added += 1
  }
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`${locale}: +${added}`)
}
