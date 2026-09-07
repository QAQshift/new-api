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
import { Check, ImagePlus, Upload, X } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  IMAGE_UPLOAD_LIMITS,
  isImageDataUrl,
  readImageFileAsDataUrl,
} from '@/lib/image-data-url'
import {
  THEME_PRESETS,
  type ContentLayout,
  type ThemeFont,
  type ThemePreset,
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

export type AppearanceSettings = {
  UIThemePreset: ThemePreset
  UIThemeFont: ThemeFont
  UIThemeRadius: ThemeRadius
  UIThemeScale: ThemeScale
  UIThemeContentLayout: ContentLayout
  UIThemeBackground: string
}

type AppearanceSectionProps = {
  defaultValues: AppearanceSettings
}

type SelectOption = { value: string; label: string }

export function AppearanceSection(props: AppearanceSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const { form, handleSubmit, handleReset, isDirty, isSubmitting } =
    useSettingsForm<AppearanceSettings>({
      defaultValues: props.defaultValues,
      onSubmit: async (_data, changedFields) => {
        for (const [key, value] of Object.entries(changedFields)) {
          await updateOption.mutateAsync({ key, value: String(value) })
        }
      },
    })

  const presetOptions: SelectOption[] = THEME_PRESETS.map((preset) => ({
    value: preset.value,
    label: t(`preset.${preset.value}`),
  }))
  const fontOptions: SelectOption[] = [
    { value: 'default', label: t('Automatic') },
    { value: 'sans', label: t('Sans') },
    { value: 'serif', label: t('Serif') },
  ]
  const radiusOptions: SelectOption[] = [
    { value: 'default', label: t('Automatic') },
    { value: 'none', label: t('None') },
    { value: 'sm', label: t('Small') },
    { value: 'md', label: t('Medium') },
    { value: 'lg', label: t('Large') },
    { value: 'xl', label: t('Extra large') },
  ]
  const scaleOptions: SelectOption[] = [
    { value: 'sm', label: t('Compact') },
    { value: 'default', label: t('Default') },
    { value: 'lg', label: t('Comfortable') },
    { value: 'xl', label: t('Super Large') },
  ]
  const layoutOptions: SelectOption[] = [
    { value: 'full', label: t('Full width') },
    { value: 'centered', label: t('Centered') },
  ]
  const selectedPreset = form.watch('UIThemePreset')
  const selectedFont = form.watch('UIThemeFont')
  const selectedRadius = form.watch('UIThemeRadius')
  const selectedBackground = form.watch('UIThemeBackground')
  const selectedPresetMeta =
    THEME_PRESETS.find((preset) => preset.value === selectedPreset) ??
    THEME_PRESETS[0]
  const previewRadiusMap: Record<string, string> = {
    default: '10px',
    none: '0px',
    sm: '5px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  }
  const previewRadius = previewRadiusMap[selectedRadius] ?? '10px'
  const previewBackground =
    /^https?:\/\//i.test(selectedBackground) ||
    isImageDataUrl(selectedBackground)
      ? `url("${selectedBackground}")`
      : undefined

  const handleBackgroundFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const dataUrl = await readImageFileAsDataUrl(
        file,
        IMAGE_UPLOAD_LIMITS.background
      )
      form.setValue('UIThemeBackground', dataUrl, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      toast.error(
        message === 'Image file is too large'
          ? t('Background image must be 4 MB or smaller')
          : t('Please choose a PNG, JPG, WebP, or GIF image')
      )
    }
  }

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
                <div
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
              <AppearanceSelect
                form={form}
                name='UIThemePreset'
                label={t('Color preset')}
                description={t('Sets the global color palette for every user.')}
                options={presetOptions}
              />
              <AppearanceSelect
                form={form}
                name='UIThemeFont'
                label={t('Font')}
                description={t(
                  'Sets the global interface font for every user.'
                )}
                options={fontOptions}
              />
              <AppearanceSelect
                form={form}
                name='UIThemeRadius'
                label={t('Border radius')}
                description={t(
                  'Sets the global corner style for controls and panels.'
                )}
                options={radiusOptions}
              />
              <AppearanceSelect
                form={form}
                name='UIThemeScale'
                label={t('Density')}
                description={t(
                  'Sets the global interface density for every user.'
                )}
                options={scaleOptions}
              />
              <AppearanceSelect
                form={form}
                name='UIThemeContentLayout'
                label={t('Content width')}
                description={t(
                  'Sets whether application content is full width or centered.'
                )}
                options={layoutOptions}
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
                      <div className='flex flex-wrap items-center gap-3'>
                        {field.value ? (
                          <div className='bg-muted/50 h-20 w-32 overflow-hidden rounded-lg border'>
                            <img
                              src={field.value}
                              alt={t('Background image')}
                              className='size-full object-cover'
                            />
                          </div>
                        ) : (
                          <div className='bg-muted/50 text-muted-foreground flex h-20 w-32 items-center justify-center rounded-lg border text-xs'>
                            {t('No background image')}
                          </div>
                        )}
                        <input
                          ref={backgroundInputRef}
                          type='file'
                          accept='image/png,image/jpeg,image/webp,image/gif'
                          className='hidden'
                          onChange={handleBackgroundFileChange}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => backgroundInputRef.current?.click()}
                        >
                          <Upload className='mr-2 size-4' /> {t('Upload')}
                        </Button>
                        {field.value ? (
                          <Button
                            type='button'
                            variant='ghost'
                            onClick={() =>
                              form.setValue('UIThemeBackground', '', {
                                shouldDirty: true,
                              })
                            }
                          >
                            <X className='mr-2 size-4' /> {t('Clear')}
                          </Button>
                        ) : null}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Upload a PNG, JPG, WebP, or GIF image as the global background. Maximum size: 4 MB.'
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

function AppearanceSelect(props: {
  form: UseFormReturn<AppearanceSettings>
  name: keyof AppearanceSettings
  label: string
  description: string
  options: SelectOption[]
}) {
  return (
    <FormField
      control={props.form.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <FormControl>
            <Select
              items={props.options}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {props.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>{props.description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
