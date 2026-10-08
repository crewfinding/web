import { FonderieApiError } from '@fonderie/client'
import type {
  IWorkspaceLocationInput,
  ITaxRegistrationDTO,
  IUpdateSettingsInput,
  IUpdateWorkspaceInput,
  IWorkspaceAddressDTO,
  IWorkspaceDTO,
  IWorkspaceLocationDTO,
  IWorkspaceSettingsDTO,
} from '@fonderie/client'

import type { IAddressParts, ITaxPresets } from './placeParts'
import { asCountry, isValidPhone, normalizePhone } from './phone'
import type { TranslationKey } from '../locales'

// The business profile IS the Fonderie workspace. The screen is a column of
// cards — Profile, Contact, Locations, Taxes, Document numbers, Regional
// settings — and each card saves ONLY its own fields: a card's body is built
// here from its values plus the latest server state, never from another
// card's unsaved draft. The server refuses a bad value with 422
// '<field path>: <why>'; each card maps that path onto its own field.

/** The legal forms the server accepts (workspaces' BUSINESS_TYPES). */
export const BUSINESS_TYPES = ['SOLE_PROP', 'PARTNERSHIP', 'LLC', 'INC', 'NONPROFIT', 'COOPERATIVE'] as const

/** The document kinds whose number the business can prefix (settings.documentPrefixes). */
export const PREFIX_KINDS = ['invoice', 'estimate', 'job'] as const
export type PrefixKind = (typeof PREFIX_KINDS)[number]

/** Server max lengths (workspaces' updateWorkspaceSchema). */
export const MAX = {
  name: 200,
  motto: 300,
  legalName: 200,
  line: 200,
  accessCode: 20,
  taxNumber: 40,
  prefix: 10,
  locationName: 100,
} as const

const orNull = (v: string): string | null => {
  const t = v.trim()
  return t.length ? t : null
}

/** 'Canada' / 'ca' / 'USA' → 'CA' / 'US'; anything else as typed, upper-cased. */
export const countryCode = (value: string | null | undefined): string => {
  const v = (value ?? '').trim().toUpperCase()
  if (['CA', 'CAN', 'CANADA'].includes(v)) return 'CA'
  if (['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(v)) return 'US'
  return v
}

// ── Head office ──────────────────────────────────────────────────────────────

/** The head office: the live location flagged so, else null. */
export const headOfficeOf = (locations: readonly IWorkspaceLocationDTO[]): IWorkspaceLocationDTO | null =>
  locations.find((l) => l.isHeadOffice && !l.isArchived) ?? null

/** Where the business is taxed: the head office's country + province / state, or null without one. */
export const taxHome = (locations: readonly IWorkspaceLocationDTO[]): { country: 'CA' | 'US'; province: string } | null => {
  const head = headOfficeOf(locations)
  if (!head) return null
  const country = countryCode(head.address.country)
  const province = (head.address.state ?? '').trim().toUpperCase().replace(/^[A-Z]{2}-/, '')
  if ((country !== 'CA' && country !== 'US') || !province) return null
  return { country, province }
}

/** The country the business works in: the head office's, else the workspace address's, else Canada. */
export const homeCountry = (ws: Pick<IWorkspaceDTO, 'address'>, locations: readonly IWorkspaceLocationDTO[]): 'CA' | 'US' => {
  const c = countryCode(headOfficeOf(locations)?.address.country || ws.address?.country)
  return c === 'US' ? 'US' : 'CA'
}

// ── Addresses ────────────────────────────────────────────────────────────────

type AnyAddress = Partial<IWorkspaceAddressDTO> | null | undefined

/** '500 Rue Sherbrooke O, Unit 4, Montréal QC H3A 3G4, CA' — '' when there is none. Unit / buzzer words come from `words`. */
export const addressOneLine = (a: AnyAddress, words: { unit: (u: string) => string; buzzer: (c: string) => string } | null = null): string => {
  if (!a) return ''
  const unit = (a.line2 ?? '').trim()
  const parts = [
    (a.line1 ?? '').trim(),
    unit ? (words ? words.unit(unit) : unit) : '',
    [a.city, a.state, a.zip].map((x) => (x ?? '').trim()).filter(Boolean).join(' '),
    (a.country ?? '').trim(),
  ].filter(Boolean)
  const line = parts.join(', ')
  const code = (a.accessCode ?? '').trim()
  return code && words ? `${line} · ${words.buzzer(code)}` : line
}

export const hasAddress = (a: AnyAddress): boolean =>
  !!a && [a.line1, a.line2, a.city, a.state, a.zip, a.country].some((x) => (x ?? '').trim().length > 0)

/** A maps search for the address (no coordinates are stored) — on the web, Google Maps in a new tab. */
export const mapsUrl = (line: string): string | null => {
  if (!line.trim()) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(line)}`
}

/** 'CA' + 'QC' → 'CA-QC'; '' when either is missing. */
export const taxRegionOf = (country: string, state: string): string => {
  const c = countryCode(country)
  const s = state.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(c) && /^[A-Z0-9]{1,3}$/.test(s) ? `${c}-${s}` : ''
}

/** The parts a picked place must have to be a business address; the missing ones (empty = precise enough). */
export const missingAddressParts = (p: IAddressParts): ('line1' | 'city' | 'state' | 'zip' | 'country')[] =>
  (['line1', 'city', 'state', 'zip', 'country'] as const).filter((k) => !(p[k] ?? '').trim())

// ── Errors ───────────────────────────────────────────────────────────────────

/** A 422 split into its field path ('address.zip', 'taxRegistrations.1.rate') and message; path null when it names none. */
export const serverRefusal = (err: unknown): { path: string | null; message: string } | null => {
  if (!(err instanceof FonderieApiError) || err.status !== 422 || !err.explanation) return null
  const m = /^([\w.]+):\s*(.+)$/s.exec(err.explanation)
  if (!m) return { path: null, message: err.explanation }
  return { path: m[1]!, message: m[2]! }
}

/** Reasons the contact / location routes answer, each with a localized message. */
export const CONTACT_REASONS = [
  'PRIMARY_REQUIRED',
  'HEAD_OFFICE_REQUIRED',
  'HEAD_OFFICE_ARCHIVE',
  'LOCATION_ARCHIVED',
  'WORKSPACE_LOCATION_ARCHIVED',
  'DUPLICATE',
  'LIMIT_REACHED',
] as const

/** The translation key for a known refusal, or null (then the error table applies). */
export const reasonKey = (err: unknown): TranslationKey | null => {
  if (!(err instanceof FonderieApiError)) return null
  const r = err.reason === 'WORKSPACE_LOCATION_ARCHIVED' ? 'LOCATION_ARCHIVED' : err.reason
  return (CONTACT_REASONS as readonly string[]).includes(r) ? (`business.reason.${r}` as TranslationKey) : null
}

// ── Tax registrations (shared by Profile and Taxes) ──────────────────────────

/** A registration as the PUT body carries it. */
type RegistrationInput = NonNullable<IUpdateWorkspaceInput['taxRegistrations']>[number]

const asInput = (r: ITaxRegistrationDTO): RegistrationInput => ({
  country: r.country,
  type: r.type,
  number: r.number || null,
  region: r.region || null,
  label: r.label || null,
  rate: typeof r.rate === 'number' ? r.rate : null,
})

/** BN (Canada) / EIN (US): the business number, which the Profile card owns. */
const isBusinessNumber = (r: ITaxRegistrationDTO) => {
  const c = countryCode(r.country)
  return (c === 'CA' && r.type === 'BN') || (c === 'US' && r.type === 'EIN')
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface IProfileValues {
  name: string
  /** The slogan shown under the name (workspace.motto). */
  motto: string
  /** The trade (workspace.industry), a key of TRADES — or what another app stored. */
  industry: string
  legalName: string
  businessType: string
  /** BN (Canada) or EIN (US) — a tax registration, not a field of its own. */
  businessNumber: string
}

export const profileValues = (ws: IWorkspaceDTO, country: 'CA' | 'US'): IProfileValues => {
  const bn = (ws.taxRegistrations ?? []).find((r) => isBusinessNumber(r) && countryCode(r.country) === country)
  return {
    name: ws.name ?? '',
    motto: ws.motto ?? '',
    industry: ws.industry ?? '',
    legalName: ws.legalName ?? '',
    businessType: ws.businessType ?? '',
    businessNumber: bn?.number ?? '',
  }
}

/**
 * The Profile card's PUT /workspaces body. The business number lives in
 * taxRegistrations (a whole-list replace), so when it changed the list is
 * rebuilt from the SERVER's registrations with only the BN / EIN swapped —
 * the Taxes card's unsaved rows are never part of it.
 */
export const profileInput = (v: IProfileValues, initial: IProfileValues, ws: IWorkspaceDTO, country: 'CA' | 'US'): IUpdateWorkspaceInput => {
  const input: IUpdateWorkspaceInput = {
    name: v.name.trim(),
    motto: orNull(v.motto),
    industry: orNull(v.industry),
    legalName: orNull(v.legalName),
    businessType: orNull(v.businessType),
  }
  if (v.businessNumber.trim() !== initial.businessNumber.trim()) {
    const type = country === 'US' ? 'EIN' : 'BN'
    const regs = (ws.taxRegistrations ?? []).filter((r) => !(isBusinessNumber(r) && countryCode(r.country) === country)).map(asInput)
    const number = v.businessNumber.trim()
    if (number) regs.push({ country, type, number, region: null, label: null, rate: null })
    input.taxRegistrations = regs
  }
  return input
}

const PROFILE_FIELDS = new Set(['name', 'motto', 'industry', 'legalName', 'businessType'])

/** Where a 422 on the Profile card belongs: one of its fields, or null (shown on the card). */
export const profileErrorField = (path: string | null): keyof IProfileValues | null => {
  if (!path) return null
  if (PROFILE_FIELDS.has(path)) return path as keyof IProfileValues
  if (path.startsWith('taxRegistrations.')) return 'businessNumber'
  return null
}

// ── Contact ──────────────────────────────────────────────────────────────────

/** A website typed without its scheme ('acme.ca') gets https://. */
export const normalizeWebsite = (v: string): string | null => {
  const t = v.trim()
  if (!t) return null
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

/**
 * The workspace phone when no listed phone carries it — a legacy value the
 * backfill skipped (e.g. not in international format). null when the list has it.
 */
export const legacyPhone = (ws: Pick<IWorkspaceDTO, 'phone'>, phones: readonly { phone: string }[], country: string): string | null => {
  const raw = (ws.phone ?? '').trim()
  if (!raw) return null
  const e164 = normalizePhone(raw, asCountry(country) ?? undefined)
  const digits = (s: string) => s.replace(/\D/g, '')
  return phones.some((p) => p.phone === raw || p.phone === e164 || digits(p.phone) === digits(raw)) ? null : raw
}

/** The workspace email when no listed email carries it; null when the list has it. */
export const legacyEmail = (ws: Pick<IWorkspaceDTO, 'email'>, emails: readonly { email: string }[]): string | null => {
  const raw = (ws.email ?? '').trim()
  if (!raw) return null
  return emails.some((e) => e.email.trim().toLowerCase() === raw.toLowerCase()) ? null : raw
}

/** The workspace address when there is no head office to carry it; null otherwise. */
export const legacyAddress = (ws: Pick<IWorkspaceDTO, 'address'>, locations: readonly IWorkspaceLocationDTO[]): IWorkspaceAddressDTO | null =>
  hasAddress(ws.address) && !!(ws.address?.line1?.trim() || ws.address?.city?.trim()) && !headOfficeOf(locations) ? (ws.address as IWorkspaceAddressDTO) : null

// ── Taxes ────────────────────────────────────────────────────────────────────

/** A preset tax line's code → the registration it is stored as. */
const REGISTRATION_OF: Record<string, string> = {
  GST: 'GST_HST',
  HST: 'GST_HST',
  QST: 'QST',
  PST: 'PST',
  RST: 'PST',
  SALES_TAX: 'STATE_SALES_TAX',
}

/** Percent with at most 3 decimals: 0.09975 → '9.975'. */
const percentText = (fraction: number) => String(Math.round(fraction * 100_000) / 1000)
const rateText = (r: number | null | undefined) => (typeof r === 'number' && Number.isFinite(r) ? String(r) : '')

/** '9,975' / ' 9.975 ' → 9.975; '' → null; anything else → NaN (validation refuses it first). */
export const parseRate = (v: string): number | null => {
  const t = v.trim().replace(',', '.')
  if (!t) return null
  return /^\d{1,3}(\.\d{1,3})?$/.test(t) ? Number(t) : NaN
}

/** A rate the server accepts: blank, or a percent 0–100 with at most 3 decimals. */
export const isValidRate = (v: string): boolean => {
  const n = parseRate(v)
  return n === null || (Number.isFinite(n) && n >= 0 && n <= 100)
}

export interface ITaxRow {
  /** Stable key for React and for 422 mapping. */
  key: string
  /** Derived from the head office (number-first) vs an extra row the owner added. */
  derived: boolean
  /** Display name: GST, HST, QST, PST, RST, Sales tax… */
  code: string
  country: string
  /** Registration type: GST_HST, QST, PST, STATE_SALES_TAX… */
  type: string
  /** Province / state code, '' when not regional. */
  region: string
  label: string
  number: string
  /** Percent, as typed. */
  rate: string
  /** The region's usual rate (percent text); null when the business enters it (US). */
  presetRate: string | null
}

/** The taxes the head office's region charges, from the API's preset tables: rates as percent text. */
export const regionTaxes = (presets: Pick<ITaxPresets, 'presets'>, home: { country: 'CA' | 'US'; province: string }): { code: string; label: string; rate: string | null }[] => {
  if (home.country === 'US') return presets.presets.US.map((p) => ({ code: p.code, label: p.label, rate: null }))
  return (presets.presets.CA[home.province] ?? []).map((p) => ({ code: p.code, label: p.label, rate: percentText(p.rate) }))
}

const regionOnly = (r: string | null | undefined) => (r ?? '').trim().toUpperCase().replace(/^[A-Z]{2}-/, '')

export interface ITaxValues {
  rows: ITaxRow[]
}

/**
 * The Taxes card's rows: one per tax the head office's region charges (its
 * stored registration's number and rate when there is one, else the usual
 * rate), then every other registration — except the business number, which
 * is the Profile card's — as an extra row.
 */
export const taxValues = (ws: IWorkspaceDTO, home: { country: 'CA' | 'US'; province: string }, lines: ReturnType<typeof regionTaxes>): ITaxValues => {
  const pool = (ws.taxRegistrations ?? []).map((r, i) => ({ r, i })).filter(({ r }) => !isBusinessNumber(r))
  const used = new Set<number>()
  const rows: ITaxRow[] = lines.map((line) => {
    const type = REGISTRATION_OF[line.code] ?? line.code
    const regional = type === 'PST' || type === 'STATE_SALES_TAX'
    const match =
      pool.find(({ r, i }) => !used.has(i) && countryCode(r.country) === home.country && r.type === type && (!regional || regionOnly(r.region) === home.province)) ??
      pool.find(({ r, i }) => !used.has(i) && countryCode(r.country) === home.country && r.type === type && !regional)
    if (match) used.add(match.i)
    return {
      key: `derived-${line.code}`,
      derived: true,
      code: line.code,
      country: home.country,
      type,
      region: regional ? home.province : '',
      label: match?.r.label ?? '',
      number: match?.r.number ?? '',
      rate: match && typeof match.r.rate === 'number' ? rateText(match.r.rate) : line.rate ?? '',
      presetRate: line.rate,
    }
  })
  for (const { r, i } of pool) {
    if (used.has(i)) continue
    rows.push({
      key: `extra-${i}`,
      derived: false,
      code: r.type,
      country: countryCode(r.country),
      type: r.type,
      region: regionOnly(r.region),
      label: r.label ?? '',
      number: r.number ?? '',
      rate: rateText(r.rate),
      presetRate: null,
    })
  }
  return { rows }
}

const sameRate = (a: string, b: string | null) => b !== null && parseRate(a) !== null && Math.abs((parseRate(a) as number) - (parseRate(b) as number)) < 1e-9

/** Whether the owner set rates of their own (a derived rate changed, or an extra row carries a rate). */
export const ratesCustomized = (rows: readonly ITaxRow[]): boolean =>
  rows.some((r) => (r.derived ? r.presetRate !== null && !sameRate(r.rate, r.presetRate) : parseRate(r.rate) !== null))

/**
 * The Taxes card's PUT /workspaces body: { taxRegistrations } only, with the
 * server's business number carried over. The API applies the region's usual
 * rates unless ANY registration has a rate — then the stored rates are the
 * whole list. So while the rates are the usual ones they are not stored (a
 * new provincial rate reaches documents by itself); once one is changed,
 * every row carries its rate so no tax drops off.
 * `sources[i]` is the row key registration i came from (for a 422).
 */
export const taxInput = (rows: readonly ITaxRow[], ws: IWorkspaceDTO): { input: IUpdateWorkspaceInput; sources: string[] } => {
  const custom = ratesCustomized(rows)
  const regs: RegistrationInput[] = []
  const sources: string[] = []
  for (const row of rows) {
    const number = row.number.trim()
    const typed = parseRate(row.rate)
    const rate = row.derived && row.presetRate !== null && !custom ? null : typed
    if (!number && rate === null) continue
    const region = row.region.trim() ? `${row.country}-${row.region.trim().toUpperCase()}` : null
    regs.push({ country: row.country, type: row.type, number: number || null, rate, region, label: orNull(row.label) })
    sources.push(row.key)
  }
  for (const r of ws.taxRegistrations ?? []) {
    if (isBusinessNumber(r)) {
      regs.push(asInput(r))
      sources.push('businessNumber')
    }
  }
  return { input: { taxRegistrations: regs }, sources }
}

/** Where a 422 on the Taxes card belongs: '<rowKey>.number' / '<rowKey>.rate' / …, or null. */
export const taxErrorField = (path: string | null, sources: readonly string[]): string | null => {
  const m = path ? /^taxRegistrations\.(\d+)(?:\.(\w+))?/.exec(path) : null
  const key = m ? sources[Number(m[1])] : undefined
  if (!key || key === 'businessNumber') return null
  const part = m![2]
  return `${key}.${part === 'rate' || part === 'region' || part === 'type' || part === 'country' ? part : 'number'}`
}

/** A blank extra row (country from the head office). */
export const newTaxRow = (country: 'CA' | 'US', n: number): ITaxRow => ({
  key: `new-${n}`,
  derived: false,
  code: '',
  country,
  type: country === 'US' ? 'STATE_SALES_TAX' : 'GST_HST',
  region: '',
  label: '',
  number: '',
  rate: '',
  presetRate: null,
})

/** The kinds of registration an extra row can be, per country (BN / EIN are the Profile card's). */
export const TAX_TYPES: Record<'CA' | 'US', readonly string[]> = {
  CA: ['GST_HST', 'QST', 'PST'],
  US: ['STATE_SALES_TAX'],
}

// ── Document numbers ─────────────────────────────────────────────────────────

/** A prefix as it will be stored: upper-cased, 1–10 of A–Z 0–9 '-'. Blank is fine (none). */
export const isValidPrefix = (v: string): boolean => {
  const t = v.trim().toUpperCase()
  return !t || /^[A-Z0-9-]{1,10}$/.test(t)
}

const BASE: Record<PrefixKind, string> = { job: 'JOB', estimate: 'EST', invoice: 'INV' }

/**
 * How a number reads with this prefix — the API's formatReference
 * (domain/business/references.ts): 'ACME-INV-0001', 'ACME-EST-0001'; a job's
 * prefix takes the place of JOB ('ACME-0042'); no prefix → 'INV-0001'.
 */
export const formatReference = (kind: PrefixKind, n: number, prefix: string): string => {
  const num = String(n).padStart(4, '0')
  const p = prefix.trim().toUpperCase()
  if (!p) return `${BASE[kind]}-${num}`
  return kind === 'job' ? `${p}-${num}` : `${p}-${BASE[kind]}-${num}`
}

/** The sample numbers the preview shows. */
export const PREVIEW_NUMBERS: Record<PrefixKind, number> = { invoice: 1, estimate: 1, job: 42 }

export const previewOf = (prefixes: Record<PrefixKind, string>): Record<PrefixKind, string> => ({
  invoice: formatReference('invoice', PREVIEW_NUMBERS.invoice, prefixes.invoice),
  estimate: formatReference('estimate', PREVIEW_NUMBERS.estimate, prefixes.estimate),
  job: formatReference('job', PREVIEW_NUMBERS.job, prefixes.job),
})

export interface IPrefixValues {
  /** One prefix for every kind. */
  single: string
  /** Per-kind prefixes ('Customize per document'). */
  each: Record<PrefixKind, string>
  customized: boolean
}

export const prefixValues = (settings: IWorkspaceSettingsDTO | null | undefined): IPrefixValues => {
  const p = settings?.documentPrefixes ?? {}
  const each = { invoice: (p['invoice'] ?? '').toUpperCase(), estimate: (p['estimate'] ?? '').toUpperCase(), job: (p['job'] ?? '').toUpperCase() }
  const customized = !(each.invoice === each.estimate && each.estimate === each.job)
  return { single: customized ? '' : each.invoice, each, customized }
}

/** The prefixes that apply: the single one for all, or each its own. */
export const effectivePrefixes = (v: IPrefixValues): Record<PrefixKind, string> =>
  v.customized ? v.each : { invoice: v.single, estimate: v.single, job: v.single }

/** PUT /workspaces/settings body: the map replaces the stored one, so kinds this card does not show are carried over. */
export const prefixInput = (v: IPrefixValues, settings: IWorkspaceSettingsDTO | null | undefined): IUpdateSettingsInput => {
  const documentPrefixes: Record<string, string> = { ...(settings?.documentPrefixes ?? {}) }
  const eff = effectivePrefixes(v)
  for (const k of PREFIX_KINDS) documentPrefixes[k] = eff[k].trim().toUpperCase()
  return { documentPrefixes }
}

// ── Regional settings ────────────────────────────────────────────────────────

/** The app's languages (code → own name), the document languages too. */
export const APP_LANGUAGES: readonly { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
]

const baseOf = (tag: string) => tag.trim().toLowerCase().split(/[-_]/)[0] ?? ''

/** The usual currency for the head office's country. */
export const currencyFor = (country: 'CA' | 'US'): string => (country === 'US' ? 'USD' : 'CAD')

export interface IRegionalValues {
  /** Language code ('fr') — the stored tag ('fr-CA') is kept when the language is unchanged. */
  locale: string
  timezone: string
  currency: string
  /** Language codes the business serves customers in. */
  languages: string[]
}

export const regionalValues = (ws: IWorkspaceDTO, settings: IWorkspaceSettingsDTO): IRegionalValues => {
  const locale = baseOf(settings.locale ?? '')
  const tz = (settings.timezone ?? '').trim()
  const langs: string[] = []
  for (const l of ws.languages ?? []) {
    const b = baseOf(l)
    if (b && !langs.includes(b)) langs.push(b)
  }
  return {
    locale: APP_LANGUAGES.some((l) => l.code === locale) ? locale : '',
    timezone: tz === 'UTC' ? '' : tz,
    currency: (settings.currency ?? '').toUpperCase(),
    languages: langs,
  }
}

/**
 * The Regional card's two writes: settings (locale, time zone, currency) and
 * the workspace's languages — each only when it changed. A stored tag keeps
 * its region ('fr-CA') when its language is still the one chosen.
 */
export const regionalInput = (
  v: IRegionalValues,
  initial: IRegionalValues,
  ws: IWorkspaceDTO,
  country: 'CA' | 'US',
): { settings: IUpdateSettingsInput | null; workspace: IUpdateWorkspaceInput | null } => {
  const s: IUpdateSettingsInput = {}
  if (v.locale !== initial.locale && v.locale) {
    s.locale = ['en', 'fr', 'es'].includes(v.locale) ? `${v.locale}-${country}` : v.locale
  }
  if (v.timezone !== initial.timezone && v.timezone) s.timezone = v.timezone
  if (v.currency !== initial.currency && v.currency) s.currency = v.currency
  let workspace: IUpdateWorkspaceInput | null = null
  const sameLangs = v.languages.length === initial.languages.length && v.languages.every((l) => initial.languages.includes(l))
  if (!sameLangs) {
    const stored = ws.languages ?? []
    const languages = v.languages.map((code) => stored.find((tag) => baseOf(tag) === code) ?? (['en', 'fr', 'es'].includes(code) ? `${code}-${country}` : code))
    workspace = { languages }
  }
  return { settings: Object.keys(s).length ? s : null, workspace }
}

// ── Location editor (the app's BusinessContacts.tsx) ─────────────────────────

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ILocationDraft {
  name: string
  /** The parts come ONLY from a picked place (no manual entry); unit and buzzer are typed. */
  line1: string
  line2: string
  city: string
  state: string
  zip: string
  country: string
  accessCode: string
  phone: string
  email: string
  taxRegion: string
  latitude: number | null
  longitude: number | null
  isHeadOffice: boolean
}

export const draftOf = (l?: IWorkspaceLocationDTO): ILocationDraft => ({
  name: l?.name ?? '',
  line1: l?.address.line1 ?? '',
  line2: l?.address.line2 ?? '',
  city: l?.address.city ?? '',
  state: l?.address.state ?? '',
  zip: l?.address.zip ?? '',
  country: l?.address.country ?? '',
  accessCode: l?.address.accessCode ?? '',
  phone: l?.phone ?? '',
  email: l?.email ?? '',
  taxRegion: l?.taxRegion ?? '',
  latitude: l?.latitude ?? null,
  longitude: l?.longitude ?? null,
  isHeadOffice: l?.isHeadOffice ?? false,
})

const ADDRESS_KEYS = ['line1', 'line2', 'city', 'state', 'zip', 'country', 'accessCode'] as const

/** The draft as the POST body: trimmed, blanks cleared. */
export const toLocationInput = (d: ILocationDraft): IWorkspaceLocationInput => ({
  name: d.name.trim(),
  address: {
    line1: d.line1.trim(),
    line2: d.line2.trim(),
    city: d.city.trim(),
    state: d.state.trim().toUpperCase(),
    zip: d.zip.trim(),
    country: countryCode(d.country),
    accessCode: orNull(d.accessCode),
  },
  taxRegion: orNull(d.taxRegion.toUpperCase()),
  latitude: d.latitude,
  longitude: d.longitude,
  phone: orNull(d.phone),
  email: orNull(d.email)?.toLowerCase() ?? null,
  isHeadOffice: d.isHeadOffice,
})

/**
 * The PUT body for an edit: the address (and what follows from it: tax
 * region, coordinates) only when it changed — a legacy hand-typed address
 * that is left alone is never re-sent.
 */
export const toLocationUpdate = (d: ILocationDraft, initial: ILocationDraft): Partial<IWorkspaceLocationInput> => {
  const full = toLocationInput(d)
  const out: Partial<IWorkspaceLocationInput> = { name: full.name, phone: full.phone, email: full.email }
  if (d.isHeadOffice !== initial.isHeadOffice) out.isHeadOffice = d.isHeadOffice
  if (ADDRESS_KEYS.some((k) => d[k].trim() !== initial[k].trim())) {
    out.address = full.address
    out.taxRegion = full.taxRegion
    out.latitude = full.latitude
    out.longitude = full.longitude
  }
  return out
}

/** The editor's checks before saving: field → message key. */
export function locationProblems(d: ILocationDraft, defaultCountry: string): Partial<Record<'name' | 'address' | 'email' | 'phone', TranslationKey>> {
  const e: Partial<Record<'name' | 'address' | 'email' | 'phone', TranslationKey>> = {}
  if (!d.name.trim()) e.name = 'business.empty'
  if (!d.line1.trim() && !d.city.trim()) e.address = 'business.locations.pick'
  if (d.email.trim() && !EMAIL.test(d.email.trim())) e.email = 'business.contact.emailError'
  if (d.phone.trim() && !isValidPhone(d.phone, asCountry(countryCode(d.country) || defaultCountry) ?? undefined)) e.phone = 'business.contact.phoneError'
  return e
}

/** Head office first, archived last. */
export const sortLocations = (locations: readonly IWorkspaceLocationDTO[]): IWorkspaceLocationDTO[] =>
  [...locations].sort((a, b) => Number(b.isHeadOffice) - Number(a.isHeadOffice) || Number(a.isArchived) - Number(b.isArchived))
