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
import { api } from '@/lib/api'

import type {
  AdminWelfareActivity,
  ApiResponse,
  WelfareActivitiesPayload,
  WelfareActivityEntryResult,
  WelfareActivityPayload,
} from './types'

// ============================================================================
// User APIs
// ============================================================================

/**
 * List the limited-time activities this user can see, with their own progress
 */
export async function getWelfareActivities(): Promise<
  ApiResponse<WelfareActivitiesPayload>
> {
  const res = await api.get('/api/user/welfare/activities')
  return res.data
}

/**
 * Take part in an activity once
 */
export async function enterWelfareActivity(
  activityId: number
): Promise<ApiResponse<WelfareActivityEntryResult>> {
  const res = await api.post(
    `/api/user/welfare/activities/${activityId}/draw`
  )
  return res.data
}

// ============================================================================
// Admin APIs
// ============================================================================

/**
 * List every activity, including ones that are not live yet
 */
export async function adminListWelfareActivities(): Promise<
  ApiResponse<{ activities: AdminWelfareActivity[] }>
> {
  const res = await api.get('/api/welfare/admin/activities')
  return res.data
}

export async function adminCreateWelfareActivity(
  payload: WelfareActivityPayload
): Promise<ApiResponse<{ id: number }>> {
  const res = await api.post('/api/welfare/admin/activities', payload)
  return res.data
}

export async function adminUpdateWelfareActivity(
  activityId: number,
  payload: WelfareActivityPayload
): Promise<ApiResponse> {
  const res = await api.put(
    `/api/welfare/admin/activities/${activityId}`,
    payload
  )
  return res.data
}

export async function adminDeleteWelfareActivity(
  activityId: number
): Promise<ApiResponse> {
  const res = await api.delete(`/api/welfare/admin/activities/${activityId}`)
  return res.data
}
