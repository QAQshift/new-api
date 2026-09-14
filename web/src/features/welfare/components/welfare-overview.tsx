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
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'

import type { WelfareModuleId, WelfareModuleMeta } from '../modules'

interface WelfareOverviewProps {
  modules: WelfareModuleMeta[]
  onOpen: (id: WelfareModuleId) => void
}

/**
 * Landing view of the welfare hub: one card per enabled module.
 */
export function WelfareOverview(props: WelfareOverviewProps) {
  const { t } = useTranslation()

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {props.modules.map((module) => (
        <Card
          key={module.id}
          data-card-hover='false'
          className='flex flex-col gap-4 p-5 sm:p-6'
        >
          <IconBadge tone='neutral' size='lg'>
            <module.icon className='h-5 w-5' strokeWidth={2} />
          </IconBadge>
          <div>
            <h3 className='text-base font-semibold tracking-tight'>
              {t(module.titleKey)}
            </h3>
            <p className='text-muted-foreground mt-1.5 text-sm'>
              {t(module.descriptionKey)}
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='self-start'
            onClick={() => props.onOpen(module.id)}
          >
            {t('Open')}
          </Button>
        </Card>
      ))}
    </div>
  )
}
