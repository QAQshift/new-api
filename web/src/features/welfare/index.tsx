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
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Sparkles } from 'lucide-react'

import { SectionPageLayout } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LotteryTab } from '@/features/lottery/components/lottery-tab'
import { CheckinCalendarCard } from '@/features/profile/components/checkin-calendar-card'
import { useStatus } from '@/hooks/use-status'

import { ActivityPanel } from './components/activity-panel'
import { WelfareOverview } from './components/welfare-overview'
import { WELFARE_MODULES, type WelfareModuleMeta } from './modules'

const OVERVIEW_TAB = 'overview'

/**
 * Welfare hub: aggregates every reward mechanism the operator has enabled
 * behind a single sidebar entry.
 *
 * Which modules appear is driven entirely by the per-module switches in the
 * admin settings, so no extra configuration is needed here.
 */
export function Welfare() {
  const { t } = useTranslation()
  const { status, loading } = useStatus()
  const [selectedTab, setSelectedTab] = useState<string | null>(null)

  const checkinEnabled = status?.checkin_enabled === true
  const lotteryEnabled = status?.lottery_enabled === true
  const activityEnabled = status?.welfare_activity_enabled === true
  const turnstileEnabled = !!(
    status?.turnstile_check && status?.turnstile_site_key
  )
  const turnstileSiteKey = status?.turnstile_site_key || ''

  const modules = useMemo(() => {
    const list: WelfareModuleMeta[] = []
    if (activityEnabled) list.push(WELFARE_MODULES.activity)
    if (checkinEnabled) list.push(WELFARE_MODULES.checkin)
    if (lotteryEnabled) list.push(WELFARE_MODULES.lottery)
    return list
  }, [activityEnabled, checkinEnabled, lotteryEnabled])

  // With a single module the overview would just be an extra click
  const activeTab =
    selectedTab ?? (modules.length === 1 ? modules[0].id : OVERVIEW_TAB)

  let body
  if (modules.length === 0) {
    body = loading ? (
      <Skeleton className='h-40 w-full rounded-xl' />
    ) : (
      <Card data-card-hover='false' className='gap-0 py-12'>
        <div className='flex flex-col items-center gap-3 px-4 text-center'>
          <IconBadge tone='neutral' size='lg'>
            <Sparkles />
          </IconBadge>
          <div>
            <h3 className='text-base font-semibold'>
              {t('No welfare module is currently available')}
            </h3>
            <p className='text-muted-foreground mt-1.5 text-sm'>
              {t('The administrator has not enabled any welfare module.')}
            </p>
          </div>
        </div>
      </Card>
    )
  } else {
    body = (
      <Tabs
        value={activeTab}
        onValueChange={(value) => setSelectedTab(value)}
      >
        <TabsList className='h-auto w-full flex-wrap justify-start p-1 sm:w-auto'>
          <TabsTrigger value={OVERVIEW_TAB}>{t('Overview')}</TabsTrigger>
          {modules.map((module) => (
            <TabsTrigger key={module.id} value={module.id}>
              {t(module.titleKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={OVERVIEW_TAB} className='mt-4'>
          <WelfareOverview modules={modules} onOpen={setSelectedTab} />
        </TabsContent>

        {activityEnabled && (
          <TabsContent value='activity' className='mt-4'>
            <ActivityPanel />
          </TabsContent>
        )}

        {checkinEnabled && (
          <TabsContent value='checkin' className='mt-4'>
            <CheckinCalendarCard
              checkinEnabled={checkinEnabled}
              turnstileEnabled={turnstileEnabled}
              turnstileSiteKey={turnstileSiteKey}
            />
          </TabsContent>
        )}

        {lotteryEnabled && (
          <TabsContent value='lottery' className='mt-4'>
            <LotteryTab />
          </TabsContent>
        )}
      </Tabs>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <div className='space-y-0.5'>
          <div>{t('Welfare Center')}</div>
          <p className='text-muted-foreground text-xs font-normal sm:text-sm'>
            {t('Check in, join activities and draw prizes in one place.')}
          </p>
        </div>
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-5xl'>{body}</div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
