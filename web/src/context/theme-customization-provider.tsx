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
import { createContext, useContext, useEffect, useMemo } from 'react'

import { useStatus } from '@/hooks/use-status'
import { removeCookie } from '@/lib/cookies'
import { isImageDataUrl } from '@/lib/image-data-url'
import {
  DEFAULT_THEME_CUSTOMIZATION,
  resolveThemeCustomization,
  resolveThemeFont,
  THEME_COOKIE_KEYS,
  type ThemeCustomization,
} from '@/lib/theme-customization'

function applyAttribute(name: string, value: string | null) {
  const body = document.body
  if (value === null) {
    body.removeAttribute(name)
    return
  }
  body.setAttribute(name, value)
}

function applyBackground(background: string) {
  const body = document.body
  if (!background) {
    body.removeAttribute('data-theme-background')
    body.style.removeProperty('--site-background-image')
    return
  }

  try {
    let imageUrl = background
    if (!isImageDataUrl(background)) {
      const parsed = new URL(background, window.location.origin)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Unsupported background protocol')
      }
      imageUrl = parsed.href
    }
    body.setAttribute('data-theme-background', 'custom')
    body.style.setProperty('--site-background-image', `url("${imageUrl}")`)
  } catch {
    body.removeAttribute('data-theme-background')
    body.style.removeProperty('--site-background-image')
  }
}

type ThemeCustomizationContextType = {
  customization: ThemeCustomization
}

const ThemeCustomizationContext = createContext<ThemeCustomizationContextType>({
  customization: DEFAULT_THEME_CUSTOMIZATION,
})

export function ThemeCustomizationProvider(props: {
  children: React.ReactNode
}) {
  const { status } = useStatus()
  const customization = useMemo(
    () => resolveThemeCustomization(status?.theme_customization),
    [status?.theme_customization]
  )

  useEffect(() => {
    Object.values(THEME_COOKIE_KEYS).forEach(removeCookie)
  }, [])

  useEffect(() => {
    applyAttribute(
      'data-theme-preset',
      customization.preset === DEFAULT_THEME_CUSTOMIZATION.preset
        ? null
        : customization.preset
    )
    applyAttribute(
      'data-theme-font',
      resolveThemeFont(customization.font, customization.preset)
    )
    applyAttribute(
      'data-theme-radius',
      customization.radius === DEFAULT_THEME_CUSTOMIZATION.radius
        ? null
        : customization.radius
    )
    applyAttribute(
      'data-theme-scale',
      customization.scale === DEFAULT_THEME_CUSTOMIZATION.scale
        ? null
        : customization.scale
    )
    applyAttribute('data-theme-content-layout', customization.contentLayout)
    applyBackground(customization.background)
  }, [customization])

  const value = useMemo(() => ({ customization }), [customization])

  return (
    <ThemeCustomizationContext.Provider value={value}>
      {props.children}
    </ThemeCustomizationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeCustomization() {
  return useContext(ThemeCustomizationContext)
}
