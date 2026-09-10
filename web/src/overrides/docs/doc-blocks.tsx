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
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Markdown } from '@/components/ui/markdown'

import { type DocBlock, resolveText } from './default-document'

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
  const code = resolveText(props.code)
  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }
  return (
    <div className='overflow-hidden rounded-xl border bg-zinc-950 dark:bg-black/60'>
      {props.title && (
        <div className='border-border/60 flex items-center justify-between border-b px-4 py-2'>
          <span className='font-mono text-xs text-zinc-400'>
            {resolveText(props.title)}
          </span>
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
          <code>{code}</code>
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
  const value = resolveText(props.value)
  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }
  return (
    <div>
      <p className='text-muted-foreground mb-1 text-sm'>
        {resolveText(props.label)}
      </p>
      <div className='bg-muted/50 flex items-center justify-between gap-2 rounded-lg border px-3 py-2'>
        <code className='text-foreground text-sm break-all'>{value}</code>
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
  const cls = 'bg-emerald-500/15 text-emerald-500'
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
      <code className='text-foreground font-mono text-sm'>
        {resolveText(props.path)}
      </code>
      <span className='text-muted-foreground text-sm'>
        {resolveText(props.desc)}
      </span>
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
          src={resolveText(props.src)}
          alt={resolveText(props.alt)}
          loading='lazy'
          onError={() => setFailed(true)}
          className='aspect-video w-full object-contain'
        />
      )}
      <figcaption className='text-muted-foreground border-t px-4 py-3 text-sm leading-6'>
        {resolveText(props.caption)}
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
      href={resolveText(props.href)}
      target={props.external ? '_blank' : undefined}
      rel={props.external ? 'noreferrer' : undefined}
      className='text-primary inline-flex items-center gap-1 hover:underline'
    >
      {props.children}
      {props.external && <ExternalLink className='size-3.5' />}
    </a>
  )
}

function DownloadLink(props: { href: string; label?: string }) {
  return (
    <a
      href={resolveText(props.href)}
      target='_blank'
      rel='noreferrer'
      className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
    >
      <Download className='size-3.5' />
      {resolveText(props.label ?? '官方下载')}
    </a>
  )
}

function CopyGrid(props: {
  items: { label: string; value: string }[]
}) {
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {props.items.map((item) => (
        <CopyRow
          key={`${item.label}-${item.value}`}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  )
}

function ContentCard(props: {
  block: Extract<DocBlock, { type: 'card' }>
}) {
  const block = props.block
  return (
    <div className='glass-panel h-full rounded-xl border p-5'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h4
          className={`text-base font-semibold ${block.mono ? 'font-mono' : ''}`}
        >
          {resolveText(block.title)}
        </h4>
        {block.badge && (
          <span className='bg-primary/10 text-primary rounded px-2 py-0.5 text-xs'>
            {resolveText(block.badge)}
          </span>
        )}
        {!block.badge && block.subtitle && (
          <span className='text-muted-foreground text-xs'>
            {resolveText(block.subtitle)}
          </span>
        )}
      </div>
      {block.badge && block.subtitle && (
        <p className='text-muted-foreground mt-0.5 text-xs'>
          {resolveText(block.subtitle)}
        </p>
      )}
      {block.text && (
        <div className='text-muted-foreground mt-2 text-sm leading-6'>
          <Markdown>{resolveText(block.text)}</Markdown>
        </div>
      )}
      {block.rows && block.rows.length > 0 && (
        <dl className='mt-3 space-y-2 text-sm'>
          {block.rows.map((row) => (
            <div
              key={`${row.label}-${row.value}`}
              className='flex justify-between gap-4 border-b pb-2 last:border-0'
            >
              <dt className='text-muted-foreground shrink-0'>
                {resolveText(row.label)}
              </dt>
              <dd className='text-right'>{resolveText(row.value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {block.copies && block.copies.length > 0 && (
        <div className='mt-4 space-y-3'>
          {block.copies.map((item) => (
            <CopyRow
              key={`${item.label}-${item.value}`}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      )}
      {block.link && (
        <div className='mt-4'>
          <BlockLink href={block.link.href} external={block.link.external}>
            {resolveText(block.link.label ?? block.link.href)}
          </BlockLink>
        </div>
      )}
    </div>
  )
}

function CalloutCard(props: {
  block: Extract<DocBlock, { type: 'callout' }>
}) {
  const block = props.block
  return (
    <div className='glass-panel h-full rounded-xl border p-5'>
      <div className='flex items-center gap-3'>
        {block.code && (
          <span className='rounded bg-rose-500/15 px-2 py-0.5 font-mono text-sm font-semibold text-rose-500'>
            {resolveText(block.code)}
          </span>
        )}
        <h4 className='font-semibold'>{resolveText(block.title)}</h4>
      </div>
      <p className='text-muted-foreground mt-3 text-sm leading-6'>
        {resolveText(block.text)}
      </p>
    </div>
  )
}

function DownloadsPanel(props: {
  block: Extract<DocBlock, { type: 'downloads' }>
}) {
  const block = props.block
  return (
    <div className='rounded-xl border p-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='font-semibold'>{resolveText(block.title)}</p>
          {block.description && (
            <p className='text-muted-foreground mt-2 max-w-xl text-sm leading-6'>
              {resolveText(block.description)}
            </p>
          )}
        </div>
        {block.href && <DownloadLink href={block.href} label='查看最新版本' />}
      </div>
      <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {block.items.map((item) => (
          <div
            key={`${item.name}-${item.desc}`}
            className='min-w-0 overflow-hidden rounded-lg border p-4'
          >
            <p className='text-sm font-medium break-words'>
              {resolveText(item.desc)}
            </p>
            <p className='text-muted-foreground mt-1 font-mono text-xs break-all'>
              {resolveText(item.name)}
            </p>
            {block.href && (
              <div className='mt-3'>
                <DownloadLink href={block.href} />
              </div>
            )}
          </div>
        ))}
      </div>
      {block.note && (
        <p className='text-muted-foreground mt-4 text-xs leading-6'>
          {resolveText(block.note)}
        </p>
      )}
    </div>
  )
}

/**
 * QR / contact card. The image sits on a white plate with padding so the
 * mandatory quiet zone is preserved and the code stays scannable in both
 * light and dark themes.
 */
function QrCard(props: { block: Extract<DocBlock, { type: 'qr' }> }) {
  const { t } = useTranslation()
  const block = props.block
  const [failed, setFailed] = useState(false)
  return (
    <div className='glass-panel h-full rounded-xl border p-5 text-center'>
      {block.title && (
        <h4 className='font-semibold'>{resolveText(block.title)}</h4>
      )}
      <div className='mx-auto mt-4 flex size-44 items-center justify-center rounded-xl border bg-white p-2'>
        {failed ? (
          <span className='text-muted-foreground text-xs'>
            {t('QR code is temporarily unavailable')}
          </span>
        ) : (
          <img
            src={resolveText(block.src)}
            alt={resolveText(block.alt ?? block.title ?? 'QR code')}
            loading='lazy'
            onError={() => setFailed(true)}
            className='size-full object-contain'
          />
        )}
      </div>
      {block.description && (
        <p className='text-muted-foreground mt-3 text-sm leading-6'>
          {resolveText(block.description)}
        </p>
      )}
      {block.caption && (
        <p className='text-muted-foreground mt-1 text-xs'>
          {resolveText(block.caption)}
        </p>
      )}
      {block.link && (
        <div className='mt-3'>
          <BlockLink href={block.link.href} external={block.link.external}>
            {resolveText(block.link.label ?? block.link.href)}
          </BlockLink>
        </div>
      )}
    </div>
  )
}

function renderSingleBlock(block: DocBlock, index: number): ReactNode {
  switch (block.type) {
    case 'markdown':
      return <Markdown key={index}>{resolveText(block.content)}</Markdown>
    case 'code':
      return (
        <CodeBlock key={index} code={block.content} title={block.title} />
      )
    case 'image':
      return (
        <TutorialFigure
          key={index}
          src={block.src}
          alt={block.alt}
          caption={block.caption ?? block.alt}
        />
      )
    case 'endpoint':
      return (
        <div key={index} className='rounded-xl border px-4 py-2'>
          <EndpointRow
            method={block.method}
            path={block.path}
            desc={block.description}
          />
        </div>
      )
    case 'table':
      return (
        <div key={index} className='overflow-x-auto rounded-xl border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    className='px-4 py-2 text-left font-medium'
                  >
                    {resolveText(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join('|')} className='border-t'>
                  {row.map((cell) => (
                    <td key={cell} className='px-4 py-2'>
                      {resolveText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'steps':
      return (
        <div key={index} className='grid gap-4 sm:grid-cols-2'>
          {block.items.map((item, itemIndex) => (
            <div
              key={`${item.title}-${item.content}`}
              className='glass-panel rounded-xl border p-5'
            >
              <div className='text-primary flex items-center gap-3'>
                <span className='bg-primary/10 flex size-7 items-center justify-center rounded-full text-sm font-bold'>
                  {itemIndex + 1}
                </span>
                <h3 className='font-semibold'>{resolveText(item.title)}</h3>
              </div>
              <div className='text-muted-foreground mt-3 text-sm leading-6'>
                <Markdown>{resolveText(item.content)}</Markdown>
              </div>
            </div>
          ))}
        </div>
      )
    case 'copy':
      return <CopyGrid key={index} items={block.items} />
    case 'qr':
      return <QrCard key={index} block={block} />
    case 'callout':
      return <CalloutCard key={index} block={block} />
    case 'card':
      return <ContentCard key={index} block={block} />
    case 'downloads':
      return <DownloadsPanel key={index} block={block} />
    default:
      return null
  }
}

/** Block types that flow into a shared responsive grid when consecutive. */
const GRID_TYPES = new Set(['card', 'callout', 'qr'])

export function DocBlocksView(props: { blocks: DocBlock[] }) {
  const groups: { grid: boolean; items: DocBlock[] }[] = []
  for (const block of props.blocks) {
    const grid = GRID_TYPES.has(block.type)
    const last = groups.at(-1)
    if (last && last.grid === grid) {
      last.items.push(block)
    } else {
      groups.push({ grid, items: [block] })
    }
  }
  return (
    <div className='space-y-6'>
      {groups.map((group) =>
        group.grid ? (
          <div
            key={`grid-${JSON.stringify(group.items[0])}`}
            className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          >
            {group.items.map((block, index) => renderSingleBlock(block, index))}
          </div>
        ) : (
          group.items.map((block, index) => renderSingleBlock(block, index))
        )
      )}
    </div>
  )
}

export function DocBlockRenderer(props: { block: DocBlock }) {
  return <>{renderSingleBlock(props.block, 0)}</>
}
