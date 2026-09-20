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
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FieldPath, UseFormReturn } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

/**
 * Visual pickers for the appearance settings.
 *
 * Every setting on this page changes something that a dropdown label cannot
 * convey — how round the corners end up, how tight the spacing reads, how much
 * of the backdrop survives the glass, where the sidebar sits. Each option
 * therefore draws its own miniature of the result, so the choice is made by
 * looking rather than by remembering what "XL" did last time.
 *
 * The miniatures are deliberately built from live theme tokens (including
 * `--background` and `--primary`) rather than fixed greys, so they stay
 * truthful in dark mode and under every colour preset.
 */

type PreviewProps = { value: string }

/* ── Font ─────────────────────────────────────────────────────────────── */

const FONT_FAMILIES: Record<string, string> = {
  default: 'var(--font-body, var(--font-sans))',
  sans: 'var(--font-sans)',
  serif: 'var(--font-serif)',
}

function FontPreview({ value }: PreviewProps) {
  return (
    <span
      className='text-lg leading-none font-semibold'
      style={{ fontFamily: FONT_FAMILIES[value] ?? FONT_FAMILIES.default }}
    >
      Aa 字
    </span>
  )
}

/* ── Radius ───────────────────────────────────────────────────────────── */

const RADII: Record<string, string> = {
  default: '0.6rem',
  none: '0px',
  sm: '0.2rem',
  md: '0.35rem',
  lg: '0.5rem',
  xl: '0.7rem',
}

function RadiusPreview({ value }: PreviewProps) {
  const radius = RADII[value] ?? RADII.default
  return (
    <span className='flex items-end gap-1.5'>
      <span
        className='border-border bg-foreground/10 block size-7 border'
        style={{ borderRadius: radius }}
      />
      <span
        className='border-primary/40 bg-primary/25 block size-4 border'
        style={{ borderRadius: radius }}
      />
    </span>
  )
}

/* ── Density ──────────────────────────────────────────────────────────── */

const DENSITY: Record<string, { gap: string; bar: string }> = {
  sm: { gap: '2px', bar: '3px' },
  default: { gap: '4px', bar: '4px' },
  lg: { gap: '6px', bar: '5px' },
  xl: { gap: '8px', bar: '6px' },
}

const DENSITY_BARS = [100, 74, 88]

function DensityPreview({ value }: PreviewProps) {
  const preset = DENSITY[value] ?? DENSITY.default
  return (
    <span className='flex w-full max-w-24 flex-col' style={{ gap: preset.gap }}>
      {DENSITY_BARS.map((width) => (
        <span
          key={width}
          className='bg-foreground/20 block rounded-full'
          style={{ height: preset.bar, width: `${width}%` }}
        />
      ))}
    </span>
  )
}

/* ── Content width ────────────────────────────────────────────────────── */

function ContentLayoutPreview({ value }: PreviewProps) {
  const centered = value === 'centered'
  return (
    <span className='border-border/70 block w-full max-w-28 rounded-md border p-1'>
      <span
        className={cn(
          'bg-primary/25 block h-5 rounded-sm',
          centered ? 'mx-auto w-2/3' : 'w-full'
        )}
      />
    </span>
  )
}

const CONTENT_MAX_WIDTHS: Record<string, string> = {
  default: '46%',
  wide: '68%',
  ultra: '88%',
}

function ContentMaxWidthPreview({ value }: PreviewProps) {
  return (
    <span className='border-border/70 block w-full max-w-28 rounded-md border p-1'>
      <span
        className='bg-primary/25 mx-auto block h-5 rounded-sm'
        style={{
          width: CONTENT_MAX_WIDTHS[value] ?? CONTENT_MAX_WIDTHS.default,
        }}
      />
    </span>
  )
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */

function SidebarVariantPreview({ value }: PreviewProps) {
  // `inset` and `floating` both inset the rail from the viewport edge; they
  // differ in which side becomes the raised panel — inset raises the CONTENT
  // region, floating raises the rail itself.
  const railIsInset = value !== 'sidebar'
  const railIsPanel = value === 'floating'
  const contentIsPanel = value === 'inset'
  return (
    <span className='border-border/70 flex h-10 w-full max-w-28 overflow-hidden rounded-md border'>
      <span className={cn('flex shrink-0', railIsInset && 'p-1')}>
        <span
          className={cn(
            'bg-foreground/25 block h-full w-3',
            railIsPanel && 'rounded-sm shadow-sm'
          )}
        />
      </span>
      <span className={cn('flex min-w-0 flex-1', contentIsPanel && 'p-1 pl-0.5')}>
        <span
          className={cn(
            'bg-primary/20 block size-full',
            contentIsPanel && 'rounded-sm'
          )}
        />
      </span>
    </span>
  )
}

const SIDEBAR_WIDTHS: Record<string, string> = {
  compact: '20%',
  default: '28%',
  wide: '38%',
}

function SidebarWidthPreview({ value }: PreviewProps) {
  const width = SIDEBAR_WIDTHS[value] ?? SIDEBAR_WIDTHS.default
  return (
    <span className='border-border/70 flex h-10 w-full max-w-28 overflow-hidden rounded-md border'>
      <span
        className='bg-foreground/25 block h-full shrink-0'
        style={{ width }}
      />
      <span className='bg-primary/15 block h-full flex-1' />
    </span>
  )
}

/* ── Glass ────────────────────────────────────────────────────────────── */

const GLASS_ALPHA: Record<string, string> = {
  soft: '26%',
  default: '58%',
  heavy: '88%',
}

function GlassIntensityPreview({ value }: PreviewProps) {
  const alpha = GLASS_ALPHA[value] ?? GLASS_ALPHA.default
  return (
    <span
      className='relative block h-9 w-full max-w-28 overflow-hidden rounded-md'
      style={{
        // Saturated fill standing in for the aurora, so the pane has
        // something visible to let through.
        backgroundImage:
          'linear-gradient(130deg, var(--primary), color-mix(in oklch, var(--primary) 45%, var(--chart-3, var(--primary))))',
      }}
    >
      <span
        className='absolute inset-1.5 rounded-sm border border-white/40'
        style={{
          backgroundColor: `color-mix(in oklch, var(--background) ${alpha}, transparent)`,
        }}
      />
    </span>
  )
}

/* ── Registry ─────────────────────────────────────────────────────────── */

const PREVIEWS: Record<string, (props: PreviewProps) => ReactNode> = {
  font: FontPreview,
  radius: RadiusPreview,
  density: DensityPreview,
  contentLayout: ContentLayoutPreview,
  contentMaxWidth: ContentMaxWidthPreview,
  sidebarVariant: SidebarVariantPreview,
  sidebarWidth: SidebarWidthPreview,
  glass: GlassIntensityPreview,
}

export type PreviewKind = keyof typeof PREVIEWS

type VisualOption = {
  value: string
  label: string
  preview: ReactNode
}

/* ── Picker ───────────────────────────────────────────────────────────── */

type VisualOptionPickerProps<T extends Record<string, string>> = {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description: string
  /** Which miniature to draw beside each choice. */
  kind: PreviewKind
  options: { value: string; label: string }[]
}

/**
 * Card grid replacement for `<Select>`. Mirrors the colour-preset picker at the
 * top of the page: same radiogroup semantics, same selected ring, same
 * thumbnail-then-label rhythm.
 */
export function VisualOptionPicker<T extends Record<string, string>>({
  form,
  name,
  label,
  description,
  kind,
  options,
}: VisualOptionPickerProps<T>) {
  const Preview = PREVIEWS[kind]
  // Pair each choice with its miniature here, so the call sites stay a plain
  // list of labels instead of repeating `<Preview value=... />` per entry.
  const rendered: VisualOption[] = options.map((option) => ({
    ...option,
    preview: <Preview value={option.value} />,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        // Always full width: the cards need room to stay legible.
        <FormItem className='col-span-full'>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div
              role='radiogroup'
              aria-label={label}
              className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'
            >
              {rendered.map((option) => {
                const isSelected = String(field.value) === option.value
                return (
                  <button
                    key={option.value}
                    type='button'
                    role='radio'
                    aria-checked={isSelected}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      'overflow-hidden rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-primary ring-primary ring-2'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className='bg-muted/50 flex h-14 items-center justify-center px-3'>
                      {option.preview}
                    </span>
                    <span className='flex items-center justify-between gap-2 px-2.5 py-1.5'>
                      <span className='truncate text-xs font-medium'>
                        {option.label}
                      </span>
                      {isSelected ? (
                        <Check className='text-primary size-3.5 shrink-0' />
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
