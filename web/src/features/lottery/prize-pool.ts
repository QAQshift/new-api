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
import type { LotteryPrize } from './types'

/**
 * Collapses tiers that award the same amount with the same weight.
 *
 * Identical tiers are the same outcome, so merging them keeps the displayed
 * chance correct and makes "quota-weight" a unique key when rendering.
 */
export function mergeIdenticalPrizes(pool: LotteryPrize[]): LotteryPrize[] {
  const merged = new Map<string, LotteryPrize>()
  for (const prize of pool) {
    const key = `${prize.quota}-${prize.weight}`
    const existing = merged.get(key)
    if (existing) {
      existing.weight += prize.weight
    } else {
      merged.set(key, { ...prize })
    }
  }
  return [...merged.values()]
}

/**
 * Relative weight of one prize tier, as a whole percentage.
 */
export function prizeWeightPercent(
  prize: LotteryPrize,
  pool: LotteryPrize[]
): number {
  const total = pool.reduce((sum, item) => sum + (Number(item.weight) || 0), 0)
  if (total <= 0) return 0
  return Math.round(((Number(prize.weight) || 0) / total) * 100)
}

/**
 * Highest prize amount in the pool, used to surface the headline number.
 */
export function topPrize(pool: LotteryPrize[]): LotteryPrize | null {
  if (pool.length === 0) return null
  return pool.reduce((best, prize) =>
    prize.quota > best.quota ? prize : best
  )
}
