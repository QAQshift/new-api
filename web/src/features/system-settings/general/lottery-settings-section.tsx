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
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatQuota } from '@/lib/format'

import { LotteryPrizeEditor } from '../components/lottery-prize-editor'
import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import {
  poolSignature,
  serializeLotteryPool,
  type LotteryPrizeDraft,
} from '../utils/lottery-pool'
import { safeNumberFieldProps } from '../utils/numeric-field'

const LOTTERY_MODE_SEGMENT = 'segment'
const LOTTERY_MODE_TIERED = 'tiered'

const schema = z.object({
  enabled: z.boolean(),
  mode: z.enum([LOTTERY_MODE_SEGMENT, LOTTERY_MODE_TIERED]),
  segmentConsumeQuota: z.coerce.number().int().min(0),
  firstThresholdQuota: z.coerce.number().int().min(0),
  thresholdStepQuota: z.coerce.number().int().min(0),
  tierPrizeStep: z.coerce.number().int().min(0),
  tierPrizeMax: z.coerce.number().int().min(0),
  showProbability: z.boolean(),
})

type Values = z.infer<typeof schema>

interface LotterySettingsSectionProps {
  defaultValues: {
    enabled: boolean
    mode: string
    segmentConsumeQuota: number
    segmentPrizes: LotteryPrizeDraft[]
    firstThresholdQuota: number
    thresholdStepQuota: number
    tierPrizes: LotteryPrizeDraft[]
    tierPrizeStep: number
    tierPrizeMax: number
    showProbability: boolean
  }
}

export function LotterySettingsSection({
  defaultValues,
}: LotterySettingsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const [segmentPrizes, setSegmentPrizes] = useState<LotteryPrizeDraft[]>(
    defaultValues.segmentPrizes
  )
  const [tierPrizes, setTierPrizes] = useState<LotteryPrizeDraft[]>(
    defaultValues.tierPrizes
  )

  const form = useForm<Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Values>,
    defaultValues: {
      enabled: defaultValues.enabled,
      // Normalise anything unexpected so the form reflects a usable mode
      mode:
        defaultValues.mode === LOTTERY_MODE_TIERED
          ? LOTTERY_MODE_TIERED
          : LOTTERY_MODE_SEGMENT,
      segmentConsumeQuota: defaultValues.segmentConsumeQuota,
      firstThresholdQuota: defaultValues.firstThresholdQuota,
      thresholdStepQuota: defaultValues.thresholdStepQuota,
      tierPrizeStep: defaultValues.tierPrizeStep,
      tierPrizeMax: defaultValues.tierPrizeMax,
      showProbability: defaultValues.showProbability,
    },
  })

  const { isDirty, isSubmitting } = form.formState
  const enabled = form.watch('enabled')
  const mode = form.watch('mode')

  const prizesDirty =
    poolSignature(segmentPrizes) !== poolSignature(defaultValues.segmentPrizes) ||
    poolSignature(tierPrizes) !== poolSignature(defaultValues.tierPrizes)

  async function onSubmit(values: Values) {
    const updates: Array<{ key: string; value: string }> = []
    const push = (field: string, value: string) =>
      updates.push({ key: `lottery_setting.${field}`, value })

    if (values.enabled !== defaultValues.enabled) {
      push('enabled', String(values.enabled))
    }
    if (values.mode !== defaultValues.mode) {
      push('mode', values.mode)
    }
    if (values.segmentConsumeQuota !== defaultValues.segmentConsumeQuota) {
      push('segment_consume_quota', String(values.segmentConsumeQuota))
    }
    if (values.firstThresholdQuota !== defaultValues.firstThresholdQuota) {
      push('first_threshold_quota', String(values.firstThresholdQuota))
    }
    if (values.thresholdStepQuota !== defaultValues.thresholdStepQuota) {
      push('threshold_step_quota', String(values.thresholdStepQuota))
    }
    if (values.tierPrizeStep !== defaultValues.tierPrizeStep) {
      push('tier_prize_step', String(values.tierPrizeStep))
    }
    if (values.tierPrizeMax !== defaultValues.tierPrizeMax) {
      push('tier_prize_max', String(values.tierPrizeMax))
    }
    if (values.showProbability !== defaultValues.showProbability) {
      // 该开关由福利中心统一持有（同时管抽奖与限时活动），因此写的是它的键
      updates.push({
        key: 'welfare_setting.show_prize_probability',
        value: String(values.showProbability),
      })
    }
    if (
      poolSignature(segmentPrizes) !== poolSignature(defaultValues.segmentPrizes)
    ) {
      push('segment_prizes', serializeLotteryPool(segmentPrizes))
    }
    if (poolSignature(tierPrizes) !== poolSignature(defaultValues.tierPrizes)) {
      push('tier_prizes', serializeLotteryPool(tierPrizes))
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

  const busy = updateOption.isPending || isSubmitting

  return (
    <SettingsSection title={t('Lottery')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={busy}
            isSaveDisabled={!(isDirty || prizesDirty)}
            saveLabel='Save lottery settings'
          />

          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Enable lottery feature')}</FormLabel>
                  <FormDescription>
                    {t(
                      'Let users spend accumulated consumption to draw random quota prizes'
                    )}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={busy}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />

          <FormField
            control={form.control}
            name='showProbability'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Show win probability')}</FormLabel>
                  <FormDescription>
                    {t(
                      'Show the chance of each tier on the user side. This single switch covers both the lottery and limited-time activities.'
                    )}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={busy}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />

          {enabled && (
            <>
              <FormField
                control={form.control}
                name='mode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Lottery mode')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={busy}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full sm:w-72'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LOTTERY_MODE_SEGMENT}>
                          {t('Segment mode')}
                        </SelectItem>
                        <SelectItem value={LOTTERY_MODE_TIERED}>
                          {t('Tiered mode')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {mode === LOTTERY_MODE_TIERED
                        ? t(
                            'Tiered mode: every draw costs a higher total consumption and awards a bigger prize. The ladder is unlimited — the next tier is always computed from the first threshold plus the step.'
                          )
                        : t(
                            'Segment mode: every fixed amount of consumption grants one draw, and the prize pool never changes.'
                          )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === LOTTERY_MODE_SEGMENT ? (
                <div className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='segmentConsumeQuota'
                    render={({ field }) => (
                      <FormItem className='sm:max-w-72'>
                        <FormLabel>
                          {t('Consumption per draw (quota)')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={1}
                            {...safeNumberFieldProps(field)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'Accumulated consumption needed for one draw. Values use the internal quota unit, the same unit as the user balance.'
                          )}
                          {' · '}
                          {t('Users see about {{amount}}', {
                            amount: formatQuota(field.value),
                          })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='space-y-2'>
                    <FormLabel>{t('Segment prize pool')}</FormLabel>
                    <FormDescription>
                      {t(
                        'Quota is credited directly when a tier is hit. Weight is the relative chance of that tier.'
                      )}
                    </FormDescription>
                    <LotteryPrizeEditor
                      pool={segmentPrizes}
                      onChange={setSegmentPrizes}
                      disabled={busy}
                    />
                  </div>
                </div>
              ) : (
                <div className='space-y-6'>
                  <div className='grid gap-6 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='firstThresholdQuota'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('First tier threshold (quota)')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min={1}
                              {...safeNumberFieldProps(field)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t(
                              'Total consumption required for the first draw.'
                            )}
                            {' · '}
                            {t('Users see about {{amount}}', {
                              amount: formatQuota(field.value),
                            })}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='thresholdStepQuota'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('Threshold step per tier (quota)')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min={1}
                              {...safeNumberFieldProps(field)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t(
                              'Tier N needs the first threshold plus (N-1) times this step.'
                            )}
                            {' · '}
                            {t('Users see about {{amount}}', {
                              amount: formatQuota(field.value),
                            })}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <FormLabel>{t('First tier prize pool')}</FormLabel>
                    <FormDescription>
                      {t(
                        'Base prize pool. Every later tier adds the prize step to each amount, so both the smallest and the largest prize grow.'
                      )}
                    </FormDescription>
                    <LotteryPrizeEditor
                      pool={tierPrizes}
                      onChange={setTierPrizes}
                      disabled={busy}
                    />
                  </div>

                  <div className='grid gap-6 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='tierPrizeStep'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('Prize step per tier (quota)')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min={0}
                              {...safeNumberFieldProps(field)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t(
                              'Added to every prize amount for each higher tier. Set 0 to keep prizes flat across tiers.'
                            )}
                            {' · '}
                            {t('Users see about {{amount}}', {
                              amount: formatQuota(field.value),
                            })}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='tierPrizeMax'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Prize cap (quota)')}</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min={0}
                              {...safeNumberFieldProps(field)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t(
                              'Upper bound for a single prize. Set 0 for no cap. Must not be lower than any tier amount below.'
                            )}
                            {' · '}
                            {t('Users see about {{amount}}', {
                              amount: formatQuota(field.value),
                            })}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
