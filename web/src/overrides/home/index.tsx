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
  Check,
  Code2,
  Globe2,
  KeyRound,
  Play,
  ShieldCheck,
  ServerCog,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useAuthStore } from '@/stores/auth-store'

export function BrandHome() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const { auth } = useAuthStore()
  const isAuthenticated = Boolean(auth.user)

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
        <section className='relative overflow-hidden border-b px-6 pt-28 pb-20 md:px-10 md:pt-40 md:pb-28'>
          <div className='bg-primary/[0.035] dark:bg-primary/[0.06] pointer-events-none absolute inset-0 -z-10' />
          <div className='mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]'>
            <div>
              <div className='text-primary mb-6 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase'>
                <Sparkles className='size-4' /> {t('AI API gateway')}
              </div>
              <h1 className='max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight md:text-7xl'>
                {t('One gateway.')}{' '}
                <span className='text-muted-foreground'>
                  {t('Every model.')}
                </span>
              </h1>
              <p className='text-muted-foreground mt-7 max-w-xl text-lg leading-relaxed'>
                {t(
                  'Connect your applications to leading AI models through one reliable, observable, OpenAI-compatible API.'
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
              <div className='text-muted-foreground mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
                {[
                  t('OpenAI compatible'),
                  t('Usage visibility'),
                  t('Built for production'),
                ].map((item) => (
                  <span key={item} className='flex items-center gap-2'>
                    <Check className='text-primary size-4' />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className='glass-panel border-border/80 bg-card/80 shadow-primary/5 rounded-2xl border p-4 shadow-2xl backdrop-blur'>
              <div className='glass-panel border-border/70 bg-background rounded-xl border p-5'>
                <div className='mb-6 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='size-2 rounded-full bg-emerald-500' />
                    <span className='text-sm font-medium'>
                      {t('Live gateway')}
                    </span>
                  </div>
                  <span className='text-muted-foreground text-xs'>
                    {t('99.98% uptime')}
                  </span>
                </div>
                <div className='bg-muted/60 rounded-lg p-4 font-mono text-xs leading-6'>
                  <div className='text-muted-foreground'>
                    POST{' '}
                    <span className='text-foreground'>
                      /v1/chat/completions
                    </span>
                  </div>
                  <div className='text-muted-foreground mt-2'>
                    model: <span className='text-primary'>gpt-4o</span>
                  </div>
                  <div className='text-muted-foreground'>
                    status:{' '}
                    <span className='text-emerald-600 dark:text-emerald-400'>
                      200 · 842ms
                    </span>
                  </div>
                </div>
                <div className='mt-5 flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>{t('Base URL')}</span>
                  <code className='text-foreground'>/v1</code>
                </div>
              </div>
              <div className='text-muted-foreground flex items-center justify-between px-2 pt-4 text-xs'>
                <span>{systemName}</span>
                <span className='flex items-center gap-1'>
                  <Play className='size-3 fill-current' />{' '}
                  {t('Ready to deploy')}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className='border-b px-6 py-12 md:px-10'>
          <div className='mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4'>
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

        <section className='bg-foreground text-background px-6 py-20 md:px-10 md:py-24'>
          <div className='mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center'>
            <div>
              <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
                {t('Build your next AI feature.')}
              </h2>
              <p className='text-background/70 mt-3 max-w-xl'>
                {t(
                  'A reliable gateway for teams that want to move quickly and keep control.'
                )}
              </p>
            </div>
            <Button
              variant='secondary'
              size='lg'
              className='rounded-xl'
              render={<Link to={isAuthenticated ? '/dashboard' : '/sign-up'} />}
            >
              {t('Get started')} <ArrowRight className='ml-2 size-4' />
            </Button>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}
