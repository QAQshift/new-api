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
import { ExternalLink, FileQuestion } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { RichContent } from '@/components/rich-content'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatus } from '@/hooks/use-status'
import {
  isHttpUrl,
  parseSidebarTabs,
  visibleSidebarTabCategories,
  type SidebarTabDraft,
} from '@/lib/sidebar-tabs'

interface CustomTabPageProps {
  pageId: string
}

/**
 * Renders the body of one custom page.
 *
 * Both content kinds are untrusted from this app's point of view: HTML goes
 * through the same sanitiser the custom home page uses, and the embed keeps
 * scripts but not same-origin access, so an embedded page cannot reach into
 * this application's session or storage.
 */
function CustomTabBody({ page }: { page: SidebarTabDraft }) {
  const { t } = useTranslation()

  if (page.type === 'iframe' && isHttpUrl(page.content)) {
    return (
      <div className='h-[85vh] min-h-[36rem] overflow-hidden rounded-xl border'>
        {/*
          注意这里**故意没有** allow-same-origin：
          加上它会和 allow-scripts 组成"可自行解除沙箱"的组合（仓库的 lint 规则
          直接拦下这条），所以被嵌入页面只能拿到不透明来源 —— 也就是请求头里的
          Origin: null，且浏览器不允许它读写 cookie / localStorage。

          后果要说清楚：**依赖登录态或站内存储的第三方应用，在这种沙箱里无法工作**。
          这类应用通常提供"嵌入模式"，把身份信息放在 URL 参数里（例如
          ?user_id=...&token=...&ui_mode=embedded），那种模式才能在沙箱内正常渲染。

          referrerPolicy 不再强制 no-referrer：很多嵌入方靠 Referer 判断"是谁嵌
          了我"来决定放不放行，把它抹掉只会让自己被拒。
        */}
        <iframe
          src={page.content}
          title={page.title}
          className='size-full border-none'
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation-by-user-activation'
          referrerPolicy='strict-origin-when-cross-origin'
        />
      </div>
    )
  }

  if (page.type === 'html') {
    return (
      <Card data-card-hover='false' className='gap-0 py-0'>
        <div className='p-5 sm:p-6'>
          <RichContent
            mode='html'
            htmlVariant='isolated'
            content={page.content}
          />
        </div>
      </Card>
    )
  }

  // 外链类型正常由侧边栏直接新标签打开；只有手输 URL 才会走到这里，
  // 给一个明确的出口而不是空白页。
  //
  // 只有确认是 http(s) 才渲染链接：后端已在保存时拦截危险协议，这里再兜一层，
  // 保证即使库里存着脏数据也不会被点开。
  const openable = isHttpUrl(page.content)

  return (
    <Card data-card-hover='false' className='gap-0 py-12'>
      <div className='flex flex-col items-center gap-3 px-4 text-center'>
        <IconBadge tone='neutral' size='lg'>
          <ExternalLink />
        </IconBadge>
        <p className='text-muted-foreground text-sm'>
          {t('This entry opens an external site.')}
        </p>
        {openable && (
          <Button
            size='sm'
            render={
              <a
                href={page.content}
                target='_blank'
                rel='noopener noreferrer'
              />
            }
          >
            {t('Open link')}
            <ExternalLink className='size-4' />
          </Button>
        )}
      </div>
    </Card>
  )
}

/**
 * One operator-configured custom page.
 *
 * The route is static (`/custom-tab/$pageId`) and the content is read from the
 * status payload at render time, so editing a page in the admin UI takes effect
 * immediately without rebuilding the frontend.
 */
export function CustomTabPage({ pageId }: CustomTabPageProps) {
  const { t } = useTranslation()
  const { status, loading } = useStatus()

  const raw = status?.SidebarCustomTabs
  const pages = useMemo(
    () =>
      visibleSidebarTabCategories(
        parseSidebarTabs(typeof raw === 'string' ? raw : '')
      ).flatMap((category) => category.items),
    [raw]
  )

  const page = pages.find((item) => item.id === pageId)

  if (loading) {
    return (
      <SectionPageLayout>
        <SectionPageLayout.Content>
          <div className='mx-auto w-full max-w-5xl'>
            <Skeleton className='h-96 w-full rounded-xl' />
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    )
  }

  // 页面被删除、或链接拼错：给出明确说明，而不是空白页。
  if (!page) {
    return (
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Custom page')}</SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='mx-auto w-full max-w-5xl'>
            <Card data-card-hover='false' className='gap-0 py-12'>
              <div className='flex flex-col items-center gap-3 px-4 text-center'>
                <IconBadge tone='neutral' size='lg'>
                  <FileQuestion />
                </IconBadge>
                <div>
                  <h3 className='text-base font-semibold'>
                    {t('This page is no longer available')}
                  </h3>
                  <p className='text-muted-foreground mt-1.5 text-sm'>
                    {t(
                      'The administrator may have removed or renamed this entry.'
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{page.title}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-5xl'>
          <CustomTabBody page={page} />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
