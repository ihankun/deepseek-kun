import type { ReactElement } from 'react'
import { SettingsCard, SettingRow, Toggle } from './settings-controls'

export function WorkshopSettingsSection({ ctx }: { ctx: Record<string, any> }): ReactElement {
  const { t, form, update } = ctx
  return (
    <SettingsCard title={t('uiPluginWorkshop')}>
      <SettingRow
        title={t('uiPluginWorkshop')}
        description={t('uiPluginWorkshopDesc')}
        control={
          <Toggle
            checked={form.appBehavior.uiPluginWorkshop !== false}
            onChange={(v) => update({ appBehavior: { uiPluginWorkshop: v } })}
          />
        }
      />
    </SettingsCard>
  )
}
