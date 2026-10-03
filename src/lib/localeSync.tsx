import { useFonderieClient } from '@fonderie/react'
import { useEffect, useRef } from 'react'
import { setLocale, useLocale } from '../hooks/useLocale'
import { DEFAULT_LOCALE, isLocale } from '../locales'
import { useAppSession } from './session'

// Makes the locale a real account preference rather than a per-device setting:
// on sign-in the server-side preference (auth's user.preferences.locale) wins,
// and later switches — navbar menu, drawer pills, settings — are pushed back
// via updatePreferences so the choice follows the account across devices.
export function LocalePreferenceSync() {
  const { user } = useAppSession()
  const client = useFonderieClient()
  const { locale } = useLocale()

  const hydratedFor = useRef<string | null>(null)
  // What we believe the server currently stores; set optimistically on push so
  // a failed write degrades to a device-local choice instead of a retry loop
  // (the next sign-in or settings save reconciles it).
  const serverLocale = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      hydratedFor.current = null
      return
    }
    if (hydratedFor.current !== user.id) {
      // Adoption pass, once per signed-in user.
      hydratedFor.current = user.id
      const preferred = user.preferences.locale
      serverLocale.current = preferred
      if (preferred === locale) return
      // A stored preference equal to the default is indistinguishable from
      // "never chosen" (fresh accounts get the default), so the device's
      // explicit pre-login choice — made on the login/register screens — is
      // the fresher signal and gets pushed to the account. Any other valid
      // stored value is a real account preference and wins over the device.
      if (isLocale(preferred) && preferred !== DEFAULT_LOCALE) {
        setLocale(preferred)
      } else {
        serverLocale.current = locale
        client.auth.updatePreferences({ locale }).catch(() => undefined)
      }
      return
    }
    if (locale === serverLocale.current) return
    serverLocale.current = locale
    client.auth.updatePreferences({ locale }).catch(() => undefined)
  }, [user, locale, client])

  return null
}
