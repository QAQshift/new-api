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

import { parseStoredDocument } from '../docs-document'

function groupLabels(data: string): string[] {
  return parseStoredDocument(data).categories.map((category) => category.label)
}

describe('documentation editor document parsing', () => {
  test('keeps the group names saved by the editor', () => {
    const saved = JSON.stringify({
      version: 3,
      categories: [
        { id: 'getting-started', label: '快速开始', order: 10 },
        { id: 'client-setup', label: '客户端配置', order: 20 },
      ],
      sections: [
        {
          id: 'start',
          categoryId: 'getting-started',
          eyebrow: 'GETTING STARTED',
          title: '五分钟完成首次调用',
          summary: '',
          published: true,
          order: 10,
          blocks: [{ type: 'markdown', content: 'hi' }],
        },
      ],
    })

    const document = parseStoredDocument(saved)

    expect(document.categories.map((category) => category.label)).toEqual([
      '快速开始',
      '客户端配置',
    ])
    expect(document.sections).toHaveLength(1)
    expect(document.sections[0].categoryId).toBe('getting-started')
  })

  test('never round-trips a saved group as nameless', () => {
    const saved = JSON.stringify({
      version: 3,
      categories: [
        { id: 'video-api', label: '视频接口', order: 40 },
        { id: 'support', label: '排错', order: 50 },
      ],
      sections: [],
    })

    expect(groupLabels(saved).every((label) => label.trim() !== '')).toBe(true)
  })

  test('falls back to the built-in group names when nothing is stored', () => {
    const labels = groupLabels('[]')

    expect(labels).toContain('Getting started')
    expect(labels.every((label) => label.trim() !== '')).toBe(true)
  })

  test('migrates legacy overrides without losing group names', () => {
    const legacy = JSON.stringify([
      { sectionId: 'start', title: '自定义标题', published: true },
    ])

    const document = parseStoredDocument(legacy)

    expect(document.sections.find((section) => section.id === 'start')?.title).toBe(
      '自定义标题'
    )
    expect(
      document.categories.every((category) => category.label.trim() !== '')
    ).toBe(true)
  })

  test('reads a legacy group name stored under title', () => {
    const saved = JSON.stringify({
      version: 3,
      categories: [{ id: 'a', title: 'Legacy group', order: 1 }],
      sections: [],
    })

    expect(groupLabels(saved)).toEqual(['Legacy group'])
  })

  test('moves a section with an unknown group onto the first group', () => {
    const saved = JSON.stringify({
      version: 3,
      categories: [{ id: 'a', label: 'A', order: 1 }],
      sections: [
        { id: 's1', categoryId: 'missing', title: 'T', blocks: [] },
      ],
    })

    const document = parseStoredDocument(saved)

    expect(document.sections[0].categoryId).toBe('a')
  })
})
