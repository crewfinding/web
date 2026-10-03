import { BellRinging, ChatText, DeviceMobile, Envelope } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useFonderieClient } from '@fonderie/react'
import { Button } from './Button'
import { Card } from './Card'
import { SectionHeader } from './SectionHeader'
import { Toggle } from './Toggle'
import { useAppSession } from '../lib/session'
import { useTranslation } from '../hooks/useTranslation'
import { toastError } from '../lib/errors'

type ChannelKey = 'email' | 'inApp' | 'sms' | 'push'

// The four channels @fonderie/auth models on user preferences. CrewFinding
// only delivers over email today (SMS/push have no provider wired), so those
// rows note the requirement — the preference still saves, and starts sending
// once a provider is configured. Labels/descriptions live in the settings
// dictionary under channels.<key>.
const CHANNELS: { key: ChannelKey; icon: Icon }[] = [
  { key: 'email', icon: Envelope },
  { key: 'inApp', icon: ChatText },
  { key: 'sms', icon: DeviceMobile },
  { key: 'push', icon: BellRinging },
]

const DEFAULTS: Record<ChannelKey, boolean> = { email: true, inApp: true, sms: false, push: false }

export function NotificationsCard() {
  const { t } = useTranslation()
  const { user, refresh } = useAppSession()
  const client = useFonderieClient()

  const saved = user?.preferences.notifications
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    email: saved?.email ?? DEFAULTS.email,
    inApp: saved?.inApp ?? DEFAULTS.inApp,
    sms: saved?.sms ?? DEFAULTS.sms,
    push: saved?.push ?? DEFAULTS.push,
  })
  const [saving, setSaving] = useState(false)

  const dirty = CHANNELS.some((c) => channels[c.key] !== (saved?.[c.key] ?? DEFAULTS[c.key]))

  const set = (key: ChannelKey, value: boolean) => setChannels((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      // updatePreferences REPLACES the notifications object, so send all four.
      await client.auth.updatePreferences({ notifications: channels })
      await refresh({ force: true })
      toast.success(t('settings.notifications.updated'))
    } catch (err) {
      toastError(err, t('settings.notifications.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card as="section" id="notifications" className="scroll-mt-20 p-5">
      <SectionHeader
        icon={BellRinging}
        title={t('settings.notifications.title')}
        description={t('settings.notifications.description')}
      />

      <div className="mt-4 divide-y divide-hairline">
        {CHANNELS.map(({ key, icon: RowIcon }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <RowIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink">{t(`settings.notifications.channels.${key}.label`)}</p>
                <p className="text-sm text-ink-subtle">{t(`settings.notifications.channels.${key}.description`)}</p>
              </div>
            </div>
            <Toggle
              pressed={channels[key]}
              onPressedChange={(next) => set(key, next)}
              pressedLabel={t('settings.notifications.on')}
              unpressedLabel={t('settings.notifications.off')}
              aria-label={t(`settings.notifications.channels.${key}.label`)}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={() => void handleSave()} loading={saving} disabled={!dirty}>
          {t('settings.notifications.save')}
        </Button>
      </div>
    </Card>
  )
}
