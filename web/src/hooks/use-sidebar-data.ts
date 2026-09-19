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
  AppWindow,
  Box,
  CreditCard,
  ExternalLink,
  FileText,
  FlaskConical,
  Gift,
  Key,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Radio,
  ServerCog,
  Settings,
  Share2,
  Ticket,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { NavGroup, SidebarData } from '@/components/layout/types'
import { useStatus } from '@/hooks/use-status'
import {
  isExternalTab,
  parseSidebarTabs,
  sidebarTabPath,
  visibleSidebarTabCategories,
} from '@/lib/sidebar-tabs'
import { ROLE } from '@/lib/roles'

/**
 * 自定义页面的内容形态 → 侧边栏图标。
 * 放在组件外，避免每次渲染重建这三个分支。
 */
function customTabIcon(type: string) {
  if (type === 'iframe') return AppWindow
  if (type === 'html') return FileText
  return ExternalLink
}

/**
 * Root navigation groups for the application sidebar.
 *
 * These are shown when the URL does not match any nested sidebar view
 * registered in `layout/lib/sidebar-view-registry.ts`.
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()
  const { status } = useStatus()
  // The welfare hub aggregates whatever reward modules are switched on
  const welfareEnabled =
    status?.checkin_enabled === true || status?.lottery_enabled === true

  // 管理员配置的自定义 tab：每个分类主题成为侧边栏里的一个独立分组。
  // 位置在「个人」之后、「管理员」之前 —— 普通用户看不到管理员分组，
  // 因此对他们而言就是排在最后。
  const customNavGroups = useMemo<NavGroup[]>(() => {
    const raw = status?.SidebarCustomTabs
    const categories = visibleSidebarTabCategories(
      parseSidebarTabs(typeof raw === 'string' ? raw : '')
    )
    return categories.map((category) => ({
      id: `custom-${category.id}`,
      title: category.title,
      items: category.items.map((page) => {
        const external = isExternalTab(page)
        return {
          title: page.title,
          url: external ? page.content : sidebarTabPath(page.id),
          icon: customTabIcon(page.type),
          external,
        }
      }),
    }))
  }, [status?.SidebarCustomTabs])

  return {
    navGroups: [
      {
        id: 'chat',
        title: t('Chat'),
        items: [
          {
            title: t('Playground'),
            url: '/playground',
            icon: FlaskConical,
          },
          {
            title: t('Chat'),
            icon: MessageSquare,
            type: 'chat-presets',
          },
        ],
      },
      {
        id: 'general',
        title: t('General'),
        items: [
          {
            title: t('Overview'),
            url: '/dashboard/overview',
            icon: Activity,
          },
          {
            title: t('Dashboard'),
            url: '/dashboard/models',
            icon: LayoutDashboard,
          },
          {
            title: t('API Keys'),
            url: '/keys',
            icon: Key,
          },
          {
            title: t('Usage Logs'),
            url: '/usage-logs/common',
            icon: FileText,
          },
          {
            title: t('Task Logs'),
            url: '/usage-logs/task',
            activeUrls: ['/usage-logs/drawing'],
            configUrls: ['/usage-logs/drawing', '/usage-logs/task'],
            icon: ListTodo,
          },
        ],
      },
      {
        id: 'personal',
        title: t('Personal'),
        items: [
          {
            title: t('Wallet'),
            url: '/wallet',
            icon: Wallet,
          },
          // Only listed while at least one welfare module is switched on
          ...(welfareEnabled
            ? [
                {
                  title: t('Welfare Center'),
                  url: '/welfare',
                  icon: Gift,
                },
              ]
            : []),
          {
            title: t('Referral Program'),
            url: '/referral',
            icon: Share2,
          },
          {
            title: t('Profile'),
            url: '/profile',
            icon: User,
          },
        ],
      },
      ...customNavGroups,
      {
        id: 'admin',
        title: t('Admin'),
        items: [
          {
            title: t('Channels'),
            url: '/channels',
            icon: Radio,
          },
          {
            title: t('Models'),
            url: '/models/metadata',
            icon: Box,
          },
          {
            title: t('Users'),
            url: '/users',
            icon: Users,
          },
          {
            title: t('Redemption Codes'),
            url: '/redemption-codes',
            icon: Ticket,
          },
          {
            title: t('Subscriptions'),
            url: '/subscriptions',
            icon: CreditCard,
          },
          {
            title: t('System Info'),
            url: '/system-info',
            icon: ServerCog,
            requiredRole: ROLE.SUPER_ADMIN,
          },
          {
            title: t('System Settings'),
            url: '/system-settings/site',
            activeUrls: ['/system-settings'],
            icon: Settings,
          },
        ],
      },
    ],
  }
}
