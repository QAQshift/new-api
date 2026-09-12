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
import { ImagePlus, ImageOff, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ImageUrlFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Tailwind classes for the preview box (size and shape). */
  previewClassName?: string
  /** How the preview image fills its box. QR codes need `contain`. */
  fit?: 'contain' | 'cover'
  /** Renders a clear button that resets the value. */
  onClear?: () => void
  name?: string
  disabled?: boolean
}

/**
 * Image link input with an inline preview, so administrators can confirm what
 * a saved URL actually points at. Used for every image URL field (site logo,
 * site background, WeChat QR code, documentation and About page blocks).
 */
export function ImageUrlField(props: ImageUrlFieldProps) {
  const { t } = useTranslation()
  const value = props.value ?? ''
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [value])

  const hasValue = value.trim().length > 0
  const fit = props.fit ?? 'contain'

  let previewBody: ReactNode
  if (!hasValue) {
    previewBody = <ImagePlus className='text-muted-foreground size-4' />
  } else if (failed) {
    previewBody = (
      <span className='text-muted-foreground flex flex-col items-center gap-1 px-1 text-center text-[10px] leading-tight'>
        <ImageOff className='size-4' />
        {t('Image preview unavailable')}
      </span>
    )
  } else {
    previewBody = (
      <button
        type='button'
        className='size-full'
        onClick={() => window.open(value, '_blank', 'noopener,noreferrer')}
        title={t('Open image')}
      >
        <img
          src={value}
          alt=''
          loading='lazy'
          onError={() => setFailed(true)}
          className={`size-full ${
            fit === 'cover' ? 'object-cover' : 'object-contain'
          }`}
        />
      </button>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Input
        value={value}
        name={props.name}
        disabled={props.disabled}
        autoComplete='off'
        placeholder={props.placeholder ?? t('https://example.com/image.png')}
        onChange={(event) => props.onChange(event.target.value)}
        className='min-w-56 flex-1'
      />
      <div
        className={`bg-muted/50 flex shrink-0 items-center justify-center overflow-hidden rounded-lg border ${
          props.previewClassName ?? 'h-16 w-24'
        }`}
        title={
          hasValue
            ? value
            : t('Paste an image link to see the preview')
        }
      >
        {previewBody}
      </div>
      {props.onClear && hasValue && (
        <Button
          type='button'
          variant='ghost'
          onClick={() => props.onClear?.()}
          aria-label={t('Clear')}
        >
          <X className='mr-2 size-4' /> {t('Clear')}
        </Button>
      )}
    </div>
  )
}
