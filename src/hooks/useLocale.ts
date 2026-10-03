import { useSyncExternalStore } from 'react'
import { DEFAULT_LOCALE, isLocale, type Locale } from '../locales'
import { createSubscribable } from './subscribable'

const STORAGE_KEY = 'locale'

function readStoredLocale(): Locale {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY)
    if (item === null) return DEFAULT_LOCALE
    const parsed: unknown = JSON.parse(item)
    return isLocale(parsed) ? parsed : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

// Module-level store (not useLocalStorage) because the navbar dropdown and the
// drawer pills render simultaneously and must observe the same value.
let locale: Locale = readStoredLocale()
const store = createSubscribable()

// Assistive tech and browser translation key off the document language.
document.documentElement.lang = locale

export function setLocale(next: Locale) {
  if (next === locale) return
  locale = next
  document.documentElement.lang = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable: keep the in-memory value for this session
  }
  store.emit()
}

// The active locale for non-React code paths (CSV export, module-level engines).
export function currentLocale(): Locale {
  return locale
}

export function useLocale() {
  const current = useSyncExternalStore(store.subscribe, () => locale)
  return { locale: current, setLocale }
}
