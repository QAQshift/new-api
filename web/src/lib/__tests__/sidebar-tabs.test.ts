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
import { describe, expect, test } from 'vitest'

import {
  countSidebarTabPages,
  isHttpUrl,
  parseSidebarTabs,
  serializeSidebarTabs,
  sidebarTabPath,
  sidebarTabsSignature,
  visibleSidebarTabCategories,
  type SidebarTabCategoryDraft,
} from '../sidebar-tabs'

const SAMPLE = {
  categories: [
    {
      id: 'cat-1',
      title: '帮助中心',
      items: [
        { id: 'pg-1', title: '使用文档', type: 'link', content: 'https://e.com' },
        {
          id: 'pg-2',
          title: '常见问题',
          type: 'iframe',
          content: 'https://e.com/faq',
        },
        { id: 'pg-3', title: '公告', type: 'html', content: '<p>hi</p>' },
      ],
    },
  ],
}

describe('parseSidebarTabs', () => {
  test('reads every category and page', () => {
    const parsed = parseSidebarTabs(JSON.stringify(SAMPLE))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].title).toBe('帮助中心')
    expect(parsed[0].items.map((item) => item.type)).toEqual([
      'link',
      'iframe',
      'html',
    ])
  })

  test('degrades to an empty list instead of throwing', () => {
    expect(parseSidebarTabs(undefined)).toEqual([])
    expect(parseSidebarTabs('')).toEqual([])
    expect(parseSidebarTabs('   ')).toEqual([])
    expect(parseSidebarTabs('not json')).toEqual([])
    // A JSON array is not the stored shape (the top level is an object)
    expect(parseSidebarTabs('[{"id":"cat-1"}]')).toEqual([])
    // Missing categories key
    expect(parseSidebarTabs('{"other":1}')).toEqual([])
  })

  test('drops malformed entries rather than poisoning the sidebar', () => {
    const parsed = parseSidebarTabs(
      '{"categories":[null,1,"x",{"id":"cat-1","title":"A","items":[null,1,{"id":"pg-1","title":"P"}]}]}'
    )

    expect(parsed).toHaveLength(1)
    expect(parsed[0].items).toHaveLength(1)
    expect(parsed[0].items[0].id).toBe('pg-1')
  })

  test('falls back to a usable type when the stored one is unknown', () => {
    const parsed = parseSidebarTabs(
      '{"categories":[{"id":"cat-1","title":"A","items":[{"id":"pg-1","title":"P","type":"video","content":"https://e.com"}]}]}'
    )

    expect(parsed[0].items[0].type).toBe('link')
  })

  test('fills in a missing id so the editor still has a stable key', () => {
    const parsed = parseSidebarTabs(
      '{"categories":[{"title":"A","items":[{"title":"P"}]}]}'
    )

    expect(parsed[0].id).toBeTruthy()
    expect(parsed[0].items[0].id).toBeTruthy()
  })
})

describe('serializeSidebarTabs', () => {
  test('round-trips through parse without losing anything', () => {
    const parsed = parseSidebarTabs(JSON.stringify(SAMPLE))

    expect(JSON.parse(serializeSidebarTabs(parsed))).toEqual(SAMPLE)
  })

  test('keeps a backend round trip from looking like a user edit', () => {
    const stored = JSON.stringify(SAMPLE)
    const once = parseSidebarTabs(stored)
    const twice = parseSidebarTabs(serializeSidebarTabs(once))

    expect(sidebarTabsSignature(twice)).toBe(sidebarTabsSignature(once))
  })

  test('detects a real edit', () => {
    const once = parseSidebarTabs(JSON.stringify(SAMPLE))
    const edited = parseSidebarTabs(JSON.stringify(SAMPLE))
    edited[0].items[0].content = 'https://other.example'

    expect(sidebarTabsSignature(edited)).not.toBe(sidebarTabsSignature(once))
  })
})

describe('isHttpUrl', () => {
  test('accepts http and https only', () => {
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('http://example.com/a?b=1')).toBe(true)

    // These would execute or embed untrusted content when clicked
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('//example.com')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
  })
})

describe('sidebarTabPath', () => {
  test('builds the in-app route from the page id', () => {
    expect(sidebarTabPath('pg-1')).toBe('/custom-tab/pg-1')
  })
})

describe('visibleSidebarTabCategories', () => {
  test('drops categories and pages that would render as nothing', () => {
    const categories: SidebarTabCategoryDraft[] = [
      { id: 'c1', title: '  ', items: [{ id: 'p1', title: 'A', type: 'link', content: 'https://e.com' }] },
      { id: 'c2', title: 'B', items: [{ id: 'p2', title: '  ', type: 'link', content: 'https://e.com' }] },
      { id: 'c3', title: 'C', items: [] },
      { id: 'c4', title: 'D', items: [{ id: 'p3', title: '标题', type: 'html', content: '<p>x</p>' }] },
    ]

    const visible = visibleSidebarTabCategories(categories)

    expect(visible.map((category) => category.id)).toEqual(['c4'])
  })

  test('keeps every page of a usable category', () => {
    const categories = parseSidebarTabs(JSON.stringify(SAMPLE))
    const visible = visibleSidebarTabCategories(categories)

    expect(visible).toHaveLength(1)
    expect(visible[0].items).toHaveLength(3)
    expect(countSidebarTabPages(visible)).toBe(3)
  })
})
