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
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import type { DocBlock } from '@/overrides/docs/default-document'

import {
  BLOCK_TYPE_LABELS,
  BLOCK_TYPES,
  createEmptyBlock,
} from './doc-block-helpers'

type PairItem = { label: string; value: string }

function PairEditor(props: {
  items: PairItem[]
  labels: [string, string]
  onChange: (items: PairItem[]) => void
}) {
  const { t } = useTranslation()
  return (
    <div className='space-y-2'>
      {props.items.map((item, index) => (
        <div key={index} className='flex items-center gap-2'>
          <Input
            value={item.label}
            placeholder={props.labels[0]}
            onChange={(event) => {
              const next = [...props.items]
              next[index] = { ...item, label: event.target.value }
              props.onChange(next)
            }}
            className='w-40'
          />
          <Input
            value={item.value}
            placeholder={props.labels[1]}
            onChange={(event) => {
              const next = [...props.items]
              next[index] = { ...item, value: event.target.value }
              props.onChange(next)
            }}
            className='flex-1'
          />
          <Button
            size='icon-sm'
            variant='ghost'
            aria-label={t('Remove item')}
            onClick={() =>
              props.onChange(
                props.items.filter((_, itemIndex) => itemIndex !== index)
              )
            }
          >
            <Trash2 className='text-destructive size-4' />
          </Button>
        </div>
      ))}
      <Button
        size='sm'
        variant='outline'
        onClick={() => props.onChange([...props.items, { label: '', value: '' }])}
      >
        <Plus className='mr-1 size-3.5' />
        {t('Add item')}
      </Button>
    </div>
  )
}

function BlockLinkEditor(props: {
  link?: { href: string; label?: string; external?: boolean }
  onChange: (link: { href: string; label: string; external: boolean }) => void
}) {
  const { t } = useTranslation()
  const link = props.link
  return (
    <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
      <Input
        value={link?.href ?? ''}
        placeholder={t('Link URL (optional)')}
        onChange={(event) =>
          props.onChange({
            href: event.target.value,
            label: link?.label ?? '',
            external: link?.external ?? true,
          })
        }
      />
      <Input
        value={link?.label ?? ''}
        placeholder={t('Link label (optional)')}
        onChange={(event) =>
          props.onChange({
            href: link?.href ?? '',
            label: event.target.value,
            external: link?.external ?? true,
          })
        }
      />
    </div>
  )
}

function DocBlockEditor(props: {
  block: DocBlock
  onChange: (block: DocBlock) => void
}) {
  const { t } = useTranslation()
  const block = props.block

  if (block.type === 'markdown') {
    return (
      <Textarea
        value={block.content}
        onChange={(event) =>
          props.onChange({ type: 'markdown', content: event.target.value })
        }
        className='min-h-32 font-mono text-sm'
      />
    )
  }
  if (block.type === 'code') {
    return (
      <div className='space-y-2'>
        <Input
          value={block.title ?? ''}
          placeholder={t('Code title (optional)')}
          onChange={(event) =>
            props.onChange({ ...block, title: event.target.value })
          }
        />
        <Textarea
          value={block.content}
          onChange={(event) =>
            props.onChange({ ...block, content: event.target.value })
          }
          className='min-h-32 font-mono text-sm'
        />
      </div>
    )
  }
  if (block.type === 'image') {
    return (
      <div className='space-y-2'>
        <Input
          value={block.src}
          placeholder='https://... image URL'
          onChange={(event) =>
            props.onChange({ ...block, src: event.target.value })
          }
        />
        <Input
          value={block.alt}
          placeholder={t('Alt text')}
          onChange={(event) =>
            props.onChange({ ...block, alt: event.target.value })
          }
        />
        <Input
          value={block.caption ?? ''}
          placeholder={t('Caption (optional)')}
          onChange={(event) =>
            props.onChange({ ...block, caption: event.target.value })
          }
        />
      </div>
    )
  }
  if (block.type === 'qr') {
    return (
      <div className='space-y-2'>
        <Input
          value={block.src}
          placeholder='https://... QR code image URL'
          onChange={(event) =>
            props.onChange({ ...block, src: event.target.value })
          }
        />
        <div className='grid gap-2 sm:grid-cols-2'>
          <Input
            value={block.title ?? ''}
            placeholder={t('Title')}
            onChange={(event) =>
              props.onChange({ ...block, title: event.target.value })
            }
          />
          <Input
            value={block.alt ?? ''}
            placeholder={t('Alt text')}
            onChange={(event) =>
              props.onChange({ ...block, alt: event.target.value })
            }
          />
        </div>
        <Input
          value={block.description ?? ''}
          placeholder={t('Description')}
          onChange={(event) =>
            props.onChange({ ...block, description: event.target.value })
          }
        />
        <Input
          value={block.caption ?? ''}
          placeholder={t('Caption (optional)')}
          onChange={(event) =>
            props.onChange({ ...block, caption: event.target.value })
          }
        />
        <BlockLinkEditor
          link={block.link}
          onChange={(link) => props.onChange({ ...block, link })}
        />
      </div>
    )
  }
  if (block.type === 'endpoint') {
    return (
      <div className='grid gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1.4fr)]'>
        <select
          value={block.method}
          onChange={(event) =>
            props.onChange({
              ...block,
              method: event.target.value as 'GET' | 'POST',
            })
          }
          className='bg-background w-full rounded-md border px-3 py-2 text-sm'
        >
          <option value='GET'>GET</option>
          <option value='POST'>POST</option>
        </select>
        <Input
          value={block.path}
          placeholder='/v1/...'
          onChange={(event) =>
            props.onChange({ ...block, path: event.target.value })
          }
        />
        <Input
          value={block.description}
          placeholder={t('Description')}
          onChange={(event) =>
            props.onChange({ ...block, description: event.target.value })
          }
        />
      </div>
    )
  }
  if (block.type === 'table') {
    return (
      <div className='space-y-2'>
        <label className='block space-y-1'>
          <span className='text-muted-foreground text-xs'>
            {t('Columns (one per line)')}
          </span>
          <Textarea
            value={block.columns.join('\n')}
            onChange={(event) =>
              props.onChange({
                ...block,
                columns: event.target.value.split('\n'),
              })
            }
            className='min-h-16 font-mono text-xs'
          />
        </label>
        <label className='block space-y-1'>
          <span className='text-muted-foreground text-xs'>
            {t('Rows (one row per line, cells separated by |)')}
          </span>
          <Textarea
            value={block.rows.map((row) => row.join(' | ')).join('\n')}
            onChange={(event) =>
              props.onChange({
                ...block,
                rows: event.target.value
                  .split('\n')
                  .map((line) => line.split('|').map((cell) => cell.trim())),
              })
            }
            className='min-h-32 font-mono text-xs'
          />
        </label>
      </div>
    )
  }
  if (block.type === 'steps') {
    return (
      <div className='space-y-3'>
        {block.items.map((item, index) => (
          <div key={index} className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-xs'>{index + 1}</span>
              <Input
                value={item.title}
                placeholder={t('Step title')}
                onChange={(event) => {
                  const items = [...block.items]
                  items[index] = { ...item, title: event.target.value }
                  props.onChange({ ...block, items })
                }}
                className='flex-1'
              />
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label={t('Remove item')}
                onClick={() =>
                  props.onChange({
                    ...block,
                    items: block.items.filter(
                      (_, itemIndex) => itemIndex !== index
                    ),
                  })
                }
              >
                <Trash2 className='text-destructive size-4' />
              </Button>
            </div>
            <Textarea
              value={item.content}
              placeholder={t('Step content (Markdown supported)')}
              onChange={(event) => {
                const items = [...block.items]
                items[index] = { ...item, content: event.target.value }
                props.onChange({ ...block, items })
              }}
              className='min-h-20 font-mono text-xs'
            />
          </div>
        ))}
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            props.onChange({
              ...block,
              items: [...block.items, { title: '', content: '' }],
            })
          }
        >
          <Plus className='mr-1 size-3.5' />
          {t('Add step')}
        </Button>
      </div>
    )
  }
  if (block.type === 'copy') {
    return (
      <PairEditor
        items={block.items}
        labels={[t('Label'), t('Value ({{SITE}} = current host)')]}
        onChange={(items) => props.onChange({ ...block, items })}
      />
    )
  }
  if (block.type === 'callout') {
    return (
      <div className='space-y-2'>
        <div className='grid gap-2 sm:grid-cols-2'>
          <Input
            value={block.code ?? ''}
            placeholder={t('Badge (e.g. 401, optional)')}
            onChange={(event) =>
              props.onChange({ ...block, code: event.target.value })
            }
          />
          <Input
            value={block.title}
            placeholder={t('Title')}
            onChange={(event) =>
              props.onChange({ ...block, title: event.target.value })
            }
          />
        </div>
        <Textarea
          value={block.text}
          onChange={(event) =>
            props.onChange({ ...block, text: event.target.value })
          }
          className='min-h-20'
        />
      </div>
    )
  }
  if (block.type === 'card') {
    return (
      <div className='space-y-2'>
        <div className='grid gap-2 sm:grid-cols-3'>
          <Input
            value={block.title}
            placeholder={t('Title')}
            onChange={(event) =>
              props.onChange({ ...block, title: event.target.value })
            }
          />
          <Input
            value={block.subtitle ?? ''}
            placeholder={t('Subtitle (optional)')}
            onChange={(event) =>
              props.onChange({ ...block, subtitle: event.target.value })
            }
          />
          <Input
            value={block.badge ?? ''}
            placeholder={t('Badge (optional)')}
            onChange={(event) =>
              props.onChange({ ...block, badge: event.target.value })
            }
          />
        </div>
        <Textarea
          value={block.text ?? ''}
          placeholder={t('Card text (Markdown supported)')}
          onChange={(event) =>
            props.onChange({ ...block, text: event.target.value })
          }
          className='min-h-16'
        />
        {block.rows && block.rows.length > 0 && (
          <div className='space-y-1'>
            <span className='text-muted-foreground text-xs'>
              {t('Key-value rows')}
            </span>
            <PairEditor
              items={block.rows}
              labels={[t('Label'), t('Value')]}
              onChange={(items) => props.onChange({ ...block, rows: items })}
            />
          </div>
        )}
        {block.copies && block.copies.length > 0 && (
          <div className='space-y-1'>
            <span className='text-muted-foreground text-xs'>
              {t('Copyable values')}
            </span>
            <PairEditor
              items={block.copies}
              labels={[t('Label'), t('Value ({{SITE}} = current host)')]}
              onChange={(items) => props.onChange({ ...block, copies: items })}
            />
          </div>
        )}
        <BlockLinkEditor
          link={block.link}
          onChange={(link) => props.onChange({ ...block, link })}
        />
        <label className='text-muted-foreground flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={block.mono ?? false}
            onChange={(event) =>
              props.onChange({ ...block, mono: event.target.checked })
            }
          />
          {t('Monospace title')}
        </label>
      </div>
    )
  }
  if (block.type === 'downloads') {
    return (
      <div className='space-y-2'>
        <Input
          value={block.title}
          placeholder={t('Downloads title')}
          onChange={(event) =>
            props.onChange({ ...block, title: event.target.value })
          }
        />
        <Input
          value={block.description ?? ''}
          placeholder={t('Description')}
          onChange={(event) =>
            props.onChange({ ...block, description: event.target.value })
          }
        />
        <Input
          value={block.href ?? ''}
          placeholder='https://... releases URL'
          onChange={(event) =>
            props.onChange({ ...block, href: event.target.value })
          }
        />
        {block.items.map((item, index) => (
          <div key={index} className='flex items-center gap-2'>
            <Input
              value={item.name}
              placeholder='file-name.exe'
              onChange={(event) => {
                const items = [...block.items]
                items[index] = { ...item, name: event.target.value }
                props.onChange({ ...block, items })
              }}
              className='flex-1'
            />
            <Input
              value={item.desc}
              placeholder={t('File description')}
              onChange={(event) => {
                const items = [...block.items]
                items[index] = { ...item, desc: event.target.value }
                props.onChange({ ...block, items })
              }}
              className='flex-1'
            />
            <Button
              size='icon-sm'
              variant='ghost'
              aria-label={t('Remove item')}
              onClick={() =>
                props.onChange({
                  ...block,
                  items: block.items.filter(
                    (_, itemIndex) => itemIndex !== index
                  ),
                })
              }
            >
              <Trash2 className='text-destructive size-4' />
            </Button>
          </div>
        ))}
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              props.onChange({
                ...block,
                items: [...block.items, { name: '', desc: '' }],
              })
            }
          >
            <Plus className='mr-1 size-3.5' />
            {t('Add file')}
          </Button>
        </div>
        <Input
          value={block.note ?? ''}
          placeholder={t('Footnote (optional)')}
          onChange={(event) =>
            props.onChange({ ...block, note: event.target.value })
          }
        />
      </div>
    )
  }
  return null
}

/**
 * Ordered block list editor: add / move / remove plus the per-type form.
 * Shared by the documentation editor and the About page editor so both
 * surfaces expose exactly the same block vocabulary.
 */
export function DocBlockListEditor(props: {
  blocks: DocBlock[]
  onChange: (blocks: DocBlock[]) => void
  emptyHint: string
}) {
  const { t } = useTranslation()
  const [newBlockType, setNewBlockType] = useState<DocBlock['type']>('markdown')
  const { blocks, onChange } = props

  const patchBlock = (index: number, block: DocBlock) => {
    const next = [...blocks]
    next[index] = block
    onChange(next)
  }

  const moveBlock = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{t('Content blocks')}</span>
        <div className='flex gap-2'>
          <select
            value={newBlockType}
            onChange={(event) =>
              setNewBlockType(event.target.value as DocBlock['type'])
            }
            className='bg-background rounded-md border px-2 py-1.5 text-sm'
          >
            {BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(BLOCK_TYPE_LABELS[type])}
              </option>
            ))}
          </select>
          <Button
            size='sm'
            variant='outline'
            onClick={() => onChange([...blocks, createEmptyBlock(newBlockType)])}
          >
            <Plus className='mr-1 size-3.5' />
            {t('Add block')}
          </Button>
        </div>
      </div>
      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`} className='space-y-2 rounded-lg border p-3'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-muted-foreground font-mono text-xs'>
              #{index + 1} {t(BLOCK_TYPE_LABELS[block.type])}
            </span>
            <div className='flex items-center gap-1'>
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label={t('Move up')}
                disabled={index === 0}
                onClick={() => moveBlock(index, -1)}
              >
                <ArrowUp className='size-4' />
              </Button>
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label={t('Move down')}
                disabled={index === blocks.length - 1}
                onClick={() => moveBlock(index, 1)}
              >
                <ArrowDown className='size-4' />
              </Button>
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label={t('Remove block')}
                onClick={() =>
                  onChange(
                    blocks.filter((_, blockIndex) => blockIndex !== index)
                  )
                }
              >
                <Trash2 className='text-destructive size-4' />
              </Button>
            </div>
          </div>
          <DocBlockEditor
            block={block}
            onChange={(next) => patchBlock(index, next)}
          />
        </div>
      ))}
      {blocks.length === 0 && (
        <p className='text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs'>
          {props.emptyHint}
        </p>
      )}
    </div>
  )
}
