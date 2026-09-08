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
  ArrowDown,
  ArrowUp,
  Eye,
  FileText,
  FolderPlus,
  Layers,
  Plus,
  RotateCcw,
  Save,
  SquarePlus,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  DocBlocksView,
} from '@/overrides/docs/doc-blocks'
import {
  type DocBlock,
  type DocCategory,
  type DocSection,
  type DocsDocument,
  defaultDocSections,
  defaultDocument,
} from '@/overrides/docs/default-document'

import { SettingsSwitchField } from '../components/settings-form-layout'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type DocsSectionProps = {
  data: string
}

const BLOCK_TYPE_LABELS: Record<DocBlock['type'], string> = {
  markdown: 'Markdown',
  code: 'Code',
  image: 'Image',
  endpoint: 'Endpoint',
  table: 'Table',
  steps: 'Steps',
  copy: 'Copy row',
  callout: 'Callout',
  card: 'Card',
  downloads: 'Downloads',
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

type StoredDocRecord = {
  id?: unknown
  categoryId?: unknown
  sectionId?: unknown
  eyebrow?: unknown
  title?: unknown
  summary?: unknown
  content?: unknown
  blocks?: unknown
  published?: unknown
  order?: unknown
}

function asDocBlockArray(value: unknown): DocBlock[] {
  return Array.isArray(value) ? (value as DocBlock[]) : []
}

function contentToBlocks(value: unknown): DocBlock[] | null {
  if (typeof value === 'string' && value.trim()) {
    const blocks: DocBlock[] = [{ type: 'markdown', content: value }]
    return blocks
  }
  return null
}

function parseStoredDocument(data: string): DocsDocument {
  const base = clone(defaultDocument)
  let parsed: unknown
  try {
    parsed = JSON.parse(data || '[]')
  } catch {
    return base
  }
  let records: unknown[] = []
  let storedCategories: unknown[] | null = null
  let isV3 = false
  if (Array.isArray(parsed)) {
    records = parsed
  } else if (parsed && typeof parsed === 'object') {
    const envelope = parsed as {
      version?: number
      categories?: unknown[]
      sections?: unknown[]
    }
    records = Array.isArray(envelope.sections) ? envelope.sections : []
    storedCategories = Array.isArray(envelope.categories)
      ? envelope.categories
      : null
    isV3 = envelope.version === 3 || (storedCategories?.length ?? 0) > 0
  }

  if (isV3) {
    const docCategories =
      storedCategories && storedCategories.length > 0
        ? (storedCategories as unknown[])
            .filter((item) => item && typeof item === 'object')
            .map((item, index): DocCategory => {
              const value = item as StoredDocRecord
              const id =
                typeof value.id === 'string' && value.id
                  ? (value.id as string)
                  : `cat-${index + 1}`
              let label = ''
              if (typeof value.title === 'string' && value.title) {
                label = value.title as string
              } else if (typeof value.eyebrow === 'string' && value.eyebrow) {
                label = value.eyebrow as string
              }
              return {
                id,
                label,
                order:
                  typeof value.order === 'number' && value.order >= 0
                    ? value.order
                    : index,
              }
            })
        : base.categories
    const knownCategoryIds = new Set(docCategories.map((item) => item.id))
    const sections = (records as unknown[])
      .map((item, index): DocSection | null => {
        if (!item || typeof item !== 'object') return null
        const value = item as StoredDocRecord
        const id =
          typeof value.id === 'string' && value.id
            ? (value.id as string).trim()
            : ''
        if (!id) return null
        const trimmedCategory =
          typeof value.categoryId === 'string' && value.categoryId
            ? (value.categoryId as string).trim()
            : ''
        const categoryId =
          trimmedCategory && knownCategoryIds.has(trimmedCategory)
            ? trimmedCategory
            : (docCategories[0]?.id ?? 'custom')
        const blocks = asDocBlockArray(value.blocks)
        const fromContent = contentToBlocks(value.content)
        const resolvedBlocks: DocBlock[] = fromContent ?? blocks
        const resolvedTitle =
          typeof value.title === 'string' && value.title.trim()
            ? (value.title as string)
            : id
        return {
          id,
          categoryId,
          eyebrow: typeof value.eyebrow === 'string' ? (value.eyebrow as string) : '',
          title: resolvedTitle,
          summary: typeof value.summary === 'string' ? (value.summary as string) : '',
          published: value.published !== false,
          order:
            typeof value.order === 'number' && value.order >= 0
              ? value.order
              : index,
          blocks: resolvedBlocks,
        }
      })
      .filter((section): section is DocSection => section !== null)
    return { version: 3, categories: docCategories, sections }
  }

  // Legacy payloads (v2 overrides + standalone docs): migrate onto defaults.
  const overrides = new Map<string, StoredDocRecord>()
  const customDocs: StoredDocRecord[] = []
  for (const item of records as unknown[]) {
    if (!item || typeof item !== 'object') continue
    const value = item as StoredDocRecord
    const sectionId =
      typeof value.sectionId === 'string' && value.sectionId
        ? (value.sectionId as string).trim()
        : ''
    if (sectionId) {
      overrides.set(sectionId, value)
    } else {
      customDocs.push(value)
    }
  }
  const sections = base.sections.map((section): DocSection => {
    const override = overrides.get(section.id)
    if (!override) return section
    const fromContent = contentToBlocks(override.content)
    return {
      ...section,
      eyebrow:
        typeof override.eyebrow === 'string' && override.eyebrow
          ? (override.eyebrow as string)
          : section.eyebrow,
      title:
        typeof override.title === 'string' && override.title.trim()
          ? (override.title as string)
          : section.title,
      summary:
        typeof override.summary === 'string' && override.summary
          ? (override.summary as string)
          : section.summary,
      published: override.published !== false,
      order:
        typeof override.order === 'number' && override.order >= 0
          ? override.order
          : section.order,
      blocks:
        asDocBlockArray(override.blocks).length > 0
          ? asDocBlockArray(override.blocks)
          : (fromContent ?? section.blocks),
    }
  })
  const hasCustomCategory = base.categories.some(
    (category) => category.id === 'custom'
  )
  const mergedCategories: DocCategory[] = hasCustomCategory
    ? base.categories
    : [
        ...base.categories,
        { id: 'custom', label: 'Custom documentation', order: 90 },
      ]
  customDocs.forEach((value, index) => {
    const title =
      typeof value.title === 'string' && value.title.trim()
        ? (value.title as string)
        : ''
    if (!title) return
    const fromContent = contentToBlocks(value.content)
    const blocks: DocBlock[] = fromContent ?? asDocBlockArray(value.blocks)
    const id =
      typeof value.id === 'string' && value.id
        ? (value.id as string)
        : `custom-doc-${index + 1}`
    sections.push({
      id,
      categoryId: 'custom',
      eyebrow: typeof value.eyebrow === 'string' ? (value.eyebrow as string) : '',
      title,
      summary: typeof value.summary === 'string' ? (value.summary as string) : '',
      published: value.published !== false,
      order:
        typeof value.order === 'number' && value.order >= 0
          ? value.order
          : 1000 + index,
      blocks,
    })
  })
  return { version: 3, categories: mergedCategories, sections }
}

function createEmptyBlock(type: DocBlock['type']): DocBlock {
  switch (type) {
    case 'markdown':
      return { type: 'markdown', content: '' }
    case 'code':
      return { type: 'code', content: '', title: '' }
    case 'image':
      return { type: 'image', src: '', alt: '', caption: '' }
    case 'endpoint':
      return { type: 'endpoint', method: 'GET', path: '', description: '' }
    case 'table':
      return { type: 'table', columns: ['列 A', '列 B'], rows: [['', '']] }
    case 'steps':
      return { type: 'steps', items: [{ title: '', content: '' }] }
    case 'copy':
      return { type: 'copy', items: [{ label: '', value: '' }] }
    case 'callout':
      return { type: 'callout', code: '', title: '', text: '' }
    case 'card':
      return { type: 'card', title: '', text: '', mono: false }
    case 'downloads':
      return { type: 'downloads', title: '', items: [{ name: '', desc: '' }] }
    default:
      return { type: 'markdown', content: '' }
  }
}

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

function BlockEditor(props: {
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
        <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'>
          <Input
            value={block.link?.href ?? ''}
            placeholder={t('Link URL (optional)')}
            onChange={(event) =>
              props.onChange({
                ...block,
                link: {
                  href: event.target.value,
                  label: block.link?.label ?? '',
                  external: block.link?.external ?? true,
                },
              })
            }
          />
          <Input
            value={block.link?.label ?? ''}
            placeholder={t('Link label (optional)')}
            onChange={(event) =>
              props.onChange({
                ...block,
                link: {
                  href: block.link?.href ?? '',
                  label: event.target.value,
                  external: block.link?.external ?? true,
                },
              })
            }
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

export function DocsSection(props: DocsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [document, setDocument] = useState<DocsDocument>(() =>
    parseStoredDocument(props.data)
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [newBlockType, setNewBlockType] = useState<DocBlock['type']>('markdown')

  useEffect(() => {
    setDocument(parseStoredDocument(props.data))
    setSelectedId(null)
    setPreview(false)
    setHasChanges(false)
  }, [props.data])

  const selectedSection = useMemo(
    () =>
      selectedId
        ? document.sections.find((section) => section.id === selectedId) ?? null
        : null,
    [document.sections, selectedId]
  )
  const selectedCategory = useMemo(
    () =>
      selectedId && selectedId.startsWith('category:')
        ? document.categories.find(
            (category) => `category:${category.id}` === selectedId
          ) ?? null
        : null,
    [document.categories, selectedId]
  )

  const markChanged = () => setHasChanges(true)

  const patchSection = (sectionId: string, patch: Partial<DocSection>) => {
    setDocument((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    }))
    markChanged()
  }

  const patchBlocks = (sectionId: string, blocks: DocBlock[]) => {
    patchSection(sectionId, { blocks })
  }

  const patchBlock = (sectionId: string, index: number, block: DocBlock) => {
    const section = document.sections.find((item) => item.id === sectionId)
    if (!section) return
    const blocks = [...section.blocks]
    blocks[index] = block
    patchBlocks(sectionId, blocks)
  }

  const moveBlock = (sectionId: string, index: number, delta: number) => {
    const section = document.sections.find((item) => item.id === sectionId)
    if (!section) return
    const target = index + delta
    if (target < 0 || target >= section.blocks.length) return
    const blocks = [...section.blocks]
    ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
    patchBlocks(sectionId, blocks)
  }

  const removeBlock = (sectionId: string, index: number) => {
    const section = document.sections.find((item) => item.id === sectionId)
    if (!section) return
    patchBlocks(
      sectionId,
      section.blocks.filter((_, blockIndex) => blockIndex !== index)
    )
  }

  const addBlock = (sectionId: string) => {
    const section = document.sections.find((item) => item.id === sectionId)
    if (!section) return
    patchBlocks(sectionId, [...section.blocks, createEmptyBlock(newBlockType)])
  }

  const addSection = (categoryId: string) => {
    const id = `section-${Date.now().toString(36)}`
    setDocument((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id,
          categoryId,
          eyebrow: '',
          title: t('Untitled section'),
          summary: '',
          published: false,
          order: current.sections.length + 1,
          blocks: [],
        },
      ],
    }))
    setSelectedId(id)
    setPreview(false)
    markChanged()
  }

  const addCategory = () => {
    const id = `category-${Date.now().toString(36)}`
    setDocument((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id,
          label: t('New category'),
          order:
            Math.max(0, ...current.categories.map((item) => item.order)) + 10,
        },
      ],
    }))
    setSelectedId(`category:${id}`)
    markChanged()
  }

  const patchCategory = (categoryId: string, patch: Partial<DocCategory>) => {
    setDocument((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category
      ),
    }))
    markChanged()
  }

  const deleteCategory = (categoryId: string) => {
    setDocument((current) => ({
      ...current,
      categories: current.categories.filter(
        (category) => category.id !== categoryId
      ),
      sections: current.sections.filter(
        (section) => section.categoryId !== categoryId
      ),
    }))
    setSelectedId(null)
    markChanged()
  }

  const deleteSection = (sectionId: string) => {
    setDocument((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== sectionId),
    }))
    setSelectedId(null)
    markChanged()
  }

  const resetSection = (sectionId: string) => {
    const base = defaultDocSections.find((section) => section.id === sectionId)
    if (!base) {
      toast.error(t('Only built-in sections can be reset'))
      return
    }
    patchSection(sectionId, clone(base))
  }

  const saveAll = async () => {
    try {
      await updateOption.mutateAsync({
        key: 'console_setting.docs',
        value: JSON.stringify(document),
      })
      setHasChanges(false)
      toast.success(t('Documentation settings saved'))
    } catch {
      toast.error(t('Failed to save documentation settings'))
    }
  }

  const orderedCategories = useMemo(
    () => [...document.categories].sort((a, b) => a.order - b.order),
    [document.categories]
  )
  const orderedSections = useMemo(
    () => [...document.sections].sort((a, b) => a.order - b.order),
    [document.sections]
  )

  return (
    <SettingsSection title={t('Documentation management')}>
      <div className='space-y-5'>
        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm'>
          <p>
            {t(
              'The documentation page is fully data-driven. Edit sections in place, add groups and sections, or reset any built-in section to its default content.'
            )}
          </p>
          <div className='flex gap-2'>
            <Button size='sm' variant='outline' onClick={addCategory}>
              <FolderPlus className='mr-2 size-4' />
              {t('Add group')}
            </Button>
            <Button size='sm' variant='outline' onClick={saveAll} disabled={!hasChanges || updateOption.isPending}>
              <Save className='mr-2 size-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
          <div className='space-y-4'>
            {orderedCategories.map((category) => {
              const categorySections = orderedSections.filter(
                (section) => section.categoryId === category.id
              )
              return (
                <div key={category.id} className='rounded-xl border p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <button
                      type='button'
                      className='flex min-w-0 flex-1 items-center gap-2 text-left'
                      onClick={() => setSelectedId(`category:${category.id}`)}
                    >
                      <Layers className='text-primary size-4 shrink-0' />
                      <span className='truncate font-medium'>
                        {category.label}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {categorySections.length}
                      </span>
                    </button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('Add section to this group')}
                      onClick={() => addSection(category.id)}
                    >
                      <SquarePlus className='size-4' />
                    </Button>
                  </div>
                  <div className='mt-2 space-y-1'>
                    {categorySections.length === 0 && (
                      <p className='text-muted-foreground px-2 text-xs'>
                        {t('No sections in this group yet')}
                      </p>
                    )}
                    {categorySections.map((section) => (
                      <button
                        key={section.id}
                        type='button'
                        onClick={() => {
                          setSelectedId(section.id)
                          setPreview(false)
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                          selectedId === section.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <span className='truncate'>
                          {section.title || section.id}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                            section.published
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {section.published ? t('Published') : t('Hidden')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            {!selectedSection && !selectedCategory && (
              <div className='text-muted-foreground flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm'>
                <div>
                  <FileText className='mx-auto mb-2 size-7 opacity-60' />
                  {t('Select a group or section to begin editing.')}
                </div>
              </div>
            )}
            {selectedCategory && (
              <div className='space-y-4 rounded-xl border p-4'>
                <h4 className='font-semibold'>{t('Group settings')}</h4>
                <label className='block space-y-1.5'>
                  <span className='text-sm font-medium'>{t('Label')}</span>
                  <Input
                    value={selectedCategory.label}
                    onChange={(event) =>
                      patchCategory(selectedCategory.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </label>
                <label className='block space-y-1.5'>
                  <span className='text-sm font-medium'>{t('Order')}</span>
                  <Input
                    type='number'
                    min={0}
                    value={selectedCategory.order}
                    onChange={(event) =>
                      patchCategory(selectedCategory.id, {
                        order: Number(event.target.value) || 0,
                      })
                    }
                  />
                </label>
                <Button
                  variant='destructive'
                  onClick={() => deleteCategory(selectedCategory.id)}
                >
                  <Trash2 className='mr-2 size-4' />
                  {t('Delete group and its sections')}
                </Button>
              </div>
            )}
            {selectedSection && (
              <div className='space-y-4 rounded-xl border p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h4 className='font-semibold'>{t('Section editor')}</h4>
                  <div className='flex gap-2'>
                    {defaultDocSections.some(
                      (section) => section.id === selectedSection.id
                    ) && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => resetSection(selectedSection.id)}
                      >
                        <RotateCcw className='mr-2 size-4' />
                        {t('Reset to built-in')}
                      </Button>
                    )}
                    <div className='flex gap-1 rounded-lg border p-1'>
                      <Button
                        size='sm'
                        variant={!preview ? 'secondary' : 'ghost'}
                        onClick={() => setPreview(false)}
                      >
                        {t('Edit')}
                      </Button>
                      <Button
                        size='sm'
                        variant={preview ? 'secondary' : 'ghost'}
                        onClick={() => setPreview(true)}
                      >
                        <Eye className='mr-1.5 size-3.5' />
                        {t('Preview')}
                      </Button>
                    </div>
                  </div>
                </div>
                {preview ? (
                  <div className='max-h-[75vh] overflow-y-auto rounded-lg border p-5'>
                    {selectedSection.eyebrow && (
                      <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
                        {selectedSection.eyebrow}
                      </p>
                    )}
                    <h2 className='mt-2 text-2xl font-semibold tracking-tight'>
                      {selectedSection.title}
                    </h2>
                    {selectedSection.summary && (
                      <p className='text-muted-foreground mt-3 leading-7'>
                        {selectedSection.summary}
                      </p>
                    )}
                    <div className='mt-6'>
                      <DocBlocksView blocks={selectedSection.blocks} />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]'>
                      <label className='space-y-1.5'>
                        <span className='text-sm font-medium'>{t('Title')}</span>
                        <Input
                          value={selectedSection.title}
                          maxLength={200}
                          onChange={(event) =>
                            patchSection(selectedSection.id, {
                              title: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className='space-y-1.5'>
                        <span className='text-sm font-medium'>
                          {t('Eyebrow label')}
                        </span>
                        <Input
                          value={selectedSection.eyebrow}
                          maxLength={100}
                          onChange={(event) =>
                            patchSection(selectedSection.id, {
                              eyebrow: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className='space-y-1.5'>
                        <span className='text-sm font-medium'>{t('Order')}</span>
                        <Input
                          type='number'
                          min={0}
                          value={selectedSection.order}
                          onChange={(event) =>
                            patchSection(selectedSection.id, {
                              order: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className='block space-y-1.5'>
                      <span className='text-sm font-medium'>{t('Summary')}</span>
                      <Input
                        value={selectedSection.summary}
                        maxLength={500}
                        onChange={(event) =>
                          patchSection(selectedSection.id, {
                            summary: event.target.value,
                          })
                        }
                      />
                    </label>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <label className='block space-y-1.5'>
                        <span className='text-sm font-medium'>{t('Group')}</span>
                        <select
                          value={selectedSection.categoryId}
                          onChange={(event) =>
                            patchSection(selectedSection.id, {
                              categoryId: event.target.value,
                            })
                          }
                          className='bg-background w-full rounded-md border px-3 py-2 text-sm'
                        >
                          {orderedCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className='flex items-end'>
                        <SettingsSwitchField
                          checked={selectedSection.published}
                          onCheckedChange={(checked) =>
                            patchSection(selectedSection.id, {
                              published: checked,
                            })
                          }
                          label={t('Publish this section')}
                          description={t(
                            'Hidden sections are removed from the navigation and the page.'
                          )}
                          className='py-0'
                        />
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>
                          {t('Content blocks')}
                        </span>
                        <div className='flex gap-2'>
                          <select
                            value={newBlockType}
                            onChange={(event) =>
                              setNewBlockType(
                                event.target.value as DocBlock['type']
                              )
                            }
                            className='bg-background rounded-md border px-2 py-1.5 text-sm'
                          >
                            {Object.entries(BLOCK_TYPE_LABELS).map(
                              ([type, label]) => (
                                <option key={type} value={type}>
                                  {t(label)}
                                </option>
                              )
                            )}
                          </select>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => addBlock(selectedSection.id)}
                          >
                            <Plus className='mr-1 size-3.5' />
                            {t('Add block')}
                          </Button>
                        </div>
                      </div>
                      {selectedSection.blocks.map((block, index) => (
                        <div
                          key={`${block.type}-${index}`}
                          className='space-y-2 rounded-lg border p-3'
                        >
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
                                onClick={() =>
                                  moveBlock(selectedSection.id, index, -1)
                                }
                              >
                                <ArrowUp className='size-4' />
                              </Button>
                              <Button
                                size='icon-sm'
                                variant='ghost'
                                aria-label={t('Move down')}
                                disabled={
                                  index === selectedSection.blocks.length - 1
                                }
                                onClick={() =>
                                  moveBlock(selectedSection.id, index, 1)
                                }
                              >
                                <ArrowDown className='size-4' />
                              </Button>
                              <Button
                                size='icon-sm'
                                variant='ghost'
                                aria-label={t('Remove block')}
                                onClick={() =>
                                  removeBlock(selectedSection.id, index)
                                }
                              >
                                <Trash2 className='text-destructive size-4' />
                              </Button>
                            </div>
                          </div>
                          <BlockEditor
                            block={block}
                            onChange={(next) =>
                              patchBlock(selectedSection.id, index, next)
                            }
                          />
                        </div>
                      ))}
                      {selectedSection.blocks.length === 0 && (
                        <p className='text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs'>
                          {t(
                            'No content blocks. Use "Reset to built-in" to load the default content.'
                          )}
                        </p>
                      )}
                    </div>

                    <div className='flex justify-between gap-2 border-t pt-4'>
                      <Button
                        variant='destructive'
                        onClick={() => deleteSection(selectedSection.id)}
                      >
                        <Trash2 className='mr-2 size-4' />
                        {t('Delete section')}
                      </Button>
                      <Button size='sm' variant='outline' onClick={saveAll} disabled={!hasChanges || updateOption.isPending}>
                        <Save className='mr-2 size-4' />
                        {updateOption.isPending ? t('Saving...') : t('Save Settings')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}
