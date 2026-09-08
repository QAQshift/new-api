/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  Check,
  Clipboard,
  Edit3,
  Eye,
  FileText,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Markdown } from '@/components/ui/markdown'
import { Textarea } from '@/components/ui/textarea'
import {
  defaultDocSections,
  type DocBlock,
} from '@/overrides/docs/default-document'

import { SettingsSwitchField } from '../components/settings-form-layout'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type ManagedDocument = {
  id: string
  sectionId?: string
  eyebrow?: string
  title: string
  summary: string
  content: string
  blocks?: DocBlock[]
  published: boolean
  order: number
}

type DocsSectionProps = {
  data: string
}

type EditorState = Omit<ManagedDocument, 'id'>

const DEFAULT_DOCUMENT_MARKDOWN = `# API 使用文档

> 这是内置文档的 Markdown 版参考模板。公开文档页还包含交互式分类导航、复制按钮、图文教程、动态站点地址和视频参数卡片；这里的内容用于管理员复制和扩展。

## 一、快速开始

1. 在控制台创建 API Key，并选择对应模型分组。
2. OpenAI 兼容客户端使用 \`https://你的域名/v1\` 作为 Base URL。
3. Claude Code 使用 \`https://你的域名\` 作为 Base URL，不要添加 \`/v1\`。
4. 首次调用建议使用短文本、低输出限制验证密钥和线路。

## 二、线路与请求地址

| 用途 | 地址 |
| --- | --- |
| OpenAI 兼容接口 | \`https://你的域名/v1\` |
| Claude Code / Anthropic | \`https://你的域名\` |
| 视频任务 | \`https://你的域名/v1/videos\` |

实际地址以当前浏览器访问的站点域名为准。若管理员配置了备用线路，请以站点公告为准。

## 三、创建并使用 API Key

1. 进入控制台的 API 密钥页面。
2. 选择要使用的模型分组。
3. 创建并复制完整的 \`sk-...\` 密钥。
4. 不要把密钥提交到 Git 仓库、前端代码、截图或公开聊天中。

标准鉴权请求头：

\`\`\`http
Authorization: Bearer sk-你的API密钥
\`\`\`

一个分组通常使用一个 Key 即可，多建 Key 不会自动增加并发能力。

## 四、CC Switch 一键配置

CC Switch 可以统一管理 Claude Code、Codex 等工具的 API Key、线路和模型。

1. 从 CC Switch 官方 GitHub Release 页面下载对应系统版本。
2. 在本站创建对应模型分组的 API Key。
3. 在密钥右侧菜单选择 CC Switch 导入。
4. 勾选要配置的工具，确认 Base URL、模型和分组后保存。

手动配置时：

- CODEX / OPENAI：\`https://你的域名/v1\`
- CLAUDE CODE：\`https://你的域名\`

模型必须与 API Key 的分组匹配。

## 五、Claude Code

安装方式：

\`\`\`bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# macOS Homebrew
brew install --cask claude-code

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
\`\`\`

配置环境变量：

\`\`\`bash
export ANTHROPIC_BASE_URL="https://你的域名"
export ANTHROPIC_AUTH_TOKEN="sk-你的API密钥"
claude
\`\`\`

Claude Code 的 Base URL 填根域名，不要添加 \`/v1\`。

## 六、Codex CLI

先安装 Node.js LTS，然后执行：

\`\`\`bash
npm install -g @openai/codex
codex --version
codex
\`\`\`

OpenAI Base URL 使用 \`https://你的域名/v1\`，建议使用 CC Switch 导入配置。

## 七、Codex 长上下文配置

如果当前分组提供长上下文模型，可以在 \`~/.codex/config.toml\` 中配置：

\`\`\`toml
model = "模型名称"
model_context_window = 1000000
model_auto_compact_token_limit = 900000
\`\`\`

保存后重启 Codex，新会话才会使用新的上下文配置。

## 八、ChatGPT 与 VS Code

ChatGPT 官方客户端请从 OpenAI 官方下载页面获取，避免安装第三方仿冒软件。

VS Code 用户可以安装 OpenAI Codex 或 Anthropic Claude Code 扩展。安装完成后确认扩展使用本站 Base URL 和 API Key，再发送一条短消息验证连接。

## 九、文字模型 API

### Chat Completions

\`\`\`bash
curl https://你的域名/v1/chat/completions \\
  -H "Authorization: Bearer sk-你的API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "模型名称",
    "messages": [{"role": "user", "content": "请用一句话介绍你自己"}],
    "stream": true
  }'
\`\`\`

### Responses API

\`\`\`bash
curl https://你的域名/v1/responses \\
  -H "Authorization: Bearer sk-你的API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"模型名称","input":"分析这段文本并给出三个要点","stream":true}'
\`\`\`

### Anthropic Messages

\`\`\`bash
curl https://你的域名/v1/messages \\
  -H "x-api-key: sk-你的API密钥" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{"model":"claude-模型名称","max_tokens":1024,"messages":[{"role":"user","content":"你好"}]}'
\`\`\`

模型名称、可用参数和价格以当前控制台模型列表和分组配置为准。

## 十、视频 API

视频生成为异步任务。创建任务成功后保存 \`task_id\`，每 3-5 秒查询一次状态。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | \`/v1/videos\` | 创建任务 |
| GET | \`/v1/videos/{task_id}\` | 查询状态 |
| GET | \`/v1/videos/{task_id}/content\` | 播放或下载 |

\`\`\`bash
curl https://你的域名/v1/videos \\
  -H "Authorization: Bearer sk-你的视频分组API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Seedance-2.0",
    "prompt": "电影感产品特写，镜头缓慢环绕，光线自然",
    "ratio": "16:9",
    "duration": 5,
    "resolution": "720p"
  }'
\`\`\`

任务完成后：

\`\`\`bash
curl https://你的域名/v1/videos/task_xxx \\
  -H "Authorization: Bearer sk-你的视频分组API密钥"

curl -L https://你的域名/v1/videos/task_xxx/content \\
  -H "Authorization: Bearer sk-你的视频分组API密钥" \\
  -o result.mp4
\`\`\`

## 十一、视频模型参数参考

| 模型 | 时长 | 清晰度 | 参考素材 |
| --- | --- | --- | --- |
| Seedance-2.0 | 4-15 秒 | 480p / 720p / 1080p / 4K | 图片、视频、音频 |
| Seedance-2.5 | 4-30 秒 | 480p / 720p | 图片、视频、音频 |
| minimax-h3 | 4-15 秒 | 768p / 2K | 图片、视频、音频 |
| grok-video | 1-15 秒 | 480p / 720p | 文生视频或参考图 |
| grok-video-1.5 | 1-15 秒 | 1080p | 最多 7 张参考图 |

实际可用范围以当前模型配置为准。首次测试建议使用短时长和低清晰度。

## 十二、参考素材

参考图片、视频和音频必须是上游可以直接访问的公网 HTTPS URL。登录后才能访问、临时 \`blob:\`、本地 \`file:\` 或带防盗链的地址可能无法使用。

- 首尾帧：使用 \`first_image\`，可选 \`last_image\`。
- 全能参考：使用 \`referenceImages\`、\`referenceVideos\`、\`referenceAudios\` 数组。
- 参考视频输入时长可能参与最终计费，请预留足够额度。

## 十三、任务状态

- \`queued\`：任务已进入队列。
- \`in_progress\`：正在生成，继续轮询。
- \`completed\`：生成完成，可以播放或下载。
- \`failed\`：读取失败原因，修正参数后重新创建。

## 十四、常见错误排查

- \`401\`：API Key 无效或分组不匹配，重新复制完整密钥。
- \`403\`：预扣费额度不足或权限不足，检查钱包和模型分组。
- \`404\`：接口路径或模型名称错误，OpenAI 地址通常需要 \`/v1\`。
- \`422\`：请求参数不符合模型范围，检查时长、清晰度、比例和素材数量。
- \`502/503/504\`：上游繁忙或暂时不可用。已有 \`task_id\` 时先继续查询，不要重复创建任务。
`

const EMPTY_EDITOR: EditorState = {
  sectionId: '',
  eyebrow: '',
  title: '',
  summary: '',
  content: '',
  blocks: [],
  published: false,
  order: 0,
}

function parseDocuments(data: string): ManagedDocument[] {
  try {
    const parsed: unknown = JSON.parse(data || '[]')
    let records: unknown = []
    if (Array.isArray(parsed)) {
      records = parsed
    } else if (parsed && typeof parsed === 'object' && 'sections' in parsed) {
      records = (parsed as { sections?: unknown }).sections
    }
    if (!Array.isArray(records)) return []
    return records.flatMap((item, index) => {
      if (!item || typeof item !== 'object') return []
      const value = item as Partial<ManagedDocument>
      if (typeof value.title !== 'string') {
        return []
      }
      return [
        {
          id:
            typeof value.id === 'string' && value.id
              ? value.id
              : `doc-${index + 1}`,
          sectionId: typeof value.sectionId === 'string' ? value.sectionId : '',
          eyebrow: typeof value.eyebrow === 'string' ? value.eyebrow : '',
          title: value.title,
          summary: typeof value.summary === 'string' ? value.summary : '',
          content: typeof value.content === 'string' ? value.content : '',
          blocks: Array.isArray(value.blocks) ? value.blocks : [],
          published: value.published === true,
          order:
            typeof value.order === 'number' && value.order >= 0
              ? value.order
              : index,
        },
      ]
    })
  } catch {
    return []
  }
}

export function DocsSection(props: DocsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [documents, setDocuments] = useState<ManagedDocument[]>(() =>
    parseDocuments(props.data)
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR)
  const [preview, setPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [copiedDefault, setCopiedDefault] = useState(false)
  const [blocksDraft, setBlocksDraft] = useState('[]')

  useEffect(() => {
    setDocuments(parseDocuments(props.data))
    setEditingId(null)
    setEditor(EMPTY_EDITOR)
    setHasChanges(false)
    setBlocksDraft('[]')
  }, [props.data])

  const updateEditor = <K extends keyof EditorState>(
    key: K,
    value: EditorState[K]
  ) => {
    setEditor((current) => ({ ...current, [key]: value }))
  }

  const startNew = () => {
    setEditingId('new')
    setEditor({ ...EMPTY_EDITOR, order: documents.length })
    setBlocksDraft('[]')
    setPreview(false)
  }

  const startEdit = (document: ManagedDocument) => {
    setEditingId(document.id)
    setEditor({
      sectionId: document.sectionId ?? '',
      eyebrow: document.eyebrow ?? '',
      title: document.title,
      summary: document.summary,
      content: document.content,
      blocks: document.blocks ?? [],
      published: document.published,
      order: document.order,
    })
    setBlocksDraft(JSON.stringify(document.blocks ?? [], null, 2))
    setPreview(false)
  }

  const saveDocument = () => {
    if (!editor.title.trim()) {
      toast.error(t('Document title and content are required'))
      return
    }
    let blocks: DocBlock[] = []
    try {
      const parsed: unknown = JSON.parse(blocksDraft || '[]')
      if (!Array.isArray(parsed)) throw new Error('blocks must be an array')
      blocks = parsed as DocBlock[]
    } catch {
      toast.error(t('Structured blocks must be valid JSON'))
      return
    }
    if (
      !editor.sectionId?.trim() &&
      !editor.content.trim() &&
      blocks.length === 0
    ) {
      toast.error(t('Document title and content are required'))
      return
    }
    const id =
      editingId === 'new' || !editingId ? crypto.randomUUID() : editingId
    const nextDocument: ManagedDocument = {
      id,
      ...editor,
      title: editor.title.trim(),
      sectionId: editor.sectionId?.trim() || undefined,
      eyebrow: editor.eyebrow?.trim() || undefined,
      summary: editor.summary.trim(),
      content: editor.content.trim(),
      blocks,
      order: Math.max(0, Math.floor(editor.order)),
    }
    setDocuments((current) => {
      const exists = current.some((item) => item.id === id)
      return exists
        ? current.map((item) => (item.id === id ? nextDocument : item))
        : [...current, nextDocument]
    })
    setEditingId(id)
    setHasChanges(true)
    toast.success(t('Document draft updated'))
  }

  const deleteDocument = (id: string) => {
    setDocuments((current) => current.filter((item) => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setEditor(EMPTY_EDITOR)
      setBlocksDraft('[]')
    }
    setHasChanges(true)
  }

  const saveAll = async () => {
    try {
      const ordered = [...documents].sort((a, b) => a.order - b.order)
      await updateOption.mutateAsync({
        key: 'console_setting.docs',
        value: JSON.stringify({ version: 2, sections: ordered }),
      })
      setHasChanges(false)
      toast.success(t('Documentation settings saved'))
    } catch {
      toast.error(t('Failed to save documentation settings'))
    }
  }

  const copyDefaultMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_DOCUMENT_MARKDOWN)
      setCopiedDefault(true)
      window.setTimeout(() => setCopiedDefault(false), 1600)
    } catch {
      toast.error(t('Unable to copy Markdown'))
    }
  }

  const loadDefaultMarkdown = () => {
    setEditingId('new')
    setEditor({
      ...EMPTY_EDITOR,
      title: t('API documentation template'),
      summary: t(
        'Editable Markdown starter based on the built-in documentation.'
      ),
      content: DEFAULT_DOCUMENT_MARKDOWN,
      order: documents.length,
    })
    setBlocksDraft('[]')
    setPreview(false)
  }

  const previewUrl = (() => {
    if (!editor.sectionId) return ''
    let blocks: DocBlock[] = []
    try {
      const parsed: unknown = JSON.parse(blocksDraft || '[]')
      if (Array.isArray(parsed)) blocks = parsed as DocBlock[]
    } catch {
      // The editor displays the JSON validation error when saving.
    }
    const draft = encodeURIComponent(
      JSON.stringify({ ...editor, blocks, published: true })
    )
    return `/docs?previewDoc=${draft}#${editor.sectionId}`
  })()

  let previewView: ReactNode
  if (editor.sectionId) {
    previewView = (
      <div className='max-h-[75vh] overflow-y-auto rounded-lg border'>
        <iframe
          title={t('Public documentation preview')}
          src={previewUrl}
          // The preview must retain same-origin access so its React app can
          // load the public documentation configuration endpoint.
          // eslint-disable-next-line react/iframe-missing-sandbox
          sandbox='allow-forms allow-modals allow-popups allow-same-origin allow-scripts'
          className='h-[75vh] w-full border-0'
        />
      </div>
    )
  } else {
    previewView = (
      <div className='bg-muted/20 min-h-80 rounded-lg border p-5'>
        <h3 className='text-xl font-semibold'>
          {editor.title || t('Untitled document')}
        </h3>
        {editor.summary && (
          <p className='text-muted-foreground mt-2 text-sm'>{editor.summary}</p>
        )}
        <div className='mt-4'>
          <Markdown>{editor.content || t('Nothing to preview yet')}</Markdown>
        </div>
      </div>
    )
  }

  return (
    <SettingsSection title={t('Documentation management')}>
      <div className='space-y-5'>
        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm'>
          <p>
            {t(
              'Create published Markdown pages that extend the built-in documentation.'
            )}
          </p>
          <div className='flex gap-2'>
            <Button size='sm' onClick={startNew}>
              <Plus className='mr-2 size-4' />
              {t('Add document')}
            </Button>
            <Button
              size='sm'
              variant='secondary'
              onClick={saveAll}
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 size-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </div>

        <div className='rounded-xl border border-dashed p-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex items-start gap-3'>
              <FileText className='text-primary mt-0.5 size-5 shrink-0' />
              <div>
                <h4 className='font-medium'>
                  {t('Built-in documentation template')}
                </h4>
                <p className='text-muted-foreground mt-1 text-sm leading-6'>
                  {t(
                    'The public docs page is built in and includes interactive navigation, examples, images, and parameter cards. Use this Markdown template as a starting point for administrator extensions.'
                  )}
                </p>
              </div>
            </div>
            <div className='flex shrink-0 gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  window.open('/docs', '_blank', 'noopener,noreferrer')
                }
              >
                <Eye className='mr-2 size-4' />
                {t('Open full public docs')}
              </Button>
              <Button size='sm' variant='outline' onClick={copyDefaultMarkdown}>
                {copiedDefault ? (
                  <Check className='mr-2 size-4' />
                ) : (
                  <Clipboard className='mr-2 size-4' />
                )}
                {copiedDefault ? t('Copied') : t('Copy Markdown')}
              </Button>
              <Button size='sm' variant='outline' onClick={loadDefaultMarkdown}>
                <Edit3 className='mr-2 size-4' />
                {t('Load into editor')}
              </Button>
            </div>
          </div>
          <details className='mt-3'>
            <summary className='text-muted-foreground cursor-pointer text-sm'>
              {t('View default Markdown source')}
            </summary>
            <pre className='bg-muted/30 mt-3 max-h-72 overflow-auto rounded-lg border p-4 text-xs leading-6 whitespace-pre-wrap'>
              {DEFAULT_DOCUMENT_MARKDOWN}
            </pre>
          </details>
        </div>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'>
          <div className='space-y-2'>
            {documents.length === 0 ? (
              <div className='text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm'>
                <FileText className='mx-auto mb-2 size-7 opacity-60' />
                {t('No custom documents yet')}
              </div>
            ) : (
              [...documents]
                .sort((a, b) => a.order - b.order)
                .map((document) => (
                  <div
                    key={document.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      editingId === document.id
                        ? 'border-primary bg-primary/5'
                        : ''
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <button
                        type='button'
                        className='min-w-0 flex-1 text-left'
                        onClick={() => startEdit(document)}
                      >
                        <p className='truncate font-medium'>{document.title}</p>
                        <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                          {document.summary || t('No summary')}
                        </p>
                      </button>
                      <div className='flex shrink-0 items-center gap-1'>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            document.published
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {document.published ? t('Published') : t('Draft')}
                        </span>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={t('Edit document')}
                          onClick={() => startEdit(document)}
                        >
                          <Edit3 className='size-4' />
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={t('Delete document')}
                          onClick={() => deleteDocument(document.id)}
                        >
                          <Trash2 className='text-destructive size-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {editingId ? (
            <div className='space-y-4 rounded-xl border p-4'>
              <div className='flex items-center justify-between gap-3'>
                <h4 className='font-semibold'>{t('Document editor')}</h4>
                <div className='flex gap-1 rounded-lg border p-1'>
                  <Button
                    size='sm'
                    variant={!preview ? 'secondary' : 'ghost'}
                    onClick={() => setPreview(false)}
                  >
                    <Edit3 className='mr-1.5 size-3.5' />
                    {t('Edit')}
                  </Button>
                  <Button
                    size='sm'
                    variant={preview ? 'secondary' : 'ghost'}
                    onClick={() => setPreview(true)}
                  >
                    <Eye className='mr-1.5 size-3.5' />
                    {t('Preview')}
                  </Button>
                </div>
              </div>
              {preview ? (
                previewView
              ) : (
                <div className='space-y-4'>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Built-in section override')}
                    </span>
                    <select
                      value={editor.sectionId ?? ''}
                      onChange={(event) =>
                        updateEditor('sectionId', event.target.value)
                      }
                      className='bg-background w-full rounded-md border px-3 py-2 text-sm'
                    >
                      <option value=''>{t('Custom document')}</option>
                      {defaultDocSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.title} ({section.id})
                        </option>
                      ))}
                    </select>
                    <span className='text-muted-foreground block text-xs'>
                      {t(
                        'Select a built-in section to append administrator Markdown and override its title and summary.'
                      )}
                    </span>
                  </label>
                  <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]'>
                    <label className='space-y-1.5'>
                      <span className='text-sm font-medium'>{t('Title')}</span>
                      <Input
                        value={editor.title}
                        maxLength={200}
                        onChange={(event) =>
                          updateEditor('title', event.target.value)
                        }
                        placeholder={t('Document title')}
                      />
                    </label>
                    <label className='space-y-1.5'>
                      <span className='text-sm font-medium'>{t('Order')}</span>
                      <Input
                        type='number'
                        min={0}
                        value={editor.order}
                        onChange={(event) =>
                          updateEditor('order', Number(event.target.value) || 0)
                        }
                      />
                    </label>
                  </div>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Eyebrow label')}
                    </span>
                    <Input
                      value={editor.eyebrow ?? ''}
                      maxLength={100}
                      onChange={(event) =>
                        updateEditor('eyebrow', event.target.value)
                      }
                      placeholder={t('Optional small label above the title')}
                    />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>{t('Summary')}</span>
                    <Input
                      value={editor.summary}
                      maxLength={500}
                      onChange={(event) =>
                        updateEditor('summary', event.target.value)
                      }
                      placeholder={t(
                        'Short description shown in the document list'
                      )}
                    />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Markdown content')}
                    </span>
                    <Textarea
                      value={editor.content}
                      onChange={(event) =>
                        updateEditor('content', event.target.value)
                      }
                      className='min-h-80 font-mono text-sm'
                      placeholder={t('Write Markdown content here...')}
                    />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Structured blocks JSON')}
                    </span>
                    <Textarea
                      value={blocksDraft}
                      onChange={(event) => setBlocksDraft(event.target.value)}
                      className='min-h-40 font-mono text-xs'
                      placeholder={t(
                        'Optional JSON blocks for code, images, endpoints, tables, or steps'
                      )}
                    />
                    <span className='text-muted-foreground block text-xs'>
                      {t(
                        'When blocks are provided, they replace Markdown and use the same interactive renderers as the built-in documentation.'
                      )}
                    </span>
                  </label>
                  <SettingsSwitchField
                    checked={editor.published}
                    onCheckedChange={(checked) =>
                      updateEditor('published', checked)
                    }
                    label={t('Publish this document')}
                    description={t(
                      'Only published documents are visible on the public docs page.'
                    )}
                    className='py-0'
                  />
                  <Button onClick={saveDocument}>
                    <Save className='mr-2 size-4' />
                    {t('Save document draft')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='text-muted-foreground flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm'>
              {t('Select a document or add a new one to begin editing.')}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}
