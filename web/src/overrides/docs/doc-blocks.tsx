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
import { Check, Clipboard, Copy, ExternalLink } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Markdown } from '@/components/ui/markdown'

import type { DocBlock } from './default-document'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function CodeBlock(props: { code: string; title?: string }) {
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

export function CopyRow(props: { label: string; value: string }) {
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

export function MethodBadge(props: { method: 'GET' | 'POST' }) {
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

export function EndpointRow(props: {
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

export function StepCard(props: {
  index: number
  title: string
  children?: ReactNode
}) {
  return (
    <div className='glass-panel rounded-xl border p-5'>
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

export function TutorialFigure(props: {
  src: string
  alt: string
  caption: string
}) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  return (
    <figure className='glass-panel bg-muted/20 overflow-hidden rounded-xl border'>
      {failed ? (
        <div className='text-muted-foreground flex aspect-video items-center justify-center px-6 text-center text-sm'>
          {t('Tutorial image is temporarily unavailable')}
        </div>
      ) : (
        <img
          src={props.src}
          alt={props.alt}
          loading='lazy'
          onError={() => setFailed(true)}
          className='aspect-video w-full object-contain'
        />
      )}
      <figcaption className='text-muted-foreground border-t px-4 py-3 text-sm leading-6'>
        {props.caption}
      </figcaption>
    </figure>
  )
}

export function BlockLink(props: {
  href: string
  children: ReactNode
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

export function DocBlockRenderer(props: { block: DocBlock }) {
  const block = props.block
  if (block.type === 'markdown') {
    return <Markdown>{block.content}</Markdown>
  }
  if (block.type === 'code') {
    return <CodeBlock code={block.content} title={block.title} />
  }
  if (block.type === 'image') {
    return (
      <TutorialFigure
        src={block.src}
        alt={block.alt}
        caption={block.caption ?? block.alt}
      />
    )
  }
  if (block.type === 'endpoint') {
    return (
      <div className='rounded-xl border px-4 py-2'>
        <EndpointRow
          method={block.method}
          path={block.path}
          desc={block.description}
        />
      </div>
    )
  }
  if (block.type === 'table') {
    return (
      <div className='overflow-x-auto rounded-xl border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-muted-foreground'>
            <tr>
              {block.columns.map((column) => (
                <th key={column} className='px-4 py-2 text-left font-medium'>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join('|')} className='border-t'>
                {row.map((cell) => (
                  <td key={`${row.join('|')}-${cell}`} className='px-4 py-2'>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (block.type !== 'steps') return null
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {block.items.map((item) => (
        <StepCard
          key={`${item.title}-${item.content}`}
          index={block.items.indexOf(item) + 1}
          title={item.title}
        >
          <Markdown>{item.content}</Markdown>
        </StepCard>
      ))}
    </div>
  )
}
