import type { IWorkspaceDTO, IWorkspaceLocationDTO, IWorkspaceSettingsDTO } from '@fonderie/client'
import { useWorkspaceProfile, useWorkspaceSettings } from '@fonderie/react-workspaces'
import { useId, useMemo } from 'react'
import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'
import { useCardDraft } from '../../../hooks/useCardDraft'
import { useTranslation } from '../../../hooks/useTranslation'
import {
  APP_LANGUAGES,
  MAX,
  PREFIX_KINDS,
  currencyFor,
  effectivePrefixes,
  headOfficeOf,
  isValidPrefix,
  prefixInput,
  prefixValues,
  previewOf,
  regionalInput,
  regionalValues,
  type IPrefixValues,
  type IRegionalValues,
  type PrefixKind,
} from '../../../lib/business'
import { cn } from '../../../lib/cn'
import { allTimeZones, regionTimeZone, timeZoneLabel } from '../../../lib/timeZones'
import { localeTags } from '../../../locales'
import { CardError, Detail, Disclosure, LabeledSelect, Prompt, SaveBar, SectionCard } from './parts'

// Document numbers and Regional settings (the mobile app's BusinessSettings.tsx).

interface ISettingsState {
  settings: IWorkspaceSettingsDTO | null
  settingsLoading: boolean
  settingsError: boolean
}

/** While the settings load / when they cannot be read: a line, never a form that could write blind. */
function SettingsPending({ loading }: { loading: boolean }) {
  const { t } = useTranslation()
  return (
    <p className="text-sm text-ink-subtle" data-testid="settings-unavailable">
      {t(loading ? 'business.loading' : 'business.settingsUnavailable')}
    </p>
  )
}

// ── Document numbers ─────────────────────────────────────────────────────────

const KIND_LABEL = {
  invoice: 'business.numbers.invoice',
  estimate: 'business.numbers.estimate',
  job: 'business.numbers.job',
} as const satisfies Record<PrefixKind, string>

export function NumbersCard({ settings, settingsLoading, settingsError, canEdit }: ISettingsState & { canEdit: boolean }) {
  const { t } = useTranslation()
  const { updateSettings } = useWorkspaceSettings()
  const initial = useMemo(() => prefixValues(settings), []) // eslint-disable-line react-hooks/exhaustive-deps
  const d = useCardDraft<IPrefixValues>(initial)
  const title = t('business.numbers.title')

  if (!settings) {
    return (
      <SectionCard title={title} testId="card-numbers">
        <SettingsPending loading={settingsLoading && !settingsError} />
      </SectionCard>
    )
  }
  const v = d.values
  const preview = previewOf(effectivePrefixes(v))
  const previewLine = PREFIX_KINDS.map((k) => preview[k]).join(' · ')

  if (!canEdit) {
    return (
      <SectionCard title={title} testId="card-numbers">
        <Detail label={t('business.numbers.preview')} value={previewLine} />
      </SectionCard>
    )
  }

  const upper = (x: string) => x.toUpperCase().slice(0, MAX.prefix)
  const prefixError = t('business.numbers.error')
  const check = () => {
    const e: Record<string, string> = {}
    if (v.customized) {
      for (const k of PREFIX_KINDS) if (!isValidPrefix(v.each[k])) e[`prefix.${k}`] = prefixError
    } else if (!isValidPrefix(v.single)) e.prefix = prefixError
    return e
  }
  const onSave = () =>
    void d.save(
      check,
      async () => {
        await updateSettings(prefixInput(v, settings))
      },
      (path) => {
        const m = path ? /^documentPrefixes\.(\w+)/.exec(path) : null
        if (!m || !(PREFIX_KINDS as readonly string[]).includes(m[1]!)) return null
        return v.customized ? `prefix.${m[1]}` : 'prefix'
      },
    )
  // Opening "Customize" starts each kind from the shared prefix; closing it
  // goes back to one prefix (the invoice's) for all.
  const toggle = () =>
    d.setValues((prev) =>
      prev.customized
        ? { ...prev, customized: false, single: prev.each.invoice }
        : { ...prev, customized: true, each: { invoice: prev.single, estimate: prev.single, job: prev.single } },
    )

  return (
    <SectionCard title={title} testId="card-numbers">
      <CardError message={d.formError} />
      {!v.customized ? (
        <Input
          label={`${t('business.numbers.prefix')} ${t('business.optional')}`}
          placeholder={t('business.numbers.placeholder', { example: 'ACME' })}
          value={v.single}
          error={d.errors.prefix}
          onChange={(e) => d.set({ single: upper(e.target.value) })}
        />
      ) : null}
      <div>
        <p className="text-xs font-medium text-ink-subtle">{t('business.numbers.preview')}</p>
        <p className="font-mono text-sm text-ink" data-testid="prefix-preview" aria-live="polite">
          {previewLine}
        </p>
      </div>
      <Disclosure label={t('business.numbers.customize')} open={v.customized} onToggle={toggle}>
        <div className="grid gap-4 md:grid-cols-3">
          {PREFIX_KINDS.map((k) => (
            <div key={k}>
              <Input
                label={`${t(KIND_LABEL[k])} ${t('business.optional')}`}
                value={v.each[k]}
                error={d.errors[`prefix.${k}`]}
                onChange={(e) => d.setValues((prev) => ({ ...prev, each: { ...prev.each, [k]: upper(e.target.value) } }))}
              />
              <p className="mt-1 font-mono text-xs text-ink-subtle">{preview[k]}</p>
            </div>
          ))}
        </div>
      </Disclosure>
      <SaveBar visible={d.dirty} saving={d.saving} onSave={onSave} onCancel={d.reset} />
    </SectionCard>
  )
}

// ── Regional settings ────────────────────────────────────────────────────────

const languageName = (code: string) => APP_LANGUAGES.find((l) => l.code === code)?.name ?? code

export function RegionalCard({
  workspace,
  settings,
  settingsLoading,
  settingsError,
  locations,
  country,
  canEdit,
}: ISettingsState & { workspace: IWorkspaceDTO; locations: IWorkspaceLocationDTO[]; country: 'CA' | 'US'; canEdit: boolean }) {
  const { t, locale } = useTranslation()
  const tzId = useId()
  const { updateSettings } = useWorkspaceSettings()
  const { updateWorkspace } = useWorkspaceProfile()
  const initial = useMemo<IRegionalValues>(
    () => (settings ? regionalValues(workspace, settings) : { locale: '', timezone: '', currency: '', languages: [] }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const d = useCardDraft<IRegionalValues>(initial)
  const title = t('business.regional.title')
  const zones = useMemo(() => allTimeZones(), [])

  if (!settings) {
    return (
      <SectionCard title={title} testId="card-regional">
        <SettingsPending loading={settingsLoading && !settingsError} />
      </SectionCard>
    )
  }
  const v = d.values
  const head = headOfficeOf(locations)
  const zone = head ? regionTimeZone(head.address.country, head.address.state) : null
  const usual = currencyFor(country)
  const tag = localeTags[locale]
  const zoneText = (z: string) => (z ? `${timeZoneLabel(z, tag)} · ${z}` : '')

  if (!canEdit) {
    return (
      <SectionCard title={title} testId="card-regional">
        <Detail label={t('business.regional.locale')} value={initial.locale ? languageName(initial.locale) : ''} />
        <Detail label={t('business.regional.timezone')} value={zoneText(initial.timezone)} />
        <Detail label={t('business.regional.currency')} value={initial.currency} />
        <Detail label={t('business.regional.languages')} value={initial.languages.map(languageName).join(', ')} />
      </SectionCard>
    )
  }

  const onSave = () =>
    void d.save(
      () => ({}),
      async () => {
        const out = regionalInput(v, initial, workspace, country)
        if (out.settings) await updateSettings(out.settings)
        if (out.workspace) await updateWorkspace(out.workspace)
      },
      (path) => {
        const root = path?.split('.')[0]
        return root === 'locale' || root === 'timezone' || root === 'currency' || root === 'languages' ? root : null
      },
    )
  const currencies = [...new Set(['CAD', 'USD', ...(v.currency ? [v.currency] : [])])]
  const toggleLanguage = (code: string) =>
    d.set({ languages: v.languages.includes(code) ? v.languages.filter((x) => x !== code) : [...v.languages, code] })
  const zoneOptions = zones.map((z) => ({ value: z, label: zoneText(z) }))

  return (
    <SectionCard title={title} testId="card-regional">
      <CardError message={d.formError} />
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledSelect
          label={t('business.regional.locale')}
          value={v.locale}
          options={APP_LANGUAGES.map((l) => ({ label: l.name, value: l.code }))}
          onChange={(x) => d.set({ locale: x })}
          error={d.errors.locale}
        />
        <div>
          <label htmlFor={tzId} className="mb-1.5 block text-sm font-medium text-ink">
            {t('business.regional.timezone')}
          </label>
          <Select
            inputId={tzId}
            options={zoneOptions}
            value={v.timezone ? { value: v.timezone, label: zoneText(v.timezone) } : null}
            placeholder={t('business.notSet')}
            noOptionsMessage={() => t('business.regional.timezoneNone')}
            aria-label={t('business.regional.timezone')}
            onChange={(o) => o && d.set({ timezone: o.value })}
          />
          {zone && zone !== v.timezone ? (
            <Button size="xs" variant="secondary" className="mt-2" data-testid="timezone-suggestion" onClick={() => d.set({ timezone: zone })}>
              {t('business.regional.timezoneSuggested', { zone: timeZoneLabel(zone, tag) })}
            </Button>
          ) : null}
          {d.errors.timezone ? <p className="mt-1.5 text-xs text-error">{d.errors.timezone}</p> : null}
        </div>
        <LabeledSelect
          label={t('business.regional.currency')}
          value={v.currency}
          allowNone={false}
          options={currencies.map((c) => ({ label: c, value: c }))}
          onChange={(x) => d.set({ currency: x })}
          error={d.errors.currency}
        />
      </div>
      {head && v.currency !== usual ? (
        <Prompt
          testId="currency-suggestion"
          text={t('business.regional.currencySuggested', { currency: usual, country: t(`business.countries.${country}`) })}
          action={t('business.regional.use', { value: usual })}
          onClick={() => d.set({ currency: usual })}
        />
      ) : null}
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">{t('business.regional.languages')}</legend>
        <div className="flex flex-wrap gap-2">
          {APP_LANGUAGES.map((l) => {
            const on = v.languages.includes(l.code)
            return (
              <button
                key={l.code}
                type="button"
                role="checkbox"
                aria-checked={on}
                data-testid={`language-${l.code}`}
                onClick={() => toggleLanguage(l.code)}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors',
                  on ? 'border-primary bg-primary/10 text-link' : 'border-hairline text-ink-muted hover:bg-surface-2',
                )}
              >
                {l.name}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-xs text-ink-subtle">{t('business.regional.languagesHelp')}</p>
        {d.errors.languages ? <p className="mt-1.5 text-xs text-error">{d.errors.languages}</p> : null}
      </fieldset>
      <SaveBar visible={d.dirty} saving={d.saving} onSave={onSave} onCancel={d.reset} />
    </SectionCard>
  )
}
