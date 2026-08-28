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
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as Radio } from '@base-ui/react/radio-group'
import { Check, Moon, Palette, RotateCcw, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useTheme } from '@/context/theme-provider'

const Item = RadioPrimitive.Root

export function ConfigDrawer() {
  const { t } = useTranslation()
  const { defaultTheme, theme, setTheme } = useTheme()
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size='icon'
            variant='ghost'
            aria-label={t('Open theme settings')}
          />
        }
      >
        <Palette className='size-[1.2rem]' aria-hidden='true' />
      </SheetTrigger>
      <SheetContent className={sideDrawerContentClassName('sm:max-w-md')}>
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>{t('Theme Settings')}</SheetTitle>
          <SheetDescription>
            {t('Choose the light or dark interface mode.')}
          </SheetDescription>
        </SheetHeader>
        <div className={sideDrawerFormClassName()}>
          <div>
            <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold'>
              {t('Theme')}
              {theme !== defaultTheme && (
                <Button
                  size='icon'
                  variant='secondary'
                  className='size-5'
                  onClick={() => setTheme(defaultTheme)}
                  aria-label={t('Reset')}
                >
                  <RotateCcw className='size-3' aria-hidden='true' />
                </Button>
              )}
            </div>
            <Radio
              value={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark')}
              className='grid w-full grid-cols-2 gap-4'
              aria-label={t('Select theme preference')}
            >
              <ThemeOption
                value='light'
                label={t('Light')}
                selected={theme === 'light'}
                icon={<Sun className='size-6' />}
              />
              <ThemeOption
                value='dark'
                label={t('Dark')}
                selected={theme === 'dark'}
                icon={<Moon className='size-6' />}
              />
            </Radio>
          </div>
        </div>
        <SheetFooter className={sideDrawerFooterClassName('grid-cols-1')}>
          <p className='text-muted-foreground text-center text-xs'>
            {t(
              'Additional appearance settings are managed by the administrator.'
            )}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ThemeOption(props: {
  value: 'light' | 'dark'
  label: string
  selected: boolean
  icon: React.ReactNode
}) {
  return (
    <Item
      value={props.value}
      className='group flex flex-col items-stretch outline-none'
      aria-label={props.label}
    >
      <div className='ring-border group-data-checked:ring-primary group-focus-visible:ring-primary/60 relative flex h-16 items-center justify-center rounded-lg ring-[1px] transition group-focus-visible:ring-2'>
        {props.icon}
        {props.selected && (
          <Check
            className='text-primary absolute top-2 right-2 size-4'
            aria-hidden='true'
          />
        )}
      </div>
      <div className='mt-1.5 text-center text-xs'>{props.label}</div>
    </Item>
  )
}
