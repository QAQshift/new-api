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
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { Switch } from '@/components/ui/switch'

import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import {
  nextTierId,
  percentToRateBp,
  rateBpToPercent,
  serializeAffiliateTiers,
  tierStartsAt,
  type AffiliateTierDraft,
} from '../utils/affiliate-tiers'
import { safeNumberFieldProps } from '../utils/numeric-field'

const schema = z.object({
  enabled: z.boolean(),
  tiers: z
    .array(
      z.object({
        id: z.string(),
        times: z.coerce.number().int().min(0),
        ratePercent: z.coerce.number().min(0).max(100),
      })
    )
    .min(1),
  cooldownDays: z.coerce.number().int().min(0),
  maxRebatePerInvitee: z.coerce.number().int().min(0),
})

type Values = z.infer<typeof schema>

export interface AffiliateSettingsDefaults {
  enabled: boolean
  tiers: AffiliateTierDraft[]
  cooldownDays: number
  maxRebatePerInvitee: number
}

export function AffiliateSettingsSection({
  defaultValues,
}: {
  defaultValues: AffiliateSettingsDefaults
}) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const form = useForm<Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Values>,
    defaultValues: {
      enabled: defaultValues.enabled,
      tiers: defaultValues.tiers.map((tier) => ({
        id: tier.id,
        times: tier.times,
        ratePercent: rateBpToPercent(tier.rateBp),
      })),
      cooldownDays: defaultValues.cooldownDays,
      maxRebatePerInvitee: defaultValues.maxRebatePerInvitee,
    },
  })

  const { isDirty, isSubmitting } = form.formState
  const enabled = form.watch('enabled')
  const tiers = form.watch('tiers')

  const setTiers = (next: Values['tiers']) => {
    form.setValue('tiers', next, { shouldDirty: true })
  }

  const updateTier = (index: number, patch: Partial<Values['tiers'][number]>) => {
    setTiers(tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)))
  }

  async function onSubmit(values: Values) {
    const updates: Array<{ key: string; value: string }> = []

    if (values.enabled !== defaultValues.enabled) {
      updates.push({
        key: 'affiliate_setting.enabled',
        value: String(values.enabled),
      })
    }

    const nextTiers = serializeAffiliateTiers(
      values.tiers.map((tier) => ({
        id: tier.id,
        times: tier.times,
        rateBp: percentToRateBp(tier.ratePercent),
      }))
    )
    if (nextTiers !== serializeAffiliateTiers(defaultValues.tiers)) {
      updates.push({ key: 'affiliate_setting.tiers', value: nextTiers })
    }

    if (values.cooldownDays !== defaultValues.cooldownDays) {
      updates.push({
        key: 'affiliate_setting.cooldown_days',
        value: String(values.cooldownDays),
      })
    }

    if (values.maxRebatePerInvitee !== defaultValues.maxRebatePerInvitee) {
      updates.push({
        key: 'affiliate_setting.max_rebate_per_invitee',
        value: String(values.maxRebatePerInvitee),
      })
    }

    if (updates.length === 0) {
      toast.info(t('No changes to save'))
      return
    }

    for (const update of updates) {
      await updateOption.mutateAsync(update)
    }

    form.reset(values)
  }

  return (
    <SettingsSection title={t('Referral Rebate Settings')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOption.isPending || isSubmitting}
            isSaveDisabled={!isDirty}
            saveLabel='Save referral rebate settings'
          />

          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Enable referral rebate')}</FormLabel>
                  <FormDescription>
                    {t(
                      'Reward inviters with a rebate on every top-up made by the users they invited. Rebates clear a cooling-off period before they can be transferred to the balance.'
                    )}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={updateOption.isPending || isSubmitting}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />

          {enabled && (
            <div className='space-y-6'>
              <FormItem>
                <FormLabel>{t('Rebate tiers')}</FormLabel>
                <FormDescription>
                  {t(
                    'Tiers are matched by how many times an invited user has topped up. Set the times to 0 for the fallback tier that covers all remaining top-ups — it is required when the feature is enabled.'
                  )}
                </FormDescription>

                <div className='space-y-2'>
                  {tiers.map((tier, index) => {
                    const startsAt = tierStartsAt(
                      tiers.map((item) => ({
                        id: item.id,
                        times: item.times,
                        rateBp: 0,
                      })),
                      index
                    )
                    return (
                      <div
                        key={tier.id}
                        className='flex flex-wrap items-end gap-2 rounded-lg border p-3'
                      >
                        <div className='min-w-24 flex-1 space-y-1.5'>
                          <label className='text-muted-foreground text-xs'>
                            {t('Up to top-up #')}
                          </label>
                          <Input
                            type='number'
                            min={0}
                            value={tier.times}
                            disabled={updateOption.isPending || isSubmitting}
                            onChange={(event) => {
                              // 忽略 NaN，避免把非法中间态写进配置
                              const next = event.target.valueAsNumber
                              if (Number.isFinite(next)) {
                                updateTier(index, { times: Math.trunc(next) })
                              }
                            }}
                          />
                        </div>

                        <div className='min-w-24 flex-1 space-y-1.5'>
                          <label className='text-muted-foreground text-xs'>
                            {t('Rebate rate (%)')}
                          </label>
                          <Input
                            type='number'
                            min={0}
                            max={100}
                            step={0.01}
                            value={tier.ratePercent}
                            disabled={updateOption.isPending || isSubmitting}
                            onChange={(event) => {
                              const next = event.target.valueAsNumber
                              if (Number.isFinite(next)) {
                                updateTier(index, { ratePercent: next })
                              }
                            }}
                          />
                        </div>

                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-muted-foreground hover:text-destructive size-9 shrink-0 p-0'
                          disabled={tiers.length <= 1}
                          aria-label={t('Remove tier')}
                          onClick={() =>
                            setTiers(tiers.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className='size-4' />
                        </Button>

                        <p className='text-muted-foreground w-full text-xs'>
                          {tier.times > 0
                            ? t('Applies to top-ups {{from}}–{{to}}', {
                                from: startsAt,
                                to: tier.times,
                              })
                            : t('Applies from top-up {{from}} onward', {
                                from: startsAt,
                              })}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-2'
                  disabled={updateOption.isPending || isSubmitting}
                  onClick={() =>
                    setTiers([
                      ...tiers,
                      { id: nextTierId(), times: 0, ratePercent: 0 },
                    ])
                  }
                >
                  <Plus className='size-4' />
                  {t('Add tier')}
                </Button>
              </FormItem>

              <div className='grid gap-6 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='cooldownDays'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Cooling-off period (days)')}</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='7'
                          {...safeNumberFieldProps(field)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          'How long a rebate stays pending before it can be transferred. This window also covers payment disputes, so keep it in line with your payment provider.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='maxRebatePerInvitee'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Rebate cap per invitee')}</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='0'
                          {...safeNumberFieldProps(field)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          'Maximum rebate a single invited user can generate. Set 0 for no limit.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
