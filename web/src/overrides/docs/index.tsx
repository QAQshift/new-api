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
import { Check, Clipboard, Copy, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'

import { PublicLayout } from '@/components/layout'

// ---------------------------------------------------------------------------
// Branded documentation content with runtime-resolved endpoints.
// ---------------------------------------------------------------------------

// Resolve the public API host at runtime so the docs work in every deployment,
// including local development and reverse-proxy setups.
const SITE =
  typeof window !== 'undefined' && window.location.host
    ? window.location.host
    : 'hub.aflowxai.com'
const OFFICIAL_CODEX_RELEASES =
  'https://github.com/openai/codex/releases/latest'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

function CodeBlock(props: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (await copyText(props.code)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }
  return (
    <div className='overflow-hidden rounded-xl border bg-zinc-950 dark:bg-black/60'>
      {props.title && (
        <div className='border-border/60 flex items-center justify-between border-b px-4 py-2'>
          <span className='font-mono text-xs text-zinc-400'>{props.title}</span>
          <button
            type='button'
            onClick={copy}
            className='flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-100'
          >
            {copied ? (
              <Check className='size-3.5' />
            ) : (
              <Clipboard className='size-3.5' />
            )}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}
      <div className='flex items-start justify-between gap-3 p-4'>
        <pre className='overflow-x-auto text-xs leading-6 text-zinc-100'>
          <code>{props.code}</code>
        </pre>
        {!props.title && (
          <button
            type='button'
            onClick={copy}
            className='shrink-0 text-zinc-500 transition-colors hover:text-zinc-100'
            aria-label='复制'
          >
            {copied ? (
              <Check className='size-4' />
            ) : (
              <Copy className='size-4' />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function CopyRow(props: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (await copyText(props.value)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }
  return (
    <div>
      <p className='text-muted-foreground mb-1 text-sm'>{props.label}</p>
      <div className='bg-muted/50 flex items-center justify-between gap-2 rounded-lg border px-3 py-2'>
        <code className='text-foreground text-sm break-all'>{props.value}</code>
        <button
          type='button'
          onClick={copy}
          className='text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-xs transition-colors'
        >
          {copied ? (
            <Check className='size-3.5' />
          ) : (
            <Copy className='size-3.5' />
          )}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  )
}

function MethodBadge(props: { method: 'GET' | 'POST' }) {
  const cls =
    props.method === 'POST'
      ? 'bg-emerald-500/15 text-emerald-500'
      : 'bg-emerald-500/15 text-emerald-500'
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${cls}`}
    >
      {props.method}
    </span>
  )
}

function EndpointRow(props: {
  method: 'GET' | 'POST'
  path: string
  desc: string
}) {
  return (
    <div className='flex flex-wrap items-center gap-3 border-b py-3 last:border-0'>
      <MethodBadge method={props.method} />
      <code className='text-foreground font-mono text-sm'>{props.path}</code>
      <span className='text-muted-foreground text-sm'>{props.desc}</span>
    </div>
  )
}

function StepCard(props: {
  index: number
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className='rounded-xl border p-5'>
      <div className='text-primary flex items-center gap-3'>
        <span className='bg-primary/10 flex size-7 items-center justify-center rounded-full text-sm font-bold'>
          {props.index}
        </span>
        <h3 className='font-semibold'>{props.title}</h3>
      </div>
      <div className='text-muted-foreground mt-3 space-y-1 text-sm leading-6'>
        {props.children}
      </div>
    </div>
  )
}

function Section(props: {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={props.id}
      className='scroll-mt-24 border-t pt-12 first:border-0 first:pt-0'
    >
      <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
        {props.eyebrow}
      </p>
      <h2 className='mt-2 text-2xl font-semibold tracking-tight md:text-3xl'>
        {props.title}
      </h2>
      {props.description && (
        <p className='text-muted-foreground mt-3 max-w-3xl leading-7'>
          {props.description}
        </p>
      )}
      <div className='mt-6'>{props.children}</div>
    </section>
  )
}

function BlockLink(props: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <a
      href={props.href}
      target={props.external ? '_blank' : undefined}
      rel={props.external ? 'noreferrer' : undefined}
      className='text-primary inline-flex items-center gap-1 hover:underline'
    >
      {props.children}
      {props.external && <ExternalLink className='size-3.5' />}
    </a>
  )
}

const docNav = [
  ['start', '快速开始'],
  ['endpoints', '线路与地址'],
  ['api-key', '创建 API Key'],
  ['cc-switch', 'CC Switch'],
  ['claude-code', 'Claude Code'],
  ['codex-tools', 'Codex 工具下载'],
  ['codex-cli', 'Codex CLI'],
  ['codex-sol-context', 'Sol 105万上下文'],
  ['chatgpt', 'ChatGPT'],
  ['vscode', 'VS Code'],
  ['text-api', '文字模型 API'],
  ['video-overview', '视频 API'],
  ['video-models', '模型参数'],
  ['video-assets', '参考素材'],
  ['video-result', '查询与下载'],
  ['errors', '错误排查'],
] as const

// ---------------------------------------------------------------------------
// CC Switch download platform tabs
// ---------------------------------------------------------------------------
function CCSwitchSection() {
  const [platform, setPlatform] = useState<'windows' | 'macos' | 'linux'>(
    'windows'
  )
  const files = {
    windows: [
      {
        name: 'CC-Switch-v3.19.2-Windows.msi',
        desc: 'Windows x64 安装版 · 推荐',
      },
      {
        name: 'CC-Switch-v3.19.2-Windows-Portable.zip',
        desc: 'Windows x64 绿色版 · 无需安装',
      },
      {
        name: 'CC-Switch-v3.19.2-Windows-arm64.msi',
        desc: 'Windows ARM64 安装版',
      },
    ],
    macos: [
      {
        name: 'CC-Switch-v3.19.2-macOS-universal.dmg',
        desc: 'macOS 通用安装包',
      },
    ],
    linux: [{ name: 'CC-Switch-v3.19.2-Linux.AppImage', desc: 'Linux 图形版' }],
  }
  return (
    <Section
      id='cc-switch'
      eyebrow='CLIENT SETUP'
      title='下载 CC Switch 并一键导入'
      description='第一次接入建议先安装 CC Switch。它可以统一管理 Claude Code、Codex 等工具的 API Key、线路和模型，不需要手动修改多个配置文件。'
    >
      <div className='rounded-xl border p-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='font-semibold'>CC Switch 下载</p>
            <p className='text-muted-foreground text-sm'>v3.19.2</p>
            <p className='text-muted-foreground mt-2 max-w-xl text-sm leading-6'>
              选择你的操作系统。Windows 普通电脑选择 x64 安装版；苹果电脑选择
              macOS 通用安装包。
            </p>
          </div>
          <BlockLink
            href='https://github.com/farion1231/cc-switch/releases/latest'
            external
          >
            查看最新版本
          </BlockLink>
        </div>
        <div className='mt-4 flex gap-2'>
          {(
            [
              ['windows', 'Windows'],
              ['macos', 'macOS'],
              ['linux', 'Linux'],
            ] as const
          ).map(([key, label]) => (
            <button
              type='button'
              key={key}
              onClick={() => setPlatform(key)}
              className={`rounded-lg border px-4 py-1.5 text-sm transition-colors ${
                platform === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'hover:bg-muted/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {files[platform].map((f) => (
            <div key={f.name} className='rounded-lg border p-4'>
              <p className='text-sm font-medium'>{f.desc}</p>
              <p className='text-muted-foreground mt-1 font-mono text-xs break-all'>
                {f.name}
              </p>
              <a
                href='https://github.com/farion1231/cc-switch/releases/latest'
                target='_blank'
                rel='noreferrer'
                className='text-primary mt-3 inline-flex items-center gap-1 text-xs hover:underline'
              >
                <Download className='size-3.5' /> 官方下载
              </a>
            </div>
          ))}
        </div>
        <p className='text-muted-foreground mt-4 text-xs leading-6'>
          下载按钮会打开 CC Switch 官方 GitHub Release 页面。macOS
          首次打开若被系统拦截，请到系统设置的隐私与安全性中允许打开。
        </p>
      </div>

      <h3 className='mt-8 text-lg font-semibold'>安装后从本站一键导入</h3>
      <p className='text-muted-foreground mt-2 leading-7'>
        不需要手抄地址。先创建对应分组的密钥，再从密钥右侧菜单导入到 CC Switch。
      </p>
      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <StepCard index={1} title='安装并打开 CC Switch'>
          <p>完成上方下载和安装，首次启动后保持 CC Switch 在后台运行。</p>
        </StepCard>
        <StepCard index={2} title='创建对应分组密钥'>
          <p>进入 API 密钥页面，选择 Claude、OpenAI 等实际要用的分组。</p>
        </StepCard>
        <StepCard index={3} title='点击 CC Switch 导入'>
          <p>打开密钥右侧应用菜单，选择 CC Switch，浏览器会唤起客户端。</p>
        </StepCard>
        <StepCard index={4} title='勾选工具并应用'>
          <p>勾选 Claude Code、Codex 等目标工具，保存并切换到本站供应商。</p>
        </StepCard>
      </div>
      <ul className='text-muted-foreground mt-4 space-y-1 text-sm'>
        <li>在目标密钥右侧打开应用菜单</li>
        <li>从应用列表选择 CC Switch</li>
        <li className='text-foreground font-medium'>模型必须与密钥分组匹配</li>
      </ul>

      <h3 className='mt-8 text-lg font-semibold'>手动创建配置时怎么填</h3>
      <div className='mt-3 grid gap-3 sm:grid-cols-2'>
        <CopyRow label='CODEX / OPENAI 兼容' value={`https://${SITE}/v1`} />
        <CopyRow label='CLAUDE CODE' value={`https://${SITE}`} />
      </div>
      <p className='text-muted-foreground mt-3 text-sm leading-6'>
        填入本站 API Key
        后获取模型列表，再选择与密钥分组匹配的模型。切换配置后若未生效，关闭并重新打开终端。
      </p>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Codex toolkit download cards
// ---------------------------------------------------------------------------
function CodexToolCard(props: {
  title: string
  build: string
  desc: string
  files: { name: string; size: string; sha: string }[]
}) {
  return (
    <div className='rounded-xl border p-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h4 className='font-semibold'>{props.title}</h4>
        <span className='text-muted-foreground font-mono text-xs'>
          {props.build}
        </span>
      </div>
      <p className='text-muted-foreground mt-2 text-sm leading-6'>
        {props.desc}
      </p>
      <p className='text-muted-foreground mt-2 text-xs'>
        下面列出的平台名称仅用于快速定位，实际文件名、版本和校验值请以官方
        Release 页面为准。
      </p>
      <div className='mt-4 space-y-3'>
        {props.files.map((f) => (
          <div key={f.name} className='rounded-lg border p-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-foreground text-sm font-medium'>
                {f.name}
              </span>
              <span className='text-muted-foreground text-xs'>
                官方页面提供
              </span>
            </div>
            <div className='text-muted-foreground mt-1 flex items-center gap-2'>
              <code className='font-mono text-[11px] break-all'>
                SHA-256（请以官方 Release 页面为准）
              </code>
            </div>
            <a
              href={OFFICIAL_CODEX_RELEASES}
              target='_blank'
              rel='noreferrer'
              className='text-primary mt-2 inline-flex items-center gap-1 text-xs hover:underline'
            >
              <Download className='size-3.5' /> 官方发布页
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function CodexToolsSection() {
  return (
    <Section
      id='codex-tools'
      eyebrow='CODEX TOOLKIT'
      title='Codex 安装器与聊天记录迁移器'
      description='适合需要快速初始化 Codex 环境或迁移已有聊天记录的用户。下载按钮会打开 OpenAI Codex 官方 GitHub Release 页面。'
    >
      <div className='grid gap-4 lg:grid-cols-2'>
        <CodexToolCard
          title='Codex 一键安装器'
          build='build-65-1-995cbc0'
          desc='用于辅助初始化 Codex 运行环境。安装完成后，仍需在 CC Switch 中导入本站 API Key 与线路。'
          files={[
            {
              name: 'codex-installer-windows-x64.exe',
              size: '152.3 MB',
              sha: '46b195a0bd0ba6e38242d93f433651eecd6dee852be30f560af17222d94e4012',
            },
            {
              name: 'codex-installer-macos-universal2.dmg',
              size: '5.0 MB',
              sha: 'cca61827189da7d45b1ce14bf21c54206aea2f586ae57263d951b4a998bf50a9',
            },
          ]}
        />
        <CodexToolCard
          title='Codex 聊天记录迁移器'
          build='build-27140614657-3-99a5c13'
          desc='用于迁移已有 Codex 聊天记录，不负责配置 API 线路。普通用户优先选择 Windows、macOS 或 Linux 图形版。'
          files={[
            {
              name: 'codex-chat-migrator-windows-x64.zip',
              size: '12.4 MB',
              sha: '4468987b681aed60f3cfcf8edc1d81060a8a6ae42a53723cf587b8b3146dc3a4',
            },
            {
              name: 'codex-chat-migrator-macos-universal2.zip',
              size: '68.7 MB',
              sha: 'a32e0acf386680560865ce706a1084443d4c21d85c3207f21c80208473d175a5',
            },
            {
              name: 'codex-chat-migrator-linux-x64-gui.tar.gz',
              size: '22.4 MB',
              sha: '54edd1e50b808b6d442bfec08d3f145dfd76ea96c0549eb28bed0970239ff32a',
            },
            {
              name: 'codex-chat-migrator-linux-x64-cli.tar.gz',
              size: '17.9 MB',
              sha: 'e87a3bc13cb6017bfe8f13ddecb645f017902cadfb173a7f2fe553caa9956243',
            },
          ]}
        />
      </div>
      <p className='text-muted-foreground mt-4 text-xs leading-6'>
        上述文件和校验值来自公开发布信息，本站不托管安装包。下载前请在官方
        Release 页面核对版本与 SHA-256；迁移前请先备份现有 Codex 数据。
      </p>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Video model parameter cards
// ---------------------------------------------------------------------------
function ModelCard(props: {
  name: string
  vendor: string
  rows: [string, string][]
}) {
  return (
    <div className='rounded-xl border p-5'>
      <div className='flex items-baseline justify-between gap-2'>
        <h4 className='font-mono text-base font-semibold'>{props.name}</h4>
        <span className='text-muted-foreground text-xs'>{props.vendor}</span>
      </div>
      <dl className='mt-3 space-y-2 text-sm'>
        {props.rows.map(([k, v]) => (
          <div
            key={k}
            className='flex justify-between gap-4 border-b pb-2 last:border-0'
          >
            <dt className='text-muted-foreground shrink-0'>{k}</dt>
            <dd className='text-right'>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function VideoModelsSection() {
  const models: [string, string, [string, string][]][] = [
    [
      'Seedance-2.0',
      'ByteDance 视频模型',
      [
        ['时长', '4-15 秒'],
        ['清晰度', '480p / 720p / 1080p / 4K'],
        ['画面比例', '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / Auto'],
        ['参考素材', '最多 9 图、3 视频、3 音频，合计不超过 12 个'],
        ['计费', '按输出秒数和清晰度计费'],
      ],
    ],
    [
      'Seedance-2.5',
      'ByteDance 视频模型',
      [
        ['时长', '4-30 秒'],
        ['清晰度', '480p / 720p'],
        ['画面比例', '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / Auto'],
        ['参考素材', '最多 30 图、10 视频、10 音频，合计不超过 50 个'],
        ['计费', '按输出秒数、清晰度和参考视频输入时长计费'],
      ],
    ],
    [
      'minimax-h3',
      'miniMax 视频模型',
      [
        ['时长', '4-15 秒'],
        ['清晰度', '768p / 2k'],
        ['画面比例', '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16'],
        ['参考素材', '最多 9 图、3 视频、3 音频，合计不超过 12 个'],
        ['计费', '按输出秒数和清晰度计费'],
      ],
    ],
    [
      'minimax-h3-vip',
      'miniMax三方视频模型',
      [
        ['时长', '5-15 秒'],
        ['清晰度', '720p / 2K'],
        ['画面比例', 'auto / 1:1 / 16:9 / 9:16 / 3:4 / 4:3 / 21:9'],
        [
          '参考素材',
          '最多 5 张图片、1 个音频，不支持视频参考；音频必须搭配图片',
        ],
        ['计费', '按清晰度固定按次计费，输出固定带音频'],
      ],
    ],
    [
      'grok-video',
      'Grok',
      [
        ['时长', '1-15 秒'],
        ['清晰度', '480p / 720p'],
        ['画面比例', '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16'],
        ['参考素材', '支持文生视频或 1 张参考图'],
        ['计费', '以当前控制台实时价格为准'],
      ],
    ],
    [
      'grok-video-1.5',
      'Grok',
      [
        ['时长', '1-15 秒'],
        ['清晰度', '1080p'],
        ['画面比例', '21:9 / 16:9 / 4:3 / 1:1 / 3:4 / 9:16'],
        ['参考素材', '最多 7 张参考图；1080p 最多 1 张'],
        ['计费', '以当前控制台实时价格为准'],
      ],
    ],
  ]
  return (
    <Section
      id='video-models'
      eyebrow='MODEL MATRIX'
      title='视频模型与参数范围'
      description='以下是常见模型的示例参数范围，便于理解请求结构。实际可用模型、参数和价格以当前控制台模型列表及分组配置为准；Seedance / MiniMax 首次建议 4 秒低清晰度，Grok 可从 1 秒开始测试。'
    >
      <div className='grid gap-4 md:grid-cols-2'>
        {models.map(([name, vendor, rows]) => (
          <ModelCard key={name} name={name} vendor={vendor} rows={rows} />
        ))}
      </div>

      <h3 className='mt-8 text-lg font-semibold'>请求字段说明</h3>
      <div className='mt-3 overflow-x-auto rounded-xl border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-muted-foreground'>
            <tr>
              <th className='px-4 py-2 text-left font-medium'>字段</th>
              <th className='px-4 py-2 text-left font-medium'>类型</th>
              <th className='px-4 py-2 text-left font-medium'>要求</th>
              <th className='px-4 py-2 text-left font-medium'>说明</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'model',
                'string',
                '必填',
                '模型名称，必须与所选视频分组支持的模型一致',
              ],
              [
                'prompt',
                'string',
                '必填',
                '视频描述；参考素材可在提示词中使用 @图1、@视频1、@音频1',
              ],
              ['ratio', 'string', '可选', '画面比例；首尾帧模式传 Auto'],
              [
                'duration',
                'integer',
                '可选',
                '输出视频秒数，必须在对应模型范围内',
              ],
              [
                'resolution',
                'string',
                '可选',
                '清晰度，必须使用对应模型支持的档位',
              ],
              [
                'aspect_ratio',
                'string',
                'Grok 可选',
                'Grok 视频模型使用的画面比例字段',
              ],
              [
                'images',
                'string[]',
                'Grok 可选',
                'Grok 图生视频使用的公网 HTTPS 图片 URL 数组',
              ],
              ['first_image', 'string', '可选', '首帧图片的公开 HTTPS URL'],
              ['last_image', 'string', '可选', '尾帧图片的公开 HTTPS URL'],
              [
                'referenceImages',
                'string[]',
                '可选',
                '参考图片的公开 HTTPS URL 数组',
              ],
              [
                'referenceVideos',
                'string[]',
                '可选',
                '参考视频的公开 HTTPS URL 数组',
              ],
              [
                'referenceAudios',
                'string[]',
                '可选',
                '参考音频的公开 HTTPS URL 数组',
              ],
            ].map((row) => (
              <tr key={row[0]} className='border-t'>
                <td className='px-4 py-2 font-mono text-xs'>{row[0]}</td>
                <td className='px-4 py-2 font-mono text-xs'>{row[1]}</td>
                <td className='px-4 py-2'>{row[2]}</td>
                <td className='text-muted-foreground px-4 py-2'>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function ErrorCard(props: { code: string; title: string; text: string }) {
  return (
    <div className='rounded-xl border p-5'>
      <div className='flex items-center gap-3'>
        <span className='rounded bg-rose-500/15 px-2 py-0.5 font-mono text-sm font-semibold text-rose-500'>
          {props.code}
        </span>
        <h4 className='font-semibold'>{props.title}</h4>
      </div>
      <p className='text-muted-foreground mt-3 text-sm leading-6'>
        {props.text}
      </p>
    </div>
  )
}

export function Docs() {
  return (
    <PublicLayout showMainContainer={false}>
      <div className='mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]'>
        <aside className='lg:sticky lg:top-20 lg:h-fit'>
          <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.16em] uppercase'>
            本页目录
          </p>
          <nav className='space-y-1'>
            {docNav.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className='text-muted-foreground hover:text-foreground hover:bg-muted/60 block rounded-lg px-3 py-1.5 text-sm transition-colors'
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <main className='min-w-0 space-y-12'>
          {/* 1. Getting started */}
          <Section
            id='start'
            eyebrow='GETTING STARTED'
            title='五分钟完成首次调用'
            description='普通用户推荐使用 CC Switch 一键配置；开发者可以直接复制接口示例。一个分组使用一个 Key 即可，多建 Key 不会增加并发。'
          >
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <StepCard index={1} title='下载 CC Switch'>
                <p>
                  按 Windows、macOS 或 Linux 下载并安装，打开后保持后台运行。
                </p>
                <BlockLink href='#cc-switch'>前往下载</BlockLink>
              </StepCard>
              <StepCard index={2} title='创建 API Key'>
                <p>进入 API 密钥页面，选择要使用的模型分组并创建密钥。</p>
              </StepCard>
              <StepCard index={3} title='一键导入配置'>
                <p>
                  在密钥右侧选择 CC Switch，勾选 Claude Code、Codex 等目标工具。
                </p>
              </StepCard>
              <StepCard index={4} title='发送最小测试'>
                <p>文字先发一条短消息，视频先用 480p、4 秒验证密钥和参数。</p>
              </StepCard>
            </div>
          </Section>

          {/* 2. Endpoints */}
          <Section
            id='endpoints'
            eyebrow='ENDPOINTS'
            title='线路与请求地址'
            description='OpenAI 兼容客户端填写带 /v1 的地址；Claude Code 填根域名，不要在末尾增加 /v1。'
          >
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='rounded-xl border p-5'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold'>主线路</h3>
                  <span className='bg-primary/10 text-primary rounded px-2 py-0.5 text-xs'>
                    默认推荐
                  </span>
                </div>
                <p className='text-muted-foreground mt-2 text-sm'>
                  回国加速，适合国内客户端和日常调用
                </p>
                <div className='mt-4 space-y-3'>
                  <CopyRow label='OpenAI 兼容' value={`https://${SITE}/v1`} />
                  <CopyRow label='Claude Code' value={`https://${SITE}`} />
                </div>
              </div>
              <div className='rounded-xl border p-5 md:col-span-2'>
                <h3 className='font-semibold'>线路说明</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  文档会根据当前浏览器地址自动生成主线路。若管理员配置了备用域名，请以控制台公告为准，避免使用已失效的旧线路。
                </p>
              </div>
            </div>
          </Section>

          {/* 3. Authentication */}
          <Section
            id='api-key'
            eyebrow='AUTHENTICATION'
            title='创建并使用 API Key'
            description='所有 API 请求都需要鉴权。密钥只展示给本人，不要放进前端代码、公开仓库或截图。'
          >
            <div className='grid gap-4 sm:grid-cols-2'>
              <StepCard index={1} title='进入 API 密钥'>
                <p>在控制台打开 API 密钥页面，点击创建密钥。</p>
              </StepCard>
              <StepCard index={2} title='选择分组'>
                <p>文字、Claude 与视频分组权限不同，按目标模型选择。</p>
              </StepCard>
              <StepCard index={3} title='保存并复制'>
                <p>复制完整 sk- 密钥，配置到客户端或 Authorization Header。</p>
              </StepCard>
              <StepCard index={4} title='不要重复创建'>
                <p>同一分组一个密钥即可；并发能力由分组和上游决定。</p>
              </StepCard>
            </div>
            <div className='mt-6'>
              <p className='mb-1 text-sm font-medium'>标准鉴权 Header</p>
              <CodeBlock code='Authorization: Bearer sk-你的API密钥' />
              <p className='text-muted-foreground mt-2 text-sm'>
                点击密钥右侧复制按钮获取完整 API Key
              </p>
            </div>
          </Section>

          {/* 4. CC Switch */}
          <CCSwitchSection />

          {/* 5. Claude Code */}
          <Section
            id='claude-code'
            eyebrow='CLAUDE CODE'
            title='Claude Code 安装与配置'
            description='Claude Code 是 Anthropic 的命令行编程工具。先安装客户端，再使用 CC Switch 一键导入；也可以手动配置环境变量。'
          >
            <div className='grid gap-4 sm:grid-cols-3'>
              <CodeBlock
                code='curl -fsSL https://claude.ai/install.sh | bash'
                title='macOS / Linux'
              />
              <CodeBlock
                code='brew install --cask claude-code'
                title='macOS Homebrew'
              />
              <CodeBlock
                code='irm https://claude.ai/install.ps1 | iex'
                title='Windows PowerShell'
              />
            </div>
            <BlockLink
              href='https://docs.anthropic.com/en/docs/claude-code/overview'
              external
            >
              Claude Code 官方文档
            </BlockLink>
            <p className='text-muted-foreground mt-3 text-sm'>
              查看最新安装要求、更新方式和系统支持情况。
            </p>

            <h3 className='mt-8 text-lg font-semibold'>
              推荐：使用 CC Switch 配置
            </h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              安装完成后返回上方，一键导入密钥、主线路和模型。
            </p>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <StepCard index={1} title='检查安装'>
                <CodeBlock code='claude --version' />
              </StepCard>
              <StepCard index={2} title='启动并验证'>
                <CodeBlock code='claude' />
                <p>输入一条测试消息，能正常回复即配置成功。</p>
              </StepCard>
            </div>
            <p className='text-muted-foreground mt-4 text-sm'>
              Windows 请在系统环境变量中添加相同变量；修改后重新打开终端。
            </p>
            <CodeBlock
              code={`# macOS / Linux
export ANTHROPIC_BASE_URL="https://${SITE}"
export ANTHROPIC_AUTH_TOKEN="sk-你的API密钥"

# 启动 Claude Code
claude`}
            />
            <p className='text-muted-foreground mt-3 text-sm font-medium'>
              Claude Code 的 Base URL 必须填写根域名 https://<code>{SITE}</code>
              ，不要添加/v1。
            </p>
          </Section>

          {/* 6. Codex toolkit */}
          <CodexToolsSection />

          {/* 7. Codex CLI */}
          <Section
            id='codex-cli'
            eyebrow='OPENAI CODEX'
            title='Codex CLI 下载与接入'
            description='Codex CLI 是 OpenAI 的命令行编程工具。需要 Node.js 和 npm；安装后建议通过 CC Switch 导入本站 OpenAI 分组配置。'
          >
            <BlockLink href='https://nodejs.org/en/download/' external>
              先安装 Node.js
            </BlockLink>
            <p className='text-muted-foreground mt-2 text-sm'>
              尚未安装 npm 的用户，先从 Node.js 官方下载 LTS 版本。
            </p>
            <BlockLink href='https://developers.openai.com/codex/cli/' external>
              Codex CLI 官方文档
            </BlockLink>
            <p className='text-muted-foreground mt-2 text-sm'>
              查看 OpenAI 官方安装、更新和使用说明。
            </p>
            <h3 className='mt-8 text-lg font-semibold'>安装后导入本站配置</h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              在 CC Switch 中勾选 Codex，OpenAI Base URL 使用 {SITE}/v1。
            </p>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <CodeBlock
                code={`# 使用 npm 安装（Windows / macOS / Linux）
npm install -g @openai/codex

# macOS 也可以使用 Homebrew
brew install --cask codex`}
              />
              <CodeBlock
                code={`# 检查并启动
codex --version
codex`}
              />
            </div>
          </Section>

          {/* 8. GPT-5.6 Sol 1M context */}
          <Section
            id='codex-sol-context'
            eyebrow='GPT-5.6 SOL'
            title='Codex 原生支持 105 万上下文'
            description='GPT-5.6 Sol 原生支持 105 万 token 上下文，现在直接把 Codex 上下文拉满。'
          >
            <p className='text-muted-foreground'>
              保存后重启 Codex，新会话直接起飞
            </p>
            <p className='mt-3 text-sm'>
              修改 ~/.codex/config.toml 后保存并重启 Codex，新会话即可使用 105
              万 token 上下文；临时测试可以用右侧命令直接启动。
            </p>
            <div className='mt-4 grid gap-4 lg:grid-cols-2'>
              <CodeBlock
                code={`# 打开 ~/.codex/config.toml，顶部加上这三行
model = "gpt-5.6-sol"
model_context_window = 1000000
model_auto_compact_token_limit = 900000`}
              />
              <CodeBlock
                code={`# 临时测试用这条命令
codex -m gpt-5.6-sol -c model_context_window=1000000 -c model_auto_compact_token_limit=900000`}
              />
            </div>
          </Section>

          {/* 9. ChatGPT app */}
          <Section
            id='chatgpt'
            eyebrow='CHATGPT APP'
            title='ChatGPT 官方客户端'
            description='需要使用 ChatGPT 网页版或官方桌面、手机客户端时，从官方入口下载，避免安装第三方仿冒软件。'
          >
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>ChatGPT 网页版</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  无需安装，浏览器打开后使用 OpenAI 账号登录。
                </p>
                <BlockLink href='https://chatgpt.com/' external>
                  ChatGPT 网页版
                </BlockLink>
              </div>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>ChatGPT 官方下载页</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  提供 macOS、Windows、iOS 和 Android 官方客户端入口。
                </p>
                <BlockLink href='https://openai.com/chatgpt/download/' external>
                  ChatGPT 官方下载页
                </BlockLink>
              </div>
            </div>
            <p className='text-muted-foreground mt-4 text-sm leading-6'>
              官方 ChatGPT 应用搭配 CC Switch 工具，在里面配置好本站的 Base URL
              和 API Key 后即可正常使用本站 API。
            </p>
          </Section>

          {/* 10. VS Code */}
          <Section
            id='vscode'
            eyebrow='VS CODE'
            title='VS Code 与 AI 扩展'
            description='习惯在编辑器里使用 AI 的用户，可以先安装 VS Code，再安装 OpenAI Codex 或 Anthropic Claude Code 扩展。'
          >
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>下载 Visual Studio Code</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  官方页面会根据 Windows、macOS 或 Linux 提供对应安装包。
                </p>
                <BlockLink
                  href='https://code.visualstudio.com/Download'
                  external
                >
                  下载 Visual Studio Code
                </BlockLink>
              </div>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>OpenAI Codex 扩展</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  在 VS Code 扩展市场查看并安装 OpenAI 官方扩展。
                </p>
                <BlockLink
                  href='https://marketplace.visualstudio.com/items?itemName=OpenAI.chatgpt'
                  external
                >
                  OpenAI Codex 扩展
                </BlockLink>
              </div>
            </div>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>Anthropic Claude Code 扩展</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  在 VS Code 扩展市场查看并安装 Anthropic 官方扩展。
                </p>
                <BlockLink
                  href='https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code'
                  external
                >
                  Anthropic Claude Code 扩展
                </BlockLink>
              </div>
              <CodeBlock
                code={`# OpenAI Codex 扩展
code --install-extension OpenAI.chatgpt

# Anthropic Claude Code 扩展
code --install-extension Anthropic.claude-code`}
              />
            </div>
            <p className='text-muted-foreground mt-4 text-sm leading-6'>
              扩展安装完成后，先确认 CC Switch 已选中本站配置，再重启 VS Code
              并发送一条短消息验证连接。
            </p>
          </Section>

          {/* 11. Text models */}
          <Section
            id='text-api'
            eyebrow='TEXT MODELS'
            title='文字模型 API'
            description='本站同时兼容 OpenAI Chat Completions、Responses API 与 Anthropic Messages。模型名称以模型广场和所选分组为准。'
          >
            <h3 className='text-lg font-semibold'>Chat Completions</h3>
            <p className='text-muted-foreground mt-2 text-sm'>
              适合大多数 OpenAI 兼容客户端与现有 SDK。
            </p>
            <div className='mt-3'>
              <CodeBlock
                code={`curl https://${SITE}/v1/chat/completions \\
  -H "Authorization: Bearer sk-你的API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.6-sol",
    "messages": [
      {"role": "user", "content": "请用一句话介绍你自己"}
    ],
    "stream": true
  }'`}
              />
            </div>

            <h3 className='mt-8 text-lg font-semibold'>Responses API</h3>
            <p className='text-muted-foreground mt-2 text-sm'>
              适合 Codex、新版 OpenAI SDK 与长上下文调用。
            </p>
            <div className='mt-3'>
              <CodeBlock
                code={`curl https://${SITE}/v1/responses \\
  -H "Authorization: Bearer sk-你的API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.6-sol",
    "input": "分析这段文本并给出三个要点",
    "stream": true
  }'`}
              />
            </div>

            <h3 className='mt-8 text-lg font-semibold'>Anthropic Messages</h3>
            <p className='text-muted-foreground mt-2 text-sm'>
              使用 Claude 分组密钥，客户端 Base URL 填根域名。
            </p>
            <div className='mt-3'>
              <CodeBlock
                code={`curl https://${SITE}/v1/messages \\
  -H "x-api-key: sk-你的API密钥" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-opus-4-8",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "你好，请用中文回复"}
    ]
  }'`}
              />
            </div>
          </Section>

          {/* 12. Video overview */}
          <Section
            id='video-overview'
            eyebrow='VIDEO API'
            title='创建视频任务'
            description='视频生成为异步任务。提交成功会返回 task_id；创建接口返回后，使用查询接口轮询状态。'
          >
            <div className='rounded-xl border px-4 py-2'>
              <EndpointRow method='POST' path='/v1/videos' desc='创建任务' />
              <EndpointRow
                method='GET'
                path='/v1/videos/{task_id}'
                desc='查询状态'
              />
              <EndpointRow
                method='GET'
                path='/v1/videos/{task_id}/content'
                desc='播放或下载'
              />
            </div>
            <div className='mt-4'>
              <CodeBlock
                code={`curl https://${SITE}/v1/videos \\
  -H "Authorization: Bearer sk-你的视频分组API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Seedance-2.0",
    "prompt": "电影感产品特写，镜头缓慢环绕，光线自然",
    "ratio": "16:9",
    "duration": 5,
    "resolution": "720p"
  }'`}
              />
              <CodeBlock
                code={`curl https://${SITE}/v1/videos \\
  -H "Authorization: Bearer sk-你的Grok分组API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "grok-video-1.5",
    "prompt": "电影感城市夜景，镜头缓慢推进，光影自然",
    "duration": 5,
    "resolution": "1080p",
    "aspect_ratio": "16:9",
    "images": []
  }'`}
              />
            </div>
            <p className='text-muted-foreground mt-4 text-sm leading-6'>
              Seedance 与 MiniMax 请求使用对应视频分组密钥；Grok 视频请求使用
              Grok 分组密钥。分组与模型不匹配时无法调用。
            </p>
          </Section>

          {/* 13. Video models + params */}
          <VideoModelsSection />

          {/* 14. Reference assets */}
          <Section
            id='video-assets'
            eyebrow='REFERENCE ASSETS'
            title='图片、视频与音频素材'
            description='参考素材必须是上游能够直接访问的公网 HTTPS URL。需要登录、临时 blob:、本地 file: 或带防盗链的地址无法使用。'
          >
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>首尾帧</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  使用 first_image，可选 last_image；ratio 固定传 Auto。
                </p>
              </div>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>全能参考</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  使用 referenceImages、referenceVideos、referenceAudios 数组。
                </p>
              </div>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>素材可访问性</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  提交前在无登录浏览器中打开 URL，确认可以直接下载文件。
                </p>
              </div>
              <div className='rounded-xl border p-5'>
                <h4 className='font-semibold'>素材计费</h4>
                <p className='text-muted-foreground mt-2 text-sm'>
                  参考视频输入时长会参与最终计费，请预留足够额度。
                </p>
              </div>
            </div>
            <div className='mt-4'>
              <CodeBlock
                code={`curl https://${SITE}/v1/videos \\
  -H "Authorization: Bearer sk-你的视频分组API密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "Seedance-2.5",
    "prompt": "@图1 中的人物向镜头挥手，动作参考 @视频1",
    "ratio": "16:9",
    "duration": 6,
    "resolution": "480p",
    "referenceImages": ["https://example.com/reference.jpg"],
    "referenceVideos": ["https://example.com/motion.mp4"]
  }'`}
              />
            </div>
          </Section>

          {/* 15. Task lifecycle */}
          <Section
            id='video-result'
            eyebrow='TASK LIFECYCLE'
            title='查询、播放与下载'
            description='提交接口只负责创建任务。请保存 task_id，间隔 3-5 秒查询一次；完成后通过 content 接口获取真实 MP4。'
          >
            <CodeBlock
              code={`# 查询任务状态
curl https://${SITE}/v1/videos/task_xxx \\
  -H "Authorization: Bearer sk-你的视频分组API密钥"

# 任务完成后下载视频
curl -L https://${SITE}/v1/videos/task_xxx/content \\
  -H "Authorization: Bearer sk-你的视频分组API密钥" \\
  -o result.mp4`}
            />
            <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='rounded-lg border p-3'>
                <p className='font-mono text-sm font-semibold'>queued</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  任务已进入队列，继续等待
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='font-mono text-sm font-semibold'>in_progress</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  正在生成，保持轮询
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='font-mono text-sm font-semibold'>completed</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  生成完成，可以播放或下载
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='font-mono text-sm font-semibold'>failed</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  读取失败原因，修正后重新创建
                </p>
              </div>
            </div>
          </Section>

          {/* 16. Troubleshooting */}
          <Section
            id='errors'
            eyebrow='TROUBLESHOOTING'
            title='常见错误排查'
            description='先根据 HTTP 状态码定位问题。视频任务若已返回 task_id，不要重复提交创建请求。'
          >
            <div className='grid gap-4 sm:grid-cols-2'>
              <ErrorCard
                code='401'
                title='API Key 无效或分组不匹配'
                text='重新复制完整密钥，确认视频请求使用视频模型分组创建的 Key。'
              />
              <ErrorCard
                code='403'
                title='预扣费额度不足'
                text='视频任务会按所选模型、清晰度和计费方式预扣费。降低清晰度，或补充钱包/套餐额度后重试。'
              />
              <ErrorCard
                code='404'
                title='接口路径或模型名称错误'
                text='OpenAI 地址需要 /v1；视频模型名称区分大小写，请直接复制本文档名称。'
              />
              <ErrorCard
                code='422'
                title='请求参数不符合模型范围'
                text='检查 duration、resolution、ratio 与参考素材数量是否符合所选模型。'
              />
              <ErrorCard
                code='502/503/504'
                title='上游繁忙或任务暂时不可用'
                text='保留 task_id，稍后查询；创建失败且没有 task_id 时再重新提交，避免重复计费。'
              />
            </div>
          </Section>
        </main>
      </div>
    </PublicLayout>
  )
}
