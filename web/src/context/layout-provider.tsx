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
import { createContext, useContext, useEffect } from 'react'

import { useThemeCustomization } from '@/context/theme-customization-provider'
import { removeCookie } from '@/lib/cookies'

export type Collapsible = 'offcanvas' | 'icon' | 'none'
export type Variant = 'inset' | 'sidebar' | 'floating'

// Cookie constants following the pattern from sidebar.tsx
const LAYOUT_COLLAPSIBLE_COOKIE_NAME = 'layout_collapsible'
const LAYOUT_VARIANT_COOKIE_NAME = 'layout_variant'

// Default values
const DEFAULT_VARIANT = 'inset'
const DEFAULT_COLLAPSIBLE = 'icon'

type LayoutContextType = {
  defaultCollapsible: Collapsible
  collapsible: Collapsible

  defaultVariant: Variant
  variant: Variant
}

const LayoutContext = createContext<LayoutContextType | null>(null)

type LayoutProviderProps = {
  children: React.ReactNode
}

/**
 * Sidebar shell shape.
 *
 * These used to be per-user preferences persisted in a layout cookie. Shell
 * geometry is now part of the administrator-controlled appearance settings, so
 * the provider simply mirrors the resolved theme customization and the tree
 * re-renders when an administrator changes it. Cookies left over from the old
 * per-user flow are cleared on mount.
 */
export function LayoutProvider({ children }: LayoutProviderProps) {
  const { customization } = useThemeCustomization()

  useEffect(() => {
    removeCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME)
    removeCookie(LAYOUT_VARIANT_COOKIE_NAME)
  }, [])

  const contextValue: LayoutContextType = {
    defaultCollapsible: DEFAULT_COLLAPSIBLE,
    // Collapsing is always available to the user (header trigger, Cmd/Ctrl+B)
    // and is not a site-wide setting, so it stays pinned to the icon rail.
    collapsible: DEFAULT_COLLAPSIBLE,
    defaultVariant: DEFAULT_VARIANT,
    variant: customization.sidebarVariant,
  }

  return <LayoutContext value={contextValue}>{children}</LayoutContext>
}

// Define the hook for the provider
// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}
