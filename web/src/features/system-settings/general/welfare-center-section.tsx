import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

const RULES_KEY = 'welfare_setting.rules_content'

interface WelfareCenterSectionProps {
  rulesContent: string
}

/**
 * Settings that belong to the welfare center itself rather than to one of its
 * sub-modules (check-in / activities / lottery).
 *
 * Right now that is only the rules blurb, which is rendered above every tab and
 * therefore has no single sub-module it could live in.
 */
export function WelfareCenterSection(props: WelfareCenterSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [value, setValue] = useState(props.rulesContent)
  const [saved, setSaved] = useState(props.rulesContent)

  const dirty = value !== saved

  async function handleSave() {
    try {
      await updateOption.mutateAsync({ key: RULES_KEY, value })
      setSaved(value)
      toast.success(t('Setting saved'))
    } catch {
      toast.error(t('Failed to update the setting'))
    }
  }

  return (
    <SettingsSection title={t('Welfare Center')}>
      <div className='space-y-2'>
        <div className='text-sm font-medium'>{t('Welfare center rules')}</div>
        <p className='text-muted-foreground text-xs'>
          {t(
            'Shown at the top of the welfare center, in every module. Supports Markdown and HTML. Leave it empty to hide the block.'
          )}
        </p>
        <Textarea
          rows={8}
          className='font-mono text-xs'
          placeholder={t('## How it works')}
          value={value}
          disabled={updateOption.isPending}
          onChange={(event) => setValue(event.target.value)}
        />
        <div className='flex justify-end'>
          <Button
            size='sm'
            onClick={handleSave}
            disabled={!dirty || updateOption.isPending}
          >
            {t('Save')}
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}
