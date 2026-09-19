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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'

import type { WelfareModuleId, WelfareModuleMeta } from '../modules'

interface WelfareOverviewProps {
  modules: WelfareModuleMeta[]
  onOpen: (id: WelfareModuleId) => void
}

/**
 * Landing view of the welfare hub: one card per enabled module.
 *
 * The whole card is the hit target (a real <button>) so the affordance matches
 * what it looks like, instead of making people aim for a small "Open" link.
 */
export function WelfareOverview(props: WelfareOverviewProps) {
  const { t } = useTranslation()

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {props.modules.map((module) => (
        <button
          key={module.id}
          type='button'
          onClick={() => props.onOpen(module.id)}
          className='group bg-card hover:border-primary/30 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none relative flex flex-col gap-3 overflow-hidden rounded-xl border p-5 text-left transition-all hover:shadow-md sm:p-6'
        >
          {/* 悬停时浮现的角落光晕，给卡片一点纵深 */}
          <span
            aria-hidden='true'
            className='from-primary/10 pointer-events-none absolute -top-16 -right-16 size-36 rounded-full bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          />

          <div className='flex items-start justify-between gap-3'>
            <IconBadge tone={module.tone} size='lg'>
              <module.icon className='size-5' strokeWidth={2} />
            </IconBadge>
            <ArrowRight className='text-muted-foreground group-hover:text-primary size-4 transition-all group-hover:translate-x-0.5' />
          </div>

          <div className='min-w-0'>
            <h3 className='text-base font-semibold tracking-tight'>
              {t(module.titleKey)}
            </h3>
            <p className='text-muted-foreground mt-1.5 text-sm text-pretty'>
              {t(module.descriptionKey)}
            </p>
          </div>

          <span className='text-primary mt-auto pt-1 text-xs font-medium'>
            {t('Open')}
          </span>
        </button>
      ))}
    </div>
  )
}
