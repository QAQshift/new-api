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
import i18next from 'i18next'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getSelf } from '@/lib/api'

import {
  getAffiliateCode,
  getAffiliateOverview,
  transferAffiliateQuota,
} from '../api'
import { generateAffiliateLink } from '../lib'
import type { AffiliateOverview } from '../types'

// ============================================================================
// Affiliate Hook
// ============================================================================

export function useAffiliate() {
  const [affiliateCode, setAffiliateCode] = useState<string>('')
  const [affiliateLink, setAffiliateLink] = useState<string>('')
  const [overview, setOverview] = useState<AffiliateOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [transferring, setTransferring] = useState(false)
  const { copyToClipboard } = useCopyToClipboard()

  // Fetch affiliate code
  const fetchAffiliateCode = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAffiliateCode()

      if (response.success && response.data) {
        setAffiliateCode(response.data)
        const link = generateAffiliateLink(response.data)
        setAffiliateLink(link)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch affiliate code:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch the rebate ladder, amounts, invitee list and funnel
  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true)
      const response = await getAffiliateOverview()
      if (response.success && response.data) {
        setOverview(response.data)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch affiliate overview:', error)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  // Copy affiliate link
  const copyAffiliateLink = useCallback(() => {
    copyToClipboard(affiliateLink)
  }, [affiliateLink, copyToClipboard])

  // Transfer affiliate quota to balance
  const transferQuota = useCallback(
    async (quota: number): Promise<boolean> => {
      try {
        setTransferring(true)
        const response = await transferAffiliateQuota({ quota })

        if (response.success) {
          toast.success(response.message || i18next.t('Transfer successful'))
          await getSelf()
          // 转移后待确认/可转移两个金额都变了，重新拉一次避免显示过期数字
          await fetchOverview()
          return true
        }

        toast.error(response.message || i18next.t('Transfer failed'))
        return false
      } catch {
        toast.error(i18next.t('Transfer failed'))
        return false
      } finally {
        setTransferring(false)
      }
    },
    [fetchOverview]
  )

  useEffect(() => {
    fetchAffiliateCode()
    fetchOverview()
  }, [fetchAffiliateCode, fetchOverview])

  return {
    affiliateCode,
    affiliateLink,
    overview,
    loading,
    overviewLoading,
    transferring,
    copyAffiliateLink,
    transferQuota,
    refetch: fetchAffiliateCode,
    refetchOverview: fetchOverview,
  }
}
