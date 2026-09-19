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
  Activity,
  ArrowRight,
  CreditCard,
  Download,
  Megaphone,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { useSystemConfig } from '@/hooks/use-system-config'
import dayjs from '@/lib/dayjs'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  buildPosterFilename,
  downloadCanvasAsPng,
  renderAffiliatePoster,
} from '../lib/affiliate-poster'
import type {
  AffiliateInvitee,
  AffiliateOverview,
  AffiliatePromoTemplate,
  AffiliateTier,
} from '../types'

/** Registration milestones used for the "next goal" progress hint. */
const REGISTRATION_MILESTONES = [3, 10, 30, 100, 300, 1000]

// Stable empty arrays: falling back to an inline `[]` would hand a fresh
// reference to the derived values on every render.
const EMPTY_TIERS: AffiliateTier[] = []
const EMPTY_INVITEES: AffiliateInvitee[] = []

/**
 * Used until the operator configures their own messages, so an unconfigured
 * site still has something to share.
 */
const DEFAULT_PROMO_TEMPLATES: AffiliatePromoTemplate[] = [
  {
    label: 'Concise',
    text: 'I am using {{site}}. One key gives you access to mainstream AI models, with straightforward setup and transparent usage. Sign up here: {{link}}',
  },
  {
    label: 'Friendly',
    text: 'If you are looking for a reliable AI API endpoint, give {{site}} a try. Here is my sign-up link: {{link}}',
  },
  {
    label: 'Rebate first',
    text: 'Sign up for {{site}} through my referral link and every top-up you make earns me a rebate - at no extra cost to you. Link: {{link}}',
  },
]

interface AffiliateProgramCardProps {
  affiliateLink: string
  overview: AffiliateOverview | null
  loading?: boolean
}

interface FunnelTile {
  key: string
  label: string
  value: number
  icon: LucideIcon
  tone: IconBadgeTone
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
  const posterRef = useRef<HTMLCanvasElement>(null)

  const tiers = overview?.tiers ?? EMPTY_TIERS
  const funnel = overview?.funnel
  const invitees = overview?.invitees ?? EMPTY_INVITEES
  const posterBackgroundUrl = overview?.poster_background_url ?? ''
  const promoTemplates =
    overview?.promo_templates && overview.promo_templates.length > 0
      ? overview.promo_templates
      : DEFAULT_PROMO_TEMPLATES

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

  /**
   * Draws the poster into the visible canvas.
   *
   * The preview and the download share one canvas, so what the operator sees on
   * the page is exactly what gets saved.
   */
  useEffect(() => {
    const canvas = posterRef.current
    const qrCanvas = qrRef.current
    if (!canvas || !qrCanvas || affiliateLink === '') return

    let cancelled = false
    const draw = async () => {
      try {
        await renderAffiliatePoster(
          {
            siteName: systemName,
            headline: t('Join {{site}}', { site: systemName }),
            referralLink: affiliateLink,
            qrCanvas,
            scanHint: t('Scan to sign up'),
            backgroundImageUrl: posterBackgroundUrl || undefined,
          },
          canvas
        )
      } catch {
        // 海报渲染失败不能影响页面其它部分
      }
    }
    if (!cancelled) void draw()
    return () => {
      cancelled = true
    }
  }, [affiliateLink, systemName, t, posterBackgroundUrl, loading])

  const handleDownloadPoster = useCallback(async () => {
    const canvas = posterRef.current
    if (!canvas || affiliateLink === '') {
      toast.error(t('Referral link is not ready yet'))
      return
    }
    try {
      await downloadCanvasAsPng(canvas, buildPosterFilename(systemName))
    } catch {
      toast.error(t('Failed to generate the poster'))
    }
  }, [affiliateLink, systemName, t])

  if (loading) {
    return (
      <TitledCard
        disableHoverEffect
        icon={<Megaphone />}
        iconTone='chart-5'
        title={<Skeleton className='h-5 w-48' />}
        description={<Skeleton className='mt-1.5 h-3 w-64' />}
      >
        <div className='space-y-3'>
          <Skeleton className='h-16 rounded-xl' />
          <Skeleton className='h-24 rounded-xl' />
          <Skeleton className='h-20 rounded-xl' />
        </div>
      </TitledCard>
    )
  }

  const funnelStats: FunnelTile[] = [
    {
      key: 'registered',
      label: t('Registered'),
      value: funnel?.registered ?? 0,
      icon: UserPlus,
      tone: 'chart-1',
    },
    {
      key: 'active',
      label: t('Active'),
      value: funnel?.active ?? 0,
      icon: Activity,
      tone: 'chart-2',
    },
    {
      key: 'topped-up',
      label: t('Topped up'),
      value: funnel?.topped_up ?? 0,
      icon: CreditCard,
      tone: 'chart-3',
    },
    {
      key: 'invites',
      label: t('Invites'),
      value: overview?.aff_count ?? 0,
      icon: Users,
      tone: 'info',
    },
  ]

  const registered = funnel?.registered ?? 0

  return (
    <TitledCard
      disableHoverEffect
      icon={<Megaphone />}
      iconTone='chart-5'
      title={t('Promotion Center')}
      description={t(
        'Track how your invitations convert and grab ready-to-share copy.'
      )}
    >
      <div className='space-y-5'>
        {/* 返利档位 */}
        {overview?.enabled ? (
          <section className='space-y-2'>
            <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {t('Rebate rules')}
            </h4>
            <div className='bg-muted/40 flex flex-wrap items-center gap-2 rounded-xl border p-3'>
              {tiers.map((tier, index) => (
                <Fragment key={tier.times}>
                  {index > 0 ? (
                    <ArrowRight className='text-muted-foreground size-3.5 shrink-0' />
                  ) : null}
                  <span className='bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums'>
                    {tier.rate_percent}%
                  </span>
                </Fragment>
              ))}
            </div>
            <p className='text-muted-foreground text-xs'>{tierSummary}</p>
            <p className='text-muted-foreground text-xs'>
              {t(
                'Rebates become transferable after a {{days}}-day cooling-off period.',
                { days: overview.cooldown_days }
              )}
            </p>
          </section>
        ) : null}

        {/* 转化漏斗 */}
        <section className='space-y-3'>
          <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {t('Conversion funnel')}
          </h4>

          <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
            {funnelStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.key}
                  className='bg-muted/40 hover:bg-muted/60 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors'
                >
                  <IconBadge tone={stat.tone} size='lg'>
                    <Icon />
                  </IconBadge>
                  <div className='min-w-0'>
                    <div className='text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase'>
                      {stat.label}
                    </div>
                    <div className='truncate text-base font-semibold tabular-nums'>
                      {stat.value}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className='grid gap-2 sm:grid-cols-2 sm:gap-3'>
            {[
              [t('Active rate'), funnel?.active_rate ?? 0],
              [t('Conversion rate'), funnel?.conversion_rate ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className='space-y-1.5'>
                <div className='flex items-baseline justify-between text-xs'>
                  <span className='text-muted-foreground'>{label}</span>
                  <span className='font-semibold tabular-nums'>
                    {percent(Number(value))}
                  </span>
                </div>
                <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                  <div
                    className='bg-primary h-full rounded-full transition-[width]'
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(value) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {nextMilestone > 0 ? (
            <div className='space-y-1.5'>
              <div className='flex items-baseline justify-between text-xs'>
                <span className='text-muted-foreground'>
                  {t('Next milestone: {{count}} registrations', {
                    count: nextMilestone,
                  })}
                </span>
                <span className='font-semibold tabular-nums'>
                  {registered} / {nextMilestone}
                </span>
              </div>
              <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                <div
                  className='bg-primary h-full rounded-full transition-[width]'
                  style={{
                    width: `${Math.min(100, (registered / nextMilestone) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>

        {/* 邀请名单 */}
        <section className='space-y-2'>
          <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {t('Invitees')}
          </h4>
          {invitees.length === 0 ? (
            <p className='text-muted-foreground bg-muted/40 rounded-xl border border-dashed px-3 py-4 text-center text-xs'>
              {t('No invited users yet. Share your referral link to get started.')}
            </p>
          ) : (
            <div className='space-y-1.5'>
              {invitees.map((invitee) => {
                const initial = (invitee.username || '?').slice(0, 1)
                return (
                  <div
                    key={invitee.user_id}
                    className='bg-muted/40 hover:bg-muted/60 flex flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-colors'
                  >
                    <span className='bg-background text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold uppercase'>
                      {initial}
                    </span>
                    <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                      {invitee.username}
                    </span>
                    <span className='text-muted-foreground tabular-nums'>
                      {dayjs.unix(invitee.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 tabular-nums',
                        invitee.topup_count > 0
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {invitee.topup_count > 0
                        ? t('Top-ups: {{count}}', { count: invitee.topup_count })
                        : t('No top-up yet')}
                    </span>
                    {invitee.rebate_quota > 0 ? (
                      <span className='text-success font-semibold tabular-nums'>
                        +{formatQuota(invitee.rebate_quota)}
                      </span>
                    ) : null}
                  </div>
                )
              })}
              {overview?.invitees_truncated ? (
                <p className='text-muted-foreground text-xs'>
                  {t('Only the most recent invitees are shown.')}
                </p>
              ) : null}
            </div>
          )}
        </section>

        {/* 推广素材与海报并排：素材在左、海报在右；窄屏自动堆成一列 */}
        <div className='grid gap-5 lg:grid-cols-2'>
          {/* 推广素材 */}
          <section className='space-y-2'>
            <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {t('Promo materials')}
            </h4>
            {/* 半宽下素材保持单列：并成两列会把文案挤成竖条 */}
            <div className='grid gap-2'>
              {promoTemplates.map((template) => {
                const text = promoText(template.text)
                return (
                  <div
                    key={`${template.label}-${template.text}`}
                    className='bg-muted/40 hover:bg-muted/60 flex flex-col gap-2 rounded-xl border p-3 transition-colors'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='bg-background text-muted-foreground rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase'>
                        {t(template.label)}
                      </span>
                      <CopyButton
                        value={text}
                        variant='ghost'
                        className='size-7 shrink-0'
                        iconClassName='size-3.5'
                        tooltip={t('Copy')}
                        aria-label={t('Copy')}
                      />
                    </div>
                    <p className='text-muted-foreground text-xs break-words'>
                      {text}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 海报预览：与下载用的是同一张画布 */}
          <section className='space-y-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                {t('Poster')}
              </h4>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleDownloadPoster}
              >
                <Download className='size-4' />
                {t('Download poster')}
              </Button>
            </div>
            <div className='flex flex-wrap items-start gap-4'>
              <canvas
                ref={posterRef}
                className='border-border w-40 shrink-0 rounded-xl border shadow-sm'
                style={{ aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
              />
              <p className='text-muted-foreground max-w-xs text-xs'>
                {t(
                  'This preview is exactly what the downloaded image looks like.'
                )}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* 隐藏的二维码画布，仅用于合成海报 */}
      <div className='hidden' aria-hidden='true'>
        <QRCodeCanvas ref={qrRef} value={affiliateLink} size={220} />
      </div>
    </TitledCard>
  )
}
