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
    /*
      沙箱按"是否跨域"分两种，这是刻意的，不是随手拼的字符串：

      跨域（第三方站点）：必须给 allow-same-origin。
        不给的话，被嵌入页面拿到的是不透明来源（Origin: null），后果有两个 ——
        它读不到自己的 cookie / localStorage（登录态失效），而且**连它自己域名下的
        模块脚本都会被判成跨域请求**（一条 `null` 来源的模块请求，服务端的 CORS
        白名单通常只列真实域名、不认 null），于是整个应用白屏。
        第三方页面本来就不可能访问我们的会话，所以这里放开没有额外风险。

      同源（指向本站自己的页面）：**不给** allow-same-origin。
        allow-scripts 与 allow-same-origin 同时出现在同源 iframe 上时，页面可以
        自己解除沙箱并触达父页面 —— 仓库的 lint 规则拦的正是这一条。这里的判断
        让那种组合在结构上不可能出现，而不是靠注释保证。

      另外 referrerPolicy 不再强制 no-referrer：很多嵌入方靠 Referer 判断"是谁
      嵌了我"来决定放不放行，抹掉它只会让自己被拒。
    */
    let sandbox =
      'allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation-by-user-activation'
    let embedIsCrossOrigin = false
    try {
      embedIsCrossOrigin =
        new URL(page.content).host !== window.location.host
    } catch {
      // 解析不出主机名时不冒险放宽
      embedIsCrossOrigin = false
    }
    if (embedIsCrossOrigin) {
      sandbox += ' allow-same-origin'
    }

    return (
      <div className='h-[85vh] min-h-[36rem] overflow-hidden rounded-xl border'>
        <iframe
          src={page.content}
          title={page.title}
          className='size-full border-none'
          sandbox={sandbox}
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
        {/* 嵌入页铺满可用宽度：它本身就是一个应用窗口，再套一层正文宽度
            （max-w-5xl 居中）会左右各留一大片空白，看起来"窗口很小"。 */}
        <div
          className={
            page.type === 'iframe'
              ? 'w-full'
              : 'mx-auto w-full max-w-5xl'
          }
        >
          <CustomTabBody page={page} />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
