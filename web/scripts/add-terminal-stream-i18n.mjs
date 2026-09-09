import fs from 'node:fs'

const KEY =
  'Request routed through the unified gateway to the healthiest model route. Streaming the response back.'

const translations = {
  en: KEY,
  zh: '请求已通过统一网关路由至最健康的模型线路，正在以流式方式返回结果...',
  'zh-TW': '請求已透過統一閘道路由至最健康的模型線路，正在以串流方式回傳結果...',
  ja: 'リクエストは統合ゲートウェイ経由で最も健全なモデル経路にルーティングされ、レスポンスをストリーミング中です...',
  ru: 'Запрос направлен через единый шлюз на самый исправный маршрут модели. Ответ передаётся потоком.',
  vi: 'Yêu cầu đã được định tuyến qua cổng gateway thống nhất tới tuyến mô hình healthy nhất, đang trả về kết quả dạng streaming...',
  fr: 'Requête routée via la passerelle unifiée vers la route de modèle la plus saine. Réponse en cours de diffusion en flux.',
}

const LOCALES_DIR = 'src/i18n/locales'
for (const [locale, value] of Object.entries(translations)) {
  const filePath = `${LOCALES_DIR}/${locale}.json`
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (KEY in json.translation) {
    console.log(`${locale}: already present`)
    continue
  }
  json.translation[KEY] = value
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`${locale}: +1`)
}
