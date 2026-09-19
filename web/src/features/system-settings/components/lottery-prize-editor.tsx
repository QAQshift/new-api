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
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrizePercent } from '@/features/lottery/prize-pool'
import { getCurrencyLabel } from '@/lib/currency'
import {
  getEditableQuotaStep,
  parseQuotaFromDollars,
  quotaUnitsToEditableAmount,
} from '@/lib/format'

import {
  createEmptyPrize,
  movePrize,
  totalPrizeWeight,
  weightFromPercent,
  weightOfOthers,
  type LotteryPrizeDraft,
} from '../utils/lottery-pool'

type UnitMode = 'quota' | 'currency'
type WeightMode = 'weight' | 'percent'

interface LotteryPrizeEditorProps {
  pool: LotteryPrizeDraft[]
  onChange: (pool: LotteryPrizeDraft[]) => void
  disabled?: boolean
  /**
   * 由所在卡片统一指定金额单位。给定时组件不再自带金额单位按钮，
   * 跟随卡片顶部那一个开关。
   */
  unitMode?: UnitMode
}

/**
 * Edits one prize pool: a list of {quota, quotaMax, weight} tiers.
 *
 * Everything is *stored* in internal units — quota for amounts, an integer
 * weight for the draw — because that is what the backend understands and what
 * keeps the draw exact. The operator, however, should not have to think in
 * those units: two toolbar switches let them type a display amount instead of
 * raw quota, and a chance percentage instead of a weight. Both are converted
 * on the way in and out; the stored format never changes.
 *
 * Tiers can be reordered. Order does not affect the odds (a tier's chance is
 * its own weight over the total, wherever it sits); it decides how the pool is
 * listed, for example ascending by amount.
 */
export function LotteryPrizeEditor({
  pool,
  onChange,
  disabled,
  unitMode: unitModeOverride,
}: LotteryPrizeEditorProps) {
  const { t } = useTranslation()
  const totalWeight = totalPrizeWeight(pool)
  // 卡片级开关优先；活动卡片没有卡片级开关，所以它仍然保留下面的金额单位按钮
  const [internalUnitMode, setInternalUnitMode] = useState<UnitMode>('quota')
  const unitMode = unitModeOverride ?? internalUnitMode
  const [weightMode, setWeightMode] = useState<WeightMode>('weight')

  const currency = getCurrencyLabel()
  const amountStep = getEditableQuotaStep()

  const updateRow = (index: number, patch: Partial<LotteryPrizeDraft>) => {
    const next = pool.map((prize, i) =>
      i === index ? { ...prize, ...patch } : prize
    )
    onChange(next)
  }

  // 金额模式下输入框展示换算后的金额，写回时再换回额度：配置里始终存额度，
  // 输入便利不影响存储格式，也就不会因为"显示币种"变化而改动已存的配置。
  const amountValue = (quota: number) =>
    unitMode === 'currency' ? quotaUnitsToEditableAmount(quota) : quota

  const writeAmount = (
    index: number,
    patchKey: 'quota' | 'quotaMax',
    raw: number
  ) => {
    updateRow(index, {
      [patchKey]:
        unitMode === 'currency' ? parseQuotaFromDollars(raw) : Math.round(raw),
    })
  }

  return (
    <div className='space-y-3'>
      {/* 输入方式切换：只改变"怎么写"，不改变"存什么" */}
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        {/* 卡片级开关接管时，这里不再重复出现金额单位按钮 */}
        {unitModeOverride === undefined && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-xs'>
              {t('Amounts in')}
            </span>
            <div className='flex gap-1'>
              <Button
                type='button'
                size='sm'
                variant={unitMode === 'quota' ? 'default' : 'outline'}
                disabled={disabled}
                onClick={() => setInternalUnitMode('quota')}
              >
                {t('Quota')}
              </Button>
              <Button
                type='button'
                size='sm'
                variant={unitMode === 'currency' ? 'default' : 'outline'}
                disabled={disabled}
                onClick={() => setInternalUnitMode('currency')}
              >
                {currency}
              </Button>
            </div>
          </div>
        )}
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-xs'>{t('Chance in')}</span>
          <div className='flex gap-1'>
            <Button
              type='button'
              size='sm'
              variant={weightMode === 'weight' ? 'default' : 'outline'}
              disabled={disabled}
              onClick={() => setWeightMode('weight')}
            >
              {t('Weight')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant={weightMode === 'percent' ? 'default' : 'outline'}
              disabled={disabled}
              onClick={() => setWeightMode('percent')}
            >
              %
            </Button>
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        {pool.map((prize, index) => {
          const others = weightOfOthers(pool, index)
          const rowTotal = (Number(prize.weight) || 0) + others
          const chancePercent =
            rowTotal > 0 ? ((Number(prize.weight) || 0) / rowTotal) * 100 : 0
          // 输入框里放两位小数就够了：再细的差异权重也表达不出来
          const chanceInputValue = Math.round(chancePercent * 100) / 100

          return (
            <div
              key={prize.id}
              className='flex flex-wrap items-end gap-2 rounded-lg border p-3'
            >
              <div className='min-w-28 flex-1 space-y-1.5'>
                <label className='text-muted-foreground text-xs'>
                  {unitMode === 'currency'
                    ? t('Prize amount (min)')
                    : t('Prize quota (min)')}
                </label>
                <Input
                  type='number'
                  min={unitMode === 'currency' ? 0 : 1}
                  step={unitMode === 'currency' ? amountStep : 1}
                  value={amountValue(prize.quota)}
                  disabled={disabled}
                  onChange={(event) => {
                    // 忽略 NaN，避免把非法中间态写进配置（见 utils/numeric-field.ts）
                    const next = event.target.valueAsNumber
                    if (Number.isFinite(next)) writeAmount(index, 'quota', next)
                  }}
                />
              </div>
              <div className='min-w-28 flex-1 space-y-1.5'>
                <label className='text-muted-foreground text-xs'>
                  {unitMode === 'currency'
                    ? t('Prize amount (max)')
                    : t('Prize quota (max)')}
                </label>
                <Input
                  type='number'
                  min={0}
                  step={unitMode === 'currency' ? amountStep : 1}
                  value={amountValue(prize.quotaMax)}
                  placeholder={t('Same as min')}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = event.target.valueAsNumber
                    if (Number.isFinite(next)) {
                      writeAmount(index, 'quotaMax', next)
                    }
                  }}
                />
              </div>
              <div className='min-w-24 flex-1 space-y-1.5'>
                <label className='text-muted-foreground text-xs'>
                  {weightMode === 'percent' ? t('Chance (%)') : t('Weight')}
                </label>
                <Input
                  type='number'
                  min={weightMode === 'percent' ? 0.01 : 1}
                  step={weightMode === 'percent' ? 0.01 : 1}
                  value={
                    weightMode === 'percent'
                      ? chanceInputValue
                      : prize.weight
                  }
                  disabled={disabled}
                  onChange={(event) => {
                    const next = event.target.valueAsNumber
                    if (!Number.isFinite(next)) return
                    if (weightMode === 'percent') {
                      // 其他档位不动，反推这一档的权重，使它恰好占到输入的百分比
                      updateRow(index, {
                        weight: weightFromPercent(next, others),
                      })
                    } else {
                      updateRow(index, { weight: next })
                    }
                  }}
                />
              </div>
              <div className='text-muted-foreground w-14 pb-2 text-xs tabular-nums'>
                {totalWeight > 0
                  ? `${formatPrizePercent(chancePercent)}%`
                  : '—'}
              </div>
              {/* 排序：顺序不影响概率，只影响奖池怎么排（比如按额度从小到大） */}
              <div className='flex gap-0.5 pb-1.5'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  disabled={disabled || index === 0}
                  onClick={() => onChange(movePrize(pool, index, -1))}
                >
                  <ArrowUp className='h-4 w-4' />
                  <span className='sr-only'>{t('Move up')}</span>
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  disabled={disabled || index === pool.length - 1}
                  onClick={() => onChange(movePrize(pool, index, 1))}
                >
                  <ArrowDown className='h-4 w-4' />
                  <span className='sr-only'>{t('Move down')}</span>
                </Button>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={disabled || pool.length <= 1}
                onClick={() => onChange(pool.filter((_, i) => i !== index))}
              >
                <Trash2 className='h-4 w-4' />
                <span className='sr-only'>{t('Remove tier')}</span>
              </Button>
              {prize.quotaMax > 0 && prize.quotaMax < prize.quota && (
                <p className='text-destructive w-full text-xs'>
                  {t('Max must not be lower than min.')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className='text-muted-foreground text-xs'>
        {t('A max equal to (or lower than) the min awards a fixed amount.')}
      </p>
      <p className='text-muted-foreground text-xs'>
        {unitMode === 'currency'
          ? t(
              'Amounts are entered in {{currency}} and stored as internal quota.',
              { currency }
            )
          : t(
              'Prize amounts use the internal quota unit, the same unit as the user balance.'
            )}
      </p>
      {weightMode === 'percent' && (
        <p className='text-muted-foreground text-xs'>
          {t(
            'Weights are whole numbers, so a very small chance cannot be represented exactly.'
          )}
        </p>
      )}

      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={disabled}
        onClick={() => onChange([...pool, createEmptyPrize()])}
      >
        <Plus className='h-4 w-4' />
        {t('Add tier')}
      </Button>
    </div>
  )
}
