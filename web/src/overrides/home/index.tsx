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
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Activity,
  Bot,
  Code2,
  Globe2,
  KeyRound,
  Layers,
  Play,
  ShieldCheck,
  ServerCog,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useAuthStore } from '@/stores/auth-store'

const REQUEST_LINES = [
  <div key='method'>
    <span className='text-emerald-600 dark:text-emerald-400'>POST</span>{' '}
    <span className='text-foreground'>/v1/chat/completions</span>
  </div>,
  <div key='auth' className='text-muted-foreground'>
    authorization: Bearer sk-******
  </div>,
  <div key='model' className='text-muted-foreground pt-2'>
    model: <span className='text-primary'>gpt-6-astra</span>
  </div>,
  <div key='stream' className='text-muted-foreground'>
    stream: <span className='text-foreground'>true</span>
  </div>,
]

/**
 * Animated gateway terminal: replays a request, streams a reply character by
 * character with a live token counter, then shows the final 200 stats and
 * loops. Falls back to a static finished state under reduced motion.
 */
function LiveTerminalPanel() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const [requestLines, setRequestLines] = useState(0)
  const [phase, setPhase] = useState<'request' | 'stream' | 'done'>('request')
  const [typedChars, setTypedChars] = useState(0)
  const [tokens, setTokens] = useState(0)
  const [latencyMs, setLatencyMs] = useState(842)
  const streamText = t(
    'Request routed through the unified gateway to the healthiest model route. Streaming the response back.'
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      setRequestLines(REQUEST_LINES.length)
      setTypedChars(streamText.length)
      setTokens(1024)
      setPhase('done')
      return
    }
    if (phase !== 'request') return
    if (requestLines < REQUEST_LINES.length) {
      const timer = window.setTimeout(() => setRequestLines((n) => n + 1), 380)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setPhase('stream'), 300)
    return () => window.clearTimeout(timer)
  }, [phase, requestLines, prefersReducedMotion, streamText])

  useEffect(() => {
    if (phase !== 'stream' || prefersReducedMotion) return
    if (typedChars < streamText.length) {
      const timer = window.setTimeout(() => {
        setTypedChars((n) => Math.min(n + 2, streamText.length))
        setTokens((n) => n + 1 + Math.floor(Math.random() * 2))
      }, 45)
      return () => window.clearTimeout(timer)
    }
    setLatencyMs(620 + Math.floor(Math.random() * 500))
    setPhase('done')
  }, [phase, typedChars, prefersReducedMotion, streamText])

  useEffect(() => {
    if (phase !== 'done' || prefersReducedMotion) return
    const timer = window.setTimeout(() => {
      setRequestLines(0)
      setTypedChars(0)
      setTokens(0)
      setPhase('request')
    }, 3200)
    return () => window.clearTimeout(timer)
  }, [phase, prefersReducedMotion])

  const showStreamLine = phase !== 'request' || typedChars > 0

  return (
    <div className='glass-panel shadow-primary/5 relative overflow-hidden rounded-2xl p-3 shadow-2xl'>
      <div className='bg-background/70 rounded-xl border p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <span className='flex gap-1.5'>
              <span className='size-2.5 rounded-full bg-red-400/70' />
              <span className='size-2.5 rounded-full bg-amber-400/70' />
              <span className='size-2.5 rounded-full bg-emerald-400/80' />
            </span>
            <span className='text-muted-foreground font-mono text-xs'>
              {t('Live gateway')}
            </span>
            <span className='relative flex size-2' aria-hidden='true'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
            </span>
          </div>
          <span className='text-muted-foreground text-xs'>
            {t('99.98% uptime')}
          </span>
        </div>
        <div className='bg-muted/50 min-h-44 space-y-1 rounded-lg p-4 font-mono text-xs leading-6'>
          {REQUEST_LINES.slice(0, requestLines)}
          {showStreamLine && (
            <div className='pt-2 text-foreground'>
              {streamText.slice(0, typedChars)}
              {phase !== 'done' && (
                <span className='text-primary ml-0.5 inline-block animate-pulse'>
                  ▍
                </span>
              )}
            </div>
          )}
          {phase === 'done' && (
            <div className='pt-2'>
              <span className='text-emerald-600 dark:text-emerald-400'>
                200
              </span>{' '}
              <span className='text-muted-foreground'>
                · {latencyMs}ms · {tokens} tokens
              </span>
            </div>
          )}
        </div>
        <div className='mt-4 flex items-center justify-between text-xs'>
          <span className='text-muted-foreground'>{t('Base URL')}</span>
          <code className='text-foreground'>/v1</code>
        </div>
      </div>
      <div className='text-muted-foreground flex items-center justify-between px-2 pt-3 text-xs'>
        <span>{systemName}</span>
        <span className='flex items-center gap-1'>
          <Play className='size-3 fill-current' /> {t('Ready to deploy')}
        </span>
      </div>
    </div>
  )
}

export function BrandHome() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = Boolean(auth.user)

  const heroPillars: {
    icon: LucideIcon
    title: string
    description: string
  }[] = [
    {
      icon: Layers,
      title: t('Every major model covered'),
      description: t(
        'Claude, Gemini, DeepSeek, Qwen and more, behind unified auth, unified billing, and one call path — no per-provider integration.'
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Production-grade availability'),
      description: t(
        'Multi-provider hot standby with automatic failover, monthly availability of 99.9% or higher, long-term API compatibility, and smooth version upgrades.'
      ),
    },
    {
      icon: Code2,
      title: t('Drop-in toolchain compatibility'),
      description: t(
        'OpenAI-compatible API works with existing SDKs and CLI tools — including Claude Code, Codex, and Gemini CLI — with zero code changes.'
      ),
    },
  ]

  const navLinks = [
    { title: t('Home'), href: '/' },
    { title: t('Pricing'), href: '/pricing' },
    { title: t('Docs'), href: '/docs' },
    { title: t('Support'), href: '/about' },
  ]

  const models = [
    {
      name: 'GPT-5.6',
      detail: t(
        'Excels at agentic coding, terminal automation, toolchain orchestration, high-frequency development, and multi-step workflows.'
      ),
      color: 'bg-emerald-500',
    },
    {
      name: 'Claude',
      detail: t(
        'Excels at deep understanding of large codebases, complex refactoring, multi-file bug fixes, long-text analysis, and stable output.'
      ),
      color: 'bg-orange-500',
    },
    {
      name: 'Gemini',
      detail: t(
        'Flexible multimodal reasoning for text, images, documents, and fast experiments.'
      ),
      color: 'bg-blue-500',
    },
  ]

  const capabilities: {
    icon: LucideIcon
    title: string
    description: string
  }[] = [
    {
      icon: Activity,
      title: t('Low-latency routing'),
      description: t(
        'Health-aware routing keeps first-token response fast and consistent.'
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Stable under load'),
      description: t(
        'Retries, route health, and operational visibility protect important calls.'
      ),
    },
    {
      icon: WalletCards,
      title: t('Fair, transparent cost'),
      description: t(
        'Clear model groups and usage logs make long-term budgets easier to manage.'
      ),
    },
    {
      icon: Globe2,
      title: t('Global intelligent scheduling'),
      description: t(
        'Multiple regions work together to select a healthy path for each request.'
      ),
    },
    {
      icon: ServerCog,
      title: t('Engineering-first operations'),
      description: t(
        'Designed for production backends, automation, and teams that need control.'
      ),
    },
    {
      icon: Bot,
      title: t('Made for Agent workflows'),
      description: t(
        'Dedicated project keys and compatible endpoints fit Codex, Claude Code, and custom agents.'
      ),
    },
  ]

  return (
    <PublicLayout showMainContainer={false} navLinks={navLinks}>
      <main>
        <section className='relative overflow-hidden border-b px-6 pt-28 pb-20 md:px-10 md:pt-36 md:pb-24'>
          <div
            className='pointer-events-none absolute inset-0 -z-10'
            style={{
              backgroundImage:
                'radial-gradient(42rem 26rem at 16% 4%, color-mix(in oklch, var(--primary) 13%, transparent), transparent 64%), radial-gradient(32rem 22rem at 84% 8%, color-mix(in oklch, var(--chart-3) 12%, transparent), transparent 62%)',
            }}
          />
          <div className='mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]'>
            <div>
              <div className='text-primary mb-6 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase'>
                <Sparkles className='size-4' /> {t('AI API gateway')}
              </div>
              <h1 className='max-w-3xl text-4xl leading-[1.18] font-bold tracking-tight text-balance md:text-5xl'>
                {t(
                  'Unified access layer, full model ecosystem, production-grade reliability.'
                )}
              </h1>
              <p className='text-muted-foreground mt-7 max-w-xl text-lg leading-relaxed'>
                {t(
                  'An AI API gateway built for production: one API across leading model services, with multi-provider hot standby, automatic failover, and monthly availability of 99.9% or higher.'
                )}
              </p>
              <div className='mt-9 flex flex-wrap gap-3'>
                <Button
                  size='lg'
                  className='h-12 rounded-xl px-6'
                  render={
                    <Link to={isAuthenticated ? '/dashboard' : '/sign-up'} />
                  }
                >
                  {isAuthenticated ? t('Open console') : t('Start building')}{' '}
                  <ArrowRight className='ml-2 size-4' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='h-12 rounded-xl px-6'
                  render={<Link to='/docs' />}
                >
                  {t('Read documentation')}
                </Button>
              </div>
            </div>

            <LiveTerminalPanel />
          </div>

          <div className='mx-auto mt-14 max-w-6xl'>
            <div className='grid gap-4 md:grid-cols-3'>
              {heroPillars.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <article
                    key={pillar.title}
                    className='glass-panel border-border/70 bg-card rounded-2xl border p-6'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg'>
                        <Icon className='size-5' />
                      </span>
                      <h2 className='text-base font-semibold'>
                        {pillar.title}
                      </h2>
                    </div>
                    <p className='text-muted-foreground mt-4 text-sm leading-relaxed'>
                      {pillar.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className='border-b px-6 py-12 md:px-10'>
          <div className='glass-panel mx-auto grid max-w-6xl grid-cols-2 gap-8 rounded-2xl p-8 md:grid-cols-4'>
            {[
              [t('Model providers'), '40+'],
              [t('API formats'), '6'],
              [t('Request visibility'), '100%'],
              [t('Setup time'), '< 5 min'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className='text-3xl font-bold tracking-tight'>{value}</div>
                <div className='text-muted-foreground mt-1 text-sm'>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className='px-6 py-20 md:px-10 md:py-28'>
          <div className='mx-auto max-w-6xl'>
            <div className='max-w-2xl'>
              <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
                {t('Everything you need')}
              </p>
              <h2 className='mt-4 text-3xl font-bold tracking-tight md:text-5xl'>
                {t('A calmer way to run AI in production.')}
              </h2>
            </div>
            <div className='mt-12 grid gap-4 md:grid-cols-3'>
              {capabilities.map((capability) => {
                const Icon = capability.icon
                return (
                  <article
                    key={capability.title}
                    className='glass-panel border-border/70 bg-card rounded-2xl border p-6'
                  >
                    <Icon className='text-primary size-6' />
                    <h3 className='mt-6 text-lg font-semibold'>
                      {t(capability.title)}
                    </h3>
                    <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                      {t(capability.description)}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className='bg-muted/25 border-y px-6 py-20 md:px-10 md:py-24'>
          <div className='mx-auto max-w-6xl'>
            <div className='flex flex-col justify-between gap-5 md:flex-row md:items-end'>
              <div>
                <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
                  {t('Model access')}
                </p>
                <h2 className='mt-4 text-3xl font-bold tracking-tight md:text-4xl'>
                  {t('One API, your choice of models.')}
                </h2>
              </div>
              <Link
                to='/pricing'
                className='text-primary inline-flex items-center gap-2 text-sm font-medium'
              >
                {t('Explore models')} <ArrowRight className='size-4' />
              </Link>
            </div>
            <div className='mt-10 grid gap-4 md:grid-cols-3'>
              {models.map((model) => (
                <article
                  key={model.name}
                  className='glass-panel border-border/70 bg-card rounded-2xl border p-5'
                >
                  <div className='flex items-center gap-3'>
                    <span className={`${model.color} size-3 rounded-full`} />
                    <h3 className='font-semibold'>{model.name}</h3>
                  </div>
                  <p className='text-muted-foreground mt-3 text-sm'>
                    {t(model.detail)}
                  </p>
                  <div className='text-muted-foreground mt-8 flex items-center gap-2 text-xs'>
                    <Code2 className='size-4' /> {t('Compatible endpoint')}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='px-6 py-20 md:px-10 md:py-28'>
          <div className='mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_0.8fr]'>
            <div>
              <KeyRound className='text-primary size-7' />
              <h2 className='mt-5 text-3xl font-bold tracking-tight md:text-4xl'>
                {t('Start with a single key.')}
              </h2>
              <p className='text-muted-foreground mt-4 max-w-xl leading-relaxed'>
                {t(
                  'Create a project key, point your SDK at our base URL, and keep the rest of your stack unchanged.'
                )}
              </p>
              <Button
                className='mt-7 rounded-xl'
                render={<Link to='/docs' hash='quickstart' />}
              >
                {t('View quick start')} <ArrowRight className='ml-2 size-4' />
              </Button>
            </div>
            <div className='glass-panel border-border/70 bg-card rounded-2xl border p-6'>
              <p className='text-muted-foreground text-xs'>
                {t('Recommended base URL')}
              </p>
              <code className='mt-3 block text-sm'>
                https://your-domain.example/v1
              </code>
              <div className='bg-border/60 my-5 h-px' />
              <p className='text-muted-foreground text-xs'>
                {t('Authentication')}
              </p>
              <code className='mt-3 block text-sm'>
                Authorization: Bearer sk-...
              </code>
            </div>
          </div>
        </section>

        <section className='relative overflow-hidden border-y px-6 py-20 md:px-10 md:py-28'>
          <div className='bg-primary/[0.025] pointer-events-none absolute inset-0 -z-10' />
          <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]'>
            <div>
              <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
                {t('Built for the long run')}
              </p>
              <h2 className='mt-4 text-3xl font-bold tracking-tight md:text-5xl'>
                {t(
                  'More than a relay. A dependable AI layer for your product.'
                )}
              </h2>
              <p className='text-muted-foreground mt-5 max-w-xl leading-7'>
                {t(
                  'We focus on the details that matter after the demo: predictable latency, stable routing, transparent usage, and practical support when your workload grows.'
                )}
              </p>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              {[
                ['99.9%', 'Service-minded reliability'],
                ['< 1s', 'Fast first-token experience'],
                ['24/7', 'Operational visibility'],
                ['1 API', 'One integration for many models'],
              ].map(([value, label]) => (
                <div key={label} className='glass-panel rounded-2xl border p-5'>
                  <div className='text-primary text-3xl font-bold tracking-tight'>
                    {value}
                  </div>
                  <div className='text-muted-foreground mt-2 text-sm'>
                    {t(label)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='px-6 py-20 md:px-10 md:py-28'>
          <div className='mx-auto max-w-6xl'>
            <div className='flex flex-col justify-between gap-5 md:flex-row md:items-end'>
              <div>
                <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
                  {t('Agent ready')}
                </p>
                <h2 className='mt-4 text-3xl font-bold tracking-tight md:text-4xl'>
                  {t('A better home for serious AI workflows.')}
                </h2>
              </div>
              <Link
                to='/docs'
                hash='agents'
                className='text-primary inline-flex items-center gap-2 text-sm font-medium'
              >
                {t('Explore the workflow')} <ArrowRight className='size-4' />
              </Link>
            </div>
            <div className='mt-10 grid gap-4 md:grid-cols-3'>
              {[
                [
                  t('Coding'),
                  t(
                    'Great for code generation, project edits, automated development, and long coding sessions.'
                  ),
                ],
                [
                  t('Automation'),
                  t(
                    'Suited for tool calling, scheduled jobs, and multi-step workflows that need predictable access.'
                  ),
                ],
                [
                  t('Team projects'),
                  t(
                    'Create dedicated keys per project and keep usage, permissions, and logs easy to audit.'
                  ),
                ],
              ].map(([title, text]) => (
                <article
                  key={title}
                  className='glass-panel rounded-2xl border p-6'
                >
                  <h3 className='font-semibold'>{t(title)}</h3>
                  <p className='text-muted-foreground mt-3 text-sm leading-6'>
                    {t(text)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className='px-6 py-20 md:px-10 md:py-24'>
          <div className='glass-panel relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-12 md:px-12'>
            <div
              className='pointer-events-none absolute inset-0'
              style={{
                backgroundImage:
                  'radial-gradient(30rem 18rem at 6% 118%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 66%), radial-gradient(24rem 16rem at 96% -20%, color-mix(in oklch, var(--chart-2) 14%, transparent), transparent 64%)',
              }}
            />
            <div className='relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center'>
              <div>
                <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
                  {t('Build your next AI feature.')}
                </h2>
                <p className='text-muted-foreground mt-3 max-w-xl'>
                  {t(
                    'A reliable gateway for teams that want to move quickly and keep control.'
                  )}
                </p>
              </div>
              <Button
                size='lg'
                className='rounded-xl'
                render={
                  <Link to={isAuthenticated ? '/dashboard' : '/sign-up'} />
                }
              >
                {t('Get started')} <ArrowRight className='ml-2 size-4' />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
