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

export type AssetImage = {
  name: string
  url: string
  size: number
  modified_at: number
}

export type AssetImageList = {
  items: AssetImage[]
  url_prefix: string
  max_bytes: number
  max_count: number
}

type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
}

export async function listAssetImages(): Promise<AssetImageList> {
  const res = await api.get<ApiEnvelope<AssetImageList>>('/api/assets/images')
  return res.data.data
}

export async function uploadAssetImage(file: File): Promise<AssetImage> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<ApiEnvelope<AssetImage>>(
    '/api/assets/images',
    formData
  )
  return res.data.data
}

export async function deleteAssetImage(name: string): Promise<void> {
  await api.delete(`/api/assets/images/${encodeURIComponent(name)}`)
}

/** Absolute URL for an uploaded image, ready to paste anywhere. */
export function absoluteAssetUrl(url: string): string {
  if (typeof window === 'undefined') return url
  return `${window.location.origin}${url}`
}

export function formatAssetSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
