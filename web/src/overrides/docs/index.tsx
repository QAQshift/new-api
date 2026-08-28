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
import { BookOpen, Check, Copy, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const sections = [
  { id: 'start', title: 'Quick start' },
  { id: 'endpoints', title: 'Endpoints and authentication' },
  { id: 'text', title: 'Text model API' },
  { id: 'image', title: 'Image model API' },
  { id: 'video', title: 'Video model API' },
  { id: 'errors', title: 'Troubleshooting' },
] as const

const quickStartCode = `curl https://your-domain.example/v1/chat/completions \
  -H "Authorization: Bearer sk-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'`

function CodeBlock(props: { code: string; label: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(props.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className='border-border/70 bg-muted/30 relative overflow-hidden rounded-xl border'>
      <div className='text-muted-foreground flex items-center justify-between border-b px-4 py-2 text-xs'>
        <span>{props.label}</span>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 gap-1.5'
          onClick={copy}
        >
          {copied ? (
            <Check className='size-3.5' />
          ) : (
            <Copy className='size-3.5' />
          )}
          {copied ? t('Copied') : t('Copy')}
        </Button>
      </div>
      <pre className='overflow-x-auto p-4 text-xs leading-relaxed'>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}

export function Docs() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const visibleSections = useMemo(
    () =>
      sections.filter((section) =>
        t(section.title).toLowerCase().includes(query.toLowerCase())
      ),
    [query, t]
  )

  return (
    <PublicLayout showMainContainer={false}>
      <div className='border-border/60 bg-background min-h-svh border-t'>
        <header className='bg-muted/20 border-b px-6 py-16 md:px-10 md:py-24'>
          <div className='mx-auto max-w-6xl'>
            <div className='text-primary mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase'>
              <BookOpen className='size-4' /> {t('Developer documentation')}
            </div>
            <h1 className='max-w-3xl text-4xl leading-tight font-bold tracking-tight md:text-6xl'>
              {t('Build with your AI gateway.')}
            </h1>
            <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-relaxed md:text-lg'>
              {t(
                'One endpoint for chat, image, and video models. Create a key, choose a model, and ship your integration.'
              )}
            </p>
          </div>
        </header>

        <div className='mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-[230px_minmax(0,1fr)] md:px-10'>
          <aside className='md:sticky md:top-24 md:h-fit'>
            <label className='relative block'>
              <Search className='text-muted-foreground absolute top-2.5 left-3 size-4' />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Search documentation')}
                className='pl-9'
              />
            </label>
            <nav
              aria-label={t('Documentation sections')}
              className='mt-5 space-y-1'
            >
              {visibleSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className='text-muted-foreground hover:text-foreground block rounded-md px-3 py-2 text-sm transition-colors'
                >
                  {t(section.title)}
                </a>
              ))}
            </nav>
          </aside>

          <main className='min-w-0 space-y-20'>
            <section id='start' className='scroll-mt-24 space-y-5'>
              <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
                {t('Getting started')}
              </p>
              <h2 className='text-3xl font-bold tracking-tight'>
                {t('Your first request in five minutes')}
              </h2>
              <p className='text-muted-foreground leading-relaxed'>
                {t(
                  'Use the same OpenAI-compatible format you already know. Keys and usage are managed from the console.'
                )}
              </p>
              <ol className='grid gap-3 sm:grid-cols-3'>
                {[
                  t('Create an account and open the console.'),
                  t('Create an API key for the model group you need.'),
                  t('Set the base URL and send a test request.'),
                ].map((step, index) => (
                  <li
                    key={step}
                    className='glass-panel border-border/70 bg-card rounded-xl border p-4'
                  >
                    <span className='text-primary text-sm font-bold'>
                      0{index + 1}
                    </span>
                    <p className='mt-3 text-sm leading-relaxed'>{step}</p>
                  </li>
                ))}
              </ol>
              <CodeBlock code={quickStartCode} label='curl' />
            </section>

            <section id='endpoints' className='scroll-mt-24 space-y-5'>
              <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
                {t('Connection')}
              </p>
              <h2 className='text-3xl font-bold tracking-tight'>
                {t('Endpoints and authentication')}
              </h2>
              <p className='text-muted-foreground leading-relaxed'>
                {t(
                  'Use the URL below as the base endpoint. Every request must include a bearer token.'
                )}
              </p>
              <div className='glass-panel border-border/70 bg-card rounded-xl border p-5'>
                <p className='text-muted-foreground text-xs'>
                  {t('OpenAI-compatible base URL')}
                </p>
                <code className='mt-2 block text-sm'>/v1</code>
                <p className='text-muted-foreground mt-4 text-xs'>
                  {t('Request header')}
                </p>
                <code className='mt-2 block text-sm'>
                  Authorization: Bearer sk-your-api-key
                </code>
              </div>
            </section>

            <section id='text' className='scroll-mt-24 space-y-5'>
              <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
                {t('Text models')}
              </p>
              <h2 className='text-3xl font-bold tracking-tight'>
                {t('Chat and responses')}
              </h2>
              <p className='text-muted-foreground leading-relaxed'>
                {t(
                  'Chat Completions, Responses, and Anthropic Messages are available through the configured model groups.'
                )}
              </p>
              <CodeBlock
                code='POST /v1/chat/completions\nPOST /v1/responses\nPOST /v1/messages'
                label={t('Available routes')}
              />
            </section>

            <section id='image' className='scroll-mt-24 space-y-5'>
              <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
                {t('Image models')}
              </p>
              <h2 className='text-3xl font-bold tracking-tight'>
                {t('Generate images')}
              </h2>
              <p className='text-muted-foreground leading-relaxed'>
                {t(
                  'Send a prompt and the model name to the image endpoint. The response contains generated image URLs or encoded data, depending on your provider settings.'
                )}
              </p>
              <CodeBlock
                code='POST /v1/images/generations\n{"model":"dall-e-3","prompt":"A calm mountain lake at dawn","n":1}'
                label={t('Request shape')}
              />
            </section>

            <section id='video' className='scroll-mt-24 space-y-5'>
              <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
                {t('Video models')}
              </p>
              <h2 className='text-3xl font-bold tracking-tight'>
                {t('Create and monitor video tasks')}
              </h2>
              <p className='text-muted-foreground leading-relaxed'>
                {t(
                  'Video generation is asynchronous. Save the returned task ID, poll its status, then download the finished content.'
                )}
              </p>
              <CodeBlock
                code='POST /v1/videos\nGET /v1/videos/{task_id}\nGET /v1/videos/{task_id}/content'
                label={t('Task lifecycle')}
              />
            </section>

            <section id='errors' className='scroll-mt-24 space-y-5'>
              <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
                {t('Support')}
              </p>
              <h2 className='text-3xl font-bold tracking-tight'>
                {t('Troubleshooting')}
              </h2>
              <div className='grid gap-3 sm:grid-cols-2'>
                {[
                  ['401', t('Check that the API key is complete and active.')],
                  [
                    '403',
                    t(
                      'Confirm the key has access to the selected model group.'
                    ),
                  ],
                  [
                    '429',
                    t('Reduce concurrency or wait for the rate limit window.'),
                  ],
                  ['5xx', t('Retry after checking upstream channel status.')],
                ].map(([code, message]) => (
                  <div
                    key={code}
                    className='glass-panel border-border/70 bg-card rounded-xl border p-4'
                  >
                    <code className='text-primary font-semibold'>{code}</code>
                    <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                      {message}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </PublicLayout>
  )
}
