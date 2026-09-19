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
import { useFormContext } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrencyLabel } from '@/lib/currency'
import {
  formatQuota,
  getEditableQuotaStep,
  parseQuotaFromDollars,
  quotaUnitsToEditableAmount,
} from '@/lib/format'

import { safeNumberFieldProps } from '../utils/numeric-field'

export type QuotaUnitMode = 'quota' | 'currency'

interface QuotaFieldProps {
  name: string
  label: string
  description: string
  /** 配额模式下的最小值；金额模式下最小值一律放宽到 0 */
  min?: number
  itemClassName?: string
  mode: QuotaUnitMode
}

/**
 * 一个"额度"输入框：显示与输入可以按金额，存进表单的始终是内部配额。
 *
 * 为什么单独抽出来：抽奖设置卡里有 5 个这样的字段，之前每个都各自
 * 拼一遍"原始配额 + 用户看到约 X"，加金额输入能力时如果逐个复制，5 处转换逻辑
 * 迟早会漂移。这里只写一遍。
 *
 * 表单状态始终是配额（和别的字段、和后端一致），切换单位只是换一种"读法"，
 * 所以来回切换不会丢精度，也不会因为站点显示币种变化而改动已存配置。
 */
export function QuotaField({
  name,
  label,
  description,
  min = 1,
  itemClassName,
  mode,
}: QuotaFieldProps) {
  const { t } = useTranslation()
  const { control } = useFormContext()
  const step = getEditableQuotaStep()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const props = safeNumberFieldProps(field)
        const quota = typeof props.value === 'number' ? props.value : 0
        // 空输入保持空：否则金额模式下会把"没填"显示成 0
        let display: number | '' = props.value
        if (mode === 'currency' && props.value !== '') {
          display = quotaUnitsToEditableAmount(quota)
        }

        return (
          <FormItem className={itemClassName}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type='number'
                min={mode === 'currency' ? 0 : min}
                step={mode === 'currency' ? step : 1}
                {...props}
                value={display}
                onChange={(event) => {
                  const next = event.target.valueAsNumber
                  // 与 utils/numeric-field.ts 保持一致：忽略 NaN 中间态，
                  // 否则空输入/半个负号会把 NaN 写进表单，提交被静默拦下
                  if (!Number.isFinite(next)) return
                  field.onChange(
                    mode === 'currency'
                      ? parseQuotaFromDollars(next)
                      : Math.round(next)
                  )
                }}
              />
            </FormControl>
            <FormDescription>
              {description}
              {' · '}
              {t('Users see about {{amount}}', {
                amount: formatQuota(quota),
              })}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

interface QuotaInputProps {
  value: number
  onChange: (quota: number) => void
  mode: QuotaUnitMode
  min?: number
  disabled?: boolean
}

/**
 * 额度输入框的"裸"版本：给手写的 useState 表单用。
 *
 * 换算逻辑与 {@link QuotaField} 完全一致，只是取值/回写走 props ——
 * 限时活动的表单是手写的（不是 react-hook-form），用不了依赖 useFormContext 的那一版。
 */
export function QuotaInput({
  value,
  onChange,
  mode,
  min = 1,
  disabled,
}: QuotaInputProps) {
  const step = getEditableQuotaStep()

  return (
    <Input
      type='number'
      min={mode === 'currency' ? 0 : min}
      step={mode === 'currency' ? step : 1}
      value={mode === 'currency' ? quotaUnitsToEditableAmount(value) : value}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.valueAsNumber
        // 与 utils/numeric-field.ts 一致：忽略 NaN 中间态
        if (!Number.isFinite(next)) return
        onChange(
          mode === 'currency' ? parseQuotaFromDollars(next) : Math.round(next)
        )
      }}
    />
  )
}

/**
 * 卡片级的金额单位开关：一个开关管住这张卡里所有的额度输入。
 *
 * 放在卡片顶部而不是每个字段各来一个 —— 5 个字段各带一个开关，既挤又容易漏看。
 */
export function QuotaUnitSwitch({
  mode,
  onChange,
  disabled,
}: {
  mode: QuotaUnitMode
  onChange: (mode: QuotaUnitMode) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const currency = getCurrencyLabel()

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      <span className='text-muted-foreground text-xs'>{t('Amounts in')}</span>
      <div className='flex gap-1'>
        <Button
          type='button'
          size='sm'
          variant={mode === 'quota' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onChange('quota')}
        >
          {t('Quota')}
        </Button>
        <Button
          type='button'
          size='sm'
          variant={mode === 'currency' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onChange('currency')}
        >
          {currency}
        </Button>
      </div>
      {mode === 'currency' && (
        <span className='text-muted-foreground text-xs'>
          {t(
            'Amounts are entered in {{currency}} and stored as internal quota.',
            { currency }
          )}
        </span>
      )}
    </div>
  )
}


