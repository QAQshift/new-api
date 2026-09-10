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
import type { DocBlock } from '@/overrides/docs/default-document'

export const BLOCK_TYPE_LABELS: Record<DocBlock['type'], string> = {
  markdown: 'Markdown',
  code: 'Code',
  image: 'Image',
  endpoint: 'Endpoint',
  table: 'Table',
  steps: 'Steps',
  copy: 'Copy row',
  qr: 'QR code / contact card',
  callout: 'Callout',
  card: 'Card',
  downloads: 'Downloads',
}

export const BLOCK_TYPES = Object.keys(BLOCK_TYPE_LABELS) as DocBlock['type'][]

export function createEmptyBlock(type: DocBlock['type']): DocBlock {
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
    case 'qr':
      return { type: 'qr', src: '', title: '', caption: '', description: '' }
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
