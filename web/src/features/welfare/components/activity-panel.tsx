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
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuotaWithCurrency } from '@/lib/currency'
import dayjs from '@/lib/dayjs'
import {
  mergeIdenticalPrizes,
  prizeWeightPercent,
} from '@/features/lottery/prize-pool'

import { enterWelfareActivity, getWelfareActivities } from '../api'
import type { WelfareActivity } from '../types'

function formatTime(timestamp: number): string {
  if (timestamp <= 0) return ''
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm')
}

/**
 * The action label doubles as the explanation for why the action is blocked,
 * so the user never has to guess.
 */
function actionLabelKey(activity: WelfareActivity): string {
  if (activity.status === 'upcoming') return 'Not started'
  if (activity.status !== 'active') return 'Ended'
  if (!activity.threshold_met) return 'Threshold not met'
  if (activity.remaining_today === 0) return 'Daily limit reached'
  if (activity.remaining_total === 0) return 'No entries left'
  return 'Participate'
}

interface ActivityCardProps {
  activity: WelfareActivity
  entering: boolean
  onEnter: (activityId: number) => void
}

function ActivityCard(props: ActivityCardProps) {
  const { t } = useTranslation()
  const activity = props.activity

  const prizePool = mergeIdenticalPrizes(activity.prizes ?? [])
  const remainingToday =
    activity.remaining_today < 0
      ? t('Unlimited')
      : String(activity.remaining_today)
  const remainingTotal =
    activity.remaining_total < 0
      ? t('Unlimited')
      : String(activity.remaining_total)

  const start = formatTime(activity.starts_at) || t('Unlimited')
  const end = formatTime(activity.ends_at) || t('Unlimited')
  const missingQuota = Math.max(
    activity.min_consume_quota - activity.used_quota,
    0
  )

  let actionLabel = t(actionLabelKey(activity))
  if (props.entering) {
    actionLabel = t('Loading...')
  }

  return (
    <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
      <div className='border-b p-4 sm:p-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-base font-semibold tracking-tight'>
                {activity.title}
              </h3>
              <span className='bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium'>
                {t(activity.status === 'active' ? 'Active' : 'Ended')}
              </span>
            </div>
            {activity.description && (
              <p className='text-muted-foreground mt-1.5 text-sm whitespace-pre-wrap'>
                {activity.description}
              </p>
            )}
          </div>
          <Button
            size='sm'
            className='w-full shrink-0 sm:w-auto'
            disabled={props.entering || !activity.can_enter}
            onClick={() => props.onEnter(activity.id)}
          >
            {actionLabel}
          </Button>
        </div>
      </div>

      <div className='grid gap-3 border-b p-4 text-sm sm:grid-cols-3 sm:p-5'>
        <div>
          <div className='text-muted-foreground text-xs'>
            {t('Activity period')}
          </div>
          <div className='mt-1 tabular-nums'>
            {t('{{start}} to {{end}}', { start, end })}
          </div>
        </div>
        <div>
          <div className='text-muted-foreground text-xs'>{t('Threshold')}</div>
          <div className='mt-1 tabular-nums'>
            {activity.min_consume_quota > 0
              ? t('{{required}} (current {{current}})', {
                  required: formatQuotaWithCurrency(activity.min_consume_quota, {
                    digitsLarge: 0,
                  }),
                  current: formatQuotaWithCurrency(activity.used_quota, {
                    digitsLarge: 0,
                  }),
                })
              : t('No threshold')}
          </div>
        </div>
        <div>
          <div className='text-muted-foreground text-xs'>
            {t('Remaining entries')}
          </div>
          <div className='mt-1 tabular-nums'>
            {t('{{today}} today, {{total}} in total', {
              today: remainingToday,
              total: remainingTotal,
            })}
          </div>
        </div>
      </div>

      <div className='p-4 sm:p-5'>
        <div className='text-muted-foreground text-xs'>{t('Prize pool')}</div>
        <div className='mt-2 flex flex-wrap gap-2'>
          {prizePool.map((prize) => (
            <div
              key={`${prize.quota}-${prize.weight}`}
              className='bg-muted/40 flex items-center gap-2 rounded-lg border px-2.5 py-1.5'
            >
              <span className='text-xs font-semibold tabular-nums sm:text-sm'>
                {formatQuotaWithCurrency(prize.quota)}
              </span>
              <span className='text-muted-foreground text-[10px] tabular-nums sm:text-xs'>
                {prizeWeightPercent(prize, prizePool)}%
              </span>
            </div>
          ))}
        </div>

        {activity.status === 'active' && !activity.threshold_met && (
          <p className='text-muted-foreground mt-3 text-xs'>
            {t('Consume {{quota}} more to participate', {
              quota: formatQuotaWithCurrency(missingQuota, { digitsLarge: 0 }),
            })}
          </p>
        )}
      </div>
    </Card>
  )
}

/**
 * The limited-time activity module.
 *
 * Self-contained so the welfare hub can mount it as soon as the module is
 * switched on.
 */
export function ActivityPanel() {
  const { t } = useTranslation()
  const [enteringId, setEnteringId] = useState<number | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['welfare-activities'],
    queryFn: async () => {
      const res = await getWelfareActivities()
      if (res.success && res.data) {
        return res.data.activities
      }
      throw new Error(res.message || t('Failed to fetch welfare activities'))
    },
    staleTime: 30000,
  })

  async function handleEnter(activityId: number) {
    setEnteringId(activityId)
    try {
      const res = await enterWelfareActivity(activityId)
      if (res.success && res.data) {
        toast.success(
          `${t('You won')} ${formatQuotaWithCurrency(res.data.prize_quota)}`
        )
        await refetch()
      } else {
        toast.error(res.message || t('Failed to join the activity'))
      }
    } catch {
      toast.error(t('Failed to join the activity'))
    } finally {
      setEnteringId(null)
    }
  }

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-48 w-full rounded-xl' />
        <Skeleton className='h-48 w-full rounded-xl' />
      </div>
    )
  }

  const activities = data ?? []
  if (activities.length === 0) {
    return (
      <Card data-card-hover='false' className='gap-0 py-12'>
        <div className='text-center'>
          <h3 className='text-base font-semibold'>{t('No activities yet')}</h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            {t('There are no limited-time activities running right now.')}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          entering={enteringId === activity.id}
          onEnter={handleEnter}
        />
      ))}
    </div>
  )
}
