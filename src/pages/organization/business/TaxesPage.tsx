import type { IWorkspaceDTO } from '@fonderie/client'
import { useWorkspaceProfile } from '@fonderie/react-workspaces'
import { X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../../components/Button'
import { IconButton } from '../../../components/IconButton'
import { Input } from '../../../components/Input'
import { useCardDraft } from '../../../hooks/useCardDraft'
import { useTranslation } from '../../../hooks/useTranslation'
import {
  MAX,
  TAX_TYPES,
  isValidRate,
  newTaxRow,
  ratesCustomized,
  regionTaxes,
  taxErrorField,
  taxHome,
  taxInput,
  taxRegions,
  taxValues,
  usualRate,
  type ITaxRow,
} from '../../../lib/business'
import { CA_PROVINCES, US_STATES } from '../../../constants/regions'
import { places, type ITaxPresets } from '../../../lib/places'
import type { TranslationKey } from '../../../locales'
import { businessOption } from '../../../constants/businessMenu'
import { CardError, Detail, Disclosure, FormFooter, LabeledSelect } from './parts'
import { BusinessPage, type IBusinessContext } from './Shell'

// The Taxes page. Taxes follow the head office: its province / state decides
// which taxes apply and their usual rates (GET /estimates/tax-presets), so the
// owner only types each registration NUMBER. Different rates and extra
// registrations sit behind "Customize rates" (the mobile app's BusinessTaxes).
// Sends { taxRegistrations } only, the BN / EIN carried over unchanged.

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

const NAME_KEYS: Record<string, string> = { GST: 'GST', HST: 'HST', QST: 'QST', PST: 'PST', RST: 'RST', SALES_TAX: 'STATE' }
const TAX_TYPE_KEYS = new Set(['GST_HST', 'QST', 'PST', 'BN', 'EIN', 'STATE_SALES_TAX'])

const typeName = (t: T, type: string) => (TAX_TYPE_KEYS.has(type) ? t(`business.taxTypes.${type}` as TranslationKey) : type)

/** 'QST' → its short name; an extra row by its registration kind. */
const rowName = (t: T, row: ITaxRow) =>
  row.label ||
  (row.derived && NAME_KEYS[row.code] ? t(`business.taxes.names.${NAME_KEYS[row.code]}` as TranslationKey) : typeName(t, row.type))

const percent = (rate: string) => (rate.trim() ? `${rate.trim()} %` : '')

/** A province in the user's language; a state by its name. */
const regionName = (t: T, country: string, code: string) =>
  country === 'CA' && code in CA_PROVINCES ? t(`business.provinces.${code as keyof typeof CA_PROVINCES & string}` as TranslationKey) : (US_STATES[code] ?? code)

/** The API's tax tables with their loading / error state. */
function useTaxPresetTables() {
  const [data, setData] = useState<ITaxPresets | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    places
      .taxPresets()
      .then((d) => live && (setData(d), setError(null)))
      .catch((e) => live && setError(e))
    return () => {
      live = false
    }
  }, [tick])
  const refresh = useCallback(() => setTick((n) => n + 1), [])
  return { data, error, refresh }
}

function Taxes({ workspace, locations, canEdit, write, back }: IBusinessContext) {
  const { t } = useTranslation()
  const home = taxHome(locations)
  const presets = useTaxPresetTables()

  if (!home) {
    const stored = (workspace.taxRegistrations ?? []).filter((r) => r.type !== 'BN' && r.type !== 'EIN')
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-subtle" data-testid="taxes-need-head-office">
          {t('business.taxes.needHeadOffice')}
        </p>
        {stored.length ? (
          <Detail
            label={t('business.taxes.stored')}
            value={stored.map((r) =>
              [typeName(t, r.type), r.number, typeof r.rate === 'number' ? `(${r.rate} %)` : ''].filter(Boolean).join(' '),
            )}
          />
        ) : null}
      </div>
    )
  }
  const basedOn = (
    <p className="text-sm text-ink" data-testid="taxes-based-on">
      {t('business.taxes.basedOn', { region: `${home.province}, ${t(`business.countries.${home.country}`)}` })}
    </p>
  )
  if (!presets.data) {
    return (
      <div className="space-y-4">
        {basedOn}
        {presets.error ? (
          <div className="space-y-2">
            <p className="text-sm text-error">{t('business.taxes.error')}</p>
            <Button size="sm" variant="secondary" onClick={presets.refresh}>
              {t('business.retry')}
            </Button>
          </div>
        ) : (
          <p role="status" className="text-sm text-ink-subtle">{t('business.loading')}</p>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {basedOn}
      <TaxRows
        workspace={workspace}
        initial={taxValues(workspace, home, regionTaxes(presets.data, home)).rows}
        country={home.country}
        presets={presets.data}
        canEdit={canEdit}
        write={write}
        back={back}
      />
    </div>
  )
}

const isBn = (r: { type: string }) => r.type === 'BN' || r.type === 'EIN'

export function BusinessTaxesPage() {
  const { t } = useTranslation()
  const o = businessOption('taxes')
  return (
    <BusinessPage title={t(o.label)} paragraph={t(o.paragraph)} testId="business-taxes">
      {(ctx) => {
        const head = ctx.locations.find((l) => l.isHeadOffice && !l.isArchived)
        // The rows restart when the stored registrations or the head office's region change.
        const key = JSON.stringify([head?.address.country, head?.address.state, (ctx.workspace.taxRegistrations ?? []).filter((r) => !isBn(r))])
        return <Taxes key={key} {...ctx} />
      }}
    </BusinessPage>
  )
}

function TaxRows({
  workspace,
  initial,
  country,
  presets,
  canEdit,
  write,
  back,
}: {
  workspace: IWorkspaceDTO
  initial: ITaxRow[]
  country: 'CA' | 'US'
  presets: Parameters<typeof usualRate>[0]
  canEdit: boolean
  write: IBusinessContext['write']
  back: () => void
}) {
  const { t } = useTranslation()
  const { updateWorkspace } = useWorkspaceProfile()
  const start = useMemo(() => initial, []) // eslint-disable-line react-hooks/exhaustive-deps
  const d = useCardDraft<{ rows: ITaxRow[] }>({ rows: start })
  const [open, setOpen] = useState(() => ratesCustomized(start) || start.some((r) => !r.derived))
  const counter = useRef(0)
  const sources = useRef<string[]>([])
  const rows = d.values.rows
  const optional = (label: string) => `${label} ${t('business.optional')}`

  const patch = (key: string, p: Partial<ITaxRow>) => {
    d.setValues((prev) => ({ rows: prev.rows.map((r) => (r.key === key ? { ...r, ...p } : r)) }))
    d.setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !Object.keys(p).some((f) => k === `${key}.${f}`))))
  }
  const check = () => {
    const e: Record<string, string> = {}
    for (const r of rows) {
      if (!isValidRate(r.rate)) e[`${r.key}.rate`] = t('business.taxes.rateError')
      if (r.number.trim().length > MAX.taxNumber) e[`${r.key}.number`] = t('business.tooLong', { max: MAX.taxNumber })
      if (!r.derived && !r.region && taxRegions(r.country, r.type).length > 0) {
        e[`${r.key}.region`] = t(r.country === 'US' ? 'business.taxes.stateError' : 'business.taxes.provinceError')
      }
    }
    if (Object.keys(e).some((k) => k.endsWith('.rate') || !k.startsWith('derived'))) setOpen(true)
    return e
  }
  const onSave = async () => {
    const ok = await d.save(
      check,
      async () => {
        const built = taxInput(rows, workspace)
        sources.current = built.sources
        await write(() => updateWorkspace(built.input))
      },
      (path) => {
        const f = taxErrorField(path, sources.current)
        if (f && (!f.startsWith('derived') || f.endsWith('.rate'))) setOpen(true)
        return f
      },
    )
    if (ok) back()
  }

  const rateInput = (r: ITaxRow) => (
    <Input
      label={t('business.taxes.rate', { tax: rowName(t, r) })}
      inputMode="decimal"
      value={r.rate}
      error={d.errors[`${r.key}.rate`]}
      onChange={(e) => patch(r.key, { rate: e.target.value })}
    />
  )
  const derived = rows.filter((r) => r.derived)
  const extra = rows.filter((r) => !r.derived)

  return (
    <div className="space-y-4" data-testid="taxes-form">
      <CardError message={d.formError} />
      <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {derived.map((r) => (
          <div key={r.key} className="space-y-1" data-testid={`tax-${r.key}`}>
            <Input
              label={optional(t('business.taxes.numberNamed', { tax: rowName(t, r) }))}
              value={r.number}
              error={d.errors[`${r.key}.number`]}
              onChange={(e) => patch(r.key, { number: e.target.value })}
            />
            {r.presetRate === null ? (
              rateInput(r)
            ) : !open ? (
              <p className="text-xs text-ink-subtle">{t('business.taxes.rateHelp', { rate: percent(r.rate) })}</p>
            ) : null}
          </div>
        ))}
      </div>
      <Disclosure label={t('business.taxes.customize')} open={open} onToggle={() => setOpen(!open)}>
        <div className="grid gap-4 md:grid-cols-2">
          {derived
            .filter((r) => r.presetRate !== null)
            .map((r) => (
              <div key={`rate-${r.key}`}>{rateInput(r)}</div>
            ))}
        </div>
        {extra.map((r) => (
          <div key={r.key} className="space-y-3 rounded-lg border border-hairline p-3" data-testid={`tax-${r.key}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{rowName(t, r)}</p>
              {canEdit ? (
              <IconButton
                icon={X}
                size="sm"
                variant="ghost"
                aria-label={t('business.taxes.remove')}
                onClick={() => d.setValues((prev) => ({ rows: prev.rows.filter((x) => x.key !== r.key) }))}
              />
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <LabeledSelect
                label={t('business.taxes.country')}
                value={r.country}
                allowNone={false}
                options={(['CA', 'US'] as const).map((c) => ({ label: t(`business.countries.${c}`), value: c }))}
                onChange={(c) => patch(r.key, { country: c, type: TAX_TYPES[c as 'CA' | 'US']?.[0] ?? r.type, region: '' })}
                error={d.errors[`${r.key}.country`]}
              />
              <LabeledSelect
                label={t('business.taxes.type')}
                value={r.type}
                allowNone={false}
                options={[...new Set([...(TAX_TYPES[r.country as 'CA' | 'US'] ?? []), r.type])].map((k) => ({
                  label: typeName(t, k),
                  value: k,
                }))}
                onChange={(k) => patch(r.key, { type: k, region: taxRegions(r.country, k).includes(r.region) ? r.region : '' })}
                error={d.errors[`${r.key}.type`]}
              />
              {/* Only a tax that belongs to a province / state asks for one (GST/HST is federal, QST is Québec's). */}
              {taxRegions(r.country, r.type).length > 0 ? (
                <LabeledSelect
                  label={t(r.country === 'US' ? 'business.taxes.state' : 'business.taxes.province')}
                  value={r.region}
                  options={taxRegions(r.country, r.type)
                    .map((c) => ({ label: regionName(t, r.country, c), value: c }))
                    .sort((a, b) => a.label.localeCompare(b.label))}
                  onChange={(c) => patch(r.key, { region: c, ...(r.rate.trim() ? {} : { rate: usualRate(presets, r.country, r.type, c) ?? '' }) })}
                  error={d.errors[`${r.key}.region`]}
                />
              ) : null}
              <Input
                label={optional(t('business.taxes.number'))}
                value={r.number}
                error={d.errors[`${r.key}.number`]}
                onChange={(e) => patch(r.key, { number: e.target.value })}
              />
              {rateInput(r)}
            </div>
          </div>
        ))}
        {canEdit ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              counter.current += 1
              const row = newTaxRow(country, counter.current)
              d.setValues((prev) => ({ rows: [...prev.rows, row] }))
            }}
          >
            {t('business.taxes.add')}
          </Button>
        ) : null}
      </Disclosure>
      </fieldset>
      {canEdit ? <FormFooter saving={d.saving} onSave={() => void onSave()} onDiscard={back} /> : null}
    </div>
  )
}
