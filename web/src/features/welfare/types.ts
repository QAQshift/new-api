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
export interface WelfarePrize {
  /** Lower bound of the payout when this tier is hit */
  quota: number
  /** Upper bound of the payout. Absent or <= quota means a fixed amount. */
  quota_max?: number
  weight: number
}

/**
 * Lifecycle of a limited-time activity.
 * `disabled` takes priority over the time window.
 */
export type WelfareActivityStatus =
  | 'disabled'
  | 'upcoming'
  | 'active'
  | 'ended'

/**
 * A limited-time activity as seen by a user, including their own progress.
 */
export interface WelfareActivity {
  id: number
  title: string
  description: string
  status: WelfareActivityStatus
  /** Unix seconds; 0 means that side is unbounded */
  starts_at: number
  ends_at: number
  /** Participation gate: the user's total consumption must reach this */
  min_consume_quota: number
  /** Per-user entry cap; 0 means unlimited */
  total_limit: number
  /** Per-user daily entry cap; 0 means unlimited */
  daily_limit: number
  prizes: WelfarePrize[]
  /** The user's total consumption, for showing threshold progress */
  used_quota: number
  entered_count: number
  entered_today: number
  /** Remaining entries; -1 means unlimited */
  remaining_total: number
  remaining_today: number
  threshold_met: boolean
  can_enter: boolean
}

/**
 * Result of entering an activity once
 */
export interface WelfareActivityEntryResult {
  activity_id: number
  entry_index: number
  prize_quota: number
  created_at: number
}

/**
 * An activity as seen by an administrator, with payout statistics.
 */
export interface AdminWelfareActivity {
  id: number
  title: string
  description: string
  starts_at: number
  ends_at: number
  min_consume_quota: number
  total_limit: number
  daily_limit: number
  prizes: WelfarePrize[]
  enabled: boolean
  /** Distinct users that have taken part */
  participant_count: number
  /** Total quota handed out by this activity */
  total_prize_quota: number
}

/**
 * Payload of the user-facing activity list.
 */
export interface WelfareActivitiesPayload {
  activities: WelfareActivity[]
  /**
   * Whether the admin allows showing each tier's chance. Shared with the
   * lottery; absent means "show", matching the pre-toggle behaviour.
   */
  show_prize_probability?: boolean
}

/**
 * Create/update payload. Stored as a JSON string on the server, but always
 * exchanged as an array so callers never build JSON by hand.
 */
export interface WelfareActivityPayload {
  title: string
  description: string
  starts_at: number
  ends_at: number
  min_consume_quota: number
  total_limit: number
  daily_limit: number
  prizes: WelfarePrize[]
  enabled: boolean
}
