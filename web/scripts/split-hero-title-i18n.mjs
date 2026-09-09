import fs from 'node:fs'

const REMOVED =
  'Unified access layer, full model ecosystem, production-grade reliability.'

const key1 = 'Unified access layer, full model ecosystem.'
const key2 = 'Production-grade reliability.'

const translations = {
  en: [key1, key2],
  zh: ['统一接入层 · 全模型生态', '生产级长期可用'],
  'zh-TW': ['統一接入層 · 全模型生態', '生產級長期可用'],
  ja: ['統一アクセス層 · 全モデルエコシステム', '本番級の長期安定性'],
  ru: [
    'Единый уровень доступа, вся экосистема моделей.',
    'Производственная надёжность.',
  ],
  vi: [
    'Tầng truy cập thống nhất, hệ sinh thái mô hình đầy đủ.',
    'Độ tin cậy cấp sản xuất.',
  ],
  fr: [
    'Couche d’accès unifiée, écosystème de modèles complet.',
    'Fiabilité de niveau production.',
  ],
}

const LOCALES_DIR = 'src/i18n/locales'
for (const [locale, [v1, v2]] of Object.entries(translations)) {
  const filePath = `${LOCALES_DIR}/${locale}.json`
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const table = json.translation
  delete table[REMOVED]
  table[key1] = v1
  table[key2] = v2
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`${locale}: ok`)
}
