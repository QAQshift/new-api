/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

export const IMAGE_UPLOAD_LIMITS = {
  logo: 512 * 1024,
  background: 4 * 1024 * 1024,
} as const

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export function isImageDataUrl(value: string) {
  return /^data:image\/(?:gif|jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(
    value
  )
}

export function readImageFileAsDataUrl(file: File, maxBytes: number) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(new Error('Unsupported image type'))
  }
  if (file.size > maxBytes) {
    return Promise.reject(new Error('Image file is too large'))
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string' && isImageDataUrl(reader.result)) {
        resolve(reader.result)
      } else {
        reject(new Error('Unable to read image'))
      }
    })
    reader.addEventListener('error', () =>
      reject(new Error('Unable to read image'))
    )
    reader.readAsDataURL(file)
  })
}
