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
 * Theme customization constants and types.
 *
 * Lives in `lib/` (not `context/`) so it can be imported alongside the
 * provider without breaking React Fast Refresh boundaries.
 */

export const THEME_PRESETS = [
  {
    value: 'default',
    name: 'Default',
    swatches: ['oklch(0.72 0.18 250)', 'oklch(0.7 0.12 280)'],
  },
  {
    // Inspired by Anthropic's official brand language: warm cream canvas
    // (#faf9f5) paired with clay/coral (#d97757) as the single accent.
    // Swatches preview the canvas → accent gradient that defines the system.
    value: 'anthropic',
    name: 'Anthropic',
    swatches: ['oklch(0.984 0.005 95)', 'oklch(0.685 0.142 38)'],
  },
  {
    value: 'simple-large',
    name: 'Simple Large-font',
    swatches: ['oklch(0.15 0 0)', 'oklch(0.99 0 0)'],
  },
  {
    value: 'underground',
    name: 'Underground',
    swatches: ['oklch(0.5315 0.0694 156.19)', 'oklch(0.5748 0.0862 336.52)'],
  },
  {
    value: 'rose-garden',
    name: 'Rose Garden',
    swatches: ['oklch(0.5827 0.2418 12.23)', 'oklch(0.8131 0.1129 5.67)'],
  },
  {
    value: 'lake-view',
    name: 'Lake View',
    swatches: ['oklch(0.765 0.177 163.22)', 'oklch(0.551 0.0899 200.52)'],
  },
  {
    value: 'sunset-glow',
    name: 'Sunset Glow',
    swatches: ['oklch(0.5591 0.1882 25.33)', 'oklch(0.7938 0.1248 42.42)'],
  },
  {
    value: 'forest-whisper',
    name: 'Forest Whisper',
    swatches: ['oklch(0.5276 0.1072 182.22)', 'oklch(0.5236 0.0505 250.18)'],
  },
  {
    value: 'ocean-breeze',
    name: 'Ocean Breeze',
    swatches: ['oklch(0.5461 0.2152 262.88)', 'oklch(0.5854 0.2041 277.12)'],
  },
  {
    value: 'lavender-dream',
    name: 'Lavender Dream',
    swatches: ['oklch(0.5709 0.1808 306.89)', 'oklch(0.811 0.0589 201.14)'],
  },
  {
    value: 'glass',
    name: 'Glass',
    swatches: ['oklch(0.968 0.004 265)', 'oklch(0.56 0.26 264)'],
  },
] as const

export type ThemePreset = (typeof THEME_PRESETS)[number]['value']
export type ThemeRadius = 'default' | 'none' | 'sm' | 'md' | 'lg' | 'xl'
export type ThemeScale = 'default' | 'sm' | 'lg' | 'xl'
export type ContentLayout = 'full' | 'centered'

/**
 * Sidebar shell shape and collapse behaviour. These used to be per-user
 * preferences kept in a layout cookie; when appearance became an
 * administrator-controlled setting they moved here and travel with the rest
 * of the theme so the whole site renders one shell.
 */
export type SidebarVariant = 'inset' | 'sidebar' | 'floating'
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none'

/**
 * Sidebar rail width. `SIDEBAR_WIDTHS` resolves the choice to the CSS custom
 * property the sidebar layout already reads.
 */
export type SidebarWidth = 'compact' | 'default' | 'wide'

export const SIDEBAR_WIDTHS: Record<SidebarWidth, string> = {
  compact: '11.5rem',
  default: '13rem',
  wide: '15rem',
}

/**
 * Upper bound for centered content (`--max-content-width`). Only meaningful
 * together with `contentLayout: 'centered'`.
 */
export type ContentWidth = 'default' | 'wide' | 'ultra'

export const CONTENT_WIDTHS: Record<ContentWidth, string> = {
  default: '1280px',
  wide: '1536px',
  ultra: '1792px',
}

/**
 * Glass recipe strength. `default` is the tuned preset; the other two trade
 * how much of the aurora shows through the panes against how solid they read.
 */
export type GlassIntensity = 'soft' | 'default' | 'heavy'

/**
 * Brand accent override. Empty string means "follow the selected preset" —
 * anything else must be a `#RRGGBB` literal. When set, the provider also
 * derives a readable `--primary-foreground` from its luminance so buttons and
 * badges stay legible on a light accent.
 */
export type ThemePrimary = string

/**
 * Font axis for the theme.
 *
 * - `default` — resolve at runtime from the active preset
 *   (see `PRESET_DEFAULT_FONT`). The shipped `default` and `anthropic`
 *   presets resolve to serif; other named color presets fall back to
 *   sans unless they list a different choice. Mirrors how
 *   `radius: 'default'` defers to a per-preset hint.
 * - `sans` — humanist sans (Public Sans), the project's UI fallback.
 * - `serif` — editorial serif (Lora + CJK fallbacks), the project's
 *   "soul" typography. Inherits across the whole UI; monospace contexts
 *   keep their own family via Tailwind preflight and `.font-mono`.
 */
export type ThemeFont = 'default' | 'sans' | 'serif'

/**
 * The resolved (non-`default`) font value applied to the DOM. The provider
 * always sets `data-theme-font` to one of these concrete values so CSS only
 * needs simple attribute selectors (no `:not()` gymnastics, no per-preset
 * font branches).
 */
export type ResolvedThemeFont = Exclude<ThemeFont, 'default'>

export type ThemeCustomization = {
  preset: ThemePreset
  font: ThemeFont
  radius: ThemeRadius
  scale: ThemeScale
  contentLayout: ContentLayout
  contentWidth: ContentWidth
  sidebarVariant: SidebarVariant
  sidebarCollapsible: SidebarCollapsible
  sidebarWidth: SidebarWidth
  glassIntensity: GlassIntensity
  primary: ThemePrimary
  background: string
}

export const DEFAULT_THEME_CUSTOMIZATION: ThemeCustomization = {
  preset: 'default',
  font: 'default',
  radius: 'default',
  scale: 'default',
  contentLayout: 'full',
  contentWidth: 'default',
  sidebarVariant: 'inset',
  sidebarCollapsible: 'icon',
  sidebarWidth: 'default',
  glassIntensity: 'default',
  primary: '',
  background: '',
}

export const THEME_PRESET_VALUES = new Set(
  THEME_PRESETS.map((p) => p.value)
) as ReadonlySet<ThemePreset>

export const THEME_FONT_VALUES: ReadonlySet<ThemeFont> = new Set([
  'default',
  'sans',
  'serif',
])

export const THEME_RADIUS_VALUES: ReadonlySet<ThemeRadius> = new Set([
  'default',
  'none',
  'sm',
  'md',
  'lg',
  'xl',
])

export const THEME_SCALE_VALUES: ReadonlySet<ThemeScale> = new Set([
  'default',
  'sm',
  'lg',
  'xl',
])

export const CONTENT_LAYOUT_VALUES: ReadonlySet<ContentLayout> = new Set([
  'full',
  'centered',
])

export const SIDEBAR_VARIANT_VALUES: ReadonlySet<SidebarVariant> = new Set([
  'inset',
  'sidebar',
  'floating',
])

export const SIDEBAR_COLLAPSIBLE_VALUES: ReadonlySet<SidebarCollapsible> =
  new Set(['offcanvas', 'icon', 'none'])

export const SIDEBAR_WIDTH_VALUES: ReadonlySet<SidebarWidth> = new Set([
  'compact',
  'default',
  'wide',
])

export const CONTENT_WIDTH_VALUES: ReadonlySet<ContentWidth> = new Set([
  'default',
  'wide',
  'ultra',
])

export const GLASS_INTENSITY_VALUES: ReadonlySet<GlassIntensity> = new Set([
  'soft',
  'default',
  'heavy',
])

/**
 * Normalise an administrator-supplied accent. Anything that is not a
 * `#RRGGBB` literal collapses to `''`, which means "follow the preset".
 */
export function resolveThemePrimary(raw: unknown): ThemePrimary {
  if (typeof raw !== 'string') return ''
  const value = raw.trim()
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : ''
}

/**
 * Pick a readable foreground for a `#RRGGBB` fill using its relative
 * luminance (WCAG formula). Without this a light accent would render white
 * button text on a near-white fill.
 */
export function resolvePrimaryForeground(
  primary: ThemePrimary
): string | null {
  if (!primary) return null
  const channel = (offset: number) => {
    const value = Number.parseInt(primary.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  return luminance > 0.55 ? '#111111' : '#ffffff'
}

export const THEME_COOKIE_KEYS = {
  preset: 'theme_preset',
  font: 'theme_font',
  radius: 'theme_radius',
  scale: 'theme_scale',
  contentLayout: 'theme_content_layout',
} as const

export function resolveThemeCustomization(raw: unknown): ThemeCustomization {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_THEME_CUSTOMIZATION
  }

  const value = raw as Record<string, unknown>
  const preset = THEME_PRESET_VALUES.has(value.preset as ThemePreset)
    ? (value.preset as ThemePreset)
    : DEFAULT_THEME_CUSTOMIZATION.preset
  const font = THEME_FONT_VALUES.has(value.font as ThemeFont)
    ? (value.font as ThemeFont)
    : DEFAULT_THEME_CUSTOMIZATION.font
  const radius = THEME_RADIUS_VALUES.has(value.radius as ThemeRadius)
    ? (value.radius as ThemeRadius)
    : DEFAULT_THEME_CUSTOMIZATION.radius
  const scale = THEME_SCALE_VALUES.has(value.scale as ThemeScale)
    ? (value.scale as ThemeScale)
    : DEFAULT_THEME_CUSTOMIZATION.scale
  const contentLayout = CONTENT_LAYOUT_VALUES.has(
    value.content_layout as ContentLayout
  )
    ? (value.content_layout as ContentLayout)
    : DEFAULT_THEME_CUSTOMIZATION.contentLayout

  const sidebarVariant = SIDEBAR_VARIANT_VALUES.has(
    value.sidebar_variant as SidebarVariant
  )
    ? (value.sidebar_variant as SidebarVariant)
    : DEFAULT_THEME_CUSTOMIZATION.sidebarVariant
  const sidebarCollapsible = SIDEBAR_COLLAPSIBLE_VALUES.has(
    value.sidebar_collapsible as SidebarCollapsible
  )
    ? (value.sidebar_collapsible as SidebarCollapsible)
    : DEFAULT_THEME_CUSTOMIZATION.sidebarCollapsible
  const sidebarWidth = SIDEBAR_WIDTH_VALUES.has(value.sidebar_width as SidebarWidth)
    ? (value.sidebar_width as SidebarWidth)
    : DEFAULT_THEME_CUSTOMIZATION.sidebarWidth
  const contentWidth = CONTENT_WIDTH_VALUES.has(
    value.content_width as ContentWidth
  )
    ? (value.content_width as ContentWidth)
    : DEFAULT_THEME_CUSTOMIZATION.contentWidth
  const glassIntensity = GLASS_INTENSITY_VALUES.has(
    value.glass_intensity as GlassIntensity
  )
    ? (value.glass_intensity as GlassIntensity)
    : DEFAULT_THEME_CUSTOMIZATION.glassIntensity

  const background =
    typeof value.background === 'string' ? value.background.trim() : ''
  return {
    preset,
    font,
    radius,
    scale,
    contentLayout,
    contentWidth,
    sidebarVariant,
    sidebarCollapsible,
    sidebarWidth,
    glassIntensity,
    primary: resolveThemePrimary(value.primary),
    background,
  }
}

/**
 * Preset → default font mapping. Used by the provider to resolve the user's
 * `font: 'default'` preference against the active preset.
 *
 * Co-located with the preset registry so a preset's signature typography
 * is declared in one place. Presets not listed here fall back to the
 * `resolveThemeFont` default of `sans`. The shipped `default` preset
 * opts into serif so the editorial Lora voice is the out-of-the-box
 * experience; vivid color presets stay on the humanist sans so their
 * accents read clearly without competing with the body type.
 */
export const PRESET_DEFAULT_FONT: Partial<
  Record<ThemePreset, ResolvedThemeFont>
> = {
  default: 'sans',
  anthropic: 'serif',
}

/**
 * Resolve a user font preference + active preset into the concrete font that
 * should drive the DOM. Pure function so it's safe to call inside both the
 * effect that applies the attribute and the UI preview that hints at what
 * `default` will render as.
 */
export function resolveThemeFont(
  font: ThemeFont,
  preset: ThemePreset
): ResolvedThemeFont {
  if (font === 'default') {
    return PRESET_DEFAULT_FONT[preset] ?? 'sans'
  }
  return font
}
