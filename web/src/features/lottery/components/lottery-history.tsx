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
import { History, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { formatQuotaWithCurrency } from '@/lib/currency'
import dayjs from '@/lib/dayjs'

import type { LotteryDrawRecord } from '../types'

interface LotteryHistoryProps {
  records: LotteryDrawRecord[]
}

/**
 * Full draw history for the current mode, newest first.
 *
 * The list is capped in height so a long history cannot push the rest of the
 * page out of reach.
 */
export function LotteryHistory({ records }: LotteryHistoryProps) {
  const { t } = useTranslation()

  return (
    <Card data-card-hover='false' className='gap-0 overflow-hidden py-0'>
      <div className='flex items-center gap-2.5 border-b p-4 sm:p-5'>
        <IconBadge tone='neutral' size='sm'>
          <History />
        </IconBadge>
        <h3 className='text-sm font-semibold'>{t('Draw history')}</h3>
        {records.length > 0 ? (
          <Badge variant='secondary' className='ml-auto tabular-nums'>
            {records.length}
          </Badge>
        ) : null}
      </div>

      {records.length === 0 ? (
        <div className='flex flex-col items-center gap-2 px-4 py-10 text-center'>
          <IconBadge tone='neutral' size='lg'>
            <Trophy />
          </IconBadge>
          <p className='text-muted-foreground text-sm'>
            {t('No lottery records yet')}
          </p>
        </div>
      ) : (
        <div className='max-h-96 divide-y overflow-y-auto'>
          {records.map((record) => (
            <div
              key={record.id}
              className='hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors sm:px-5'
            >
              <span className='bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums'>
                {record.draw_index}
              </span>
              <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                {t('Draw #{{index}}', { index: record.draw_index })}
              </span>
              <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                {dayjs(record.created_at * 1000).format('YYYY-MM-DD HH:mm')}
              </span>
              <span className='text-success shrink-0 text-sm font-semibold tabular-nums'>
                +{formatQuotaWithCurrency(record.prize_quota)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
