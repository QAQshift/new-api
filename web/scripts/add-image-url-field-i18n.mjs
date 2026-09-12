import fs from 'node:fs'

const REMOVED = [
  'Or paste an image URL',
  'No background image',
  'Background image must be 4 MB or smaller',
  'Logo image must be 512 KB or smaller',
  'Please choose a PNG, JPG, WebP, or GIF image',
  'Upload a PNG, JPG, WebP, or GIF logo image (512 KB max), or paste a link from the image library.',
  'Upload a PNG, JPG, WebP, or GIF image (4 MB max), or paste a link from the image library.',
]

const KEYS = {
  'Paste an image link to see the preview': {
    en: 'Paste an image link to see the preview',
    zh: '粘贴图片链接后可预览',
    'zh-TW': '貼上圖片連結後可預覽',
    ja: '画像リンクを貼り付けるとプレビューできます',
    ru: 'Вставьте ссылку на изображение, чтобы увидеть предпросмотр',
    vi: 'Dán liên kết hình ảnh để xem trước',
    fr: 'Collez un lien d’image pour voir l’aperçu',
  },
  'Image preview unavailable': {
    en: 'Image preview unavailable',
    zh: '图片预览不可用',
    'zh-TW': '圖片預覽無法使用',
    ja: '画像プレビューを表示できません',
    ru: 'Предпросмотр изображения недоступен',
    vi: 'Không thể xem trước hình ảnh',
    fr: 'Aperçu de l’image indisponible',
  },
  'Paste an image link from the image library': {
    en: 'Paste an image link from the image library',
    zh: '粘贴图片库中的图片链接',
    'zh-TW': '貼上圖片庫中的圖片連結',
    ja: '画像ライブラリの画像リンクを貼り付け',
    ru: 'Вставьте ссылку на изображение из библиотеки',
    vi: 'Dán liên kết hình ảnh từ thư viện',
    fr: 'Collez un lien d’image depuis la bibliothèque',
  },
  'Paste a link from the image library. Upload images there first, then copy the link.':
    {
      en: 'Paste a link from the image library. Upload images there first, then copy the link.',
      zh: '粘贴图片库中的链接。先在图片库上传图片，再复制链接。',
      'zh-TW': '貼上圖片庫中的連結。先在圖片庫上傳圖片，再複製連結。',
      ja: '画像ライブラリのリンクを貼り付けてください。先に画像をアップロードし、リンクをコピーします。',
      ru: 'Вставьте ссылку из библиотеки изображений. Сначала загрузите изображение, затем скопируйте ссылку.',
      vi: 'Dán liên kết từ thư viện hình ảnh. Hãy tải ảnh lên trước, sau đó sao chép liên kết.',
      fr: 'Collez un lien depuis la bibliothèque d’images. Téléversez d’abord l’image, puis copiez le lien.',
    },
  'https://example.com/image.png': {
    en: 'https://example.com/image.png',
    zh: 'https://example.com/image.png',
    'zh-TW': 'https://example.com/image.png',
    ja: 'https://example.com/image.png',
    ru: 'https://example.com/image.png',
    vi: 'https://example.com/image.png',
    fr: 'https://example.com/image.png',
  },
}

const LOCALES = ['en', 'zh', 'zh-TW', 'ja', 'ru', 'vi', 'fr']
const LOCALES_DIR = 'src/i18n/locales'

for (const locale of LOCALES) {
  const filePath = `${LOCALES_DIR}/${locale}.json`
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let added = 0
  for (const key of REMOVED) delete json.translation[key]
  for (const [key, values] of Object.entries(KEYS)) {
    if (key in json.translation) continue
    json.translation[key] = values[locale] ?? values.en
    added += 1
  }
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`${locale}: +${added}`)
}
