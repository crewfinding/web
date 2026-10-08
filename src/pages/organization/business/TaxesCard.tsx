import type { IWorkspaceDTO, IWorkspaceLocationDTO } from '@fonderie/client'
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
  taxValues,
  type ITaxRow,
} from '../../../lib/business'
import { places, type ITaxPresets } from '../../../lib/places'
import type { TranslationKey } from '../../../locales'
import { CardError, Detail, Disclosure, LabeledSelect, SaveBar, SectionCard } from './parts'

// Taxes follow the head office: its province / state decides which taxes
// apply and their usual rates (GET /estimates/tax-presets), so the owner only
// types each registration NUMBER. Different rates and extra registrations sit
// behind "Different rates / add a tax" (the mobile app's TaxesCard).

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

const NAME_KEYS: Record<string, string> = { GST: 'GST', HST: 'HST', QST: 'QST', PST: 'PST', RST: 'RST', SALES_TAX: 'STATE' }
const TAX_TYPE_KEYS = new Set(['GST_HST', 'QST', 'PST', 'BN', 'EIN', 'STATE_SALES_TAX'])

const typeName = (t: T, type: string) => (TAX_TYPE_KEYS.has(type) ? t(`business.taxTypes.${type}` as TranslationKey) : type)

/** 'QST' → its short name; an extra row by its registration kind. */
const rowName = (t: T, row: ITaxRow) =>
  row.label ||
  (row.derived && NAME_KEYS[row.code] ? t(`business.taxes.names.${NAME_KEYS[row.code]}` as TranslationKey) : typeName(t, row.type))

const percent = (rate: string) => (rate.trim() ? `${rate.trim()} %` : '')

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

export function TaxesCard({
  workspace,
  locations,
  canEdit,
}: {
  workspace: IWorkspaceDTO
  locations: IWorkspaceLocationDTO[]
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const home = taxHome(locations)
  const presets = useTaxPresetTables()
  const title = home
    ? t('business.taxes.titleRegion', { region: `${home.province}, ${t(`business.countries.${home.country}`)}` })
    : t('business.taxes.title')

  if (!home) {
    const stored = (workspace.taxRegistrations ?? []).filter((r) => r.type !== 'BN' && r.type !== 'EIN')
    return (
      <SectionCard title={title} testId="card-taxes">
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
      </SectionCard>
    )
  }
  if (!presets.data) {
    return (
      <SectionCard title={title} testId="card-taxes">
        {presets.error ? (
          <div className="space-y-2">
            <p className="text-sm text-error">{t('business.taxes.error')}</p>
            <Button size="sm" variant="secondary" onClick={presets.refresh}>
              {t('business.retry')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-subtle">{t('business.loading')}</p>
        )}
      </SectionCard>
    )
  }
  return (
    <TaxRows
      title={title}
      workspace={workspace}
      initial={taxValues(workspace, home, regionTaxes(presets.data, home)).rows}
      country={home.country}
      canEdit={canEdit}
    />
  )
}

function TaxRows({
  title,
  workspace,
  initial,
  country,
  canEdit,
}: {
  title: string
  workspace: IWorkspaceDTO
  initial: ITaxRow[]
  country: 'CA' | 'US'
  canEdit: boolean
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

  if (!canEdit) {
    return (
      <SectionCard title={title} testId="card-taxes">
        {start.map((r) => (
          <Detail key={r.key} label={[rowName(t, r), percent(r.rate)].filter(Boolean).join(' · ')} value={r.number} />
        ))}
      </SectionCard>
    )
  }

  const patch = (key: string, p: Partial<ITaxRow>) => {
    d.setValues((prev) => ({ rows: prev.rows.map((r) => (r.key === key ? { ...r, ...p } : r)) }))
    d.setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !Object.keys(p).some((f) => k === `${key}.${f}`))))
  }
  const check = () => {
    const e: Record<string, string> = {}
    for (const r of rows) {
      if (!isValidRate(r.rate)) e[`${r.key}.rate`] = t('business.taxes.rateError')
      if (r.number.trim().length > MAX.taxNumber) e[`${r.key}.number`] = t('business.tooLong', { max: MAX.taxNumber })
    }
    if (Object.keys(e).some((k) => k.endsWith('.rate') || !k.startsWith('derived'))) setOpen(true)
    return e
  }
  const onSave = () =>
    void d.save(
      check,
      async () => {
        const built = taxInput(rows, workspace)
        sources.current = built.sources
        await updateWorkspace(built.input)
      },
      (path) => {
        const f = taxErrorField(path, sources.current)
        if (f && (!f.startsWith('derived') || f.endsWith('.rate'))) setOpen(true)
        return f
      },
    )

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
    <SectionCard title={title} testId="card-taxes">
      <CardError message={d.formError} />
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
      <Disclosure label={t('business.taxes.custom')} open={open} onToggle={() => setOpen(!open)}>
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
              <IconButton
                icon={X}
                size="sm"
                variant="ghost"
                aria-label={t('business.taxes.remove')}
                onClick={() => d.setValues((prev) => ({ rows: prev.rows.filter((x) => x.key !== r.key) }))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <LabeledSelect
                label={t('business.taxes.country')}
                value={r.country}
                allowNone={false}
                options={(['CA', 'US'] as const).map((c) => ({ label: t(`business.countries.${c}`), value: c }))}
                onChange={(c) => patch(r.key, { country: c, type: TAX_TYPES[c as 'CA' | 'US']?.[0] ?? r.type })}
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
                onChange={(k) => patch(r.key, { type: k })}
                error={d.errors[`${r.key}.type`]}
              />
              <Input
                label={optional(t('business.taxes.region'))}
                value={r.region}
                error={d.errors[`${r.key}.region`]}
                onChange={(e) => patch(r.key, { region: e.target.value.toUpperCase() })}
              />
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
      </Disclosure>
      <SaveBar
        visible={d.dirty}
        saving={d.saving}
        onSave={onSave}
        onCancel={() => {
          d.reset()
          setOpen(ratesCustomized(start) || start.some((r) => !r.derived))
        }}
      />
    </SectionCard>
  )
}
