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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuotaWithCurrency } from '@/lib/currency'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import {
  isPrizeRange,
  mergeIdenticalPrizes,
  prizeMax,
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
  /** Admin-controlled: whether the prize pool may be shown at all */
  showPrizePool: boolean
  /** Admin-controlled: whether each tier's chance may be shown */
  showProbability: boolean
  /** Admin-controlled: whether recent winners may be shown (default off) */
  showWinnerList: boolean
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

  // 状态文案必须区分"未开始"：否则未开始的活动会被显示成"已结束"
  let statusLabel = t('Ended')
  let statusVariant: 'default' | 'warning' | 'secondary' = 'secondary'
  if (activity.status === 'active') {
    statusLabel = t('Active')
    statusVariant = 'default'
  } else if (activity.status === 'upcoming') {
    statusLabel = t('Not started')
    statusVariant = 'warning'
  }

  const thresholdPercent =
    activity.min_consume_quota > 0
      ? Math.min(
          100,
          (activity.used_quota / activity.min_consume_quota) * 100
        )
      : 0

  return (
    <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
      <div className='border-b p-4 sm:p-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-base font-semibold tracking-tight'>
                {activity.title}
              </h3>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
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

      <div className='border-b p-4 sm:p-5'>
        <div className='grid gap-2 text-sm sm:grid-cols-3 sm:gap-3'>
          <div className='bg-muted/40 rounded-xl border px-3 py-2.5'>
            <div className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
              {t('Activity period')}
            </div>
            <div className='mt-1 text-xs tabular-nums'>
              {t('{{start}} to {{end}}', { start, end })}
            </div>
          </div>
          <div className='bg-muted/40 rounded-xl border px-3 py-2.5'>
            <div className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
              {t('Threshold')}
            </div>
            <div className='mt-1 text-xs tabular-nums'>
              {activity.min_consume_quota > 0
                ? formatQuotaWithCurrency(activity.min_consume_quota, {
                    digitsLarge: 0,
                  })
                : t('No threshold')}
            </div>
          </div>
          <div className='bg-muted/40 rounded-xl border px-3 py-2.5'>
            <div className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
              {t('Remaining entries')}
            </div>
            <div className='mt-1 text-xs tabular-nums'>
              {t('{{today}} today, {{total}} in total', {
                today: remainingToday,
                total: remainingTotal,
              })}
            </div>
          </div>
        </div>

        {activity.min_consume_quota > 0 && (
          <div className='mt-3 space-y-1.5'>
            <div className='flex items-baseline justify-between text-xs'>
              <span className='text-muted-foreground'>{t('Threshold')}</span>
              <span className='font-semibold tabular-nums'>
                {formatQuotaWithCurrency(activity.used_quota, {
                  digitsLarge: 0,
                })}{' '}
                /{' '}
                {formatQuotaWithCurrency(activity.min_consume_quota, {
                  digitsLarge: 0,
                })}
              </span>
            </div>
            <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
              <div
                className={cn(
                  'h-full rounded-full transition-[width]',
                  activity.threshold_met ? 'bg-success' : 'bg-primary'
                )}
                style={{ width: `${thresholdPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className='p-4 sm:p-5'>
        {props.showPrizePool && (
          <>
            <div className='text-muted-foreground text-xs'>
              {t('Prize pool')}
            </div>
            <div className='mt-2 flex flex-wrap gap-2'>
              {prizePool.map((prize) => (
                <div
                  key={`${prize.quota}-${prize.quota_max ?? 0}-${prize.weight}`}
                  className='bg-muted/40 flex items-center gap-2 rounded-lg border px-2.5 py-1.5'
                >
                  <span className='text-xs font-semibold tabular-nums sm:text-sm'>
                    {isPrizeRange(prize)
                      ? `${formatQuotaWithCurrency(prize.quota)} ~ ${formatQuotaWithCurrency(prizeMax(prize))}`
                      : formatQuotaWithCurrency(prize.quota)}
                  </span>
                  {props.showProbability && (
                    <span className='text-muted-foreground text-[10px] tabular-nums sm:text-xs'>
                      {prizeWeightPercent(prize, prizePool)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* 门槛提示不属于奖池信息，奖池隐藏时依然保留 */}
        {activity.status === 'active' && !activity.threshold_met && (
          <p
            className={cn(
              'text-muted-foreground text-xs',
              props.showPrizePool && 'mt-3'
            )}
          >
            {t('Consume {{quota}} more to participate', {
              quota: formatQuotaWithCurrency(missingQuota, { digitsLarge: 0 }),
            })}
          </p>
        )}

        {/* 中奖名单同样不属于奖池信息：奖池隐藏时它照常展示。
            昵称已由服务端遮蔽，这里拿不到完整用户名。 */}
        {props.showWinnerList && (activity.recent_winners?.length ?? 0) > 0 && (
          <div className='mt-3 border-t pt-3'>
            <div className='text-muted-foreground mb-1.5 text-xs font-medium'>
              {t('Recent winners')}
            </div>
            <div className='space-y-1'>
              {activity.recent_winners?.map((winner) => (
                <div
                  key={winner.id}
                  className='flex items-center justify-between gap-3 text-xs'
                >
                  <span className='text-muted-foreground truncate'>
                    {winner.username}
                  </span>
                  <span className='font-semibold tabular-nums'>
                    {formatQuotaWithCurrency(winner.prize_quota)}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
        // 整份负载都要留下：里面有活动的概率展示开关
        return res.data
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

  const activities = data?.activities ?? []
  // 后端缺省这些字段时按“展示”处理，保持与加开关之前的行为一致
  const showPrizePool = data?.show_prize_pool !== false
  const showProbability = data?.show_prize_probability !== false
  // 与前两个相反：中奖名单默认关闭，字段缺省即隐藏（公开他人昵称属于隐私暴露）
  const showWinnerList = data?.show_winner_list === true
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
          showPrizePool={showPrizePool}
          showProbability={showProbability}
          showWinnerList={showWinnerList}
          onEnter={handleEnter}
        />
      ))}
    </div>
  )
}
