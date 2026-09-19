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
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_SIDEBAR_TAB_CATEGORIES,
  MAX_SIDEBAR_TAB_HTML_LENGTH,
  MAX_SIDEBAR_TAB_ITEMS,
  MAX_SIDEBAR_TAB_ITEMS_PER_CATEGORY,
  MAX_SIDEBAR_TAB_TITLE_LENGTH,
  MAX_SIDEBAR_TAB_URL_LENGTH,
  countSidebarTabPages,
  createEmptyCategory,
  createEmptyPage,
  parseSidebarTabs,
  serializeSidebarTabs,
  sidebarTabsSignature,
  type SidebarTabCategoryDraft,
  type SidebarTabDraft,
  type SidebarTabType,
} from '@/lib/sidebar-tabs'

import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

/** The option key this section writes to. */
const OPTION_KEY = 'SidebarCustomTabs'

const TAB_TYPE_OPTIONS: Array<{ value: SidebarTabType; labelKey: string }> = [
  { value: 'link', labelKey: 'External link' },
  { value: 'iframe', labelKey: 'Embedded page' },
  { value: 'html', labelKey: 'HTML content' },
]

interface SidebarTabsSectionProps {
  initialSerialized: string
}

/**
 * Editor for the custom sidebar tabs: categories, each holding pages.
 *
 * A category becomes one sidebar group; a page is either an external link, an
 * embedded URL, or a block of HTML. The same limits are enforced server-side,
 * so the counters and disabled states here exist to prevent dead ends rather
 * than to be the only guard.
 */
export function SidebarTabsSection({
  initialSerialized,
}: SidebarTabsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [categories, setCategories] = useState<SidebarTabCategoryDraft[]>(() =>
    parseSidebarTabs(initialSerialized)
  )

  const initialSignature = useMemo(
    () => sidebarTabsSignature(parseSidebarTabs(initialSerialized)),
    [initialSerialized]
  )
  const dirty = sidebarTabsSignature(categories) !== initialSignature
  const saving = updateOption.isPending
  const totalPages = countSidebarTabPages(categories)

  const patchCategory = (
    index: number,
    patch: Partial<SidebarTabCategoryDraft>
  ) =>
    setCategories((prev) =>
      prev.map((category, i) =>
        i === index ? { ...category, ...patch } : category
      )
    )

  const patchPage = (
    categoryIndex: number,
    pageIndex: number,
    patch: Partial<SidebarTabDraft>
  ) =>
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              items: category.items.map((page, j) =>
                j === pageIndex ? { ...page, ...patch } : page
              ),
            }
          : category
      )
    )

  const addCategory = () =>
    setCategories((prev) => [...prev, createEmptyCategory()])

  const removeCategory = (index: number) =>
    setCategories((prev) => prev.filter((_, i) => i !== index))

  const addPage = (categoryIndex: number) =>
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? { ...category, items: [...category.items, createEmptyPage()] }
          : category
      )
    )

  const removePage = (categoryIndex: number, pageIndex: number) =>
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              items: category.items.filter((_, j) => j !== pageIndex),
            }
          : category
      )
    )

  async function handleSave() {
    // 服务端会再做一次完整校验并返回可读的报错；这里不做前置拦截，
    // 避免两套规则漂移。
    await updateOption.mutateAsync({
      key: OPTION_KEY,
      value: serializeSidebarTabs(categories),
    })
  }

  return (
    <SettingsSection title={t('Custom sidebar tabs')}>
      <SettingsPageFormActions
        onSave={handleSave}
        isSaving={saving}
        isSaveDisabled={!dirty}
        saveLabel='Save custom sidebar tabs'
      />

      <div className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          {t(
            'Every signed-in user sees these entries in the sidebar. Each category becomes its own group.'
          )}
        </p>

        {categories.length === 0 ? (
          <div className='text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm'>
            {t('No custom entries yet. Add a category to get started.')}
          </div>
        ) : null}

        {categories.map((category, categoryIndex) => (
          <Card
            key={category.id}
            data-card-hover='false'
            className='gap-0 py-0'
          >
            <div className='flex flex-wrap items-end gap-2 border-b p-4'>
              <div className='min-w-48 flex-1 space-y-1.5'>
                <label className='text-muted-foreground text-xs'>
                  {t('Category name')}
                </label>
                <Input
                  value={category.title}
                  maxLength={MAX_SIDEBAR_TAB_TITLE_LENGTH}
                  placeholder={t('e.g. Help center')}
                  disabled={saving}
                  onChange={(event) =>
                    patchCategory(categoryIndex, { title: event.target.value })
                  }
                />
              </div>
              <span className='text-muted-foreground pb-2 text-xs tabular-nums'>
                {category.items.length} / {MAX_SIDEBAR_TAB_ITEMS_PER_CATEGORY}
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={
                  saving ||
                  category.items.length >= MAX_SIDEBAR_TAB_ITEMS_PER_CATEGORY ||
                  totalPages >= MAX_SIDEBAR_TAB_ITEMS
                }
                onClick={() => addPage(categoryIndex)}
              >
                <Plus className='size-4' />
                {t('Add page')}
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={saving}
                aria-label={t('Remove category')}
                onClick={() => removeCategory(categoryIndex)}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>

            <div className='space-y-3 p-4'>
              {category.items.length === 0 ? (
                <p className='text-muted-foreground text-xs'>
                  {t(
                    'This category has no page yet, so it will not appear in the sidebar.'
                  )}
                </p>
              ) : null}

              {category.items.map((page, pageIndex) => (
                <div
                  key={page.id}
                  className='bg-muted/30 space-y-2 rounded-lg border p-3'
                >
                  <div className='flex flex-wrap items-end gap-2'>
                    <div className='min-w-40 flex-1 space-y-1.5'>
                      <label className='text-muted-foreground text-xs'>
                        {t('Page name')}
                      </label>
                      <Input
                        value={page.title}
                        maxLength={MAX_SIDEBAR_TAB_TITLE_LENGTH}
                        disabled={saving}
                        onChange={(event) =>
                          patchPage(categoryIndex, pageIndex, {
                            title: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='min-w-40 space-y-1.5'>
                      <label className='text-muted-foreground text-xs'>
                        {t('Content type')}
                      </label>
                      <Select
                        value={page.type}
                        disabled={saving}
                        onValueChange={(value) =>
                          patchPage(categoryIndex, pageIndex, {
                            type: value as SidebarTabType,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAB_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(option.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      disabled={saving}
                      aria-label={t('Remove page')}
                      onClick={() => removePage(categoryIndex, pageIndex)}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-muted-foreground text-xs'>
                      {page.type === 'html' ? t('HTML content') : t('URL')}
                    </label>
                    {page.type === 'html' ? (
                      <Textarea
                        value={page.content}
                        rows={5}
                        maxLength={MAX_SIDEBAR_TAB_HTML_LENGTH}
                        className='font-mono text-xs'
                        placeholder='<p>...</p>'
                        disabled={saving}
                        onChange={(event) =>
                          patchPage(categoryIndex, pageIndex, {
                            content: event.target.value,
                          })
                        }
                      />
                    ) : (
                      <Input
                        value={page.content}
                        maxLength={MAX_SIDEBAR_TAB_URL_LENGTH}
                        placeholder='https://example.com'
                        disabled={saving}
                        onChange={(event) =>
                          patchPage(categoryIndex, pageIndex, {
                            content: event.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={saving || categories.length >= MAX_SIDEBAR_TAB_CATEGORIES}
          onClick={addCategory}
        >
          <Plus className='size-4' />
          {t('Add category')}
        </Button>
      </div>
    </SettingsSection>
  )
}
