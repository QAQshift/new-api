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
import { Check, ImagePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ImageUrlField } from '@/components/image-url-field'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { isImageDataUrl } from '@/lib/image-data-url'
import {
  resolvePrimaryForeground,
  THEME_PRESETS,
  type ContentLayout,
  type ContentWidth,
  type GlassIntensity,
  type SidebarVariant,
  type SidebarWidth,
  type ThemeFont,
  type ThemePreset,
  type ThemePrimary,
  type ThemeRadius,
  type ThemeScale,
} from '@/lib/theme-customization'

import { FormDirtyIndicator } from '../components/form-dirty-indicator'
import { FormNavigationGuard } from '../components/form-navigation-guard'
import {
  SettingsForm,
  SettingsFormGrid,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useSettingsForm } from '../hooks/use-settings-form'
import { useUpdateOption } from '../hooks/use-update-option'
import { VisualOptionPicker } from './appearance-visual-options'

export type AppearanceSettings = {
  UIThemePreset: ThemePreset
  UIThemeFont: ThemeFont
  UIThemeRadius: ThemeRadius
  UIThemeScale: ThemeScale
  UIThemeContentLayout: ContentLayout
  UIThemeContentWidth: ContentWidth
  UIThemeSidebarVariant: SidebarVariant
  UIThemeSidebarWidth: SidebarWidth
  UIThemeGlass: GlassIntensity
  UIThemePrimary: ThemePrimary
  UIThemeBackground: string
}

type AppearanceSectionProps = {
  defaultValues: AppearanceSettings
}

export function AppearanceSection(props: AppearanceSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const { form, handleSubmit, handleReset, isDirty, isSubmitting } =
    useSettingsForm<AppearanceSettings>({
      defaultValues: props.defaultValues,
      onSubmit: async (_data, changedFields) => {
        for (const [key, value] of Object.entries(changedFields)) {
          await updateOption.mutateAsync({ key, value: String(value) })
        }
      },
    })

  const fontOptions = [
    { value: 'default', label: t('Automatic') },
    { value: 'sans', label: t('Sans') },
    { value: 'serif', label: t('Serif') },
  ]
  const radiusOptions = [
    { value: 'default', label: t('Automatic') },
    { value: 'none', label: t('None') },
    { value: 'sm', label: t('Small') },
    { value: 'md', label: t('Medium') },
    { value: 'lg', label: t('Large') },
    { value: 'xl', label: t('Extra large') },
  ]
  const scaleOptions = [
    { value: 'sm', label: t('Compact') },
    { value: 'default', label: t('Default') },
    { value: 'lg', label: t('Comfortable') },
    { value: 'xl', label: t('Super Large') },
  ]
  const layoutOptions = [
    { value: 'full', label: t('Full width') },
    { value: 'centered', label: t('Centered') },
  ]
  const sidebarVariantOptions = [
    { value: 'inset', label: t('Inset') },
    { value: 'sidebar', label: t('Standard') },
    { value: 'floating', label: t('Floating') },
  ]
  const sidebarWidthOptions = [
    { value: 'compact', label: t('Compact') },
    { value: 'default', label: t('Default') },
    { value: 'wide', label: t('Wide') },
  ]
  const contentWidthOptions = [
    { value: 'default', label: t('Default') },
    { value: 'wide', label: t('Wide') },
    { value: 'ultra', label: t('Extra wide') },
  ]
  const glassOptions = [
    { value: 'soft', label: t('More transparent') },
    { value: 'default', label: t('Default') },
    { value: 'heavy', label: t('More solid') },
  ]
  const selectedPreset = form.watch('UIThemePreset')
  const selectedFont = form.watch('UIThemeFont')
  const selectedRadius = form.watch('UIThemeRadius')
  const selectedScale = form.watch('UIThemeScale')
  const selectedBackground = form.watch('UIThemeBackground')
  const selectedPresetMeta =
    THEME_PRESETS.find((preset) => preset.value === selectedPreset) ??
    THEME_PRESETS[0]
  // The outer preview corner is driven explicitly rather than only through
  // `--radius`. The administrator has to SEE the difference between "none" and
  // "xl" at a glance, and an explicit value cannot be lost to a cascade change
  // somewhere else in the stylesheet.
  const previewRadiusMap: Record<string, string> = {
    default: '1rem',
    none: '0px',
    sm: '0.3rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  }
  const previewRadius = previewRadiusMap[selectedRadius] ?? '1rem'
  const previewBackground =
    /^https?:\/\//i.test(selectedBackground) ||
    isImageDataUrl(selectedBackground)
      ? `url("${selectedBackground}")`
      : undefined

  return (
    <>
      <FormNavigationGuard when={isDirty} />
      <SettingsSection title={t('Site appearance')}>
        <Form {...form}>
          <SettingsForm onSubmit={handleSubmit}>
            <SettingsPageFormActions
              onSave={handleSubmit}
              onReset={handleReset}
              isSaving={isSubmitting || updateOption.isPending}
              isResetDisabled={!isDirty}
            />
            <FormDirtyIndicator isDirty={isDirty} />
            <SettingsFormGrid>
              <div className='col-span-full space-y-4'>
                <div>
                  <FormLabel>{t('Color preset')}</FormLabel>
                  <FormDescription>
                    {t('Preview and choose the global visual language.')}
                  </FormDescription>
                </div>
                <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = preset.value === selectedPreset
                    return (
                      <button
                        key={preset.value}
                        type='button'
                        aria-pressed={isSelected}
                        onClick={() =>
                          form.setValue('UIThemePreset', preset.value, {
                            shouldDirty: true,
                          })
                        }
                        className={`group relative overflow-hidden rounded-xl border text-left transition-all ${isSelected ? 'border-primary ring-primary ring-2' : 'border-border hover:border-primary/60'}`}
                      >
                        <div
                          className='h-16 p-3'
                          style={{
                            background: `linear-gradient(135deg, ${preset.swatches[0]}, ${preset.swatches[1]})`,
                          }}
                        >
                          <div className='h-2.5 w-1/2 rounded-full bg-white/80' />
                          <div className='mt-2 h-2 w-2/3 rounded-full bg-white/45' />
                        </div>
                        <div className='bg-card flex items-center justify-between px-3 py-2'>
                          <span className='truncate text-xs font-medium'>
                            {t(`preset.${preset.value}`)}
                          </span>
                          {isSelected && (
                            <Check className='text-primary size-4 shrink-0' />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {/* Two mechanisms on purpose: `data-theme-*` makes the real
                    radius/density tokens resolve inside the preview, and the
                    explicit `borderRadius` guarantees the corner still tracks
                    the choice on its own. */}
                <div
                  data-theme-radius={selectedRadius}
                  data-theme-scale={selectedScale}
                  className='relative overflow-hidden rounded-2xl border p-5'
                  style={{
                    borderRadius: previewRadius,
                    backgroundColor:
                      'color-mix(in oklch, var(--card) 72%, transparent)',
                    backgroundImage: previewBackground,
                    backgroundSize: previewBackground ? 'cover' : undefined,
                    backgroundPosition: 'center',
                    boxShadow:
                      '0 1px 2px color-mix(in oklch, var(--foreground) 6%, transparent), 0 8px 24px color-mix(in oklch, var(--foreground) 8%, transparent), inset 0 1px 0 color-mix(in oklch, white 60%, transparent)',
                    backdropFilter: 'blur(20px) saturate(130%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(130%)',
                    fontFamily:
                      selectedFont === 'serif'
                        ? 'var(--font-serif)'
                        : 'var(--font-sans)',
                  }}
                >
                  <div className='bg-background/40 absolute inset-0' />
                  <div className='relative space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase'>
                          {t('Live preview')}
                        </p>
                        <p className='mt-1 text-lg font-semibold'>
                          {t('A polished workspace')}
                        </p>
                      </div>
                      <span
                        className='size-3 rounded-full'
                        style={{
                          backgroundColor: selectedPresetMeta.swatches[1],
                        }}
                      />
                    </div>
                    <div className='grid grid-cols-3 gap-2'>
                      {[t('Fast'), t('Stable'), t('Transparent')].map(
                        (label, index) => (
                          <div
                            key={label}
                            className='bg-card/70 rounded-lg border p-2.5'
                            style={{ borderRadius: previewRadius }}
                          >
                            <div className='text-primary text-sm font-semibold'>
                              {['98ms', '99.9%', '24/7'][index]}
                            </div>
                            <div className='text-muted-foreground mt-1 text-[10px]'>
                              {label}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <VisualOptionPicker
                form={form}
                name='UIThemeFont'
                kind='font'
                label={t('Font')}
                description={t(
                  'Sets the global interface font for every user.'
                )}
                options={fontOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeRadius'
                kind='radius'
                label={t('Border radius')}
                description={t(
                  'Sets the global corner style for controls and panels.'
                )}
                options={radiusOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeScale'
                kind='density'
                label={t('Density')}
                description={t(
                  'Sets the global interface density for every user.'
                )}
                options={scaleOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeContentLayout'
                kind='contentLayout'
                label={t('Content width')}
                description={t(
                  'Sets whether application content is full width or centered.'
                )}
                options={layoutOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeContentWidth'
                kind='contentMaxWidth'
                label={t('Content max width')}
                description={t(
                  'Caps how wide centered content may grow. Only applies when content width is centered.'
                )}
                options={contentWidthOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeSidebarVariant'
                kind='sidebarVariant'
                label={t('Sidebar style')}
                description={t('Sets the sidebar shell for every user.')}
                options={sidebarVariantOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeSidebarWidth'
                kind='sidebarWidth'
                label={t('Sidebar width')}
                description={t('Sets the sidebar rail width for every user.')}
                options={sidebarWidthOptions}
              />
              <VisualOptionPicker
                form={form}
                name='UIThemeGlass'
                kind='glass'
                label={t('Glass intensity')}
                description={t(
                  'Controls how much of the background shows through glass panels. Only affects the Glass preset.'
                )}
                options={glassOptions}
              />
              <FormField
                control={form.control}
                name='UIThemePrimary'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Accent color')}</FormLabel>
                    <FormControl>
                      <div className='flex flex-wrap items-center gap-2'>
                        <input
                          type='color'
                          aria-label={t('Accent color')}
                          value={field.value || '#6366f1'}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          className='border-input h-8 w-12 cursor-pointer rounded-lg border bg-transparent p-0.5'
                        />
                        <Input
                          value={field.value}
                          placeholder={t('Follow the preset')}
                          onChange={(event) =>
                            field.onChange(event.target.value.trim())
                          }
                          className='max-w-48 font-mono'
                        />
                        {field.value ? (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => field.onChange('')}
                          >
                            {t('Reset')}
                          </Button>
                        ) : null}
                        {/* Swatch so the accent is judged by looking at it,
                            not by reading a hex string. Follows the same
                            luminance rule the provider applies. */}
                        <span
                          className='ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold'
                          style={{
                            backgroundColor: field.value || 'var(--primary)',
                            color: field.value
                              ? (resolvePrimaryForeground(field.value) ??
                                'var(--primary-foreground)')
                              : 'var(--primary-foreground)',
                          }}
                        >
                          Aa 字
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Overrides the accent defined by the color preset. Leave empty to follow the preset.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='UIThemeBackground'
                render={({ field }) => (
                  <FormItem className='col-span-full'>
                    <FormLabel className='flex items-center gap-2'>
                      <ImagePlus className='size-4' /> {t('Background image')}
                    </FormLabel>
                    <FormControl>
                      <ImageUrlField
                        value={field.value ?? ''}
                        name={field.name}
                        placeholder={t('Paste an image link from the image library')}
                        previewClassName='h-20 w-32'
                        fit='cover'
                        onClear={() =>
                          form.setValue('UIThemeBackground', '', {
                            shouldDirty: true,
                          })
                        }
                        onChange={(value) =>
                          form.setValue('UIThemeBackground', value.trim(), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Paste a link from the image library. Upload images there first, then copy the link.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsFormGrid>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {t(
                'Users can only switch between light and dark mode. These appearance settings are controlled globally by administrators.'
              )}
            </p>
          </SettingsForm>
        </Form>
      </SettingsSection>
    </>
  )
}
