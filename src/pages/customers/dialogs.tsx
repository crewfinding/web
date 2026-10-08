import type { ICustomerDTO } from '@fonderie/client'
import { useCustomerLabels, useCustomers } from '@fonderie/react-customers'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useId, useState, type ReactNode } from 'react'
import { AddressAutocomplete } from '../../components/AddressAutocomplete'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { DialogShell } from '../../components/DialogShell'
import { Input } from '../../components/Input'
import { Notice } from '../../components/Notice'
import { PhoneInput } from '../../components/PhoneInput'
import { useTranslation } from '../../hooks/useTranslation'
import {
  ADDRESS_LABEL_CHIPS,
  CUSTOMER_LIMITS,
  ENTRY_MAX,
  LABEL_DEFAULTS,
  RELATIONSHIP_SUGGESTIONS,
  addressProblem,
  canShowMore,
  customerDisplayName,
  customerErrorMessage,
  customerLabelText,
  effectiveLabel,
  entryProblem,
  isBlacklisted,
  labelOptions,
  missingPlaceParts,
  normalizeEntry,
  pickable,
  relationshipText,
  type ContactKind,
  type EntryKind,
  type IAddressDraft,
} from '../../lib/customers'
import type { IAddressParts } from '../../lib/placeParts'
import { Chip, CustomerAvatar } from './shared'
import { useSearchQuery } from './hooks'

// The add / change dialogs of a customer's sections — the mobile app's
// EntrySheet, AddAddressSheet, RelationshipSheet, LabelPickerSheet and
// CustomerPickerModal. Each is mounted only while open: it starts empty.

/** A titled dialog with Save; `onSave` throws on a refusal — the dialog stays open and says why. */
function FormDialog({
  title,
  saveLabel,
  canSave = true,
  saving,
  error,
  onSave,
  onClose,
  children,
  testId,
}: {
  title: string
  saveLabel: string
  canSave?: boolean
  saving: boolean
  error: string | null
  onSave: () => void
  onClose: () => void
  children: ReactNode
  testId?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <DialogShell open labelledBy={id} onClose={onClose} wide>
      <Card className="max-h-[85vh] overflow-y-auto p-6" data-testid={testId}>
        <h2 id={id} className="text-card-title pr-6 text-ink">
          {title}
        </h2>
        <form
          noValidate
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
        >
          {children}
          {error ? (
            <p className="text-sm text-error" aria-live="polite">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('customers.sections.cancel')}
            </Button>
            <Button type="submit" loading={saving} disabled={saving || !canSave} data-testid="dialog-save">
              {saving ? t('customers.sections.saving') : saveLabel}
            </Button>
          </div>
        </form>
      </Card>
    </DialogShell>
  )
}

/** Runs a save: busy while it runs, the refusal said in the dialog, closes when it lands. */
function useSave(onClose: () => void) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await fn()
      onClose()
    } catch (e) {
      setError(customerErrorMessage(t, e))
    } finally {
      setSaving(false)
    }
  }
  return { saving, error, setError, run }
}

/** Label chips (+ a custom word for "other"). */
function LabelChips({
  chips,
  value,
  onChange,
  custom,
  onCustom,
}: {
  chips: readonly string[]
  value: string
  onChange: (v: string) => void
  custom?: string
  onCustom?: (v: string) => void
}) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">{t('customers.sections.label')}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('customers.sections.label')}>
        {chips.map((c) => (
          <Chip key={c} on={value === c} onClick={() => onChange(c)}>
            {customerLabelText(t, c)}
          </Chip>
        ))}
      </div>
      {value === 'other' && onCustom ? (
        <Input
          containerClassName="mt-2"
          value={custom ?? ''}
          maxLength={CUSTOMER_LIMITS.label}
          onChange={(e) => onCustom(e.target.value)}
          placeholder={t('customers.sections.customLabel')}
          aria-label={t('customers.sections.customLabel')}
        />
      ) : null}
    </fieldset>
  )
}

// ── Phone, email, note, tag ──────────────────────────────────────────────────

const ENTRY_TITLES = {
  phone: 'customers.sections.addPhone',
  email: 'customers.sections.addEmail',
  note: 'customers.sections.addNote',
  tag: 'customers.sections.addTag',
} as const

export function EntryDialog({
  kind,
  defaultCountry,
  onClose,
  onSave,
}: {
  kind: EntryKind
  defaultCountry: string
  onClose: () => void
  onSave: (entry: { value: string; label?: string }) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const chips = kind === 'phone' || kind === 'email' ? LABEL_DEFAULTS[kind] : null
  const [value, setValue] = useState('')
  const [label, setLabel] = useState<string>(chips?.[0] ?? '')
  const [custom, setCustom] = useState('')
  const [touched, setTouched] = useState(false)
  const s = useSave(onClose)
  const normalized = normalizeEntry(kind, value)
  const problem = entryProblem(kind, normalized, defaultCountry)
  const fieldLabel = t(
    kind === 'phone' ? 'customers.sections.number' : kind === 'email' ? 'customers.sections.emailAddress' : kind === 'note' ? 'customers.sections.note' : 'customers.sections.tag',
  )
  const change = (v: string) => {
    setValue(v)
    s.setError(null)
  }

  return (
    <FormDialog
      title={t(ENTRY_TITLES[kind])}
      saveLabel={t('customers.sections.save')}
      saving={s.saving}
      error={s.error}
      testId={`entry-${kind}`}
      onClose={onClose}
      onSave={() => {
        setTouched(true)
        if (problem) return
        void s.run(() => onSave({ value: normalized, label: chips ? effectiveLabel(label, custom) : undefined }))
      }}
    >
      {kind === 'phone' ? (
        <PhoneInput label={fieldLabel} value={value} defaultCountry={defaultCountry} onChange={change} error={touched && problem ? t(problem) : undefined} />
      ) : kind === 'note' ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            {fieldLabel}
            <textarea
              className="input mt-1.5 min-h-32 w-full p-3 font-normal"
              value={value}
              maxLength={ENTRY_MAX.note}
              placeholder={t('customers.sections.notePlaceholder')}
              onChange={(e) => change(e.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
          </label>
          {touched && problem ? <p className="mt-1.5 text-xs text-error">{t(problem)}</p> : null}
        </div>
      ) : (
        <Input
          type={kind === 'email' ? 'email' : 'text'}
          label={fieldLabel}
          value={value}
          maxLength={ENTRY_MAX[kind]}
          placeholder={kind === 'tag' ? t('customers.sections.tagPlaceholder') : undefined}
          autoComplete="off"
          onChange={(e) => change(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && problem ? t(problem) : undefined}
          autoFocus
          data-testid="entry-value"
        />
      )}
      {chips ? <LabelChips chips={chips} value={label} onChange={setLabel} custom={custom} onCustom={setCustom} /> : null}
    </FormDialog>
  )
}

// ── Address ──────────────────────────────────────────────────────────────────

/**
 * Add an address: ONLY from the places search (the business locations'
 * rule) — a place without street, city, province / state, postal code or
 * country is refused; the unit is the one typed part.
 */
export function AddressDialog({ onClose, onSave }: { onClose: () => void; onSave: (draft: IAddressDraft) => Promise<unknown> }) {
  const { t } = useTranslation()
  const [d, setD] = useState<IAddressDraft>({ place: null, unit: '', label: 'service' })
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(true)
  const [imprecise, setImprecise] = useState(false)
  const [touched, setTouched] = useState(false)
  const s = useSave(onClose)
  const problem = addressProblem(d)

  const pick = (p: IAddressParts) => {
    if (missingPlaceParts(p).length) {
      setImprecise(true)
      return
    }
    setImprecise(false)
    setD((prev) => ({ ...prev, place: p }))
    setSearching(false)
    setQuery('')
  }
  const summary = d.place ? [d.place.line1, d.place.city, `${d.place.state} ${d.place.zip}`.trim(), d.place.country].filter(Boolean).join(', ') : ''

  return (
    <FormDialog
      title={t('customers.address.title')}
      saveLabel={t('customers.sections.save')}
      saving={s.saving}
      error={s.error}
      testId="address-dialog"
      onClose={onClose}
      onSave={() => {
        setTouched(true)
        if (problem) return
        void s.run(() => onSave(d))
      }}
    >
      {searching ? (
        <div>
          <AddressAutocomplete
            value={query}
            onChangeText={(v) => {
              setQuery(v)
              setImprecise(false)
            }}
            onSelect={pick}
            label={t('customers.address.search')}
            error={imprecise ? t('customers.address.imprecise') : touched && problem ? t(problem) : undefined}
          />
        </div>
      ) : (
        <div data-testid="address-summary">
          <p className="text-xs font-medium text-ink-subtle">{t('customers.address.search')}</p>
          <p className="text-sm text-ink">{summary}</p>
          <Button type="button" variant="link" className="mt-1 h-auto px-0" onClick={() => setSearching(true)}>
            {t('customers.address.change')}
          </Button>
        </div>
      )}
      <Input
        label={t('customers.address.unit')}
        value={d.unit}
        maxLength={CUSTOMER_LIMITS.unit}
        placeholder={t('customers.address.unitPlaceholder')}
        onChange={(e) => setD((prev) => ({ ...prev, unit: e.target.value }))}
        data-testid="address-unit"
      />
      <LabelChips chips={ADDRESS_LABEL_CHIPS} value={d.label} onChange={(label) => setD((prev) => ({ ...prev, label }))} />
    </FormDialog>
  )
}

// ── Label of a phone / email / address ───────────────────────────────────────

const LABEL_TITLES = {
  phone: 'customers.sections.phoneLabel',
  email: 'customers.sections.emailLabel',
  address: 'customers.sections.addressLabel',
} as const

/** Change a contact's label: the defaults, the workspace's saved ones (each can be forgotten), "other". */
export function LabelDialog({
  kind,
  current,
  onClose,
  onSave,
}: {
  kind: ContactKind
  current: string
  onClose: () => void
  onSave: (label: string) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const { labels, removeLabel } = useCustomerLabels(kind)
  const options = labelOptions(kind, labels)
  const known = options.some((o) => o.value === current)
  const [selected, setSelected] = useState(known ? current : 'other')
  const [custom, setCustom] = useState(known ? '' : current)
  const s = useSave(onClose)

  return (
    <FormDialog
      title={t(LABEL_TITLES[kind])}
      saveLabel={t('customers.sections.save')}
      saving={s.saving}
      error={s.error}
      testId="label-dialog"
      onClose={onClose}
      onSave={() => void s.run(() => onSave(effectiveLabel(selected, custom)))}
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t(LABEL_TITLES[kind])}>
        {options.map((o) => (
          <span key={o.id} className="inline-flex items-center gap-1">
            <Chip on={selected === o.value} onClick={() => setSelected(o.value)}>
              {customerLabelText(t, o.value)}
            </Chip>
            {o.saved ? (
              <button
                type="button"
                className="cursor-pointer rounded-full p-1 text-ink-subtle hover:bg-surface-2 hover:text-ink"
                aria-label={t('customers.sections.forgetLabel', { label: customerLabelText(t, o.value) })}
                onClick={() => removeLabel(o.id).catch((e) => s.setError(customerErrorMessage(t, e)))}
              >
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {selected === 'other' ? (
        <Input
          value={custom}
          maxLength={CUSTOMER_LIMITS.label}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={t('customers.sections.customLabel')}
          aria-label={t('customers.sections.customLabel')}
          autoFocus
        />
      ) : null}
    </FormDialog>
  )
}

// ── Relationship (link another customer) ─────────────────────────────────────

/**
 * The customer picker: searches the SERVER (name, reference, email, phone)
 * and pages — never a filter over the first page in memory. The customer
 * itself and archived ones are not offered; a blacklisted one is marked and
 * asks before it is used.
 */
function CustomerPicker({ excludeId, onPick }: { excludeId: string; onPick: (c: ICustomerDTO) => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const query = useSearchQuery(search)
  const { customers, isLoading, error, hasMore, loadMore, refresh } = useCustomers({ ...(query ? { search: query } : {}), archived: false, limit: 25 })
  const results = pickable(customers, excludeId)
  const [confirming, setConfirming] = useState<ICustomerDTO | null>(null)

  if (confirming) {
    const name = customerDisplayName(confirming)
    return (
      <Notice
        tone="warning"
        action={
          <span className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setConfirming(null)}>
              {t('customers.sections.cancel')}
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => onPick(confirming)}>
              {t('customers.picker.useAnyway')}
            </Button>
          </span>
        }
      >
        <p className="font-semibold">{t('customers.picker.blacklistedTitle')}</p>
        <p>
          {confirming.blacklisted.reason
            ? t('customers.picker.blacklistedReason', { name, reason: confirming.blacklisted.reason })
            : t('customers.picker.blacklisted', { name })}
        </p>
      </Notice>
    )
  }

  return (
    <div className="space-y-2" data-testid="customer-picker">
      <Input
        type="search"
        iconLeft={MagnifyingGlass}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('customers.picker.search')}
        aria-label={t('customers.picker.search')}
        autoComplete="off"
        autoFocus
      />
      <ul className="max-h-64 divide-y divide-hairline overflow-y-auto rounded-lg border border-hairline">
        {results.map((c) => {
          const blacklisted = isBlacklisted(c)
          const name = customerDisplayName(c)
          return (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-surface-2"
                onClick={() => (blacklisted ? setConfirming(c) : onPick(c))}
                aria-label={blacklisted ? `${name}, ${t('customers.list.blacklisted')}` : name}
              >
                <CustomerAvatar customer={c} blacklisted={blacklisted} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{name}</span>
                  {c.referenceCode ? <span className="block text-xs text-ink-subtle">#{c.referenceCode}</span> : null}
                  {blacklisted ? <span className="block text-xs text-error">{t('customers.list.blacklisted')}</span> : null}
                </span>
              </button>
            </li>
          )
        })}
        {results.length === 0 ? (
          <li className="px-3 py-4 text-center text-sm text-ink-subtle">
            {isLoading ? (
              t('customers.picker.loading')
            ) : error ? (
              <>
                {customerErrorMessage(t, error)}{' '}
                <Button type="button" variant="link" size="sm" onClick={() => void refresh({ force: true })}>
                  {t('customers.picker.retry')}
                </Button>
              </>
            ) : query ? (
              t('customers.picker.noMatch')
            ) : (
              t('customers.picker.empty')
            )}
          </li>
        ) : null}
      </ul>
      {canShowMore({ hasMore, isLoading, rows: customers.length }) ? (
        <Button type="button" variant="link" size="sm" onClick={() => void loadMore()}>
          {t('customers.list.showMore')}
        </Button>
      ) : null}
    </div>
  )
}

/** Link another customer (a contact at a business, a spouse…). */
export function RelationshipDialog({
  customerId,
  onClose,
  onSave,
}: {
  customerId: string
  onClose: () => void
  onSave: (relatedId: string, relationship: string) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const [related, setRelated] = useState<ICustomerDTO | null>(null)
  const [relLabel, setRelLabel] = useState('contact')
  const [custom, setCustom] = useState('')
  const s = useSave(onClose)
  const effective = relLabel === 'other' ? custom.trim() : relLabel
  const canSave = !!related && effective.length > 0

  return (
    <FormDialog
      title={t('customers.sections.linkContact')}
      saveLabel={t('customers.sections.addRelationship')}
      canSave={canSave}
      saving={s.saving}
      error={s.error}
      testId="relationship-dialog"
      onClose={onClose}
      onSave={() => {
        if (canSave && related) void s.run(() => onSave(related.id, effective))
      }}
    >
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">{t('customers.sections.customer')}</p>
        {related ? (
          <div className="flex items-center gap-3 rounded-lg border border-hairline px-3 py-2">
            <CustomerAvatar customer={related} blacklisted={isBlacklisted(related)} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{customerDisplayName(related)}</span>
            <Button type="button" variant="link" size="sm" onClick={() => setRelated(null)}>
              {t('customers.picker.change')}
            </Button>
          </div>
        ) : (
          <CustomerPicker excludeId={customerId} onPick={setRelated} />
        )}
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">{t('customers.sections.relationship')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('customers.sections.relationship')}>
          {[...RELATIONSHIP_SUGGESTIONS, 'other'].map((r) => (
            <Chip key={r} on={relLabel === r} onClick={() => setRelLabel(r)}>
              {r === 'other' ? t('customers.label.other') : relationshipText(t, r)}
            </Chip>
          ))}
        </div>
        {relLabel === 'other' ? (
          <Input
            containerClassName="mt-2"
            value={custom}
            maxLength={CUSTOMER_LIMITS.relationship}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t('customers.sections.relationshipCustom')}
            aria-label={t('customers.sections.relationship')}
          />
        ) : null}
      </fieldset>
    </FormDialog>
  )
}
