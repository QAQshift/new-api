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
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { AffiliateProgramCard } from '@/features/wallet/components/affiliate-program-card'
import { AffiliateRewardsCard } from '@/features/wallet/components/affiliate-rewards-card'
import { TransferDialog } from '@/features/wallet/components/dialogs/transfer-dialog'
import { useTopupInfo } from '@/features/wallet/hooks'
import { useAffiliate } from '@/features/wallet/hooks/use-affiliate'
import type { UserWalletData } from '@/features/wallet/types'
import { getSelf } from '@/lib/api'

/**
 * Referral program page.
 *
 * Owns its own sidebar entry instead of living inside the wallet, because the
 * rebate program is a promotion surface rather than a payment one.
 */
export function Referral() {
  const { t } = useTranslation()
  const { topupInfo } = useTopupInfo()
  const {
    affiliateLink,
    overview,
    loading,
    overviewLoading,
    transferring,
    transferQuota,
  } = useAffiliate()

  const [user, setUser] = useState<UserWalletData | null>(null)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const fetchUser = useCallback(async () => {
    const response = await getSelf()
    if (response.success && response.data) {
      setUser(response.data as UserWalletData)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleTransfer = useCallback(
    async (quota: number): Promise<boolean> => {
      const success = await transferQuota(quota)
      if (success) {
        setTransferDialogOpen(false)
        await fetchUser()
      }
      return success
    },
    [transferQuota, fetchUser]
  )

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <div className='space-y-0.5'>
          <div>{t('Referral Program')}</div>
          <p className='text-muted-foreground text-xs font-normal sm:text-sm'>
            {t('Invite users and earn a rebate on their top-ups.')}
          </p>
        </div>
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-5xl space-y-4'>
          <AffiliateRewardsCard
            user={user}
            affiliateLink={affiliateLink}
            onTransfer={() => setTransferDialogOpen(true)}
            complianceConfirmed={
              topupInfo?.payment_compliance_confirmed !== false
            }
            loading={loading}
          />

          <AffiliateProgramCard
            affiliateLink={affiliateLink}
            overview={overview}
            loading={overviewLoading}
          />
        </div>
      </SectionPageLayout.Content>

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onConfirm={handleTransfer}
        availableQuota={user?.aff_quota ?? 0}
        transferring={transferring}
      />
    </SectionPageLayout>
  )
}
