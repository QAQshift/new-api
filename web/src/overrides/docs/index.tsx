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
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Code2,
  Gauge,
  Globe2,
  KeyRound,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'

const navigation = [
  { id: 'overview', label: 'Overview' },
  { id: 'models', label: 'Models and Billing' },
  { id: 'network', label: 'Network' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'agents', label: 'Agent Ready' },
  { id: 'faq', label: 'FAQ' },
] as const

const quickstartCode = `curl https://your-domain.example/v1/chat/completions \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'`

const networkMeta = [
  'One API key per project',
  'Intelligent scheduling',
  'Healthy provider',
] as const

function CodeBlock(props: { code: string; title: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(props.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className='glass-panel overflow-hidden rounded-2xl border'>
      <div className='border-border/60 flex items-center justify-between border-b px-4 py-3'>
        <span className='text-muted-foreground font-mono text-xs'>
          {props.title}
        </span>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 gap-1.5'
          onClick={copy}
        >
          {copied ? (
            <Check className='size-3.5' />
          ) : (
            <Clipboard className='size-3.5' />
          )}
          {copied ? t('Copied') : t('Copy')}
        </Button>
      </div>
      <pre className='overflow-x-auto p-5 text-xs leading-6'>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}

function SectionHeading(props: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className='max-w-2xl'>
      <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
        {props.eyebrow}
      </p>
      <h2 className='mt-3 text-3xl font-semibold tracking-tight md:text-4xl'>
        {props.title}
      </h2>
      <p className='text-muted-foreground mt-4 leading-7'>
        {props.description}
      </p>
    </div>
  )
}

export function Docs() {
  const { t } = useTranslation()
  const requestCode = quickstartCode.replace(
    'https://your-domain.example',
    typeof window === 'undefined'
      ? 'https://your-domain.example'
      : window.location.origin
  )

  return (
    <PublicLayout showMainContainer={false}>
      <div className='min-h-svh border-t'>
        <header className='relative overflow-hidden border-b px-6 pt-28 pb-16 md:px-10 md:pt-40 md:pb-24'>
          <div className='bg-primary/[0.035] dark:bg-primary/[0.06] pointer-events-none absolute inset-0 -z-10' />
          <div className='mx-auto max-w-6xl'>
            <div className='text-primary flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase'>
              <BookIcon /> {t('Developer documentation')}
            </div>
            <h1 className='mt-5 max-w-4xl text-5xl leading-[1.04] font-semibold tracking-tight md:text-7xl'>
              {t('Mainstream AI model APIs')}{' '}
              <span className='text-muted-foreground'>
                {t('at a fraction of the cost')}
              </span>
            </h1>
            <p className='text-muted-foreground mt-6 max-w-2xl text-lg leading-8'>
              {t('Stable relay · clear billing · unified multi-model access')}
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Button
                size='lg'
                className='rounded-xl'
                render={<a href='#quickstart' />}
              >
                {t('Start building')} <ArrowRight className='ml-2 size-4' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='rounded-xl'
                render={<a href='#models' />}
              >
                {t('Browse models')} <ChevronRight className='ml-2 size-4' />
              </Button>
            </div>
          </div>
        </header>

        <div className='mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[190px_minmax(0,1fr)] md:px-10 md:py-16'>
          <aside className='md:sticky md:top-24 md:h-fit'>
            <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.16em] uppercase'>
              {t('On this page')}
            </p>
            <nav aria-label={t('Documentation sections')} className='space-y-1'>
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className='text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors'
                >
                  {t(item.label)} <ChevronRight className='size-3.5' />
                </a>
              ))}
            </nav>
          </aside>

          <main className='min-w-0 space-y-28'>
            <section id='overview' className='scroll-mt-24 space-y-8'>
              <SectionHeading
                eyebrow={t('Model relay · unified access')}
                title={t('Unified model access')}
                description={t(
                  'Connect existing applications with minimal changes. Keep the same SDK, key, and request format while the gateway handles routing and observability.'
                )}
              />
              <div className='grid gap-4 sm:grid-cols-3'>
                {[
                  {
                    icon: Gauge,
                    title: 'Unified model access',
                    text: 'One integration gives your application access to the configured model groups.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Clear usage tracking',
                    text: 'Review model, token, latency, and deduction details in one console.',
                  },
                  {
                    icon: Code2,
                    title: 'Stable API relay',
                    text: 'Health checks and intelligent scheduling keep important requests moving.',
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <article
                      key={item.title}
                      className='glass-panel rounded-2xl border p-5'
                    >
                      <Icon className='text-primary size-5' />
                      <h3 className='mt-5 font-semibold'>{t(item.title)}</h3>
                      <p className='text-muted-foreground mt-2 text-sm leading-6'>
                        {t(item.text)}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>

            <section id='models' className='scroll-mt-24 space-y-8'>
              <SectionHeading
                eyebrow={t('Models and Billing')}
                title={t('Top models online, with transparent billing.')}
                description={t(
                  'See available models, rate rules, and best-fit scenarios at a glance. The console remains authoritative for current availability and billing.'
                )}
              />
              <div className='grid gap-4 md:grid-cols-2'>
                {[
                  {
                    name: 'GPT-5.6',
                    tag: '1× rate',
                    description:
                      'Excels at agentic coding, terminal automation, toolchain orchestration, and multi-step development workflows.',
                    color: 'bg-emerald-500',
                  },
                  {
                    name: 'Claude',
                    tag: '2× rate',
                    description:
                      'Strong at deep understanding of large codebases, complex refactoring, long-text analysis, and stable output.',
                    color: 'bg-orange-500',
                  },
                  {
                    name: 'Gemini',
                    tag: 'Multimodal',
                    description:
                      'Flexible multimodal reasoning for text, images, documents, and fast experiments.',
                    color: 'bg-blue-500',
                  },
                  {
                    name: 'Claude models / Kiro channel',
                    tag: '2× rate',
                    description:
                      'Designed for Claude Code, project refactoring, and long-text analysis.',
                    color: 'bg-violet-500',
                  },
                ].map((model) => (
                  <article
                    key={model.name}
                    className='glass-panel rounded-2xl border p-6'
                  >
                    <div className='flex items-center gap-3'>
                      <span className={`${model.color} size-3 rounded-full`} />
                      <h3 className='font-semibold'>{model.name}</h3>
                      <span className='text-muted-foreground ml-auto text-xs'>
                        {t(model.tag)}
                      </span>
                    </div>
                    <p className='text-muted-foreground mt-4 text-sm leading-6'>
                      {t(model.description)}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id='network' className='scroll-mt-24 space-y-8'>
              <SectionHeading
                eyebrow={t('Network')}
                title={t('One primary API, two backup routes')}
                description={t(
                  'Regional nodes, health checks, and intelligent scheduling work together to find a healthy path for each request.'
                )}
              />
              <div className='glass-panel relative overflow-hidden rounded-2xl border p-6 md:p-8'>
                <div className='bg-primary/[0.025] absolute inset-0 -z-10' />
                <div className='grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center'>
                  {[
                    { icon: KeyRound, title: 'Your application' },
                    { icon: Network, title: 'Intelligent scheduling' },
                    { icon: Globe2, title: 'Healthy provider' },
                  ].map((node, index) => {
                    const Icon = node.icon
                    return (
                      <div key={node.title} className='flex items-center gap-4'>
                        <div className='bg-background/75 flex size-12 shrink-0 items-center justify-center rounded-xl border'>
                          <Icon className='text-primary size-5' />
                        </div>
                        <div>
                          <p className='font-medium'>{t(node.title)}</p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {t(networkMeta[index])}
                          </p>
                        </div>
                        {index < 2 && (
                          <ArrowRight className='text-muted-foreground mx-auto hidden size-5 md:block' />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <section id='quickstart' className='scroll-mt-24 space-y-8'>
              <SectionHeading
                eyebrow={t('Quickstart')}
                title={t('Get started now — go live with a few lines of code')}
                description={t(
                  'Register, create an API Key, replace BASE_URL, and send your first request in minutes.'
                )}
              />
              <div className='grid gap-4 sm:grid-cols-3'>
                {[
                  'Sign up and open the console',
                  'Create a project token',
                  'Copy the full API address and you are ready.',
                ].map((step, index) => (
                  <div
                    key={step}
                    className='glass-panel rounded-2xl border p-5'
                  >
                    <span className='text-primary text-sm font-bold'>
                      0{index + 1}
                    </span>
                    <p className='mt-4 text-sm leading-6'>{t(step)}</p>
                  </div>
                ))}
              </div>
              <CodeBlock
                code={requestCode}
                title={t('OpenAI-compatible request')}
              />
            </section>

            <section id='agents' className='scroll-mt-24 space-y-8'>
              <SectionHeading
                eyebrow={t('Agent Ready')}
                title={t(
                  'An entry point built for coding tools and Agent assistants.'
                )}
                description={t(
                  'More than web chat — built to plug the API into development, automation, project analysis, and multi-step Agent pipelines.'
                )}
              />
              <p className='text-muted-foreground max-w-3xl text-sm leading-7'>
                {t(
                  'High-performance AI model API relay platform with intelligent scheduling, unified model access, and production-ready operations for development, automation, and long-term business calls.'
                )}
              </p>
              <div className='glass-panel grid gap-6 rounded-2xl border p-6 md:grid-cols-3 md:p-8'>
                {[
                  {
                    icon: Bot,
                    title: 'Call Logs',
                    text: 'Review requests, usage, and errors in one place for easier debugging.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Intelligent Scheduling',
                    text: 'Health-aware routes select the best available path for each request.',
                  },
                  {
                    icon: CircleHelp,
                    title: 'Project tokens',
                    text: 'Create dedicated API Keys for coding tools, backends, or Agent assistants.',
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title}>
                      <Icon className='text-primary size-5' />
                      <h3 className='mt-4 font-semibold'>{t(item.title)}</h3>
                      <p className='text-muted-foreground mt-2 text-sm leading-6'>
                        {t(item.text)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>

            <section id='faq' className='scroll-mt-24 space-y-8'>
              <SectionHeading
                eyebrow={t('FAQ')}
                title={t('Frequently asked questions.')}
                description={t(
                  'The most common pre-onboarding questions, answered in one place.'
                )}
              />
              <div className='glass-panel divide-border/70 divide-y rounded-2xl border px-5'>
                {[
                  [
                    'Which API address should I use?',
                    'Use the primary API shown in the console by default. OpenAI-compatible clients append /v1; Anthropic clients use the root domain. Switch to a backup route when you hit network jitter or timeouts.',
                  ],
                  [
                    'How are the two models billed?',
                    'Model groups use the rates shown in the console. The usage log is authoritative and shows the model, tokens, group, and final deduction.',
                  ],
                  [
                    'Which SDKs and tools are supported?',
                    'Compatible with OpenAI and Anthropic SDKs, LangChain, Cursor, Cline, Claude Code, Codex, and custom applications that support compatible endpoints.',
                  ],
                  [
                    'Is there a rate limit?',
                    'Limits depend on the configured group and account policy. For high-concurrency integrations, select the appropriate group and monitor your usage logs.',
                  ],
                ].map(([question, answer]) => (
                  <details key={question} className='group py-5'>
                    <summary className='flex cursor-pointer list-none items-center justify-between gap-4 font-medium'>
                      {t(question)}
                      <ChevronRight className='text-muted-foreground size-4 transition-transform group-open:rotate-90' />
                    </summary>
                    <p className='text-muted-foreground max-w-3xl pt-3 text-sm leading-6'>
                      {t(answer)}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </PublicLayout>
  )
}

function BookIcon() {
  return (
    <span className='inline-flex size-4 items-center justify-center rounded border border-current text-[9px]'>
      API
    </span>
  )
}
