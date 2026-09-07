/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Edit3, Eye, FileText, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Markdown } from '@/components/ui/markdown'
import { Textarea } from '@/components/ui/textarea'

import { SettingsSwitchField } from '../components/settings-form-layout'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

type ManagedDocument = {
  id: string
  title: string
  summary: string
  content: string
  published: boolean
  order: number
}

type DocsSectionProps = {
  data: string
}

type EditorState = Omit<ManagedDocument, 'id'>

const EMPTY_EDITOR: EditorState = {
  title: '',
  summary: '',
  content: '',
  published: false,
  order: 0,
}

function parseDocuments(data: string): ManagedDocument[] {
  try {
    const parsed: unknown = JSON.parse(data || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item, index) => {
      if (!item || typeof item !== 'object') return []
      const value = item as Partial<ManagedDocument>
      if (
        typeof value.title !== 'string' ||
        typeof value.content !== 'string'
      ) {
        return []
      }
      return [
        {
          id:
            typeof value.id === 'string' && value.id
              ? value.id
              : `doc-${index + 1}`,
          title: value.title,
          summary: typeof value.summary === 'string' ? value.summary : '',
          content: value.content,
          published: value.published === true,
          order:
            typeof value.order === 'number' && value.order >= 0
              ? value.order
              : index,
        },
      ]
    })
  } catch {
    return []
  }
}

export function DocsSection(props: DocsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [documents, setDocuments] = useState<ManagedDocument[]>(() =>
    parseDocuments(props.data)
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR)
  const [preview, setPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setDocuments(parseDocuments(props.data))
    setEditingId(null)
    setEditor(EMPTY_EDITOR)
    setHasChanges(false)
  }, [props.data])

  const updateEditor = <K extends keyof EditorState>(
    key: K,
    value: EditorState[K]
  ) => {
    setEditor((current) => ({ ...current, [key]: value }))
  }

  const startNew = () => {
    setEditingId('new')
    setEditor({ ...EMPTY_EDITOR, order: documents.length })
    setPreview(false)
  }

  const startEdit = (document: ManagedDocument) => {
    setEditingId(document.id)
    setEditor({
      title: document.title,
      summary: document.summary,
      content: document.content,
      published: document.published,
      order: document.order,
    })
    setPreview(false)
  }

  const saveDocument = () => {
    if (!editor.title.trim() || !editor.content.trim()) {
      toast.error(t('Document title and content are required'))
      return
    }
    const id =
      editingId === 'new' || !editingId ? crypto.randomUUID() : editingId
    const nextDocument: ManagedDocument = {
      id,
      ...editor,
      title: editor.title.trim(),
      summary: editor.summary.trim(),
      content: editor.content.trim(),
      order: Math.max(0, Math.floor(editor.order)),
    }
    setDocuments((current) => {
      const exists = current.some((item) => item.id === id)
      return exists
        ? current.map((item) => (item.id === id ? nextDocument : item))
        : [...current, nextDocument]
    })
    setEditingId(id)
    setHasChanges(true)
    toast.success(t('Document draft updated'))
  }

  const deleteDocument = (id: string) => {
    setDocuments((current) => current.filter((item) => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setEditor(EMPTY_EDITOR)
    }
    setHasChanges(true)
  }

  const saveAll = async () => {
    try {
      const ordered = [...documents].sort((a, b) => a.order - b.order)
      await updateOption.mutateAsync({
        key: 'console_setting.docs',
        value: JSON.stringify(ordered),
      })
      setHasChanges(false)
      toast.success(t('Documentation settings saved'))
    } catch {
      toast.error(t('Failed to save documentation settings'))
    }
  }

  return (
    <SettingsSection title={t('Documentation management')}>
      <div className='space-y-5'>
        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm'>
          <p>
            {t(
              'Create published Markdown pages that extend the built-in documentation.'
            )}
          </p>
          <div className='flex gap-2'>
            <Button size='sm' onClick={startNew}>
              <Plus className='mr-2 size-4' />
              {t('Add document')}
            </Button>
            <Button
              size='sm'
              variant='secondary'
              onClick={saveAll}
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 size-4' />
              {updateOption.isPending ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'>
          <div className='space-y-2'>
            {documents.length === 0 ? (
              <div className='text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm'>
                <FileText className='mx-auto mb-2 size-7 opacity-60' />
                {t('No custom documents yet')}
              </div>
            ) : (
              [...documents]
                .sort((a, b) => a.order - b.order)
                .map((document) => (
                  <div
                    key={document.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      editingId === document.id
                        ? 'border-primary bg-primary/5'
                        : ''
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <button
                        type='button'
                        className='min-w-0 flex-1 text-left'
                        onClick={() => startEdit(document)}
                      >
                        <p className='truncate font-medium'>{document.title}</p>
                        <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                          {document.summary || t('No summary')}
                        </p>
                      </button>
                      <div className='flex shrink-0 items-center gap-1'>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            document.published
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {document.published ? t('Published') : t('Draft')}
                        </span>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={t('Edit document')}
                          onClick={() => startEdit(document)}
                        >
                          <Edit3 className='size-4' />
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={t('Delete document')}
                          onClick={() => deleteDocument(document.id)}
                        >
                          <Trash2 className='text-destructive size-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {editingId ? (
            <div className='space-y-4 rounded-xl border p-4'>
              <div className='flex items-center justify-between gap-3'>
                <h4 className='font-semibold'>{t('Document editor')}</h4>
                <div className='flex gap-1 rounded-lg border p-1'>
                  <Button
                    size='sm'
                    variant={!preview ? 'secondary' : 'ghost'}
                    onClick={() => setPreview(false)}
                  >
                    <Edit3 className='mr-1.5 size-3.5' />
                    {t('Edit')}
                  </Button>
                  <Button
                    size='sm'
                    variant={preview ? 'secondary' : 'ghost'}
                    onClick={() => setPreview(true)}
                  >
                    <Eye className='mr-1.5 size-3.5' />
                    {t('Preview')}
                  </Button>
                </div>
              </div>
              {preview ? (
                <div className='bg-muted/20 min-h-80 rounded-lg border p-5'>
                  <h3 className='text-xl font-semibold'>
                    {editor.title || t('Untitled document')}
                  </h3>
                  {editor.summary && (
                    <p className='text-muted-foreground mt-2 text-sm'>
                      {editor.summary}
                    </p>
                  )}
                  <div className='mt-4'>
                    <Markdown>
                      {editor.content || t('Nothing to preview yet')}
                    </Markdown>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]'>
                    <label className='space-y-1.5'>
                      <span className='text-sm font-medium'>{t('Title')}</span>
                      <Input
                        value={editor.title}
                        maxLength={200}
                        onChange={(event) =>
                          updateEditor('title', event.target.value)
                        }
                        placeholder={t('Document title')}
                      />
                    </label>
                    <label className='space-y-1.5'>
                      <span className='text-sm font-medium'>{t('Order')}</span>
                      <Input
                        type='number'
                        min={0}
                        value={editor.order}
                        onChange={(event) =>
                          updateEditor('order', Number(event.target.value) || 0)
                        }
                      />
                    </label>
                  </div>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>{t('Summary')}</span>
                    <Input
                      value={editor.summary}
                      maxLength={500}
                      onChange={(event) =>
                        updateEditor('summary', event.target.value)
                      }
                      placeholder={t(
                        'Short description shown in the document list'
                      )}
                    />
                  </label>
                  <label className='block space-y-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Markdown content')}
                    </span>
                    <Textarea
                      value={editor.content}
                      onChange={(event) =>
                        updateEditor('content', event.target.value)
                      }
                      className='min-h-80 font-mono text-sm'
                      placeholder={t('Write Markdown content here...')}
                    />
                  </label>
                  <SettingsSwitchField
                    checked={editor.published}
                    onCheckedChange={(checked) =>
                      updateEditor('published', checked)
                    }
                    label={t('Publish this document')}
                    description={t(
                      'Only published documents are visible on the public docs page.'
                    )}
                    className='py-0'
                  />
                  <Button onClick={saveDocument}>
                    <Save className='mr-2 size-4' />
                    {t('Save document draft')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='text-muted-foreground flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm'>
              {t('Select a document or add a new one to begin editing.')}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}
