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
  CalendarClock,
  CalendarDays,
  Gift,
  type LucideIcon,
} from 'lucide-react'

import type { IconBadgeTone } from '@/components/ui/icon-badge'

/**
 * Modules the welfare hub can aggregate. Each one is switched on or off
 * independently by the operator, and the hub only shows what is enabled.
 */
export type WelfareModuleId = 'activity' | 'checkin' | 'lottery'

export interface WelfareModuleMeta {
  id: WelfareModuleId
  icon: LucideIcon
  /** i18n source key for the module name */
  titleKey: string
  /** i18n source key for the one-line description */
  descriptionKey: string
  /** Colour used by the module's icon badge, so the three modules stay distinct */
  tone: IconBadgeTone
}

export const WELFARE_MODULES: Record<WelfareModuleId, WelfareModuleMeta> = {
  activity: {
    id: 'activity',
    icon: CalendarClock,
    titleKey: 'Limited-time Activities',
    descriptionKey: 'Join time-limited activities for a chance at extra quota',
    tone: 'chart-4',
  },
  checkin: {
    id: 'checkin',
    icon: CalendarDays,
    titleKey: 'Daily Check-in',
    descriptionKey: 'Check in daily to receive random quota rewards',
    tone: 'chart-2',
  },
  lottery: {
    id: 'lottery',
    icon: Gift,
    titleKey: 'Lottery',
    descriptionKey: 'Draw prizes with the quota you have already consumed',
    tone: 'chart-5',
  },
}
