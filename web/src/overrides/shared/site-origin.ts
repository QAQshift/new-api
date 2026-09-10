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
 * The relay listens on a fixed path set, so the public address of every
 * deployment is simply the origin the visitor is already browsing. Deriving it
 * from the browser keeps published endpoints correct for custom domains and
 * mirrors without any server-side setting.
 */
export function resolveSiteOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}
