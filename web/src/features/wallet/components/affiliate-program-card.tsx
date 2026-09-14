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
import { Megaphone } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'
import dayjs from '@/lib/dayjs'
import { formatQuota } from '@/lib/format'

import { downloadAffiliatePoster } from '../lib/affiliate-poster'
import type {
  AffiliateInvitee,
  AffiliateOverview,
  AffiliateTier,
} from '../types'

/** Registration milestones used for the "next goal" progress hint. */
const REGISTRATION_MILESTONES = [3, 10, 30, 100, 300, 1000]

// Stable empty arrays: falling back to an inline `[]` would hand a fresh
// reference to the derived values on every render.
const EMPTY_TIERS: AffiliateTier[] = []
const EMPTY_INVITEES: AffiliateInvitee[] = []

interface AffiliateProgramCardProps {
  affiliateLink: string
  overview: AffiliateOverview | null
  loading?: boolean
}

function percent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${Math.round(safe * 100)}%`
}

export function AffiliateProgramCard({
  affiliateLink,
  overview,
  loading,
}: AffiliateProgramCardProps) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const qrRef = useRef<HTMLCanvasElement>(null)

  const tiers = overview?.tiers ?? EMPTY_TIERS
  const funnel = overview?.funnel
  const invitees = overview?.invitees ?? EMPTY_INVITEES

  // 档位的可读描述，例如「第 1-3 次充值返 5% · 第 4 次起返 3%」
  const tierSummary = useMemo(() => {
    if (tiers.length === 0) return ''
    return tiers
      .map((tier) =>
        tier.fallback
          ? t('Applies from top-up {{from}} onward', { from: tier.from })
          : t('Applies to top-ups {{from}}–{{to}}', {
              from: tier.from,
              to: tier.to,
            })
      )
      .join(' · ')
  }, [tiers, t])

  const nextMilestone = useMemo(() => {
    const registered = funnel?.registered ?? 0
    return REGISTRATION_MILESTONES.find((value) => value > registered) ?? 0
  }, [funnel?.registered])

  const promoText = useCallback(
    (template: string) =>
      t(template, { site: systemName, link: affiliateLink }),
    [t, systemName, affiliateLink]
  )

  const handleDownloadPoster = useCallback(async () => {
    const qrCanvas = qrRef.current
    if (!qrCanvas || affiliateLink === '') {
      toast.error(t('Referral link is not ready yet'))
      return
    }
    try {
      await downloadAffiliatePoster({
        siteName: systemName,
        headline: t('Join {{site}}', { site: systemName }),
        referralLink: affiliateLink,
        qrCanvas,
      })
    } catch {
      toast.error(t('Failed to generate the poster'))
    }
  }, [affiliateLink, systemName, t])

  if (loading) {
    return (
      <Card data-card-hover='false' className='bg-muted/20 py-0'>
        <CardContent className='space-y-4 p-4'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-16 rounded-lg' />
          <Skeleton className='h-24 rounded-lg' />
        </CardContent>
      </Card>
    )
  }

  const funnelStats: Array<[string, string]> = [
    [t('Registered'), String(funnel?.registered ?? 0)],
    [t('Active'), String(funnel?.active ?? 0)],
    [t('Topped up'), String(funnel?.topped_up ?? 0)],
    [t('Invites'), String(overview?.aff_count ?? 0)],
  ]

  return (
    <Card data-card-hover='false' className='bg-muted/20 py-0'>
      <CardContent className='space-y-5 p-3 sm:p-4'>
        <div className='flex items-center gap-2.5'>
          <IconBadge tone='chart-5'>
            <Megaphone />
          </IconBadge>
          <div className='min-w-0'>
            <h3 className='truncate text-sm font-semibold'>
              {t('Promotion Center')}
            </h3>
            <p className='text-muted-foreground text-xs'>
              {t(
                'Track how your invitations convert and grab ready-to-share copy.'
              )}
            </p>
          </div>
        </div>

        {/* 返利档位 */}
        {overview?.enabled ? (
          <div className='bg-background/60 rounded-lg border p-3'>
            <div className='flex flex-wrap items-center gap-2'>
              {tiers.map((tier, index) => (
                <span key={tier.times} className='flex items-center gap-2'>
                  {index > 0 ? (
                    <span className='text-muted-foreground text-xs'>→</span>
                  ) : null}
                  <span className='bg-primary/10 text-primary rounded-md px-2 py-1 text-sm font-semibold tabular-nums'>
                    {tier.rate_percent}%
                  </span>
                </span>
              ))}
              <span className='text-muted-foreground text-xs'>
                {t('Rebate rules')}
              </span>
            </div>
            <p className='text-muted-foreground mt-2 text-xs'>{tierSummary}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              {t(
                'Rebates become transferable after a {{days}}-day cooling-off period.',
                { days: overview.cooldown_days }
              )}
            </p>
          </div>
        ) : null}

        {/* 转化漏斗 */}
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-2 text-center sm:grid-cols-4'>
            {funnelStats.map(([label, value]) => (
              <div key={label} className='bg-background/60 rounded-lg border py-2'>
                <div className='text-muted-foreground truncate text-[10px] font-medium tracking-wider uppercase'>
                  {label}
                </div>
                <div className='mt-0.5 truncate text-sm font-semibold tabular-nums'>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
            <span>
              {t('Active rate')}: {percent(funnel?.active_rate ?? 0)}
            </span>
            <span>
              {t('Conversion rate')}: {percent(funnel?.conversion_rate ?? 0)}
            </span>
          </div>

          {nextMilestone > 0 ? (
            <div className='space-y-1.5'>
              <div className='text-muted-foreground text-xs'>
                {t('Next milestone: {{count}} registrations', {
                  count: nextMilestone,
                })}
              </div>
              <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                <div
                  className='bg-primary h-full rounded-full transition-[width]'
                  style={{
                    width: `${Math.min(
                      100,
                      ((funnel?.registered ?? 0) / nextMilestone) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* 邀请名单 */}
        <div className='space-y-2'>
          <h4 className='text-xs font-semibold'>{t('Invitees')}</h4>
          {invitees.length === 0 ? (
            <p className='text-muted-foreground text-xs'>
              {t('No invited users yet. Share your referral link to get started.')}
            </p>
          ) : (
            <div className='space-y-1.5'>
              {invitees.map((invitee) => (
                <div
                  key={invitee.user_id}
                  className='bg-background/60 flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 text-xs'
                >
                  <span className='min-w-0 flex-1 truncate font-medium'>
                    {invitee.username}
                  </span>
                  <span className='text-muted-foreground tabular-nums'>
                    {dayjs.unix(invitee.created_at).format('YYYY-MM-DD HH:mm')}
                  </span>
                  <span
                    className={
                      invitee.topup_count > 0
                        ? 'text-primary tabular-nums'
                        : 'text-muted-foreground'
                    }
                  >
                    {invitee.topup_count > 0
                      ? t('Top-ups: {{count}}', { count: invitee.topup_count })
                      : t('No top-up yet')}
                  </span>
                  {invitee.rebate_quota > 0 ? (
                    <span className='tabular-nums'>
                      +{formatQuota(invitee.rebate_quota)}
                    </span>
                  ) : null}
                </div>
              ))}
              {overview?.invitees_truncated ? (
                <p className='text-muted-foreground text-xs'>
                  {t('Only the most recent invitees are shown.')}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* 推广素材 */}
        <div className='space-y-2'>
          <h4 className='text-xs font-semibold'>{t('Promo materials')}</h4>
          <div className='space-y-1.5'>
            {[
              [
                'Concise',
                'I am using {{site}}. One key gives you access to mainstream AI models, with straightforward setup and transparent usage. Sign up here: {{link}}',
              ],
              [
                'Friendly',
                'If you are looking for a reliable AI API endpoint, give {{site}} a try. Here is my sign-up link: {{link}}',
              ],
              [
                'Rebate first',
                'Sign up for {{site}} through my referral link and every top-up you make earns me a rebate - at no extra cost to you. Link: {{link}}',
              ],
            ].map(([label, template]) => {
              const key = label ?? ''
              const text = promoText(template ?? '')
              return (
                <div
                  key={key}
                  className='bg-background/60 flex items-start gap-2 rounded-lg border p-2.5'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                      {t(key)}
                    </div>
                    <p className='mt-1 text-xs break-words'>{text}</p>
                  </div>
                  <CopyButton
                    value={text}
                    variant='outline'
                    className='size-8 shrink-0'
                    iconClassName='size-3.5'
                    tooltip={t('Copy')}
                    aria-label={t('Copy')}
                  />
                </div>
              )
            })}
          </div>

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleDownloadPoster}
          >
            {t('Download poster')}
          </Button>
        </div>

        {/* 隐藏的二维码画布，仅用于合成海报 */}
        <div className='hidden' aria-hidden='true'>
          <QRCodeCanvas ref={qrRef} value={affiliateLink} size={220} />
        </div>
      </CardContent>
    </Card>
  )
}
