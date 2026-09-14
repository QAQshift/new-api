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
 * Affiliate rebate tiers as stored by the backend.
 *
 * `rate_bp` is a basis-point value (500 = 5%) so the backend never has to do
 * floating-point money math. The admin UI edits percentages and converts at the
 * boundary.
 */
export interface AffiliateTierDraft {
  /** Stable client-side key so reordering/deleting keeps React keys unique. */
  id: string
  /** Covers top-ups 1..times; 0 means "all remaining top-ups" (fallback tier). */
  times: number
  /** Rebate rate in basis points. */
  rateBp: number
}

let tierSequence = 0

export function nextTierId(): string {
  tierSequence += 1
  return `affiliate-tier-${tierSequence}`
}

interface RawTier {
  times?: unknown
  rate_bp?: unknown
}

/**
 * Parses the option value. Tolerates missing or malformed JSON so a corrupted
 * option row cannot break the whole settings page.
 */
export function parseAffiliateTiers(raw: unknown): AffiliateTierDraft[] {
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => {
      const tier = (item ?? {}) as RawTier
      return {
        id: nextTierId(),
        times: Math.trunc(Number(tier.times) || 0),
        rateBp: Math.round(Number(tier.rate_bp) || 0),
      }
    })
  } catch {
    return []
  }
}

/**
 * Serializes tiers for the backend. Values are truncated/rounded to integers so
 * no float ever reaches the option store.
 */
export function serializeAffiliateTiers(
  tiers: ReadonlyArray<AffiliateTierDraft>
): string {
  return JSON.stringify(
    tiers.map((tier) => ({
      times: Math.trunc(Number(tier.times) || 0),
      rate_bp: Math.round(Number(tier.rateBp) || 0),
    }))
  )
}

/** Basis points -> percent, for display in an input. */
export function rateBpToPercent(rateBp: number): number {
  const value = Number(rateBp) || 0
  return Math.round(value) / 100
}

/** Percent -> basis points (integer). */
export function percentToRateBp(percent: number): number {
  const value = Number(percent) || 0
  return Math.round(value * 100)
}

/**
 * First top-up ordinal covered by the tier at `index`.
 * Tier 0 always starts at 1; later tiers continue right after the previous one.
 */
export function tierStartsAt(
  tiers: ReadonlyArray<AffiliateTierDraft>,
  index: number
): number {
  if (index <= 0) return 1
  return Math.trunc(Number(tiers[index - 1]?.times) || 0) + 1
}
