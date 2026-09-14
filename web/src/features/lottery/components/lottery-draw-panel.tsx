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
import { Gift, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { formatQuotaWithCurrency } from '@/lib/currency'

import {
  mergeIdenticalPrizes,
  prizeWeightPercent,
  topPrize,
} from '../prize-pool'
import type { LotteryStatus } from '../types'

const TIERED_MODE = 'tiered'

interface LotteryDrawPanelProps {
  status: LotteryStatus
  drawing: boolean
  onDraw: () => void
}

/**
 * The primary draw panel: prize pool, progress towards the next draw and the
 * draw action itself.
 */
export function LotteryDrawPanel({
  status,
  drawing,
  onDraw,
}: LotteryDrawPanelProps) {
  const { t } = useTranslation()

  const isTiered = status.mode === TIERED_MODE
  const drawableCount = status.drawable_count ?? 0
  const canDraw = drawableCount > 0
  const remainingQuota = Math.max(status.next_threshold - status.used_quota, 0)
  const nextTierIndex = (status.drawn_count ?? 0) + 1

  const prizePool = useMemo(
    () => mergeIdenticalPrizes(status.next_prizes ?? []),
    [status.next_prizes]
  )
  const best = topPrize(prizePool)

  const progressPercent =
    status.next_threshold > 0
      ? Math.min(100, Math.round((status.used_quota / status.next_threshold) * 100))
      : 0

  let drawButtonLabel = t('Draw now')
  if (drawing) {
    drawButtonLabel = t('Loading...')
  } else if (!canDraw) {
    drawButtonLabel = t('No draw available')
  }

  let subtitle: string
  if (canDraw) {
    subtitle = isTiered
      ? t('Tier {{tier}} unlocked, ready to draw', { tier: nextTierIndex })
      : t('{{count}} draw(s) available', { count: drawableCount })
  } else {
    subtitle = isTiered
      ? t('Consume {{quota}} more to unlock tier {{tier}}', {
          quota: formatQuotaWithCurrency(remainingQuota, { digitsLarge: 0 }),
          tier: nextTierIndex,
        })
      : t('Consume {{quota}} more for the next draw', {
          quota: formatQuotaWithCurrency(remainingQuota, { digitsLarge: 0 }),
        })
  }

  return (
    <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
      {/* Header */}
      <div className='border-b p-5 sm:p-7'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-start gap-4'>
            <IconBadge tone='neutral' size='lg'>
              <Gift className='h-5 w-5' strokeWidth={2} />
            </IconBadge>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-lg font-semibold tracking-tight sm:text-xl'>
                  {t('Lottery')}
                </h3>
                <span className='bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium'>
                  {isTiered ? t('Tiered mode') : t('Segment mode')}
                </span>
                {canDraw && (
                  <span className='inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400'>
                    <Sparkles className='h-3 w-3' />
                    {t('{{count}} available', { count: drawableCount })}
                  </span>
                )}
              </div>
              <p className='text-muted-foreground mt-1.5 text-sm'>{subtitle}</p>
            </div>
          </div>

          <Button
            onClick={onDraw}
            disabled={drawing || !canDraw}
            size='lg'
            className='w-full shrink-0 sm:w-auto'
          >
            {drawButtonLabel}
          </Button>
        </div>
      </div>

      {/* Prize pool for the next draw */}
      <div className='border-b p-5 sm:p-7'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <h4 className='text-sm font-semibold'>{t('Next prize pool')}</h4>
          {best && (
            <span className='text-muted-foreground text-xs'>
              {t('Top prize')} {formatQuotaWithCurrency(best.quota)}
            </span>
          )}
        </div>
        {prizePool.length > 0 ? (
          <div className='mt-4 flex flex-wrap gap-3'>
            {prizePool.map((prize) => (
              <div
                key={`${prize.quota}-${prize.weight}`}
                className='bg-muted/40 min-w-28 rounded-xl border px-4 py-3 text-center'
              >
                <div className='text-base font-semibold tabular-nums sm:text-lg'>
                  {formatQuotaWithCurrency(prize.quota)}
                </div>
                <div className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
                  {prizeWeightPercent(prize, prizePool)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-muted-foreground mt-3 text-sm'>
            {t('No prize configured')}
          </p>
        )}
      </div>

      {/* Progress towards the next draw */}
      <div className='border-b p-5 sm:p-7'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>
            {isTiered
              ? t('Tier {{tier}} progress', { tier: nextTierIndex })
              : t('Progress to next draw')}
          </span>
          <span className='text-muted-foreground tabular-nums'>
            {formatQuotaWithCurrency(status.used_quota, { digitsLarge: 0 })} /{' '}
            {formatQuotaWithCurrency(status.next_threshold, { digitsLarge: 0 })}
          </span>
        </div>
        <div className='bg-muted mt-3 h-2.5 w-full overflow-hidden rounded-full'>
          <div
            className='bg-primary h-full rounded-full transition-all'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-px'>
        <div className='bg-card p-4 text-center sm:p-6'>
          <div className='text-xl font-semibold tracking-tight tabular-nums sm:text-2xl'>
            {formatQuotaWithCurrency(status.used_quota, { digitsLarge: 0 })}
          </div>
          <div className='text-muted-foreground mt-1 text-xs font-medium'>
            {t('Total consumed')}
          </div>
        </div>
        <div className='bg-card p-4 text-center sm:p-6'>
          <div className='text-xl font-semibold tracking-tight tabular-nums sm:text-2xl'>
            {status.drawn_count}
          </div>
          <div className='text-muted-foreground mt-1 text-xs font-medium'>
            {t('Draws made')}
          </div>
        </div>
        <div className='bg-card p-4 text-center sm:p-6'>
          <div className='text-xl font-semibold tracking-tight tabular-nums sm:text-2xl'>
            {drawableCount}
          </div>
          <div className='text-muted-foreground mt-1 text-xs font-medium'>
            {t('Draws available')}
          </div>
        </div>
      </div>
    </Card>
  )
}
