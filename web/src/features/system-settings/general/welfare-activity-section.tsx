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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatQuotaWithCurrency } from '@/lib/currency'
import dayjs from '@/lib/dayjs'
import {
  adminCreateWelfareActivity,
  adminDeleteWelfareActivity,
  adminListWelfareActivities,
  adminUpdateWelfareActivity,
} from '@/features/welfare/api'
import type {
  AdminWelfareActivity,
  WelfareActivityPayload,
} from '@/features/welfare/types'

import { LotteryPrizeEditor } from '../components/lottery-prize-editor'
import {
  QuotaInput,
  QuotaUnitSwitch,
  type QuotaUnitMode,
} from '../components/quota-field'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import {
  createEmptyPrize,
  serializeLotteryPool,
  toPrizeDrafts,
  type LotteryPrizeDraft,
} from '../utils/lottery-pool'

const ACTIVITIES_ENABLED_KEY = 'welfare_setting.activities_enabled'

interface ActivityFormState {
  title: string
  description: string
  /** datetime-local strings; empty means unbounded on that side */
  startsAt: string
  endsAt: string
  minConsumeQuota: number
  totalLimit: number
  dailyLimit: number
  enabled: boolean
}

function emptyForm(): ActivityFormState {
  return {
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    minConsumeQuota: 0,
    totalLimit: 0,
    dailyLimit: 0,
    enabled: false,
  }
}

function toDateTimeInput(seconds: number): string {
  if (!seconds) return ''
  return dayjs(seconds * 1000).format('YYYY-MM-DDTHH:mm')
}

function fromDateTimeInput(value: string): number {
  if (!value) return 0
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.unix() : 0
}

function toFormState(activity: AdminWelfareActivity): ActivityFormState {
  return {
    title: activity.title,
    description: activity.description,
    startsAt: toDateTimeInput(activity.starts_at),
    endsAt: toDateTimeInput(activity.ends_at),
    minConsumeQuota: activity.min_consume_quota,
    totalLimit: activity.total_limit,
    dailyLimit: activity.daily_limit,
    enabled: activity.enabled,
  }
}

interface WelfareActivitySectionProps {
  activitiesEnabled: boolean
  /** 活动自己的展示开关：与抽奖的同名开关互相独立，各写各的配置 */
  showPrizePool: boolean
  showProbability: boolean
  showWinnerList: boolean
}

/**
 * Admin management for limited-time activities.
 *
 * This section owns its own data (activities are rows, not options), so it
 * only borrows the option plumbing for the module master switch.
 */
export function WelfareActivitySection(props: WelfareActivitySectionProps) {
  const { t } = useTranslation()
  // 金额输入单位：管住这个表单里两处金额（消费门槛 + 奖池）。
  // 表单状态里存的始终是内部配额。
  const [unitMode, setUnitMode] = useState<QuotaUnitMode>('quota')
  const updateOption = useUpdateOption()
  const queryClient = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ActivityFormState>(emptyForm())
  const [prizes, setPrizes] = useState<LotteryPrizeDraft[]>([createEmptyPrize()])
  const [saving, setSaving] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const activitiesQuery = useQuery({
    queryKey: ['welfare-admin-activities'],
    queryFn: async () => {
      const res = await adminListWelfareActivities()
      if (res.success && res.data) {
        return res.data.activities
      }
      throw new Error(res.message || t('Failed to fetch welfare activities'))
    },
  })

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm())
    setPrizes([createEmptyPrize()])
    setFormOpen(true)
  }

  function openEditForm(activity: AdminWelfareActivity) {
    setEditingId(activity.id)
    setForm(toFormState(activity))
    setPrizes(
      activity.prizes.length > 0
        ? toPrizeDrafts(activity.prizes)
        : [createEmptyPrize()]
    )
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  async function handleSubmit() {
    const payload: WelfareActivityPayload = {
      title: form.title,
      description: form.description,
      starts_at: fromDateTimeInput(form.startsAt),
      ends_at: fromDateTimeInput(form.endsAt),
      min_consume_quota: form.minConsumeQuota,
      total_limit: form.totalLimit,
      daily_limit: form.dailyLimit,
      prizes: JSON.parse(serializeLotteryPool(prizes)),
      enabled: form.enabled,
    }

    setSaving(true)
    try {
      const res =
        editingId === null
          ? await adminCreateWelfareActivity(payload)
          : await adminUpdateWelfareActivity(editingId, payload)
      if (!res.success) {
        toast.error(res.message || t('Failed to save the activity'))
        return
      }
      toast.success(editingId === null ? t('Activity created') : t('Activity updated'))
      closeForm()
      await queryClient.invalidateQueries({
        queryKey: ['welfare-admin-activities'],
      })
    } catch {
      toast.error(t('Failed to save the activity'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(activityId: number) {
    try {
      const res = await adminDeleteWelfareActivity(activityId)
      if (!res.success) {
        toast.error(res.message || t('Failed to delete the activity'))
        return
      }
      toast.success(t('Activity deleted'))
      setPendingDeleteId(null)
      await queryClient.invalidateQueries({
        queryKey: ['welfare-admin-activities'],
      })
    } catch {
      toast.error(t('Failed to delete the activity'))
    }
  }

  // 这一卡里的开关都是"拨一下立刻存"，没有统一的保存按钮
  async function handleToggleOption(key: string, next: boolean) {
    try {
      await updateOption.mutateAsync({ key, value: String(next) })
    } catch {
      toast.error(t('Failed to update the setting'))
    }
  }

  async function handleToggleModule(next: boolean) {
    await handleToggleOption(ACTIVITIES_ENABLED_KEY, next)
  }

  const activities = activitiesQuery.data ?? []

  return (
    <SettingsSection title={t('Limited-time Activities')}>
      <div className='flex items-start justify-between gap-4 rounded-xl border p-4'>
        <div className='min-w-0'>
          <div className='text-sm font-medium'>
            {t('Enable limited-time activities')}
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t(
              'Shows the activity module in the welfare center. Individual activities still need to be enabled below.'
            )}
          </p>
        </div>
        <Switch
          checked={props.activitiesEnabled}
          disabled={updateOption.isPending}
          onCheckedChange={handleToggleModule}
        />
      </div>

      {/* 以下三个开关只作用于活动。抽奖有各自的一套（在"抽奖"卡里），
          两个模块可以设成不一样。 */}
      <div className='flex items-start justify-between gap-4 rounded-xl border p-4'>
        <div className='min-w-0'>
          <div className='text-sm font-medium'>
            {t('Show the activity prize pool')}
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t(
              'Show what each activity can pay out. Turning this off hides the amounts but keeps the threshold progress and the participate button.'
            )}
          </p>
        </div>
        <Switch
          checked={props.showPrizePool}
          disabled={updateOption.isPending}
          onCheckedChange={(next) =>
            handleToggleOption(
              'welfare_setting.show_activity_prize_pool',
              next
            )
          }
        />
      </div>

      <div className='flex items-start justify-between gap-4 rounded-xl border p-4'>
        <div className='min-w-0'>
          <div className='text-sm font-medium'>
            {t('Show the activity win probability')}
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t(
              'Show the chance of each tier. Only meaningful while the prize pool is visible.'
            )}
          </p>
        </div>
        <Switch
          checked={props.showProbability}
          disabled={updateOption.isPending}
          onCheckedChange={(next) =>
            handleToggleOption('welfare_setting.show_activity_probability', next)
          }
        />
      </div>

      <div className='flex items-start justify-between gap-4 rounded-xl border p-4'>
        <div className='min-w-0'>
          <div className='text-sm font-medium'>{t('Show recent winners')}</div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {t(
              'Show recent winners of each activity on the user side, with names partially masked. Off by default, because it exposes users to each other.'
            )}
          </p>
        </div>
        <Switch
          checked={props.showWinnerList}
          disabled={updateOption.isPending}
          onCheckedChange={(next) =>
            handleToggleOption('welfare_setting.show_winner_list', next)
          }
        />
      </div>

      <div className='flex items-center justify-between gap-4'>
        <div className='text-sm font-medium'>{t('Activities')}</div>
        <Button size='sm' onClick={openCreateForm}>
          <Plus className='h-4 w-4' />
          {t('New activity')}
        </Button>
      </div>

      {formOpen && (
        <div className='space-y-4 rounded-xl border p-4'>
          {/* 放在表单顶部：下面两处金额（消费门槛、奖池）都听它的 */}
          <QuotaUnitSwitch
            mode={unitMode}
            onChange={setUnitMode}
            disabled={saving}
          />

          <div className='text-sm font-semibold'>
            {editingId === null ? t('New activity') : t('Edit activity')}
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Activity name')}
              </label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Consumption requirement')}
              </label>
              <QuotaInput
                value={form.minConsumeQuota}
                mode={unitMode}
                min={0}
                disabled={saving}
                onChange={(quota) =>
                  setForm((prev) => ({ ...prev, minConsumeQuota: quota }))
                }
              />
              <p className='text-muted-foreground text-xs'>
                {t('Users see about {{amount}}', {
                  amount: formatQuotaWithCurrency(form.minConsumeQuota, {
                    digitsLarge: 0,
                  }),
                })}
              </p>
            </div>
          </div>

          <div className='space-y-1.5'>
            <label className='text-muted-foreground text-xs'>
              {t('Description')}
            </label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Starts at')}
              </label>
              <Input
                type='datetime-local'
                value={form.startsAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                }
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Ends at')}
              </label>
              <Input
                type='datetime-local'
                value={form.endsAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                }
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Total entries per user')}
              </label>
              <Input
                type='number'
                min={0}
                value={form.totalLimit}
                onChange={(event) => {
                  const next = event.target.valueAsNumber
                  if (Number.isFinite(next)) {
                    setForm((prev) => ({ ...prev, totalLimit: next }))
                  }
                }}
              />
              <p className='text-muted-foreground text-xs'>
                {t('Set 0 for unlimited.')}
              </p>
            </div>
            <div className='space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Daily entries per user')}
              </label>
              <Input
                type='number'
                min={0}
                value={form.dailyLimit}
                onChange={(event) => {
                  const next = event.target.valueAsNumber
                  if (Number.isFinite(next)) {
                    setForm((prev) => ({ ...prev, dailyLimit: next }))
                  }
                }}
              />
              <p className='text-muted-foreground text-xs'>
                {t('Set 0 for unlimited.')}
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='text-sm font-medium'>{t('Prize pool')}</div>
            <LotteryPrizeEditor
              pool={prizes}
              onChange={setPrizes}
              disabled={saving}
              unitMode={unitMode}
            />
          </div>

          <div className='flex items-center gap-3'>
            <Switch
              checked={form.enabled}
              onCheckedChange={(next) =>
                setForm((prev) => ({ ...prev, enabled: next }))
              }
            />
            <span className='text-sm'>{t('Enable this activity')}</span>
          </div>

          <div className='flex items-center gap-2'>
            <Button size='sm' disabled={saving} onClick={handleSubmit}>
              {saving ? t('Saving...') : t('Save')}
            </Button>
            <Button size='sm' variant='outline' disabled={saving} onClick={closeForm}>
              {t('Cancel')}
            </Button>
          </div>
        </div>
      )}

      {activitiesQuery.isLoading && (
        <div className='text-muted-foreground text-sm'>{t('Loading...')}</div>
      )}

      {!activitiesQuery.isLoading && activities.length === 0 && (
        <div className='text-muted-foreground rounded-xl border p-6 text-center text-sm'>
          {t('No activities yet')}
        </div>
      )}

      {!activitiesQuery.isLoading && activities.length > 0 && (
        <div className='divide-y rounded-xl border'>
          {activities.map((activity) => (
            <div key={activity.id} className='p-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-sm font-medium'>
                      {activity.title}
                    </span>
                    <span className='bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[11px]'>
                      {activity.enabled ? t('Enabled') : t('Disabled')}
                    </span>
                  </div>
                  <div className='text-muted-foreground mt-1 space-y-0.5 text-xs'>
                    <div>
                      {t('Activity period')}:{' '}
                      {activity.starts_at > 0
                        ? dayjs(activity.starts_at * 1000).format(
                            'YYYY-MM-DD HH:mm'
                          )
                        : t('Unlimited')}{' '}
                      ~{' '}
                      {activity.ends_at > 0
                        ? dayjs(activity.ends_at * 1000).format(
                            'YYYY-MM-DD HH:mm'
                          )
                        : t('Unlimited')}
                    </div>
                    <div>
                      {t('Threshold')}:{' '}
                      {activity.min_consume_quota > 0
                        ? formatQuotaWithCurrency(activity.min_consume_quota, {
                            digitsLarge: 0,
                          })
                        : t('No threshold')}
                      {' · '}
                      {t('Total entries per user')}:{' '}
                      {activity.total_limit > 0
                        ? activity.total_limit
                        : t('Unlimited')}
                      {' · '}
                      {t('Daily entries per user')}:{' '}
                      {activity.daily_limit > 0
                        ? activity.daily_limit
                        : t('Unlimited')}
                    </div>
                    <div>
                      {t('Participants')}: {activity.participant_count}
                      {' · '}
                      {t('Distributed')}:{' '}
                      {formatQuotaWithCurrency(activity.total_prize_quota, {
                        digitsLarge: 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className='flex shrink-0 items-center gap-2'>
                  {pendingDeleteId === activity.id ? (
                    <>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleDelete(activity.id)}
                      >
                        {t('Confirm delete')}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setPendingDeleteId(null)}
                      >
                        {t('Cancel')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => openEditForm(activity)}
                      >
                        <Pencil className='h-4 w-4' />
                        {t('Edit')}
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setPendingDeleteId(activity.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                        <span className='sr-only'>{t('Delete')}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
