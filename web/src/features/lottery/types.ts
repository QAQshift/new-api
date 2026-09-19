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
 * Generic API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

/**
 * One tier of a prize pool. Tiers are drawn by relative weight.
 */
export interface LotteryPrize {
  /** Lower bound of the payout when this tier is hit */
  quota: number
  /** Upper bound of the payout. Absent or <= quota means a fixed amount. */
  quota_max?: number
  /** Relative weight used by the weighted draw */
  weight: number
}

/**
 * A completed draw.
 */
export interface LotteryDrawRecord {
  id: number
  /** Draw mode the record belongs to: 'segment' or 'tiered' */
  mode: string
  /** 1-based position within the current mode, also the ladder tier */
  draw_index: number
  /** Quota awarded by this draw */
  prize_quota: number
  /** Unix timestamp in seconds */
  created_at: number
}

/**
 * Lottery progress for the current user
 */
export interface LotteryStatus {
  /** Whether the lottery feature is enabled */
  enabled: boolean
  /** 'segment' (fixed consumption per draw) or 'tiered' (growing ladder) */
  mode: string
  /** Quota the user has consumed in total */
  used_quota: number
  /** How many times the user has drawn in the current mode */
  drawn_count: number
  /** Draws available right now */
  drawable_count: number
  /** Cumulative consumption required for the next draw */
  next_threshold: number
  /** Prize pool the next draw will use */
  next_prizes: LotteryPrize[]
  /** Recent draws, newest first */
  records: LotteryDrawRecord[]
  /**
   * Whether the admin allows showing each tier's chance.
   * Absent means "show", matching the behaviour before the toggle existed.
   */
  show_probability?: boolean
}

/**
 * Result of a single draw
 */
export interface LotteryDrawResult {
  mode: string
  draw_index: number
  prize_quota: number
  created_at: number
}
