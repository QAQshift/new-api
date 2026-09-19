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
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Gift } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuotaWithCurrency } from '@/lib/currency'

import { drawLottery, getLotteryStatus } from '../api'
import { LotteryDrawPanel } from './lottery-draw-panel'
import { LotteryHistory } from './lottery-history'

/**
 * The lottery module: prize pool, draw action and draw history.
 *
 * Self-contained so it can be mounted either standalone or inside the
 * welfare hub.
 */
export function LotteryTab() {
  const { t } = useTranslation()
  const [drawing, setDrawing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['lottery-status'],
    queryFn: async () => {
      const res = await getLotteryStatus()
      if (res.success && res.data) {
        return res.data
      }
      throw new Error(res.message || t('Failed to fetch lottery status'))
    },
    staleTime: 30000,
  })

  async function handleDraw() {
    setDrawing(true)
    try {
      const res = await drawLottery()
      if (res.success && res.data) {
        toast.success(
          `${t('You won')} ${formatQuotaWithCurrency(res.data.prize_quota)}`
        )
        await refetch()
      } else {
        toast.error(res.message || t('Draw failed'))
      }
    } catch {
      toast.error(t('Draw failed'))
    } finally {
      setDrawing(false)
    }
  }

  let body: ReactNode
  if (isLoading) {
    body = (
      <>
        <Skeleton className='h-64 w-full rounded-xl' />
        <Skeleton className='h-40 w-full rounded-xl' />
      </>
    )
  } else if (!data?.enabled) {
    // The operator may switch the feature off at any time
    body = (
      <Card data-card-hover='false' className='gap-0 py-12'>
        <div className='flex flex-col items-center gap-3 px-4 text-center'>
          <IconBadge tone='neutral' size='lg'>
            <Gift />
          </IconBadge>
          <div>
            <h3 className='text-base font-semibold'>
              {t('Lottery is not available')}
            </h3>
            <p className='text-muted-foreground mt-1.5 text-sm'>
              {t('The administrator has not enabled the lottery feature.')}
            </p>
          </div>
        </div>
      </Card>
    )
  } else {
    body = (
      <>
        <LotteryDrawPanel
          status={data}
          drawing={drawing}
          onDraw={handleDraw}
        />
        <LotteryHistory records={data.records ?? []} />
      </>
    )
  }

  return <div className='flex flex-col gap-4 sm:gap-5'>{body}</div>
}
