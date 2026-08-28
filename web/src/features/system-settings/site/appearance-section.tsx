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
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
}

type AppearanceSectionProps = {
  defaultValues: AppearanceSettings
}

type SelectOption = { value: string; label: string }

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
