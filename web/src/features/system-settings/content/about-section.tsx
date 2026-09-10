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
import { Eye, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { defaultAboutDocument } from '@/overrides/about/default-about'
import type { AboutDocument } from '@/overrides/about/parse-about'
import { StructuredAboutPage } from '@/overrides/about/structured-about'

import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import { DocBlockListEditor } from './doc-block-editor'

type AboutSectionProps = {
  data: string
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function parseAboutDocument(data: string): AboutDocument {
  try {
    const parsed: unknown = JSON.parse(data || 'null')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return clone(defaultAboutDocument)
    }
    const record = parsed as Partial<AboutDocument>
    return {
      version: typeof record.version === 'number' ? record.version : 1,
      eyebrow: typeof record.eyebrow === 'string' ? record.eyebrow : '',
      title: typeof record.title === 'string' ? record.title : '',
      summary: typeof record.summary === 'string' ? record.summary : '',
      blocks: Array.isArray(record.blocks) ? record.blocks : [],
    }
  } catch {
    return clone(defaultAboutDocument)
  }
}

export function AboutSection(props: AboutSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [document, setDocument] = useState<AboutDocument>(() =>
    parseAboutDocument(props.data)
  )
  const [preview, setPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setDocument(parseAboutDocument(props.data))
    setPreview(false)
    setHasChanges(false)
  }, [props.data])

  const patch = (next: Partial<AboutDocument>) => {
    setDocument((current) => ({ ...current, ...next }))
    setHasChanges(true)
  }

  const save = async (value: string) => {
    try {
      await updateOption.mutateAsync({
        key: 'console_setting.about_document',
        value,
      })
      setHasChanges(false)
      toast.success(t('About page settings saved'))
    } catch {
      toast.error(t('Failed to save about page settings'))
    }
  }

  return (
    <SettingsSection title={t('About page content')}>
      <div className='space-y-5'>
        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm'>
          <p>
            {t(
              'Design the About page with the same blocks as the documentation. Use QR code blocks for WeChat or QQ contact codes, and contact cards for copyable support handles.'
            )}
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => window.open('/about', '_blank', 'noopener,noreferrer')}
            >
              <Eye className='mr-2 size-4' />
              {t('Open public page')}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setDocument(clone(defaultAboutDocument))
                setHasChanges(true)
              }}
            >
              <RotateCcw className='mr-2 size-4' />
              {t('Reset to default')}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setDocument(clone(defaultAboutDocument))
                void save('')
              }}
              disabled={updateOption.isPending}
            >
              <Trash2 className='mr-2 size-4' />
              {t('Clear and use built-in page')}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => save(JSON.stringify(document))}
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 size-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </div>

        <div className='space-y-4 rounded-xl border p-4'>
          <div className='grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]'>
            <label className='space-y-1.5'>
              <span className='text-sm font-medium'>
                {t('Eyebrow label')}
              </span>
              <Input
                value={document.eyebrow}
                maxLength={100}
                onChange={(event) => patch({ eyebrow: event.target.value })}
              />
            </label>
            <label className='space-y-1.5'>
              <span className='text-sm font-medium'>{t('Title')}</span>
              <Input
                value={document.title}
                maxLength={200}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </label>
          </div>
          <label className='block space-y-1.5'>
            <span className='text-sm font-medium'>{t('Summary')}</span>
            <Input
              value={document.summary}
              maxLength={500}
              onChange={(event) => patch({ summary: event.target.value })}
            />
          </label>

          <DocBlockListEditor
            blocks={document.blocks}
            onChange={(blocks) => patch({ blocks })}
            emptyHint={t(
              'No content blocks yet. Add cards, contact info, or WeChat / QQ QR codes.'
            )}
          />

          <div className='flex justify-end border-t pt-4'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => save(JSON.stringify(document))}
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 size-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>{t('Preview')}</span>
            <Button
              size='sm'
              variant={preview ? 'secondary' : 'outline'}
              onClick={() => setPreview((current) => !current)}
            >
              <Eye className='mr-1.5 size-3.5' />
              {preview ? t('Hide preview') : t('Show preview')}
            </Button>
          </div>
          {preview && (
            <div className='max-h-[70vh] overflow-y-auto rounded-xl border'>
              <StructuredAboutPage document={document} />
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}
