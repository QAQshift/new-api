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
import { Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'

/**
 * Built-in About page. Used when neither the structured About document nor
 * the legacy About content option is configured.
 */
export function SupportPage() {
  const { t } = useTranslation()
  const { systemName, logo } = useSystemConfig()
  const supportEmail = 'support@example.com'

  return (
    <main className='bg-muted/20 min-h-svh border-t'>
      <section className='mx-auto max-w-5xl px-6 pt-20 pb-14 md:px-10 md:pt-28'>
        <div className='flex items-center gap-3'>
          <img
            src={logo}
            alt=''
            className='size-10 rounded-xl object-contain'
          />
          <span className='text-muted-foreground text-sm font-medium'>
            {systemName}
          </span>
        </div>
        <h1 className='mt-8 max-w-3xl text-4xl leading-tight font-bold tracking-tight md:text-6xl'>
          {t('How can we help?')}
        </h1>
        <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-relaxed md:text-lg'>
          {t(
            'Find answers, report an issue, or contact our support team about your account and API usage.'
          )}
        </p>
      </section>

      <section className='mx-auto grid max-w-5xl gap-4 px-6 pb-20 md:grid-cols-3 md:px-10'>
        <article className='glass-panel border-border/70 bg-card rounded-2xl border p-6'>
          <MessageCircle className='text-primary size-6' />
          <h2 className='mt-5 text-lg font-semibold'>
            {t('API and account help')}
          </h2>
          <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
            {t(
              'Get help with API keys, model access, billing, and request errors.'
            )}
          </p>
          <Button variant='outline' className='mt-6' render={<a href='/docs' />}>
            {t('Read the docs')}
          </Button>
        </article>
        <article className='glass-panel border-border/70 bg-card rounded-2xl border p-6'>
          <Mail className='text-primary size-6' />
          <h2 className='mt-5 text-lg font-semibold'>
            {t('Contact support')}
          </h2>
          <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
            {t(
              'Include your account email, request ID, and a short description so we can respond quickly.'
            )}
          </p>
          <Button
            className='mt-6'
            render={<a href={`mailto:${supportEmail}`} />}
          >
            {t('Email support')}
          </Button>
        </article>
        <article className='glass-panel border-border/70 bg-card rounded-2xl border p-6'>
          <ShieldCheck className='text-primary size-6' />
          <h2 className='mt-5 text-lg font-semibold'>{t('Security first')}</h2>
          <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
            {t(
              'Never share an API key in screenshots, public repositories, or support requests.'
            )}
          </p>
        </article>
      </section>
    </main>
  )
}
