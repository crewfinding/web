import { useCallback } from 'react'
import { getMessages, translate, type Messages, type TranslationKey } from '../locales'
import type { MessageParams } from '../locales/types'
import { currentLocale, useLocale } from './useLocale'

// t() resolves a typed dot-path key in the active locale, interpolating
// {param} placeholders. m is the same dictionary as a tree — use it for
// structured content (feature lists, help articles) that t() can't address.
export function useTranslation() {
  const { locale, setLocale } = useLocale()
  const m: Messages = getMessages(locale)
  const t = useCallback(
    (key: TranslationKey, params?: MessageParams) => translate(m, key, params),
    [m],
  )
  return { t, m, locale, setLocale }
}

// For non-React code (module-level engines, CSV headers): the same lookup
// against whatever locale is active right now.
export function tNow(key: TranslationKey, params?: MessageParams): string {
  return translate(getMessages(currentLocale()), key, params)
}
