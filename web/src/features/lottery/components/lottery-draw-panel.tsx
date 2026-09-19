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
import {
  Coins,
  Gift,
  Loader2,
  Sparkles,
  Ticket,
  Trophy,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { formatQuotaWithCurrency } from '@/lib/currency'

import {
  formatPrizePercent,
  isPrizeRange,
  mergeIdenticalPrizes,
  prizeMax,
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
  // 后端缺省这些字段时按“展示”处理，保持与加开关之前的行为一致
  const showPrizePool = status.show_prize_pool !== false
  const showProbability = status.show_probability !== false

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

  const statTiles: Array<{
    key: string
    label: string
    value: string
    icon: typeof Coins
    tone: IconBadgeTone
  }> = [
    {
      key: 'consumed',
      label: t('Total consumed'),
      value: formatQuotaWithCurrency(status.used_quota, { digitsLarge: 0 }),
      icon: Coins,
      tone: 'chart-1',
    },
    {
      key: 'made',
      label: t('Draws made'),
      value: String(status.drawn_count),
      icon: Trophy,
      tone: 'chart-3',
    },
    {
      key: 'available',
      label: t('Draws available'),
      value: String(drawableCount),
      icon: Ticket,
      tone: 'chart-5',
    },
  ]

  return (
    <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
      {/* Header */}
      <div className='border-b p-5 sm:p-7'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-start gap-4'>
            <IconBadge tone='chart-5' size='lg'>
              <Gift className='size-5' strokeWidth={2} />
            </IconBadge>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-lg font-semibold tracking-tight sm:text-xl'>
                  {t('Lottery')}
                </h3>
                {canDraw && (
                  <span className='bg-success/10 text-success inline-flex items-center gap-1 rounded-4xl px-2 py-0.5 text-xs font-medium'>
                    <Sparkles className='size-3' />
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
            className='w-full shrink-0 gap-2 sm:w-auto'
          >
            {drawing ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Sparkles className='size-4' />
            )}
            {drawButtonLabel}
          </Button>
        </div>
      </div>

      {/* Prize pool for the next draw */}
      {showPrizePool && (
        <div className='border-b p-5 sm:p-7'>
          <div className='flex flex-wrap items-baseline justify-between gap-2'>
            <h4 className='text-sm font-semibold'>{t('Next prize pool')}</h4>
            {best && (
              <span className='text-muted-foreground text-xs'>
                {t('Top prize')} {formatQuotaWithCurrency(prizeMax(best))}
              </span>
            )}
          </div>
          {prizePool.length > 0 ? (
            <div className='mt-4 flex flex-wrap gap-3'>
              {prizePool.map((prize) => (
                <div
                  key={`${prize.quota}-${prize.quota_max ?? 0}-${prize.weight}`}
                  className='bg-muted/40 hover:border-primary/30 min-w-28 rounded-xl border px-4 py-3 text-center transition-colors'
                >
                  <div className='text-base font-semibold tabular-nums sm:text-lg'>
                    {isPrizeRange(prize)
                      ? `${formatQuotaWithCurrency(prize.quota)} ~ ${formatQuotaWithCurrency(prizeMax(prize))}`
                      : formatQuotaWithCurrency(prize.quota)}
                  </div>
                  {showProbability && (
                    <div className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
                      {formatPrizePercent(prizeWeightPercent(prize, prizePool))}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground mt-3 text-sm'>
              {t('No prize configured')}
            </p>
          )}
        </div>
      )}

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
      <div className='grid gap-px sm:grid-cols-3'>
        {statTiles.map((tile) => {
          const Icon = tile.icon
          return (
            <div
              key={tile.key}
              className='bg-card hover:bg-muted/30 flex items-center gap-3 p-4 transition-colors sm:p-5'
            >
              <IconBadge tone={tile.tone} size='lg'>
                <Icon />
              </IconBadge>
              <div className='min-w-0'>
                <div className='text-xl font-semibold tracking-tight tabular-nums sm:text-2xl'>
                  {tile.value}
                </div>
                <div className='text-muted-foreground truncate text-xs font-medium'>
                  {tile.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
