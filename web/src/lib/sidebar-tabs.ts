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

/**
 * Custom sidebar tabs: a category (its own sidebar group) containing pages.
 *
 * A page is one of three shapes:
 *   - `link`   — opens an external site in a new tab, renders nothing in-app
 *   - `iframe` — an in-app page that embeds the URL
 *   - `html`   — an in-app page that renders the HTML (sanitised at render time)
 *
 * The same limits are enforced by the backend on save; they are repeated here so
 * the editor can disable "add" actions and set input lengths instead of letting
 * the operator hit a server-side rejection after the fact.
 */
export type SidebarTabType = 'link' | 'iframe' | 'html'

export interface SidebarTabDraft {
  /** Stable identifier; it appears in the in-app route, so it must not change. */
  id: string
  title: string
  type: SidebarTabType
  /** A URL for `link`/`iframe`, raw HTML for `html`. */
  content: string
  /** false keeps this page out of the sidebar for everyone. */
  published: boolean
}

export interface SidebarTabCategoryDraft {
  id: string
  title: string
  items: SidebarTabDraft[]
  /** false hides the whole category, including its published pages. */
  published: boolean
}

export const MAX_SIDEBAR_TAB_CATEGORIES = 20
export const MAX_SIDEBAR_TAB_ITEMS_PER_CATEGORY = 30
export const MAX_SIDEBAR_TAB_ITEMS = 100
export const MAX_SIDEBAR_TAB_TITLE_LENGTH = 60
export const MAX_SIDEBAR_TAB_URL_LENGTH = 2000
export const MAX_SIDEBAR_TAB_HTML_LENGTH = 20000

const TAB_TYPES = new Set<string>(['link', 'iframe', 'html'])

/** Radix used for generated ids; base36 keeps them short and URL-safe. */
let idSeq = 0

function nextId(prefix: string): string {
  idSeq += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${random}${idSeq.toString(36)}`
}

export function createCategoryId(): string {
  return nextId('cat')
}

export function createPageId(): string {
  return nextId('pg')
}

/**
 * New entries start as drafts.
 *
 * The whole point of the publish flag is to avoid exposing half-finished work,
 * so the safe default is "not visible until switched on" — the operator has to
 * make a deliberate choice to publish.
 */
export function createEmptyPage(type: SidebarTabType = 'link'): SidebarTabDraft {
  return { id: createPageId(), title: '', type, content: '', published: false }
}

export function createEmptyCategory(): SidebarTabCategoryDraft {
  return {
    id: createCategoryId(),
    title: '',
    items: [createEmptyPage()],
    published: false,
  }
}

/** In-app route for a page that renders content (iframe / html). */
export function sidebarTabPath(id: string): string {
  return `/custom-tab/${id}`
}

/** Whether a page opens an external site rather than an in-app route. */
export function isExternalTab(page: SidebarTabDraft): boolean {
  return page.type === 'link'
}

export function isHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeType(value: unknown): SidebarTabType {
  const raw = typeof value === 'string' ? value : ''
  return TAB_TYPES.has(raw) ? (raw as SidebarTabType) : 'link'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Parses the stored JSON string into editable drafts.
 *
 * Malformed input degrades to an empty list rather than throwing, and individual
 * entries that do not look like a category/page are dropped — a bad stored value
 * must never be able to break the settings page or the sidebar itself.
 */
export function parseSidebarTabs(
  raw: string | null | undefined
): SidebarTabCategoryDraft[] {
  if (!raw || raw.trim() === '') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return []
    const categories = parsed.categories
    if (!Array.isArray(categories)) return []

    return categories
      .filter(isRecord)
      .map((category) => {
        const items = Array.isArray(category.items) ? category.items : []
        return {
          id: String(category.id ?? createCategoryId()),
          title: String(category.title ?? ''),
          published: category.published !== false,
          items: items.filter(isRecord).map((item) => ({
            id: String(item.id ?? createPageId()),
            title: String(item.title ?? ''),
            type: normalizeType(item.type),
            content: String(item.content ?? ''),
            published: item.published !== false,
          })),
        }
      })
  } catch {
    return []
  }
}

/** Serialises the drafts for the backend, dropping editor-only state. */
export function serializeSidebarTabs(
  categories: SidebarTabCategoryDraft[]
): string {
  return JSON.stringify({
    categories: categories.map((category) => ({
      id: category.id,
      title: category.title,
      published: category.published,
      items: category.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        content: item.content,
        published: item.published,
      })),
    })),
  })
}

/**
 * Compares two configs ignoring object key order, so a round-trip through the
 * backend never looks like a user edit.
 */
export function sidebarTabsSignature(
  categories: SidebarTabCategoryDraft[]
): string {
  return JSON.stringify(
    categories.map((category) => [
      category.id,
      category.title,
      category.published,
      category.items.map((item) => [
        item.id,
        item.title,
        item.type,
        item.content,
        item.published,
      ]),
    ])
  )
}

/** Total pages across every category, for the "n / max" hint. */
export function countSidebarTabPages(
  categories: SidebarTabCategoryDraft[]
): number {
  return categories.reduce((sum, category) => sum + category.items.length, 0)
}

/**
 * Whether an entry is visible to users.
 *
 * A missing flag means published: configurations saved before the publish
 * toggle existed have no such field, and treating them as drafts would make
 * every existing entry vanish at once.
 */
export function isPublished(entry: { published?: boolean }): boolean {
  return entry.published !== false
}

/**
 * Entries that will actually render.
 *
 * Filters drafts, empty titles, and categories left without any usable page —
 * an empty sidebar group would be dropped by the sidebar anyway. Keeping this
 * shared means the editor, the sidebar and the custom page route all agree on
 * what "visible" means, so an unpublished page is also unreachable by URL.
 */
export function visibleSidebarTabCategories(
  categories: SidebarTabCategoryDraft[]
): SidebarTabCategoryDraft[] {
  return categories
    .filter(isPublished)
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) => isPublished(item) && item.title.trim() !== ''
      ),
    }))
    .filter((category) => category.title.trim() !== '' && category.items.length > 0)
}
