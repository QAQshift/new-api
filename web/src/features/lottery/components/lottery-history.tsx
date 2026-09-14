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
import { History } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { formatQuotaWithCurrency } from '@/lib/currency'
import dayjs from '@/lib/dayjs'

import type { LotteryDrawRecord } from '../types'

interface LotteryHistoryProps {
  records: LotteryDrawRecord[]
}

/**
 * Full draw history for the current mode, newest first.
 */
export function LotteryHistory({ records }: LotteryHistoryProps) {
  const { t } = useTranslation()

  return (
    <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
      <div className='flex items-center gap-2 border-b p-4 sm:p-5'>
        <History className='text-muted-foreground h-4 w-4' strokeWidth={2} />
        <h3 className='text-sm font-semibold'>{t('Draw history')}</h3>
      </div>

      {records.length === 0 ? (
        <p className='text-muted-foreground p-6 text-center text-sm'>
          {t('No lottery records yet')}
        </p>
      ) : (
        <div className='divide-y'>
          {records.map((record) => (
            <div
              key={record.id}
              className='flex items-center justify-between gap-4 px-4 py-3 sm:px-5'
            >
              <span className='text-sm font-medium'>
                {t('Draw #{{index}}', { index: record.draw_index })}
              </span>
              <span className='text-muted-foreground hidden text-xs tabular-nums sm:inline'>
                {dayjs(record.created_at * 1000).format('YYYY-MM-DD HH:mm')}
              </span>
              <span className='text-sm font-semibold tabular-nums'>
                +{formatQuotaWithCurrency(record.prize_quota)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
