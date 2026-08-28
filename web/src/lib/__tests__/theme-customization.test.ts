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
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_THEME_CUSTOMIZATION,
  resolveThemeCustomization,
} from '../theme-customization'

describe('resolveThemeCustomization', () => {
  it('maps a valid administrator response to the frontend shape', () => {
    expect(
      resolveThemeCustomization({
        preset: 'forest-whisper',
        font: 'serif',
        radius: 'lg',
        scale: 'sm',
        content_layout: 'centered',
      })
    ).toEqual({
      preset: 'forest-whisper',
      font: 'serif',
      radius: 'lg',
      scale: 'sm',
      contentLayout: 'centered',
    })
  })

  it('accepts the administrator glass preset', () => {
    expect(resolveThemeCustomization({ preset: 'glass' }).preset).toBe('glass')
  })

  it('falls back independently for unsupported values', () => {
    expect(
      resolveThemeCustomization({
        preset: 'unknown',
        font: 'sans',
        radius: 'huge',
        scale: 'xl',
        content_layout: 'sidebar',
      })
    ).toEqual({
      ...DEFAULT_THEME_CUSTOMIZATION,
      font: 'sans',
      scale: 'xl',
    })
  })
})
