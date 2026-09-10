/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export type DocCopyItem = { label: string; value: string }

export type DocLink = {
  href: string
  label?: string
  external?: boolean
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
  | { type: 'copy'; items: DocCopyItem[] }
  | {
      type: 'qr'
      src: string
      title?: string
      alt?: string
      caption?: string
      description?: string
      link?: DocLink
    }
  | { type: 'callout'; code?: string; title: string; text: string }
  | {
      type: 'card'
      title: string
      subtitle?: string
      badge?: string
      text?: string
      link?: DocLink
      rows?: DocCopyItem[]
      copies?: DocCopyItem[]
      mono?: boolean
    }
  | {
      type: 'downloads'
      title: string
      description?: string
      href?: string
      note?: string
      items: { name: string; desc: string }[]
    }

/**
 * Runtime placeholder. Every string rendered on the public docs page goes
 * through resolveText(), which replaces {{SITE}} with the current browser
 * host so the docs work in any deployment.
 */
export const SITE_PLACEHOLDER = '{{SITE}}'

export function resolveText(value: string): string {
  if (!value.includes(SITE_PLACEHOLDER)) return value
  const host =
    typeof window !== 'undefined' && window.location.host
      ? window.location.host
      : 'localhost'
  return value.split(SITE_PLACEHOLDER).join(host)
}

export type DocCategory = {
  id: string
  label: string
  order: number
}

export type DocSection = {
  id: string
  categoryId: string
  eyebrow: string
  title: string
  summary: string
  published: boolean
  order: number
  blocks: DocBlock[]
}

export type DocsDocument = {
  version: number
  categories: DocCategory[]
  sections: DocSection[]
}

const CODEX_RELEASES = 'https://github.com/openai/codex/releases/latest'
const CC_SWITCH_RELEASES =
  'https://github.com/farion1231/cc-switch/releases/latest'

export const defaultDocCategories: DocCategory[] = [
  { id: 'getting-started', label: 'Getting started', order: 10 },
  { id: 'client-setup', label: 'Client setup', order: 20 },
  { id: 'text-api', label: 'Text API', order: 30 },
  { id: 'video-api', label: 'Video API', order: 40 },
  { id: 'support', label: 'Troubleshooting', order: 50 },
]

/**
 * The built-in document is fully data-driven. The public page and the admin
 * editor render the exact same blocks, and administrators can edit every
 * section in place.
 */
export const defaultDocSections: DocSection[] = [
  {
    id: 'start',
    categoryId: 'getting-started',
    eyebrow: 'GETTING STARTED',
    title: '五分钟完成首次调用',
    summary:
      '普通用户推荐使用 CC Switch 一键配置；开发者可以直接复制接口示例。一个分组使用一个 Key 即可，多建 Key 不会增加并发。',
    published: true,
    order: 10,
    blocks: [
      {
        type: 'steps',
        items: [
          {
            title: '下载 CC Switch',
            content:
              '按 Windows、macOS 或 Linux 下载并安装，打开后保持后台运行。\n\n[前往下载](#cc-switch)',
          },
          {
            title: '创建 API Key',
            content: '进入 API 密钥页面，选择要使用的模型分组并创建密钥。',
          },
          {
            title: '一键导入配置',
            content:
              '在密钥右侧选择 CC Switch，勾选 Claude Code、Codex 等目标工具。',
          },
          {
            title: '发送最小测试',
            content:
              '文字先发一条短消息，视频先用 480p、4 秒验证密钥和参数。',
          },
        ],
      },
    ],
  },
  {
    id: 'endpoints',
    categoryId: 'getting-started',
    eyebrow: 'ENDPOINTS',
    title: '线路与请求地址',
    summary:
      'OpenAI 兼容客户端填写带 /v1 的地址；Claude Code 填根域名，不要在末尾增加 /v1。',
    published: true,
    order: 20,
    blocks: [
      {
        type: 'card',
        title: '主线路',
        badge: '默认推荐',
        text: '回国加速，适合国内客户端和日常调用',
        copies: [
          { label: 'OpenAI 兼容', value: 'https://{{SITE}}/v1' },
          { label: 'Claude Code', value: 'https://{{SITE}}' },
        ],
      },
      {
        type: 'card',
        title: '线路说明',
        text: '文档会根据当前浏览器地址自动生成主线路。若管理员配置了备用域名，请以控制台公告为准，避免使用已失效的旧线路。',
      },
    ],
  },
  {
    id: 'api-key',
    categoryId: 'getting-started',
    eyebrow: 'AUTHENTICATION',
    title: '创建并使用 API Key',
    summary:
      '所有 API 请求都需要鉴权。密钥只展示给本人，不要放进前端代码、公开仓库或截图。',
    published: true,
    order: 30,
    blocks: [
      {
        type: 'steps',
        items: [
          {
            title: '进入 API 密钥',
            content: '在控制台打开 API 密钥页面，点击创建密钥。',
          },
          {
            title: '选择分组',
            content: '文字、Claude 与视频分组权限不同，按目标模型选择。',
          },
          {
            title: '保存并复制',
            content: '复制完整 sk- 密钥，配置到客户端或 Authorization Header。',
          },
          {
            title: '不要重复创建',
            content: '同一分组一个密钥即可；并发能力由分组和上游决定。',
          },
        ],
      },
      { type: 'markdown', content: '#### 标准鉴权 Header' },
      { type: 'code', content: 'Authorization: Bearer sk-你的API密钥' },
      {
        type: 'markdown',
        content: '点击密钥右侧复制按钮获取完整 API Key',
      },
      {
        type: 'image',
        src: 'https://api.bblabu.ai/tutorial-assets/api-key-copy.jpg',
        alt: 'API key creation and copy example',
        caption:
          '在控制台创建密钥并复制完整的 sk- 值。完整密钥只展示一次。',
      },
      {
        type: 'card',
        title: '配置前检查',
        text: '- 确认密钥分组包含你需要调用的模型。\n- 不要把 API Key 提交到 Git 仓库或前端代码。\n- 首次请求使用短文本和小输出上限。',
      },
    ],
  },
  {
    id: 'cc-switch',
    categoryId: 'client-setup',
    eyebrow: 'CLIENT SETUP',
    title: '下载 CC Switch 并一键导入',
    summary:
      '第一次接入建议先安装 CC Switch。它可以统一管理 Claude Code、Codex 等工具的 API Key、线路和模型，不需要手动修改多个配置文件。',
    published: true,
    order: 40,
    blocks: [
      {
        type: 'downloads',
        title: 'CC Switch 下载（v3.19.2）',
        description:
          '选择你的操作系统。Windows 普通电脑选择 x64 安装版；苹果电脑选择 macOS 通用安装包。',
        href: CC_SWITCH_RELEASES,
        note: '下载按钮会打开 CC Switch 官方 GitHub Release 页面。macOS 首次打开若被系统拦截，请到系统设置的隐私与安全性中允许打开。',
        items: [
          { name: 'CC-Switch-v3.19.2-Windows.msi', desc: 'Windows x64 安装版 · 推荐' },
          { name: 'CC-Switch-v3.19.2-Windows-Portable.zip', desc: 'Windows x64 绿色版 · 无需安装' },
          { name: 'CC-Switch-v3.19.2-Windows-arm64.msi', desc: 'Windows ARM64 安装版' },
          { name: 'CC-Switch-v3.19.2-macOS-universal.dmg', desc: 'macOS 通用安装包' },
          { name: 'CC-Switch-v3.19.2-Linux.AppImage', desc: 'Linux 图形版' },
        ],
      },
      {
        type: 'markdown',
        content:
          '### 安装后从本站一键导入\n\n不需要手抄地址。先创建对应分组的密钥，再从密钥右侧菜单导入到 CC Switch。',
      },
      {
        type: 'steps',
        items: [
          {
            title: '安装并打开 CC Switch',
            content: '完成上方下载和安装，首次启动后保持 CC Switch 在后台运行。',
          },
          {
            title: '创建对应分组密钥',
            content: '进入 API 密钥页面，选择 Claude、OpenAI 等实际要用的分组。',
          },
          {
            title: '点击 CC Switch 导入',
            content: '打开密钥右侧应用菜单，选择 CC Switch，浏览器会唤起客户端。',
          },
          {
            title: '勾选工具并应用',
            content: '勾选 Claude Code、Codex 等目标工具，保存并切换到本站供应商。',
          },
        ],
      },
      {
        type: 'markdown',
        content:
          '- 在目标密钥右侧打开应用菜单\n- 从应用列表选择 CC Switch\n- **模型必须与密钥分组匹配**',
      },
      {
        type: 'markdown',
        content:
          '### 导入流程参考\n\n这些截图展示打开 CC Switch、选择工具并应用配置的典型流程。',
      },
      {
        type: 'image',
        src: 'https://api.bblabu.ai/tutorial-assets/cc-switch-1.png',
        alt: 'Open CC Switch from the key menu',
        caption: '第一步：在 API 密钥菜单中选择 CC Switch。',
      },
      {
        type: 'image',
        src: 'https://api.bblabu.ai/tutorial-assets/cc-switch-2.png',
        alt: 'Select client tools to configure',
        caption: '第二步：选择要配置的工具，例如 Claude Code 或 Codex。',
      },
      {
        type: 'image',
        src: 'https://api.bblabu.ai/tutorial-assets/cc-switch-3.png',
        alt: 'Apply the CC Switch configuration',
        caption: '第三步：确认接入地址和模型，保存并应用。',
      },
      { type: 'markdown', content: '### 手动创建配置时怎么填' },
      {
        type: 'copy',
        items: [
          { label: 'CODEX / OPENAI 兼容', value: 'https://{{SITE}}/v1' },
          { label: 'CLAUDE CODE', value: 'https://{{SITE}}' },
        ],
      },
      {
        type: 'markdown',
        content:
          '填入本站 API Key 后获取模型列表，再选择与密钥分组匹配的模型。切换配置后若未生效，关闭并重新打开终端。',
      },
    ],
  },
  {
    id: 'claude-code',
    categoryId: 'client-setup',
    eyebrow: 'CLAUDE CODE',
    title: 'Claude Code 安装与配置',
    summary:
      'Claude Code 是 Anthropic 的命令行编程工具。先安装客户端，再使用 CC Switch 一键导入；也可以手动配置环境变量。',
    published: true,
    order: 50,
    blocks: [
      {
        type: 'code',
        title: 'macOS / Linux',
        content: 'curl -fsSL https://claude.ai/install.sh | bash',
      },
      {
        type: 'code',
        title: 'macOS Homebrew',
        content: 'brew install --cask claude-code',
      },
      {
        type: 'code',
        title: 'Windows PowerShell',
        content: 'irm https://claude.ai/install.ps1 | iex',
      },
      {
        type: 'markdown',
        content:
          '[Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code/overview)\n\n查看最新安装要求、更新方式和系统支持情况。',
      },
      {
        type: 'markdown',
        content:
          '### 推荐：使用 CC Switch 配置\n\n安装完成后返回上方，一键导入密钥、主线路和模型。',
      },
      {
        type: 'steps',
        items: [
          { title: '检查安装', content: '```\nclaude --version\n```' },
          {
            title: '启动并验证',
            content: '```\nclaude\n```\n\n输入一条测试消息，能正常回复即配置成功。',
          },
        ],
      },
      {
        type: 'markdown',
        content:
          'Windows 请在系统环境变量中添加相同变量；修改后重新打开终端。',
      },
      {
        type: 'code',
        content:
          '# macOS / Linux\nexport ANTHROPIC_BASE_URL="https://{{SITE}}"\nexport ANTHROPIC_AUTH_TOKEN="sk-你的API密钥"\n\n# 启动 Claude Code\nclaude',
      },
      {
        type: 'markdown',
        content:
          'Claude Code 的 Base URL 必须填写根域名 `https://{{SITE}}`，**不要添加 /v1**。',
      },
    ],
  },
  {
    id: 'codex-tools',
    categoryId: 'client-setup',
    eyebrow: 'CODEX TOOLKIT',
    title: 'Codex 安装器与聊天记录迁移器',
    summary:
      '适合需要快速初始化 Codex 环境或迁移已有聊天记录的用户。下载按钮会打开 OpenAI Codex 官方 GitHub Release 页面。',
    published: true,
    order: 60,
    blocks: [
      {
        type: 'downloads',
        title: 'Codex 一键安装器（build-65-1-995cbc0）',
        description:
          '用于辅助初始化 Codex 运行环境。安装完成后，仍需在 CC Switch 中导入本站 API Key 与线路。',
        href: CODEX_RELEASES,
        note: '平台名称仅用于快速定位，实际文件名、版本和校验值以官方 Release 页面为准。',
        items: [
          {
            name: 'codex-installer-windows-x64.exe',
            desc: '152.3 MB · SHA-256 46b195a0bd0ba6e38242d93f433651eecd6dee852be30f560af17222d94e4012',
          },
          {
            name: 'codex-installer-macos-universal2.dmg',
            desc: '5.0 MB · SHA-256 cca61827189da7d45b1ce14bf21c54206aea2f586ae57263d951b4a998bf50a9',
          },
        ],
      },
      {
        type: 'downloads',
        title: 'Codex 聊天记录迁移器（build-27140614657-3-99a5c13）',
        description:
          '用于迁移已有 Codex 聊天记录，不负责配置 API 线路。普通用户优先选择 Windows、macOS 或 Linux 图形版。',
        href: CODEX_RELEASES,
        note: '迁移前请先备份现有 Codex 数据。',
        items: [
          {
            name: 'codex-chat-migrator-windows-x64.zip',
            desc: '12.4 MB · SHA-256 4468987b681aed60f3cfcf8edc1d81060a8a6ae42a53723cf587b8b3146dc3a4',
          },
          {
            name: 'codex-chat-migrator-macos-universal2.zip',
            desc: '68.7 MB · SHA-256 a32e0acf386680560865ce706a1084443d4c21d85c3207f21c80208473d175a5',
          },
          {
            name: 'codex-chat-migrator-linux-x64-gui.tar.gz',
            desc: '22.4 MB · SHA-256 54edd1e50b808b6d442bfec08d3f145dfd76ea96c0549eb28bed0970239ff32a',
          },
          {
            name: 'codex-chat-migrator-linux-x64-cli.tar.gz',
            desc: '17.9 MB · SHA-256 e87a3bc13cb6017bfe8f13ddecb645f017902cadfb173a7f2fe553caa9956243',
          },
        ],
      },
      {
        type: 'markdown',
        content:
          '上述文件和校验值来自公开发布信息，本站不托管安装包。下载前请在官方 Release 页面核对版本与 SHA-256。',
      },
    ],
  },
  {
    id: 'codex-cli',
    categoryId: 'client-setup',
    eyebrow: 'OPENAI CODEX',
    title: 'Codex CLI 下载与接入',
    summary:
      'Codex CLI 是 OpenAI 的命令行编程工具。需要 Node.js 和 npm；安装后建议通过 CC Switch 导入本站 OpenAI 分组配置。',
    published: true,
    order: 70,
    blocks: [
      {
        type: 'markdown',
        content:
          '[先安装 Node.js](https://nodejs.org/en/download/)\n\n尚未安装 npm 的用户，先从 Node.js 官方下载 LTS 版本。',
      },
      {
        type: 'markdown',
        content:
          '[Codex CLI 官方文档](https://developers.openai.com/codex/cli/)\n\n查看 OpenAI 官方安装、更新和使用说明。',
      },
      {
        type: 'markdown',
        content:
          '### 安装后导入本站配置\n\n在 CC Switch 中勾选 Codex，OpenAI Base URL 使用 `https://{{SITE}}/v1`。',
      },
      {
        type: 'code',
        content:
          '# 使用 npm 安装（Windows / macOS / Linux）\nnpm install -g @openai/codex\n\n# macOS 也可以使用 Homebrew\nbrew install --cask codex',
      },
      {
        type: 'code',
        content: '# 检查并启动\ncodex --version\ncodex',
      },
    ],
  },
  {
    id: 'codex-sol-context',
    categoryId: 'client-setup',
    eyebrow: 'GPT-5.6 SOL',
    title: 'Codex 原生支持 105 万上下文',
    summary:
      'GPT-5.6 Sol 原生支持 105 万 token 上下文，现在直接把 Codex 上下文拉满。',
    published: true,
    order: 80,
    blocks: [
      {
        type: 'markdown',
        content:
          '保存后重启 Codex，新会话直接起飞。\n\n修改 ~/.codex/config.toml 后保存并重启 Codex，新会话即可使用 105 万 token 上下文；临时测试可以用下方命令直接启动。',
      },
      {
        type: 'code',
        title: '~/.codex/config.toml',
        content:
          '# 打开 ~/.codex/config.toml，顶部加上这三行\nmodel = "gpt-5.6-sol"\nmodel_context_window = 1000000\nmodel_auto_compact_token_limit = 900000',
      },
      {
        type: 'code',
        title: '临时测试命令',
        content:
          'codex -m gpt-5.6-sol -c model_context_window=1000000 -c model_auto_compact_token_limit=900000',
      },
    ],
  },
  {
    id: 'chatgpt',
    categoryId: 'client-setup',
    eyebrow: 'CHATGPT APP',
    title: 'ChatGPT 官方客户端',
    summary:
      '需要使用 ChatGPT 网页版或官方桌面、手机客户端时，从官方入口下载，避免安装第三方仿冒软件。',
    published: true,
    order: 90,
    blocks: [
      {
        type: 'card',
        title: 'ChatGPT 网页版',
        text: '无需安装，浏览器打开后使用 OpenAI 账号登录。',
        link: { href: 'https://chatgpt.com/', label: '打开 ChatGPT 网页版', external: true },
      },
      {
        type: 'card',
        title: 'ChatGPT 官方下载页',
        text: '提供 macOS、Windows、iOS 和 Android 官方客户端入口。',
        link: { href: 'https://openai.com/chatgpt/download/', label: '前往官方下载页', external: true },
      },
      {
        type: 'markdown',
        content:
          '官方 ChatGPT 应用搭配 CC Switch 工具，在里面配置好本站的 Base URL 和 API Key 后即可正常使用本站 API。',
      },
    ],
  },
  {
    id: 'vscode',
    categoryId: 'client-setup',
    eyebrow: 'VS CODE',
    title: 'VS Code 与 AI 扩展',
    summary:
      '习惯在编辑器里使用 AI 的用户，可以先安装 VS Code，再安装 OpenAI Codex 或 Anthropic Claude Code 扩展。',
    published: true,
    order: 100,
    blocks: [
      {
        type: 'card',
        title: '下载 Visual Studio Code',
        text: '官方页面会根据 Windows、macOS 或 Linux 提供对应安装包。',
        link: { href: 'https://code.visualstudio.com/Download', label: '下载 Visual Studio Code', external: true },
      },
      {
        type: 'card',
        title: 'OpenAI Codex 扩展',
        text: '在 VS Code 扩展市场查看并安装 OpenAI 官方扩展。',
        link: { href: 'https://marketplace.visualstudio.com/items?itemName=OpenAI.chatgpt', label: 'OpenAI Codex 扩展', external: true },
      },
      {
        type: 'card',
        title: 'Anthropic Claude Code 扩展',
        text: '在 VS Code 扩展市场查看并安装 Anthropic 官方扩展。',
        link: { href: 'https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code', label: 'Anthropic Claude Code 扩展', external: true },
      },
      {
        type: 'code',
        content:
          '# OpenAI Codex 扩展\ncode --install-extension OpenAI.chatgpt\n\n# Anthropic Claude Code 扩展\ncode --install-extension Anthropic.claude-code',
      },
      {
        type: 'markdown',
        content:
          '扩展安装完成后，先确认 CC Switch 已选中本站配置，再重启 VS Code 并发送一条短消息验证连接。',
      },
    ],
  },
  {
    id: 'text-api',
    categoryId: 'text-api',
    eyebrow: 'TEXT MODELS',
    title: '文字模型 API',
    summary:
      '本站同时兼容 OpenAI Chat Completions、Responses API 与 Anthropic Messages。模型名称以模型广场和所选分组为准。',
    published: true,
    order: 110,
    blocks: [
      {
        type: 'markdown',
        content: '### Chat Completions\n\n适合大多数 OpenAI 兼容客户端与现有 SDK。',
      },
      {
        type: 'code',
        title: 'Chat Completions 请求示例',
        content:
          'curl https://{{SITE}}/v1/chat/completions \\\n  -H "Authorization: Bearer sk-你的API密钥" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "model": "gpt-5.6-sol",\n    "messages": [\n      {"role": "user", "content": "请用一句话介绍你自己"}\n    ],\n    "stream": true\n  }\'',
      },
      {
        type: 'markdown',
        content: '### Responses API\n\n适合 Codex、新版 OpenAI SDK 与长上下文调用。',
      },
      {
        type: 'code',
        title: 'Responses API 请求示例',
        content:
          'curl https://{{SITE}}/v1/responses \\\n  -H "Authorization: Bearer sk-你的API密钥" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "model": "gpt-5.6-sol",\n    "input": "分析这段文本并给出三个要点",\n    "stream": true\n  }\'',
      },
      {
        type: 'markdown',
        content: '### Anthropic Messages\n\n使用 Claude 分组密钥，客户端 Base URL 填根域名。',
      },
      {
        type: 'code',
        title: 'Anthropic Messages 请求示例',
        content:
          'curl https://{{SITE}}/v1/messages \\\n  -H "x-api-key: sk-你的API密钥" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d \'{\n    "model": "claude-opus-4-8",\n    "max_tokens": 1024,\n    "messages": [\n      {"role": "user", "content": "你好，请用中文回复"}\n    ]\n  }\'',
      },
    ],
  },
  {
    id: 'video-overview',
    categoryId: 'video-api',
    eyebrow: 'VIDEO API',
    title: '创建视频任务',
    summary:
      '视频生成为异步任务。提交成功会返回 task_id；创建接口返回后，使用查询接口轮询状态。',
    published: true,
    order: 120,
    blocks: [
      { type: 'endpoint', method: 'POST', path: '/v1/videos', description: '创建任务' },
      { type: 'endpoint', method: 'GET', path: '/v1/videos/{task_id}', description: '查询状态' },
      { type: 'endpoint', method: 'GET', path: '/v1/videos/{task_id}/content', description: '播放或下载' },
      {
        type: 'code',
        title: 'Seedance 请求示例',
        content:
          'curl https://{{SITE}}/v1/videos \\\n  -H "Authorization: Bearer sk-你的视频分组API密钥" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "model": "Seedance-2.0",\n    "prompt": "电影感产品特写，镜头缓慢环绕，光线自然",\n    "ratio": "16:9",\n    "duration": 5,\n    "resolution": "720p"\n  }\'',
      },
      {
        type: 'code',
        title: 'Grok 请求示例',
        content:
          'curl https://{{SITE}}/v1/videos \\\n  -H "Authorization: Bearer sk-你的Grok分组API密钥" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "model": "grok-video-1.5",\n    "prompt": "电影感城市夜景，镜头缓慢推进，光影自然",\n    "duration": 5,\n    "resolution": "1080p",\n    "aspect_ratio": "16:9",\n    "images": []\n  }\'',
      },
      {
        type: 'markdown',
        content:
          'Seedance 与 MiniMax 请求使用对应视频分组密钥；Grok 视频请求使用 Grok 分组密钥。分组与模型不匹配时无法调用。',
      },
    ],
  },
  {
    id: 'video-models',
    categoryId: 'video-api',
    eyebrow: 'MODEL MATRIX',
    title: '视频模型与参数范围',
    summary:
      '以下是常见模型的示例参数范围，便于理解请求结构。实际可用模型、参数和价格以当前控制台模型列表及分组配置为准；Seedance / MiniMax 首次建议 4 秒低清晰度，Grok 可从 1 秒开始测试。',
    published: true,
    order: 130,
    blocks: [
      {
        type: 'card',
        title: 'Seedance-2.0',
        subtitle: 'ByteDance 视频模型',
        mono: true,
        rows: [
          { label: '时长', value: '4-15 秒' },
          { label: '清晰度', value: '480p / 720p / 1080p / 4K' },
          { label: '画面比例', value: '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / Auto' },
          { label: '参考素材', value: '最多 9 图、3 视频、3 音频，合计不超过 12 个' },
          { label: '计费', value: '按输出秒数和清晰度计费' },
        ],
      },
      {
        type: 'card',
        title: 'Seedance-2.5',
        subtitle: 'ByteDance 视频模型',
        mono: true,
        rows: [
          { label: '时长', value: '4-30 秒' },
          { label: '清晰度', value: '480p / 720p' },
          { label: '画面比例', value: '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / Auto' },
          { label: '参考素材', value: '最多 30 图、10 视频、10 音频，合计不超过 50 个' },
          { label: '计费', value: '按输出秒数、清晰度和参考视频输入时长计费' },
        ],
      },
      {
        type: 'card',
        title: 'minimax-h3',
        subtitle: 'miniMax 视频模型',
        mono: true,
        rows: [
          { label: '时长', value: '4-15 秒' },
          { label: '清晰度', value: '768p / 2k' },
          { label: '画面比例', value: '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16' },
          { label: '参考素材', value: '最多 9 图、3 视频、3 音频，合计不超过 12 个' },
          { label: '计费', value: '按输出秒数和清晰度计费' },
        ],
      },
      {
        type: 'card',
        title: 'minimax-h3-vip',
        subtitle: 'miniMax三方视频模型',
        mono: true,
        rows: [
          { label: '时长', value: '5-15 秒' },
          { label: '清晰度', value: '720p / 2K' },
          { label: '画面比例', value: 'auto / 1:1 / 16:9 / 9:16 / 3:4 / 4:3 / 21:9' },
          { label: '参考素材', value: '最多 5 张图片、1 个音频，不支持视频参考；音频必须搭配图片' },
          { label: '计费', value: '按清晰度固定按次计费，输出固定带音频' },
        ],
      },
      {
        type: 'card',
        title: 'grok-video',
        subtitle: 'Grok',
        mono: true,
        rows: [
          { label: '时长', value: '1-15 秒' },
          { label: '清晰度', value: '480p / 720p' },
          { label: '画面比例', value: '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16' },
          { label: '参考素材', value: '支持文生视频或 1 张参考图' },
          { label: '计费', value: '以当前控制台实时价格为准' },
        ],
      },
      {
        type: 'card',
        title: 'grok-video-1.5',
        subtitle: 'Grok',
        mono: true,
        rows: [
          { label: '时长', value: '1-15 秒' },
          { label: '清晰度', value: '1080p' },
          { label: '画面比例', value: '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16' },
          { label: '参考素材', value: '最多 7 张参考图；1080p 最多 1 张' },
          { label: '计费', value: '以当前控制台实时价格为准' },
        ],
      },
      { type: 'markdown', content: '### 请求字段说明' },
      {
        type: 'table',
        columns: ['字段', '类型', '要求', '说明'],
        rows: [
          ['model', 'string', '必填', '模型名称，必须与所选视频分组支持的模型一致'],
          ['prompt', 'string', '必填', '视频描述；参考素材可在提示词中使用 @图1、@视频1、@音频1'],
          ['ratio', 'string', '可选', '画面比例；首尾帧模式传 Auto'],
          ['duration', 'integer', '可选', '输出视频秒数，必须在对应模型范围内'],
          ['resolution', 'string', '可选', '清晰度，必须使用对应模型支持的档位'],
          ['aspect_ratio', 'string', 'Grok 可选', 'Grok 视频模型使用的画面比例字段'],
          ['images', 'string[]', 'Grok 可选', 'Grok 图生视频使用的公网 HTTPS 图片 URL 数组'],
          ['first_image', 'string', '可选', '首帧图片的公开 HTTPS URL'],
          ['last_image', 'string', '可选', '尾帧图片的公开 HTTPS URL'],
          ['referenceImages', 'string[]', '可选', '参考图片的公开 HTTPS URL 数组'],
          ['referenceVideos', 'string[]', '可选', '参考视频的公开 HTTPS URL 数组'],
          ['referenceAudios', 'string[]', '可选', '参考音频的公开 HTTPS URL 数组'],
        ],
      },
    ],
  },
  {
    id: 'video-assets',
    categoryId: 'video-api',
    eyebrow: 'REFERENCE ASSETS',
    title: '图片、视频与音频素材',
    summary:
      '参考素材必须是上游能够直接访问的公网 HTTPS URL。需要登录、临时 blob:、本地 file: 或带防盗链的地址无法使用。',
    published: true,
    order: 140,
    blocks: [
      {
        type: 'card',
        title: '首尾帧',
        text: '使用 first_image，可选 last_image；ratio 固定传 Auto。',
      },
      {
        type: 'card',
        title: '全能参考',
        text: '使用 referenceImages、referenceVideos、referenceAudios 数组。',
      },
      {
        type: 'card',
        title: '素材可访问性',
        text: '提交前在无登录浏览器中打开 URL，确认可以直接下载文件。',
      },
      {
        type: 'card',
        title: '素材计费',
        text: '参考视频输入时长会参与最终计费，请预留足够额度。',
      },
      {
        type: 'code',
        title: '参考素材请求示例',
        content:
          'curl https://{{SITE}}/v1/videos \\\n  -H "Authorization: Bearer sk-你的视频分组API密钥" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "model": "Seedance-2.5",\n    "prompt": "@图1 中的人物向镜头挥手，动作参考 @视频1",\n    "ratio": "16:9",\n    "duration": 6,\n    "resolution": "480p",\n    "referenceImages": ["https://example.com/reference.jpg"],\n    "referenceVideos": ["https://example.com/motion.mp4"]\n  }\'',
      },
    ],
  },
  {
    id: 'video-result',
    categoryId: 'video-api',
    eyebrow: 'TASK LIFECYCLE',
    title: '查询、播放与下载',
    summary:
      '提交接口只负责创建任务。请保存 task_id，间隔 3-5 秒查询一次；完成后通过 content 接口获取真实 MP4。',
    published: true,
    order: 150,
    blocks: [
      {
        type: 'code',
        title: '查询与下载',
        content:
          '# 查询任务状态\ncurl https://{{SITE}}/v1/videos/task_xxx \\\n  -H "Authorization: Bearer sk-你的视频分组API密钥"\n\n# 任务完成后下载视频\ncurl -L https://{{SITE}}/v1/videos/task_xxx/content \\\n  -H "Authorization: Bearer sk-你的视频分组API密钥" \\\n  -o result.mp4',
      },
      {
        type: 'card',
        title: 'queued',
        mono: true,
        text: '任务已进入队列，继续等待',
      },
      {
        type: 'card',
        title: 'in_progress',
        mono: true,
        text: '正在生成，保持轮询',
      },
      {
        type: 'card',
        title: 'completed',
        mono: true,
        text: '生成完成，可以播放或下载',
      },
      {
        type: 'card',
        title: 'failed',
        mono: true,
        text: '读取失败原因，修正后重新创建',
      },
    ],
  },
  {
    id: 'errors',
    categoryId: 'support',
    eyebrow: 'TROUBLESHOOTING',
    title: '常见错误排查',
    summary:
      '先根据 HTTP 状态码定位问题。视频任务若已返回 task_id，不要重复提交创建请求。',
    published: true,
    order: 160,
    blocks: [
      {
        type: 'callout',
        code: '401',
        title: 'API Key 无效或分组不匹配',
        text: '重新复制完整密钥，确认视频请求使用视频模型分组创建的 Key。',
      },
      {
        type: 'callout',
        code: '403',
        title: '预扣费额度不足',
        text: '视频任务会按所选模型、清晰度和计费方式预扣费。降低清晰度，或补充钱包/套餐额度后重试。',
      },
      {
        type: 'callout',
        code: '404',
        title: '接口路径或模型名称错误',
        text: 'OpenAI 地址需要 /v1；视频模型名称区分大小写，请直接复制本文档名称。',
      },
      {
        type: 'callout',
        code: '422',
        title: '请求参数不符合模型范围',
        text: '检查 duration、resolution、ratio 与参考素材数量是否符合所选模型。',
      },
      {
        type: 'callout',
        code: '502/503/504',
        title: '上游繁忙或任务暂时不可用',
        text: '保留 task_id，稍后查询；创建失败且没有 task_id 时再重新提交，避免重复计费。',
      },
    ],
  },
]

export const defaultDocument: DocsDocument = {
  version: 3,
  categories: defaultDocCategories,
  sections: defaultDocSections,
}
