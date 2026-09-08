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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { api } from '@/lib/api'

import { PublicLayout } from '@/components/layout'
import { subscribeDocsChanged } from '@/lib/docs-sync'

import { DocBlocksView } from './doc-blocks'
import {
  type DocBlock,
  type DocCategory,
  type DocSection,
  type DocsDocument,
  defaultDocument,
} from './default-document'

type StoredSection = {
  id?: string
  sectionId?: string
  categoryId?: string
  eyebrow?: string
  title?: string
  summary?: string
  content?: string
  blocks?: DocBlock[]
  published?: boolean
  order?: number
}

type StoredDocs = {
  version?: number
  categories?: DocCategory[]
  sections?: StoredSection[]
}

type DocsResponse = { data?: StoredDocs | StoredSection[] }

function normalizeSection(
  stored: StoredSection,
  fallbackCategoryId: string,
  fallbackOrder: number
): DocSection | null {
  const id = (stored.id || stored.sectionId || '').trim()
  const title = (stored.title || '').trim()
  if (!id || !title) return null
  let blocks: DocBlock[] = []
  if (stored.blocks && stored.blocks.length > 0) {
    blocks = stored.blocks
  } else if (stored.content?.trim()) {
    blocks = [{ type: 'markdown', content: stored.content }]
  }
  return {
    id,
    categoryId: (stored.categoryId || fallbackCategoryId || 'custom').trim(),
    eyebrow: stored.eyebrow?.trim() || '',
    title,
    summary: stored.summary?.trim() || '',
    published: stored.published !== false,
    order: typeof stored.order === 'number' ? stored.order : fallbackOrder,
    blocks,
  }
}

function parseStoredDocs(data: DocsResponse['data']): {
  categories: DocCategory[]
  sections: StoredSection[]
  isV3: boolean
} {
  if (Array.isArray(data)) {
    return { categories: [], sections: data, isV3: false }
  }
  const stored = data ?? {}
  const sections = Array.isArray(stored.sections) ? stored.sections : []
  const categories = Array.isArray(stored.categories)
    ? stored.categories
    : []
  const isV3 = stored.version === 3 || categories.length > 0
  return { categories, sections, isV3 }
}

function getPreviewSectionFromUrl(): StoredSection | null {
  if (typeof window === 'undefined') return null
  const encoded = new URLSearchParams(window.location.search).get('previewDoc')
  if (!encoded) return null
  try {
    const parsed: unknown = JSON.parse(encoded)
    if (!parsed || typeof parsed !== 'object') return null
    const preview = parsed as Partial<StoredSection>
    let sectionId = ''
    if (typeof preview.id === 'string' && preview.id) {
      sectionId = preview.id
    } else if (typeof preview.sectionId === 'string') {
      sectionId = preview.sectionId
    }
    if (!sectionId) return null
    return {
      ...preview,
      id: sectionId,
      sectionId,
      published: true,
    }
  } catch {
    return null
  }
}

/**
 * Build the effective public document. A saved v3 document is authoritative
 * (the admin editor always saves the full document, preloaded with built-in
 * defaults). Legacy v2 payloads keep the old override semantics: overrides
 * replace built-in section chrome/content, standalone docs are appended to a
 * dedicated custom category.
 */
function buildEffectiveDocument(data: DocsResponse['data']): DocsDocument {
  const previewStored = getPreviewSectionFromUrl()
  const stored = parseStoredDocs(data)
  const base = defaultDocument

  if (stored.isV3) {
    const categories = stored.categories.length
      ? [...stored.categories].sort((a, b) => a.order - b.order)
      : base.categories
    const knownCategoryIds = new Set(categories.map((category) => category.id))
    const sectionsById = new Map<string, DocSection>()
    stored.sections.forEach((storedSection, index) => {
      const fallback = knownCategoryIds.has(
        storedSection.categoryId?.trim() || ''
      )
        ? (storedSection.categoryId as string)
        : (categories[0]?.id ?? 'custom')
      const section = normalizeSection(
        storedSection,
        fallback,
        (storedSection.order ?? index) as number
      )
      if (section) sectionsById.set(section.id, section)
    })
    const previewSection = previewStored
      ? normalizeSection(previewStored, categories[0]?.id ?? 'custom', 0)
      : null
    if (previewSection) sectionsById.set(previewSection.id, previewSection)
    const sections = [...sectionsById.values()]
      .filter((section) => section.published)
      .sort((a, b) => a.order - b.order)
    return { version: 3, categories, sections }
  }

  // Legacy merge: overrides apply on top of the built-in document.
  const overrideById = new Map<string, StoredSection>()
  const customDocs: StoredSection[] = []
  const records = previewStored
    ? [...stored.sections, previewStored]
    : stored.sections
  for (const record of records) {
    const sectionId = (record.sectionId || '').trim()
    if (sectionId) {
      overrideById.set(sectionId, record)
    } else if (record.published !== false && record.title?.trim()) {
      customDocs.push(record)
    }
  }

  const sections: DocSection[] = []
  for (const baseSection of base.sections) {
    const override = overrideById.get(baseSection.id)
    if (override && override.published === false) continue
    let overrideBlocks = baseSection.blocks
    if (override?.blocks?.length) {
      overrideBlocks = override.blocks
    } else if (override?.content?.trim()) {
      overrideBlocks = [{ type: 'markdown', content: override.content }]
    }
    const section = normalizeSection(
      {
        ...baseSection,
        ...(override
          ? {
              eyebrow: override.eyebrow ?? baseSection.eyebrow,
              title: override.title || baseSection.title,
              summary: override.summary ?? baseSection.summary,
              blocks: overrideBlocks,
            }
          : {}),
        id: baseSection.id,
      },
      baseSection.categoryId,
      baseSection.order
    )
    if (section) sections.push(section)
  }

  const hasCustomCategory = base.categories.some(
    (category) => category.id === 'custom'
  )
  const categories = [...base.categories]
  if (!hasCustomCategory) {
    categories.push({
      id: 'custom',
      label: 'Custom documentation',
      order: 90,
    })
  }
  customDocs.forEach((record, index) => {
    const section = normalizeSection(
      record,
      'custom',
      1000 + (record.order ?? index)
    )
    if (section) sections.push(section)
  })

  return {
    version: 3,
    categories: categories.sort((a, b) => a.order - b.order),
    sections: sections.sort((a, b) => a.order - b.order),
  }
}

function DocSectionView(props: { section: DocSection }) {
  const section = props.section
  return (
    <section
      id={section.id}
      className='scroll-mt-24 border-t pt-10 first:border-0 first:pt-0'
    >
      {section.eyebrow && (
        <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
          {section.eyebrow}
        </p>
      )}
      <h2 className='mt-2 text-2xl font-semibold tracking-tight md:text-3xl'>
        {section.title}
      </h2>
      {section.summary && (
        <p className='text-muted-foreground mt-3 max-w-3xl leading-7'>
          {section.summary}
        </p>
      )}
      {section.blocks.length > 0 && (
        <div className='mt-6'>
          <DocBlocksView blocks={section.blocks} />
        </div>
      )}
    </section>
  )
}

export function Docs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['public-docs-content'],
    queryFn: async () => {
      try {
        const response = await api.get<DocsResponse>('/api/docs/content')
        return response.data.data
      } catch {
        return undefined
      }
    },
  })

  useEffect(() => {
    return subscribeDocsChanged(() => {
      queryClient.invalidateQueries({ queryKey: ['public-docs-content'] })
    })
  }, [queryClient])

  const docsDocument = useMemo(() => buildEffectiveDocument(data), [data])

  const categories = useMemo(
    () =>
      docsDocument.categories
        .map((category) => ({
          ...category,
          sections: docsDocument.sections
            .filter((section) => section.categoryId === category.id)
            .sort((a, b) => a.order - b.order)
            .map((section) => section.id),
        }))
        .filter((category) => category.sections.length > 0),
    [docsDocument]
  )
  const sectionTitleById = useMemo(() => {
    const map = new Map<string, string>()
    docsDocument.sections.forEach((section) => map.set(section.id, section.title))
    return map
  }, [docsDocument])

  const [activeCategory, setActiveCategory] = useState(() => {
    const sectionId =
      typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    return (
      categories.find((category) =>
        category.sections.includes(sectionId)
      )?.id ??
      categories[0]?.id ??
      ''
    )
  })
  const scrollToSection = (sectionId: string) => {
    const section = document.querySelector<HTMLElement>(`#${sectionId}`)
    if (!section) return
    const headerOffset = 128
    const top =
      section.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
    window.history.replaceState(null, '', `#${sectionId}`)
  }

  useEffect(() => {
    const sections = docsDocument.sections
      .map((section) => document.querySelector<HTMLElement>(`#${section.id}`))
      .filter((section): section is HTMLElement => section !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const sectionId = visible[0]?.target.id
        if (!sectionId) return
        const category = categories.find((item) =>
          item.sections.includes(sectionId)
        )
        if (category) setActiveCategory(category.id)
      },
      { rootMargin: '-128px 0px -55% 0px', threshold: 0 }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [categories, docsDocument.sections])

  return (
    <PublicLayout showMainContainer={false}>
      <div className='mx-auto max-w-7xl px-4 pt-24 pb-10 md:px-8 md:pt-28 md:pb-14'>
        <header className='border-b pb-8'>
          <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
            {t('API DOCUMENTATION')}
          </p>
          <h1 className='mt-3 text-3xl font-semibold tracking-tight md:text-4xl'>
            {t('From first request to production')}
          </h1>
          <p className='text-muted-foreground mt-3 max-w-3xl text-sm leading-7 md:text-base'>
            {t(
              'Choose a documentation category for your task. Each section includes copyable requests, parameter notes, and troubleshooting steps.'
            )}
          </p>
        </header>

        <div
          className='bg-background/85 supports-[backdrop-filter]:bg-background/65 sticky top-16 z-30 mt-6 flex gap-1 overflow-x-auto rounded-xl border p-1 shadow-sm backdrop-blur-xl'
          role='tablist'
          aria-label={t('Documentation categories')}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type='button'
              role='tab'
              aria-selected={activeCategory === category.id}
              aria-controls='docs-section-nav'
              onClick={() => {
                setActiveCategory(category.id)
                scrollToSection(category.sections[0])
              }}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm transition-colors md:px-4 ${
                activeCategory === category.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(category.label)}
            </button>
          ))}
        </div>

        <div className='grid gap-8 pt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12'>
          <aside
            id='docs-section-nav'
            className='lg:sticky lg:top-28 lg:h-fit'
            aria-label={t('Section navigation')}
          >
            <div className='glass-panel max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border p-4'>
              <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.16em] uppercase'>
                {t('Documentation outline')}
              </p>
              <nav className='space-y-4' aria-label={t('Section navigation')}>
                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      type='button'
                      onClick={() => {
                        setActiveCategory(category.id)
                        scrollToSection(category.sections[0])
                      }}
                      className={`mb-1 px-3 text-xs font-semibold tracking-wide uppercase transition-colors ${
                        activeCategory === category.id
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t(category.label)}
                    </button>
                    <div className='space-y-0.5'>
                      {category.sections.map((sectionId) => (
                        <a
                          key={sectionId}
                          href={`#${sectionId}`}
                          onClick={(event) => {
                            event.preventDefault()
                            scrollToSection(sectionId)
                          }}
                          className='text-muted-foreground hover:text-foreground hover:bg-muted/60 block rounded-lg px-3 py-1.5 text-sm transition-colors'
                        >
                          {sectionTitleById.get(sectionId) ?? sectionId}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <main className='min-w-0 space-y-8'>
            {categories.map((category) => (
              <div key={category.id} className='space-y-8'>
                {category.sections.map((sectionId) => {
                  const section = docsDocument.sections.find(
                    (item) => item.id === sectionId
                  )
                  if (!section) return null
                  return <DocSectionView key={sectionId} section={section} />
                })}
              </div>
            ))}
          </main>
        </div>
      </div>
    </PublicLayout>
  )
}
