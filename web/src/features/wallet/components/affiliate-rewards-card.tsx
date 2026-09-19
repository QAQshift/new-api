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
  ArrowRight,
  Clock3,
  Share2,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { UserWalletData } from '../types'

interface AffiliateRewardsCardProps {
  user: UserWalletData | null
  affiliateLink: string
  onTransfer: () => void
  complianceConfirmed?: boolean
  loading?: boolean
}

interface RewardTile {
  key: string
  label: string
  value: string
  icon: LucideIcon
  tone: IconBadgeTone
  /** Optional one-line explanation under the number */
  hint?: string
  /** Draws attention to a non-zero amount waiting on the cooling-off period */
  highlight?: boolean
}

export function AffiliateRewardsCard({
  user,
  affiliateLink,
  onTransfer,
  complianceConfirmed = true,
  loading,
}: AffiliateRewardsCardProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <TitledCard
        disableHoverEffect
        icon={<Share2 />}
        iconTone='primary'
        title={<Skeleton className='h-5 w-40' />}
        description={<Skeleton className='mt-1.5 h-3 w-60' />}
      >
        <div className='grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4'>
          {['a', 'b', 'c', 'd'].map((key) => (
            <Skeleton key={key} className='h-16 rounded-xl' />
          ))}
        </div>
      </TitledCard>
    )
  }

  const pendingQuota = user?.aff_pending_quota ?? 0
  const transferableQuota = user?.aff_quota ?? 0
  const hasTransferable = transferableQuota > 0

  const tiles: RewardTile[] = [
    {
      key: 'pending',
      label: t('Pending'),
      value: formatQuota(pendingQuota),
      icon: Clock3,
      tone: 'warning',
      hint:
        pendingQuota > 0 ? t('Clears the cooling-off period') : undefined,
      highlight: pendingQuota > 0,
    },
    {
      key: 'transferable',
      label: t('Transferable'),
      value: formatQuota(transferableQuota),
      icon: Wallet,
      tone: 'success',
      highlight: hasTransferable,
    },
    {
      key: 'earned',
      label: t('Total Earned'),
      value: formatQuota(user?.aff_history_quota ?? 0),
      icon: TrendingUp,
      tone: 'chart-3',
    },
    {
      key: 'invites',
      label: t('Invites'),
      value: String(user?.aff_count ?? 0),
      icon: Users,
      tone: 'info',
    },
  ]

  return (
    <TitledCard
      disableHoverEffect
      icon={<Share2 />}
      iconTone='primary'
      title={t('Referral Program')}
      description={t(
        'Earn a rebate on every top-up made by users you invite. Rebates clear a cooling-off period before they can be transferred to your balance.'
      )}
      action={
        hasTransferable ? (
          <Button
            onClick={onTransfer}
            disabled={!complianceConfirmed}
            className='w-full sm:w-auto'
            size='sm'
          >
            {t('Transfer to Balance')}
            <ArrowRight className='size-4' />
          </Button>
        ) : undefined
      }
    >
      <div className='space-y-4'>
        <div className='grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4'>
          {tiles.map((tile) => {
            const Icon = tile.icon
            return (
              <div
                key={tile.key}
                className={cn(
                  'bg-muted/40 hover:bg-muted/60 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                  tile.highlight && 'border-primary/20 bg-primary/5'
                )}
              >
                <IconBadge tone={tile.tone} size='lg'>
                  <Icon />
                </IconBadge>
                <div className='min-w-0'>
                  <div className='text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase'>
                    {tile.label}
                  </div>
                  <div className='truncate text-base font-semibold tabular-nums'>
                    {tile.value}
                  </div>
                  {tile.hint ? (
                    <div className='text-muted-foreground truncate text-[11px]'>
                      {tile.hint}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <div className='space-y-1.5'>
          <div className='text-muted-foreground text-xs font-medium'>
            {t('Your referral link')}
          </div>
          <div className='flex items-center gap-2'>
            <Input
              value={affiliateLink}
              readOnly
              className='bg-background h-10 min-w-0 flex-1 font-mono text-xs'
            />
            <CopyButton
              value={affiliateLink}
              variant='outline'
              className='size-10 shrink-0'
              iconClassName='size-4'
              tooltip={t('Copy referral link')}
              aria-label={t('Copy referral link')}
            />
          </div>
        </div>

        {!complianceConfirmed ? (
          <p className='text-warning text-xs'>
            {t(
              'Referral reward transfer is disabled until the administrator confirms compliance terms.'
            )}
          </p>
        ) : null}
      </div>
    </TitledCard>
  )
}
