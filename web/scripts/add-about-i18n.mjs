import fs from 'node:fs'

const KEYS = {
  'About page content': {
    en: 'About page content',
    zh: '关于页内容',
    'zh-TW': '關於頁內容',
    ja: 'アバウトページの内容',
    ru: 'Содержимое страницы «О нас»',
    vi: 'Nội dung trang giới thiệu',
    fr: 'Contenu de la page À propos',
  },
  'About page settings saved': {
    en: 'About page settings saved',
    zh: '关于页设置已保存',
    'zh-TW': '關於頁設定已儲存',
    ja: 'アバウトページの設定を保存しました',
    ru: 'Настройки страницы «О нас» сохранены',
    vi: 'Đã lưu cài đặt trang giới thiệu',
    fr: 'Paramètres de la page À propos enregistrés',
  },
  'Failed to save about page settings': {
    en: 'Failed to save about page settings',
    zh: '关于页设置保存失败',
    'zh-TW': '關於頁設定儲存失敗',
    ja: 'アバウトページの設定を保存できませんでした',
    ru: 'Не удалось сохранить настройки страницы «О нас»',
    vi: 'Lưu cài đặt trang giới thiệu thất bại',
    fr: 'Échec de l’enregistrement des paramètres de la page À propos',
  },
  'Clear and use built-in page': {
    en: 'Clear and use built-in page',
    zh: '清空并改用内置页面',
    'zh-TW': '清空並改用內建頁面',
    ja: 'クリアして内蔵ページを使用',
    ru: 'Очистить и использовать встроенную страницу',
    vi: 'Xóa và dùng trang mặc định',
    fr: 'Effacer et utiliser la page intégrée',
  },
  'Open public page': {
    en: 'Open public page',
    zh: '打开公共页面',
    'zh-TW': '開啟公開頁面',
    ja: '公開ページを開く',
    ru: 'Открыть публичную страницу',
    vi: 'Mở trang công khai',
    fr: 'Ouvrir la page publique',
  },
  'Hide preview': {
    en: 'Hide preview',
    zh: '隐藏预览',
    'zh-TW': '隱藏預覽',
    ja: 'プレビューを閉じる',
    ru: 'Скрыть предпросмотр',
    vi: 'Ẩn xem trước',
    fr: 'Masquer l’aperçu',
  },
  'QR code is temporarily unavailable': {
    en: 'QR code is temporarily unavailable',
    zh: '二维码暂时无法加载',
    'zh-TW': 'QR 碼暫時無法載入',
    ja: 'QR コードを一時的に読み込めません',
    ru: 'QR-код временно недоступен',
    vi: 'Mã QR tạm thời không khả dụng',
    fr: 'Le QR code est temporairement indisponible',
  },
  'Design the About page with the same blocks as the documentation. Use QR code blocks for WeChat or QQ contact codes, and contact cards for copyable support handles.':
    {
      en: 'Design the About page with the same blocks as the documentation. Use QR code blocks for WeChat or QQ contact codes, and contact cards for copyable support handles.',
      zh: '使用与文档页相同的内容块来设计关于页。用二维码块放置微信或 QQ 联系方式，用联系卡片放置可复制的客服账号。',
      'zh-TW':
        '使用與文件頁相同的內容區塊來設計關於頁。用 QR 碼區塊放置微信或 QQ 聯絡方式，用聯絡卡片放置可複製的客服帳號。',
      ja: 'ドキュメントと同じブロックでアバウトページを設計できます。QR コードブロックで WeChat や QQ の連絡先を、コンタクトカードでコピー可能なサポート窓口を配置できます。',
      ru: 'Оформите страницу «О нас» теми же блоками, что и документацию. Блоки QR-кода подходят для WeChat и QQ, карточки — для копируемых контактов поддержки.',
      vi: 'Thiết kế trang giới thiệu bằng cùng các khối như trang tài liệu. Dùng khối mã QR cho WeChat hoặc QQ và thẻ liên hệ cho các kênh hỗ trợ có thể sao chép.',
      fr: 'Concevez la page À propos avec les mêmes blocs que la documentation. Utilisez les blocs QR pour WeChat ou QQ et les cartes de contact pour les canaux copiables.',
    },
  'No content blocks yet. Add cards, contact info, or WeChat / QQ QR codes.':
    {
      en: 'No content blocks yet. Add cards, contact info, or WeChat / QQ QR codes.',
      zh: '还没有内容块。可以添加卡片、联系方式，或微信 / QQ 二维码。',
      'zh-TW': '還沒有內容區塊。可以新增卡片、聯絡方式，或微信 / QQ QR 碼。',
      ja: 'まだブロックがありません。カード、連絡先、WeChat / QQ の QR コードを追加できます。',
      ru: 'Блоков пока нет. Добавьте карточки, контакты или QR-коды WeChat / QQ.',
      vi: 'Chưa có khối nội dung. Hãy thêm thẻ, thông tin liên hệ hoặc mã QR WeChat / QQ.',
      fr: 'Aucun bloc pour le moment. Ajoutez des cartes, des contacts ou des QR codes WeChat / QQ.',
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
