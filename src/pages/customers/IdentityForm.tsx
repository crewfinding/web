import { useWorkspaceSettings } from '@fonderie/react-workspaces'
import { useId, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Notice } from '../../components/Notice'
import { PhoneInput } from '../../components/PhoneInput'
import { Select } from '../../components/Select'
import { useTranslation } from '../../hooks/useTranslation'
import {
  IDENTITY_MAX,
  customerLanguages,
  identityProblems,
  matchLanguage,
  normalizeIdentity,
  type ICustomerIdentityValues,
} from '../../lib/customers'
import { allTimeZones, suggestTimeZone, timeZoneLabel } from '../../lib/timeZones'
import { useCurrentWorkspace } from '../../lib/workspace'
import { localeTags } from '../../locales'
import { Chip } from './shared'
import { useDefaultCountry } from './hooks'

// Who the customer is: individual or business, name, reference, language,
// time zone — the mobile app's CustomerIdentityForm. The same form creates a
// customer (with a first phone and email) and edits one.

type Field = keyof ICustomerIdentityValues

/** The customer's time zone: none (the business's), the suggested one in one click, or any from a searchable list. */
function TimeZoneField({
  value,
  onChange,
  suggestion,
}: {
  value: string
  onChange: (zone: string) => void
  suggestion: { zone: string; source: 'address' | 'workspace' } | null
}) {
  const { t, locale } = useTranslation()
  const id = useId()
  const tag = localeTags[locale]
  const zones = useMemo(() => allTimeZones(), [])
  const text = (z: string) => `${timeZoneLabel(z, tag)} · ${z}`
  const none = { value: '', label: t('customers.form.timezoneDefault') }
  const options = useMemo(() => [none, ...zones.map((z) => ({ value: z, label: text(z) }))], [zones, tag, t]) // eslint-disable-line react-hooks/exhaustive-deps
  const suggestionText = suggestion
    ? t(suggestion.source === 'address' ? 'customers.form.suggestedAddress' : 'customers.form.suggestedBusiness', {
        zone: timeZoneLabel(suggestion.zone, tag),
      })
    : null

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {t('customers.form.timezone')}
      </label>
      <Select
        inputId={id}
        options={options}
        value={value ? { value, label: text(value) } : none}
        placeholder={t('customers.form.timezoneSearch')}
        noOptionsMessage={() => t('customers.form.timezoneNone')}
        onChange={(o) => onChange(o?.value ?? '')}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestion && suggestion.zone !== value ? (
          <Chip role="button" on={false} onClick={() => onChange(suggestion.zone)} testId="timezone-suggestion">
            {suggestionText}
          </Chip>
        ) : null}
        {value ? (
          <Chip role="button" on={false} onClick={() => onChange('')}>
            {t('customers.form.timezoneClear')}
          </Chip>
        ) : null}
      </div>
    </div>
  )
}

export function IdentityForm({
  initial,
  withContact,
  submitText,
  submitting,
  serverError,
  addresses,
  onSubmit,
  onDiscard,
}: {
  initial: ICustomerIdentityValues
  /** Create: also ask for a first phone and email. */
  withContact: boolean
  submitText: string
  submitting: boolean
  /** The server's refusal, already translated. */
  serverError: string | null
  /** The customer's addresses (edit): their province / state suggests a time zone. */
  addresses?: readonly { isPrimary?: boolean; address: { countryIso?: string | null; subdivision1Iso?: string | null } }[] | null
  onSubmit: (values: ICustomerIdentityValues) => void
  onDiscard: () => void
}) {
  const { t } = useTranslation()
  const { current: workspace } = useCurrentWorkspace()
  const { settings } = useWorkspaceSettings()
  const country = useDefaultCountry()
  const [v, setV] = useState<ICustomerIdentityValues>(initial)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const languages = useMemo(() => customerLanguages(workspace?.languages), [workspace?.languages])
  const zoneSuggestion = useMemo(
    () => suggestTimeZone({ addresses, workspaceZone: settings?.timezone, workspaceAddress: workspace?.address }),
    [addresses, settings?.timezone, workspace?.address],
  )
  const set = (patch: Partial<ICustomerIdentityValues>) => {
    setV((prev) => ({ ...prev, ...patch }))
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, ''])) }))
  }

  // A new customer starts in the business's language (its locale), once
  // known — until a language is picked.
  const [languageTouched, setLanguageTouched] = useState(!!initial.locale)
  const startLocale = withContact && !languageTouched ? matchLanguage(settings?.locale, languages) : ''
  const values: ICustomerIdentityValues = startLocale ? { ...v, locale: startLocale } : v

  const submit = () => {
    const found: Partial<Record<Field, string>> = {}
    for (const [field, key] of Object.entries(identityProblems(values, { withContact, country }))) found[field as Field] = t(key)
    for (const [field, max] of Object.entries(IDENTITY_MAX)) {
      if (!found[field as Field] && String(v[field as Field] ?? '').trim().length > (max ?? Infinity))
        found[field as Field] = t('customers.form.tooLong', { max: max ?? 0 })
    }
    setErrors(found)
    if (Object.values(found).some(Boolean)) return
    onSubmit(normalizeIdentity(values))
  }

  const selectedLanguage = matchLanguage(values.locale, languages)
  const input = (field: 'firstName' | 'lastName' | 'companyName' | 'referenceCode', label: string, required = false) => (
    <Input
      label={required ? `${label} *` : label}
      value={v[field]}
      error={errors[field] || undefined}
      onChange={(e) => set({ [field]: e.target.value })}
      data-testid={`customer-${field}`}
    />
  )

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {serverError ? <Notice tone="error">{serverError}</Notice> : null}
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">{t('customers.form.type')}</legend>
        <div className="flex gap-2" role="radiogroup" aria-label={t('customers.form.type')}>
          {(['individual', 'business'] as const).map((ct) => (
            <Chip key={ct} on={v.type === ct} onClick={() => set({ type: ct })} testId={`customer-type-${ct}`}>
              {t(`customers.form.${ct}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        {v.type === 'individual' ? (
          <>
            {input('firstName', t('customers.form.firstName'), true)}
            {input('lastName', t('customers.form.lastName'))}
          </>
        ) : null}
        {input('companyName', t('customers.form.companyName'), v.type === 'business')}
        {input('referenceCode', t('customers.form.reference'))}
        {withContact ? (
          <>
            <PhoneInput label={t('customers.form.phone')} value={v.phone} defaultCountry={country} error={errors.phone || undefined} onChange={(x) => set({ phone: x })} />
            <Input
              type="email"
              label={t('customers.form.email')}
              value={v.email}
              error={errors.email || undefined}
              onChange={(e) => set({ email: e.target.value })}
              data-testid="customer-email"
            />
          </>
        ) : null}
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">{t('customers.form.language')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('customers.form.language')}>
          {[{ code: '', name: t('customers.form.languageDefault') }, ...languages].map((l) => (
            <Chip
              key={l.code || 'default'}
              on={l.code ? selectedLanguage === l.code : !selectedLanguage}
              onClick={() => {
                setLanguageTouched(true)
                set({ locale: l.code })
              }}
            >
              {l.name}
            </Chip>
          ))}
        </div>
      </fieldset>
      <TimeZoneField value={v.timezone} onChange={(zone) => set({ timezone: zone })} suggestion={zoneSuggestion} />
      <div className="flex gap-2">
        <Button type="submit" loading={submitting} disabled={submitting} data-testid="customer-submit">
          {submitText}
        </Button>
        <Button type="button" variant="ghost" onClick={onDiscard}>
          {t('customers.detail.cancel')}
        </Button>
      </div>
    </form>
  )
}
