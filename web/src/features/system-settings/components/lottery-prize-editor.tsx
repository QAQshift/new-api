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
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  createEmptyPrize,
  totalPrizeWeight,
  type LotteryPrizeDraft,
} from '../utils/lottery-pool'

interface LotteryPrizeEditorProps {
  pool: LotteryPrizeDraft[]
  onChange: (pool: LotteryPrizeDraft[]) => void
  disabled?: boolean
}

/**
 * Edits one prize pool: a list of {quota, weight} tiers.
 *
 * Quota is entered directly in the internal quota unit — the same unit as
 * `users.quota` — so what the operator types is exactly what gets credited.
 */
export function LotteryPrizeEditor({
  pool,
  onChange,
  disabled,
}: LotteryPrizeEditorProps) {
  const { t } = useTranslation()
  const totalWeight = totalPrizeWeight(pool)

  const updateRow = (index: number, patch: Partial<LotteryPrizeDraft>) => {
    const next = pool.map((prize, i) =>
      i === index ? { ...prize, ...patch } : prize
    )
    onChange(next)
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        {pool.map((prize, index) => (
          <div
            key={prize.id}
            className='flex flex-wrap items-end gap-2 rounded-lg border p-3'
          >
            <div className='min-w-32 flex-1 space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Prize quota')}
              </label>
              <Input
                type='number'
                min={1}
                value={prize.quota}
                disabled={disabled}
                onChange={(event) => {
                  // 忽略 NaN，避免把非法中间态写进配置（见 utils/numeric-field.ts）
                  const next = event.target.valueAsNumber
                  if (Number.isFinite(next)) updateRow(index, { quota: next })
                }}
              />
            </div>
            <div className='min-w-24 flex-1 space-y-1.5'>
              <label className='text-muted-foreground text-xs'>
                {t('Weight')}
              </label>
              <Input
                type='number'
                min={1}
                value={prize.weight}
                disabled={disabled}
                onChange={(event) => {
                  const next = event.target.valueAsNumber
                  if (Number.isFinite(next)) updateRow(index, { weight: next })
                }}
              />
            </div>
            <div className='text-muted-foreground w-14 pb-2 text-xs tabular-nums'>
              {totalWeight > 0
                ? `${Math.round(((Number(prize.weight) || 0) / totalWeight) * 100)}%`
                : '—'}
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
          </div>
        ))}
      </div>
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
