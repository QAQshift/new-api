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

export type AboutDocument = {
  version: number
  eyebrow: string
  title: string
  summary: string
  blocks: DocBlock[]
}

/**
 * Normalize a stored About payload. Returns null when nothing usable is
 * configured, which lets the caller fall back to the legacy About content or
 * the built-in page.
 */
export function parseAboutDocument(value: unknown): AboutDocument | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const blocks = Array.isArray(record.blocks)
    ? (record.blocks as DocBlock[])
    : []
  const title = typeof record.title === 'string' ? record.title.trim() : ''
  const summary =
    typeof record.summary === 'string' ? record.summary.trim() : ''
  if (!title && blocks.length === 0) return null
  return {
    version: typeof record.version === 'number' ? record.version : 1,
    eyebrow: typeof record.eyebrow === 'string' ? record.eyebrow : '',
    title,
    summary,
    blocks,
  }
}
