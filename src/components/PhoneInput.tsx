import { useId, useMemo, useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/cn'
import {
  DEFAULT_PHONE_COUNTRY,
  asCountry,
  callingCodeOf,
  countryName,
  displayOf,
  flagOf,
  nextTyping,
  phoneCountries,
  toE164,
  type CountryCode,
} from '../lib/phone'
import { localeTags } from '../locales'

/**
 * A phone field: the country (flag + calling code) and the number formatted
 * for it as it is typed; the value handed back is E.164 ("+15145550100") —
 * the mobile app's PhoneInput, with the same libphonenumber rules.
 */
export function PhoneInput({
  value,
  onChange,
  defaultCountry,
  label,
  error,
}: {
  value: string
  onChange: (e164: string) => void
  defaultCountry?: string
  label: string
  error?: string
}) {
  const { t, locale } = useTranslation()
  const id = useId()
  const fallback = asCountry(defaultCountry) ?? DEFAULT_PHONE_COUNTRY
  const start = useMemo(() => displayOf(value, fallback), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<CountryCode>(start.country)
  const [text, setText] = useState(start.text)
  const countries = useMemo(() => phoneCountries(), [])

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          aria-label={t('business.phone.country')}
          value={country}
          onChange={(e) => {
            const next = e.target.value as CountryCode
            setCountry(next)
            onChange(toE164(text, next))
          }}
          className="input h-11 w-32 shrink-0"
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {`${flagOf(c)} ${callingCodeOf(c)} ${countryName(c, localeTags[locale])}`}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={text}
          placeholder={t('business.phone.placeholder')}
          aria-invalid={!!error}
          onChange={(e) => {
            const shown = nextTyping(text, e.target.value, country)
            setText(shown)
            onChange(toE164(shown, country))
          }}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-lg border bg-surface-1 px-3 py-2.5 text-ink transition-all placeholder:text-ink-subtle focus:ring-2 focus:outline-none',
            error ? 'border-error focus:ring-error/20' : 'border-hairline focus:border-primary focus:ring-primary/20',
          )}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs text-error">{error}</p> : null}
    </div>
  )
}
