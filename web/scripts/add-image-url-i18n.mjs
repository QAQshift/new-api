import fs from 'node:fs'

const REMOVED = [
  'Upload a PNG, JPG, WebP, or GIF logo image. Maximum size: 512 KB.',
  'Upload a PNG, JPG, WebP, or GIF image as the global background. Maximum size: 4 MB.',
]

const KEYS = {
  'Or paste an image URL': {
    en: 'Or paste an image URL',
    zh: '或粘贴图片链接',
    'zh-TW': '或貼上圖片連結',
    ja: 'または画像 URL を貼り付け',
    ru: 'Или вставьте ссылку на изображение',
    vi: 'Hoặc dán URL hình ảnh',
    fr: 'Ou collez une URL d’image',
  },
  'Upload a PNG, JPG, WebP, or GIF logo image (512 KB max), or paste a link from the image library.':
    {
      en: 'Upload a PNG, JPG, WebP, or GIF logo image (512 KB max), or paste a link from the image library.',
      zh: '上传 PNG、JPG、WebP 或 GIF 徽标（最大 512 KB），或粘贴图片库中的链接。',
      'zh-TW':
        '上傳 PNG、JPG、WebP 或 GIF 徽標（最大 512 KB），或貼上圖片庫中的連結。',
      ja: 'PNG、JPG、WebP、GIF のロゴ画像（最大 512 KB）をアップロードするか、画像ライブラリのリンクを貼り付けます。',
      ru: 'Загрузите логотип в формате PNG, JPG, WebP или GIF (до 512 КБ) или вставьте ссылку из библиотеки изображений.',
      vi: 'Tải logo PNG, JPG, WebP hoặc GIF (tối đa 512 KB), hoặc dán liên kết từ thư viện hình ảnh.',
      fr: 'Téléversez un logo PNG, JPG, WebP ou GIF (512 Ko max) ou collez un lien de la bibliothèque d’images.',
    },
  'Upload a PNG, JPG, WebP, or GIF image (4 MB max), or paste a link from the image library.':
    {
      en: 'Upload a PNG, JPG, WebP, or GIF image (4 MB max), or paste a link from the image library.',
      zh: '上传 PNG、JPG、WebP 或 GIF 图片（最大 4 MB），或粘贴图片库中的链接。',
      'zh-TW':
        '上傳 PNG、JPG、WebP 或 GIF 圖片（最大 4 MB），或貼上圖片庫中的連結。',
      ja: 'PNG、JPG、WebP、GIF 画像（最大 4 MB）をアップロードするか、画像ライブラリのリンクを貼り付けます。',
      ru: 'Загрузите изображение PNG, JPG, WebP или GIF (до 4 МБ) или вставьте ссылку из библиотеки изображений.',
      vi: 'Tải ảnh PNG, JPG, WebP hoặc GIF (tối đa 4 MB), hoặc dán liên kết từ thư viện hình ảnh.',
      fr: 'Téléversez une image PNG, JPG, WebP ou GIF (4 Mo max) ou collez un lien de la bibliothèque d’images.',
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
