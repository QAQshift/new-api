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
 * Upper bound of a tier's payout. A missing, zero or too-small max means the
 * tier pays a fixed amount, so the lower bound doubles as the upper one.
 */
export function prizeMax(prize: LotteryPrize): number {
  const max = Number(prize.quota_max) || 0
  return max > prize.quota ? max : prize.quota
}

/**
 * True when the tier pays a range rather than a single fixed amount.
 */
export function isPrizeRange(prize: LotteryPrize): boolean {
  return prizeMax(prize) > prize.quota
}

/**
 * Collapses tiers that award the same amount with the same weight.
 *
 * Identical tiers are the same outcome, so merging them keeps the displayed
 * chance correct and makes "quota-quota_max-weight" a unique key when
 * rendering. Tiers that differ only in their range stay separate.
 */
export function mergeIdenticalPrizes(pool: LotteryPrize[]): LotteryPrize[] {
  const merged = new Map<string, LotteryPrize>()
  for (const prize of pool) {
    const key = `${prize.quota}-${prize.quota_max ?? 0}-${prize.weight}`
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
 * Relative weight of one prize tier, as a percentage.
 *
 * Deliberately unrounded: the caller decides how much precision to show. A tier
 * with weight 1 out of 200 is 0.5%, and rounding that to "1%" before anyone
 * looks at it hides a real difference of a factor of two.
 */
export function prizeWeightPercent(
  prize: LotteryPrize,
  pool: LotteryPrize[]
): number {
  const total = pool.reduce((sum, item) => sum + (Number(item.weight) || 0), 0)
  if (total <= 0) return 0
  return ((Number(prize.weight) || 0) / total) * 100
}

/**
 * Formats a percentage for display: at most two decimals, trailing zeros
 * dropped, so 70 stays "70", 0.5 stays "0.5" and 33.3333 becomes "33.33".
 *
 * A chance that is real but smaller than the displayed precision reports
 * "<0.01" rather than "0" — showing a flat zero for a non-zero chance would be
 * a lie, and the whole point of the extra precision is to tell those apart.
 */
export function formatPrizePercent(percent: number): string {
  if (!Number.isFinite(percent) || percent <= 0) return '0'
  const rounded = Math.round(percent * 100) / 100
  if (rounded === 0) return '<0.01'
  return String(rounded)
}

/**
 * Highest prize amount in the pool, used to surface the headline number.
 */
export function topPrize(pool: LotteryPrize[]): LotteryPrize | null {
  if (pool.length === 0) return null
  return pool.reduce((best, prize) =>
    prizeMax(prize) > prizeMax(best) ? prize : best
  )
}
