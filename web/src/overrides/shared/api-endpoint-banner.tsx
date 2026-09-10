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
import { Check, Copy, Link2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { resolveSiteOrigin } from './site-origin'

const ENDPOINT_ROW_CLASSES =
  'bg-background/60 flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2'
const ENDPOINT_VALUE_CLASSES =
  'text-primary mt-1 block truncate font-mono text-sm'

function EndpointRow(props: { label: string; hint: string; value: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be denied; the address stays visible for manual copy.
    }
  }

  return (
    <div className={ENDPOINT_ROW_CLASSES}>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
          <span className='text-sm font-medium'>{props.label}</span>
          <span className='text-muted-foreground text-xs'>{props.hint}</span>
        </div>
        <code className={ENDPOINT_VALUE_CLASSES}>{props.value}</code>
      </div>
      <button
        type='button'
        onClick={copy}
        aria-label={`${t('Copy')}: ${props.label}`}
        className='text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-xs transition-colors'
      >
        {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
        <span className='hidden sm:inline'>
          {copied ? t('Copied') : t('Copy')}
        </span>
      </button>
    </div>
  )
}

/**
 * Public endpoint banner. The branded homepage renders it as its own section,
 * the console renders it above the API key table; both share this component so
 * the addresses can never drift apart.
 */
export function ApiEndpointBanner(props: {
  className?: string
  showHeading?: boolean
}) {
  const { t } = useTranslation()
  const origin = resolveSiteOrigin()
  const showHeading = props.showHeading ?? true

  return (
    <section
      className={cn(
        'glass-panel border-border/70 bg-card rounded-xl border p-4 sm:p-5',
        props.className
      )}
    >
      {showHeading && (
        <div className='mb-3 flex items-center gap-2'>
          <Link2 className='text-primary size-4' />
          <h3 className='text-sm font-semibold'>{t('API Endpoints')}</h3>
        </div>
      )}
      <p className='text-muted-foreground text-xs leading-5'>
        {t(
          'OpenAI-compatible clients append /v1. Anthropic clients use the root domain.'
        )}
      </p>
      <div className='mt-3 grid gap-2 min-[520px]:grid-cols-2'>
        <EndpointRow
          label={t('OpenAI Compatible')}
          hint={t('Append /v1')}
          value={`${origin}/v1`}
        />
        <EndpointRow
          label={t('Anthropic')}
          hint={t('Use the root domain')}
          value={origin}
        />
      </div>
    </section>
  )
}
