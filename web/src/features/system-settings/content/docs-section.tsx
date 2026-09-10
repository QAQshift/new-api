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
  Eye,
  FileText,
  FolderPlus,
  Layers,
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

import { DocBlocksView } from '@/overrides/docs/doc-blocks'
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
import { DocBlockListEditor } from './doc-block-editor'

type DocsSectionProps = {
  data: string
}

function clone<T>(value: T): T {
  return structuredClone(value)
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
        const fromContent = contentToBlocks(value.content)
        const resolvedBlocks: DocBlock[] = fromContent ?? asDocBlockArray(value.blocks)
        const resolvedTitle =
          typeof value.title === 'string' && value.title.trim()
            ? (value.title as string)
            : id
        return {
          id,
          categoryId,
          eyebrow:
            typeof value.eyebrow === 'string' ? (value.eyebrow as string) : '',
          title: resolvedTitle,
          summary:
            typeof value.summary === 'string' ? (value.summary as string) : '',
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
    const overrideBlocks = asDocBlockArray(override.blocks)
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
        overrideBlocks.length > 0 ? overrideBlocks : (fromContent ?? section.blocks),
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
      eyebrow:
        typeof value.eyebrow === 'string' ? (value.eyebrow as string) : '',
      title,
      summary:
        typeof value.summary === 'string' ? (value.summary as string) : '',
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

export function DocsSection(props: DocsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [document, setDocument] = useState<DocsDocument>(() =>
    parseStoredDocument(props.data)
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                window.open('/docs', '_blank', 'noopener,noreferrer')
              }
            >
              <Eye className='mr-2 size-4' />
              {t('Open full public docs')}
            </Button>
            <Button size='sm' variant='outline' onClick={addCategory}>
              <FolderPlus className='mr-2 size-4' />
              {t('Add group')}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={saveAll}
              disabled={!hasChanges || updateOption.isPending}
            >
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

                    <DocBlockListEditor
                      blocks={selectedSection.blocks}
                      onChange={(blocks) =>
                        patchSection(selectedSection.id, { blocks })
                      }
                      emptyHint={t(
                        'No content blocks. Use "Reset to built-in" to load the default content.'
                      )}
                    />

                    <div className='flex justify-between gap-2 border-t pt-4'>
                      <Button
                        variant='destructive'
                        onClick={() => deleteSection(selectedSection.id)}
                      >
                        <Trash2 className='mr-2 size-4' />
                        {t('Delete section')}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={saveAll}
                        disabled={!hasChanges || updateOption.isPending}
                      >
                        <Save className='mr-2 size-4' />
                        {updateOption.isPending
                          ? t('Saving...')
                          : t('Save Settings')}
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
