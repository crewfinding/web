import type { MessageParams, MessagePath } from './types'
import en from './lang/en'
import es from './lang/es'
import fr from './lang/fr'

export const locales = ['en', 'fr', 'es'] as const
export type Locale = (typeof locales)[number]

export const DEFAULT_LOCALE: Locale = 'en'

// Native-language names, shown in the locale pickers.
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

// BCP 47 tags for Intl APIs (localized month names, number formats, …).
export const localeTags: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
}

export function isLocale(value: unknown): value is Locale {
  return (locales as readonly unknown[]).includes(value)
}

// English is the canonical dictionary: its shape defines the key space, and
// fr/es are typed against it so a missing or extra key is a compile error.
export type Messages = typeof en
export type TranslationKey = MessagePath<Messages>

const messages: Record<Locale, Messages> = { en, fr, es }

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages[DEFAULT_LOCALE]
}

// Resolve a dot-path key and interpolate {param} placeholders. A missing key
// renders the key itself — visible in the UI, never a crash.
export function translate(m: Messages, key: TranslationKey, params?: MessageParams): string {
  let node: unknown = m
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') break
    node = (node as Record<string, unknown>)[part]
  }
  const text = typeof node === 'string' ? node : key
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
