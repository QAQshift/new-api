import fs from 'node:fs'

const REMOVED_KEYS = ['Stable, reliable gateway.', 'Any model, always online.']

const NEW_KEYS = [
  'Unified access layer, full model ecosystem, production-grade reliability.',
  'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.',
  'Every major model covered',
  'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.',
  'Production-grade availability',
  'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.',
  'Drop-in toolchain compatibility',
  'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.',
]

const translations = {
  en: {},
  zh: {
    'Unified access layer, full model ecosystem, production-grade reliability.':
      '统一接入层 · 全模型生态 · 生产级长期可用',
    'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.':
      'AI API 网关为企业生产环境设计，单套接口覆盖主流大模型服务。长期运行场景下，提供多提供商热备容灾、自动故障切换、月度可用性不低于 99.9% 的持续服务保障。',
    'Every major model covered': '主流模型全覆盖',
    'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.':
      '支持 Claude、Gemini、DeepSeek、Qwen 等主流模型，统一鉴权、统一计费、统一调用链路，无需逐一对接。',
    'Production-grade availability': '生产级长期可用',
    'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.':
      '多提供商热备容灾，单点故障自动切换，月度可用性不低于 99.9%，接口语义长期兼容，版本升级平滑演进。',
    'Drop-in toolchain compatibility': '成熟工具链适配',
    'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.':
      '兼容 OpenAI API 规范，现有 SDK 与 CLI 工具（含 Claude Code、Codex、Gemini CLI 等）零改造接入。',
  },
  'zh-TW': {
    'Unified access layer, full model ecosystem, production-grade reliability.':
      '統一接入層 · 全模型生態 · 生產級長期可用',
    'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.':
      'AI API 閘道為企業生產環境設計，單套介面覆蓋主流大模型服務。長期執行場景下，提供多提供商熱備容災、自動故障切換、月度可用性不低於 99.9% 的持續服務保障。',
    'Every major model covered': '主流模型全覆蓋',
    'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.':
      '支援 Claude、Gemini、DeepSeek、Qwen 等主流模型，統一鑑權、統一計費、統一呼叫鏈路，無需逐一對接。',
    'Production-grade availability': '生產級長期可用',
    'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.':
      '多提供商熱備容災，單點故障自動切換，月度可用性不低於 99.9%，介面語義長期相容，版本升級平滑演進。',
    'Drop-in toolchain compatibility': '成熟工具鏈適配',
    'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.':
      '相容 OpenAI API 規範，現有 SDK 與 CLI 工具（含 Claude Code、Codex、Gemini CLI 等）零改造接入。',
  },
  ja: {
    'Unified access layer, full model ecosystem, production-grade reliability.':
      '統一アクセス層、全モデル対応、本番級の長期安定性',
    'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.':
      '企業の本番環境のために設計された AI API ゲートウェイ。単一の API で主要大規模モデルサービスをカバーし、複数プロバイダーのホットスタンバイ、自動フェイルオーバー、月間稼働率 99.9% 以上の継続的なサービス保証を提供します。',
    'Every major model covered': '主要モデルをフルカバー',
    'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.':
      'Claude、Gemini、DeepSeek、Qwen などの主要モデルに対応。認証・課金・呼び出し経路を統一し、個別対応は不要です。',
    'Production-grade availability': '本番級の長期可用性',
    'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.':
      '複数プロバイダーのホットスタンバイと自動フェイルオーバーにより、月間稼働率 99.9% 以上を実現。API 互換性は長期にわたり維持され、バージョンアップも平滑に進みます。',
    'Drop-in toolchain compatibility': '成熟したツールチェーン対応',
    'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.':
      'OpenAI API 規範に準拠し、既存の SDK や CLI ツール（Claude Code、Codex、Gemini CLI など）に修正なしでそのまま接続できます。',
  },
  ru: {
    'Unified access layer, full model ecosystem, production-grade reliability.':
      'Единый уровень доступа, вся экосистема моделей, производственная надёжность.',
    'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.':
      'AI API-шлюз, созданный для production-сред: один API для ведущих сервисов больших моделей с горячим резервированием провайдеров, автоматическим переключением при сбоях и гарантией доступности не ниже 99,9% в месяц.',
    'Every major model covered': 'Полное покрытие основных моделей',
    'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.':
      'Claude, Gemini, DeepSeek, Qwen и другие — с единой аутентификацией, единым биллингом и единым путём вызова, без отдельной интеграции с каждым провайдером.',
    'Production-grade availability': 'Производственная доступность',
    'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.':
      'Горячее резервирование провайдеров и автоматическое переключение при сбоях, доступность не ниже 99,9% в месяц, долгосрочная совместимость API и плавное обновление версий.',
    'Drop-in toolchain compatibility': 'Совместимость с готовыми инструментами',
    'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.':
      'API совместим с OpenAI: существующие SDK и CLI-инструменты (включая Claude Code, Codex, Gemini CLI) подключаются без изменений кода.',
  },
  vi: {
    'Unified access layer, full model ecosystem, production-grade reliability.':
      'Tầng truy cập thống nhất, hệ sinh thái mô hình đầy đủ, độ tin cậy cấp sản xuất.',
    'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.':
      'Cổng API AI được thiết kế cho môi trường sản xuất: một API duy nhất phủ các dịch vụ mô hình lớn hàng đầu, với dự phòng nóng đa nhà cung cấp, tự động chuyển đổi khi lỗi và cam kết khả dụng hàng tháng không dưới 99,9%.',
    'Every major model covered': 'Phủ đủ các mô hình chính',
    'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.':
      'Hỗ trợ Claude, Gemini, DeepSeek, Qwen và nhiều mô hình khác với xác thực, tính phí và đường gọi thống nhất — không cần tích hợp riêng từng nhà cung cấp.',
    'Production-grade availability': 'Khả dụng cấp sản xuất',
    'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.':
      'Dự phòng nóng đa nhà cung cấp, tự động chuyển đổi khi lỗi, khả dụng hàng tháng không dưới 99,9%, tương thích API lâu dài và nâng cấp phiên bản mượt mà.',
    'Drop-in toolchain compatibility': 'Tương thích chuỗi công cụ sẵn có',
    'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.':
      'API tương thích chuẩn OpenAI, các SDK và công cụ CLI hiện có (bao gồm Claude Code, Codex, Gemini CLI) kết nối không cần sửa đổi.',
  },
  fr: {
    'Unified access layer, full model ecosystem, production-grade reliability.':
      'Couche d’accès unifiée, écosystème de modèles complet, fiabilité de niveau production.',
    'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.':
      'Une passerelle API IA conçue pour la production : une seule API couvrant les principaux services de modèles, avec redondance active multi-fournisseurs, reprise automatique sur incident et une disponibilité mensuelle garantie d’au moins 99,9 %.',
    'Every major model covered': 'Tous les grands modèles couverts',
    'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.':
      'Claude, Gemini, DeepSeek, Qwen et plus, avec authentification, facturation et chaîne d’appel unifiées — sans intégration propre à chaque fournisseur.',
    'Production-grade availability': 'Disponibilité de niveau production',
    'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.':
      'Redondance active multi-fournisseurs et reprise automatique sur incident, disponibilité mensuelle d’au moins 99,9 %, compatibilité API durable et mises à niveau en douceur.',
    'Drop-in toolchain compatibility': 'Compatibilité prête à l’emploi',
    'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.':
      'API compatible OpenAI : les SDK et outils CLI existants (Claude Code, Codex, Gemini CLI, etc.) se connectent sans aucune modification.',
  },
}

const LOCALES_DIR = 'src/i18n/locales'
for (const [locale, values] of Object.entries(translations)) {
  const filePath = `${LOCALES_DIR}/${locale}.json`
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const table = json.translation
  let removed = 0
  for (const key of REMOVED_KEYS) {
    if (key in table) {
      delete table[key]
      removed += 1
    }
  }
  let added = 0
  for (const key of NEW_KEYS) {
    if (!(key in table)) {
      table[key] = values[key] ?? key
      added += 1
    }
  }
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`${locale}: -${removed} +${added}`)
}
