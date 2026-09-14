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
 * One editable prize tier. `id` only exists to give React a stable key while
 * rows are added and removed — it is stripped before the pool is persisted.
 */
export interface LotteryPrizeDraft {
  id: string
  quota: number
  weight: number
}

let prizeSeq = 0

function nextPrizeId(): string {
  prizeSeq += 1
  return `prize-${prizeSeq}`
}

export function createEmptyPrize(): LotteryPrizeDraft {
  return { id: nextPrizeId(), quota: 0, weight: 1 }
}

/**
 * Sum of all tier weights, used to preview each tier's hit chance.
 */
export function totalPrizeWeight(pool: LotteryPrizeDraft[]): number {
  return pool.reduce((sum, prize) => sum + (Number(prize.weight) || 0), 0)
}

/**
 * Parses a prize pool that the backend stores as a JSON string.
 * Missing or malformed input degrades to an empty pool instead of throwing,
 * so a bad stored value cannot break the settings page.
 */
/**
 * Turns a prize pool that arrived as an array (rather than a JSON string)
 * into editable drafts.
 */
export function toPrizeDrafts(
  prizes: ReadonlyArray<{ quota: number; weight: number }>
): LotteryPrizeDraft[] {
  return prizes.map((prize) => ({
    id: nextPrizeId(),
    quota: Number(prize.quota) || 0,
    weight: Number(prize.weight) || 0,
  }))
}

export function parseLotteryPool(value: string | undefined): LotteryPrizeDraft[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null
      )
      .map((item) => ({
        id: nextPrizeId(),
        quota: Number(item.quota) || 0,
        weight: Number(item.weight) || 0,
      }))
  } catch {
    return []
  }
}

/**
 * Serialises a pool for the backend, dropping the editor-only `id`.
 */
export function serializeLotteryPool(pool: LotteryPrizeDraft[]): string {
  return JSON.stringify(
    pool.map((prize) => ({ quota: prize.quota, weight: prize.weight }))
  )
}

/**
 * Compares two pools independently of object key order, so a round-trip
 * through the backend never looks like a user edit.
 */
export function poolSignature(pool: LotteryPrizeDraft[]): string {
  return JSON.stringify(pool.map((prize) => [prize.quota, prize.weight]))
}
