// Date/time display preferences. Fonderie stores `dateFormat`/`timeFormat` as
// free-form strings on the user's preferences; this module defines the option
// set the app actually supports and the formatting that honors them. Keep the
// stored `value`s stable — they are what lives in the user's saved preferences.

import { currentLocale } from '../hooks/useLocale'
import { localeTags, type Locale } from '../locales'
import { tNow } from '../hooks/useTranslation'

export interface FormatOption {
  value: string
  label: string
}

// Date-format labels are the format patterns themselves — locale-independent.
export const DATE_FORMATS: FormatOption[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY' },
]

// Values are format TOKENS, matching how @fonderie/auth stores the preference
// (its defaults are 'MM/DD/YYYY' and 'hh:mm A') — so the select reflects the
// saved value and writes back a token other tooling understands. Labels are
// display copy and follow the active locale, hence a getter.
export function getTimeFormats(): FormatOption[] {
  return [
    { value: 'hh:mm A', label: tNow('settings.datetime.time12') },
    { value: 'HH:mm', label: tNow('settings.datetime.time24') },
  ]
}

export const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY'
export const DEFAULT_TIME_FORMAT = 'hh:mm A'

// Short month names ('MMM D, YYYY') follow the active locale via Intl; one
// formatter per locale, built lazily.
const monthFormatters = new Map<Locale, Intl.DateTimeFormat>()
function shortMonth(d: Date): string {
  const locale = currentLocale()
  let formatter = monthFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(localeTags[locale], { month: 'short' })
    monthFormatters.set(locale, formatter)
  }
  return formatter.format(d)
}

const pad = (n: number) => String(n).padStart(2, '0')

// A stored value we don't recognise falls back to the default rather than
// rendering something broken (the backend accepts any string).
export function formatDate(input: Date | number | string, fmt: string | undefined): string {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  switch (fmt) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`
    case 'MMM D, YYYY':
      return `${shortMonth(d)} ${d.getDate()}, ${yyyy}`
    default:
      return `${mm}/${dd}/${yyyy}` // MM/DD/YYYY
  }
}

// 24-hour when the token has no meridiem marker (e.g. 'HH:mm'); 12-hour
// otherwise (fonderie's 'hh:mm A' default, and any unrecognised token).
export function formatTime(input: Date | number | string, fmt: string | undefined): string {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  const is24h = !!fmt && !/a/i.test(fmt)
  if (is24h) return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
  const h12 = d.getHours() % 12 || 12
  return `${h12}:${pad(d.getMinutes())} ${ampm}`
}

export function formatDateTime(
  input: Date | number | string,
  dateFmt: string | undefined,
  timeFmt: string | undefined,
): string {
  return `${formatDate(input, dateFmt)} ${formatTime(input, timeFmt)}`
}
