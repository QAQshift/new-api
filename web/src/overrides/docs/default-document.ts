export type DocCategory = {
  id: string
  label: string
  sections: string[]
}

export type DefaultDocSection = {
  id: string
  category: string
  eyebrow: string
  title: string
  summary: string
  order: number
}

export type DocBlock =
  | { type: 'markdown'; content: string }
  | { type: 'code'; content: string; language?: string; title?: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | {
      type: 'endpoint'
      method: 'GET' | 'POST'
      path: string
      description: string
    }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'steps'; items: { title: string; content: string }[] }

/**
 * The built-in document outline is intentionally data-only. Rich sections
 * keep their existing React renderers, while administrators can override any
 * section with Markdown or structured content blocks through the console.
 */
export const defaultDocSections: DefaultDocSection[] = [
  {
    id: 'start',
    category: 'getting-started',
    eyebrow: 'GETTING STARTED',
    title: '五分钟完成首次调用',
    summary:
      '普通用户推荐使用 CC Switch 一键配置；开发者可以直接复制接口示例。一个分组使用一个 Key 即可，多建 Key 不会增加并发。',
    order: 10,
  },
  {
    id: 'endpoints',
    category: 'getting-started',
    eyebrow: 'ENDPOINTS',
    title: '线路与请求地址',
    summary:
      'OpenAI 兼容客户端填写带 /v1 的地址；Claude Code 填根域名，不要在末尾增加 /v1。',
    order: 20,
  },
  {
    id: 'api-key',
    category: 'getting-started',
    eyebrow: 'AUTHENTICATION',
    title: '创建并使用 API Key',
    summary:
      '每个 API Key 绑定一个或多个模型分组。请将密钥保存在密码管理器或环境变量中。',
    order: 30,
  },
  {
    id: 'cc-switch',
    category: 'client-setup',
    eyebrow: 'CLIENT SETUP',
    title: '下载 CC Switch 并一键导入',
    summary:
      '第一次接入建议先安装 CC Switch。它可以统一管理 Claude Code、Codex 等工具的 API Key、线路和模型。',
    order: 40,
  },
  {
    id: 'claude-code',
    category: 'client-setup',
    eyebrow: 'CLAUDE CODE',
    title: 'Claude Code 安装与配置',
    summary: '使用环境变量连接 Claude Code，Base URL 填根域名，不要添加 /v1。',
    order: 50,
  },
  {
    id: 'codex-tools',
    category: 'client-setup',
    eyebrow: 'CODEX TOOLKIT',
    title: 'Codex 安装器与聊天记录迁移器',
    summary: '下载按钮会打开 OpenAI Codex 官方 GitHub Release 页面。',
    order: 60,
  },
  {
    id: 'codex-cli',
    category: 'client-setup',
    eyebrow: 'CODEX CLI',
    title: 'Codex CLI 下载与接入',
    summary: '安装 Codex CLI 后通过 CC Switch 或配置文件接入本站。',
    order: 70,
  },
  {
    id: 'codex-sol-context',
    category: 'client-setup',
    eyebrow: 'LONG CONTEXT',
    title: 'Codex 原生支持 105 万上下文',
    summary: '长上下文模型需要在 Codex 配置文件中声明上下文窗口。',
    order: 80,
  },
  {
    id: 'chatgpt',
    category: 'client-setup',
    eyebrow: 'CHATGPT APP',
    title: 'ChatGPT 官方客户端',
    summary: '从 OpenAI 官方入口下载 ChatGPT 网页版或桌面、手机客户端。',
    order: 90,
  },
  {
    id: 'vscode',
    category: 'client-setup',
    eyebrow: 'VS CODE',
    title: 'VS Code 与 AI 扩展',
    summary: '在 VS Code 中安装 OpenAI Codex 或 Anthropic Claude Code 扩展。',
    order: 100,
  },
  {
    id: 'text-api',
    category: 'text-api',
    eyebrow: 'TEXT MODELS',
    title: '文字模型 API',
    summary:
      '本站兼容 OpenAI Chat Completions、Responses API 与 Anthropic Messages。',
    order: 110,
  },
  {
    id: 'video-overview',
    category: 'video-api',
    eyebrow: 'VIDEO API',
    title: '创建视频任务',
    summary:
      '视频生成为异步任务。提交成功会返回 task_id，随后使用查询接口轮询状态。',
    order: 120,
  },
  {
    id: 'video-models',
    category: 'video-api',
    eyebrow: 'MODEL MATRIX',
    title: '视频模型与参数范围',
    summary:
      '以下是常见模型的示例参数范围，实际可用模型和价格以当前控制台配置为准。',
    order: 130,
  },
  {
    id: 'video-assets',
    category: 'video-api',
    eyebrow: 'REFERENCE ASSETS',
    title: '图片、视频与音频素材',
    summary: '参考素材必须是上游能够直接访问的公网 HTTPS URL。',
    order: 140,
  },
  {
    id: 'video-result',
    category: 'video-api',
    eyebrow: 'TASK LIFECYCLE',
    title: '查询、播放与下载',
    summary:
      '提交接口只负责创建任务。请保存 task_id，完成后通过 content 接口获取真实 MP4。',
    order: 150,
  },
  {
    id: 'errors',
    category: 'support',
    eyebrow: 'TROUBLESHOOTING',
    title: '常见错误排查',
    summary:
      '先根据 HTTP 状态码定位问题。视频任务若已返回 task_id，不要重复提交创建请求。',
    order: 160,
  },
]

export const defaultDocCategories: DocCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    sections: ['start', 'endpoints', 'api-key'],
  },
  {
    id: 'client-setup',
    label: 'Client setup',
    sections: [
      'cc-switch',
      'claude-code',
      'codex-tools',
      'codex-cli',
      'codex-sol-context',
      'chatgpt',
      'vscode',
    ],
  },
  { id: 'text-api', label: 'Text API', sections: ['text-api'] },
  {
    id: 'video-api',
    label: 'Video API',
    sections: [
      'video-overview',
      'video-models',
      'video-assets',
      'video-result',
    ],
  },
  { id: 'support', label: 'Troubleshooting', sections: ['errors'] },
  { id: 'custom', label: 'Custom documentation', sections: ['custom-docs'] },
]
