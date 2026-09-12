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
  type DocBlock,
  type DocCategory,
  type DocSection,
  type DocsDocument,
  defaultDocument,
} from '@/overrides/docs/default-document'

function clone<T>(value: T): T {
  return structuredClone(value)
}

type StoredDocRecord = {
  id?: unknown
  label?: unknown
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

/**
 * Resolve a stored group's display name. The editor and the admin option API
 * both persist `label`, so that is the authoritative field; `title`/`eyebrow`
 * are only read as a fallback for older payloads that reused a section field
 * for the group name.
 */
function resolveCategoryLabel(value: StoredDocRecord): string {
  if (typeof value.label === 'string' && value.label.trim()) {
    return value.label.trim()
  }
  if (typeof value.title === 'string' && value.title.trim()) {
    return value.title.trim()
  }
  if (typeof value.eyebrow === 'string' && value.eyebrow.trim()) {
    return value.eyebrow.trim()
  }
  return ''
}

/**
 * Build the editable document from the value stored in `console_setting.docs`.
 *
 * A saved v3 document is authoritative. Legacy payloads (v2 overrides and
 * standalone docs) are migrated onto the built-in document.
 */
export function parseStoredDocument(data: string): DocsDocument {
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
              return {
                id,
                label: resolveCategoryLabel(value),
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
        const resolvedBlocks: DocBlock[] =
          fromContent ?? asDocBlockArray(value.blocks)
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
        overrideBlocks.length > 0
          ? overrideBlocks
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
