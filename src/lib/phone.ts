import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'

// The phone rules every phone field shares: the value a form stores is E.164
// ('+15145550100'); what the person sees is the number formatted for its
// country as they type ('(514) 555-0100'), with the country chosen by flag.

export type { CountryCode }

/** Fallback when nothing else names a country. */
export const DEFAULT_PHONE_COUNTRY: CountryCode = 'CA'

const ALL = new Set<string>(getCountries())

/** 'ca' / 'CA' → 'CA' when libphonenumber knows it; otherwise null. */
export const asCountry = (v: string | null | undefined): CountryCode | null => {
  const c = (v ?? '').trim().toUpperCase()
  return ALL.has(c) ? (c as CountryCode) : null
}

/** 🇨🇦 from 'CA' (regional indicator symbols). */
export const flagOf = (country: string): string =>
  country.length === 2 ? String.fromCodePoint(...[...country.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '🏳'

export const callingCodeOf = (country: CountryCode): string => `+${getCountryCallingCode(country)}`

/** Every country, CA and US first (the app's markets), then by code. */
export const phoneCountries = (): CountryCode[] => {
  const rest = getCountries().filter((c) => c !== 'CA' && c !== 'US').sort()
  return ['CA', 'US', ...rest]
}

/**
 * The stored value of what was typed: E.164 as soon as the digits make a
 * number for `country` (or for the '+code' typed), the raw text otherwise —
 * so validation can still say it is wrong — and '' for nothing.
 */
export const toE164 = (text: string, country: CountryCode): string => {
  const t = text.trim()
  if (!/\d/.test(t)) return ''
  const parsed = parsePhoneNumberFromString(t, country)
  return parsed ? parsed.number : t
}

/** A complete, dialable number (libphonenumber's metadata rules). Empty is not a phone. */
export const isValidPhone = (value: string | null | undefined, country: CountryCode = DEFAULT_PHONE_COUNTRY): boolean => {
  const t = (value ?? '').trim()
  if (!t) return false
  const parsed = parsePhoneNumberFromString(t, country)
  return !!parsed && parsed.isValid()
}

/**
 * The E.164 of a stored value (legacy rows hold '5145550100' or
 * '(514) 555-0100'), read in `country` when it has no '+code'; the value
 * unchanged when it is not a valid number, null when blank.
 */
export const normalizePhone = (value: string | null | undefined, country: CountryCode = DEFAULT_PHONE_COUNTRY): string | null => {
  const t = (value ?? '').trim()
  if (!t) return null
  const parsed = parsePhoneNumberFromString(t, country)
  return parsed && parsed.isValid() ? parsed.number : t
}

/** As-you-type display for `country`: '5145550' → '(514) 555-0'. */
export const formatTyping = (text: string, country: CountryCode): string => new AsYouType(country).input(text)

/** What to show for a stored value: its country (from '+code' when present) and the national format. */
export const displayOf = (value: string | null | undefined, fallback: CountryCode): { country: CountryCode; text: string } => {
  const t = (value ?? '').trim()
  if (!t) return { country: fallback, text: '' }
  const parsed = parsePhoneNumberFromString(t, fallback)
  if (!parsed) return { country: fallback, text: t }
  const country = (parsed.country as CountryCode | undefined) ?? fallback
  return { country, text: parsed.isValid() ? parsed.formatNational() : formatTyping(t, country) }
}

/**
 * The next display text after an edit. AsYouType re-inserts the bracket or
 * dash someone just deleted, so a backspace over a formatting character
 * would do nothing: when the digits did not change but the text got
 * shorter, the last digit goes instead.
 */
export const nextTyping = (previous: string, typed: string, country: CountryCode): string => {
  const digits = (s: string) => s.replace(/[^\d+]/g, '')
  let raw = typed
  if (typed.length < previous.length && digits(typed) === digits(previous)) {
    raw = digits(typed).slice(0, -1)
  }
  return digits(raw) ? formatTyping(digits(raw), country) : ''
}

/** A country's name in `locale` (Intl.DisplayNames when the engine has it), else its code. */
export const countryName = (country: string, locale: string): string => {
  try {
    const DN = (Intl as unknown as { DisplayNames?: new (l: string[], o: { type: 'region' }) => { of(c: string): string | undefined } }).DisplayNames
    return (DN && new DN([locale], { type: 'region' }).of(country)) || country
  } catch {
    return country
  }
}
