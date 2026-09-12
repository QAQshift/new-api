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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { SettingsSection } from '../components/settings-section'
import {
  absoluteAssetUrl,
  type AssetImage,
  deleteAssetImage,
  formatAssetSize,
  listAssetImages,
  uploadAssetImage,
} from './asset-api'

const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp,image/x-icon'

export function AssetLibrarySection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deletingName, setDeletingName] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['asset-images'],
    queryFn: listAssetImages,
  })

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['asset-images'] })

  const uploadFiles = async (files: FileList | File[]) => {
    const list = [...files]
    if (list.length === 0) return
    setUploading(true)
    let uploaded = 0
    for (const file of list) {
      try {
        await uploadAssetImage(file)
        uploaded += 1
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : t('Upload failed')
        toast.error(`${file.name}: ${message}`)
      }
    }
    setUploading(false)
    if (uploaded > 0) {
      toast.success(t('Images uploaded'))
      await refresh()
    }
  }

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(label)
    } catch {
      toast.error(t('Copy failed'))
    }
  }

  const remove = async (image: AssetImage) => {
    if (!window.confirm(t('Delete this image? Links using it will break.'))) {
      return
    }
    setDeletingName(image.name)
    try {
      await deleteAssetImage(image.name)
      toast.success(t('Image deleted'))
      await refresh()
    } catch {
      toast.error(t('Failed to delete image'))
    } finally {
      setDeletingName(null)
    }
  }

  const items = data?.items ?? []
  const maxMb = data?.max_bytes ? Math.round(data.max_bytes / 1024 / 1024) : 8

  return (
    <SettingsSection title={t('Image library')}>
      <div className='space-y-5'>
        <p className='text-muted-foreground text-sm'>
          {t(
            'Upload images to the server and copy a stable link for documentation, the About page, or the site logo and background.'
          )}
        </p>

        <div
          role='button'
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            if (event.dataTransfer?.files?.length) {
              void uploadFiles(event.dataTransfer.files)
            }
          }}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
          }`}
        >
          {uploading ? (
            <Loader2 className='text-primary size-6 animate-spin' />
          ) : (
            <ImagePlus className='text-primary size-6' />
          )}
          <p className='text-sm font-medium'>
            {uploading
              ? t('Uploading...')
              : t('Drop images here or click to upload')}
          </p>
          <p className='text-muted-foreground text-xs'>
            {t(
              'Supported formats: JPG, PNG, GIF, WebP, AVIF, BMP, ICO. Up to {{size}} MB per image.',
              { size: maxMb }
            )}
          </p>
          <input
            ref={inputRef}
            type='file'
            accept={ACCEPT}
            multiple
            className='hidden'
            onChange={(event) => {
              if (event.target.files?.length) {
                void uploadFiles(event.target.files)
              }
              event.target.value = ''
            }}
          />
        </div>

        {isLoading && (
          <div className='text-muted-foreground flex min-h-24 items-center justify-center text-sm'>
            <Loader2 className='mr-2 size-4 animate-spin' />
            {t('Loading...')}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className='text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm'>
            {t('No images uploaded yet')}
          </p>
        )}
        {!isLoading && items.length > 0 && (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {items.map((image) => {
              const url = absoluteAssetUrl(image.url)
              return (
                <div
                  key={image.name}
                  className='flex flex-col gap-3 rounded-xl border p-3'
                >
                  <div className='bg-muted/40 flex h-36 items-center justify-center overflow-hidden rounded-lg border'>
                    <img
                      src={image.url}
                      alt={image.name}
                      loading='lazy'
                      className='max-h-full max-w-full object-contain'
                    />
                  </div>
                  <div className='min-w-0'>
                    <p className='truncate font-mono text-xs' title={image.name}>
                      {image.name}
                    </p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {formatAssetSize(image.size)}
                    </p>
                  </div>
                  <input
                    readOnly
                    value={url}
                    onFocus={(event) => event.target.select()}
                    className='bg-muted/40 w-full rounded-md border px-2 py-1 font-mono text-[11px]'
                  />
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => copy(url, t('Link copied'))}
                    >
                      <Copy className='mr-1.5 size-3.5' />
                      {t('Copy link')}
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        copy(`![](${url})`, t('Markdown copied'))
                      }
                    >
                      <Copy className='mr-1.5 size-3.5' />
                      {t('Copy Markdown')}
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('Open image')}
                      onClick={() =>
                        window.open(url, '_blank', 'noopener,noreferrer')
                      }
                    >
                      <ExternalLink className='size-4' />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('Delete image')}
                      disabled={deletingName === image.name}
                      onClick={() => remove(image)}
                    >
                      {deletingName === image.name ? (
                        <Loader2 className='size-4 animate-spin' />
                      ) : (
                        <Trash2 className='text-destructive size-4' />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SettingsSection>
  )
}
