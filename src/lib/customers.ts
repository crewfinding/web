/**
 * The customers screens' rules, kept pure so a test can pin them — the mobile
 * app's utils/customer.ts, CustomerEditor/labels.ts and permissions.ts, and
 * the controllers' form ↔ request mapping (docs/parity/5-customers.md).
 *
 * The server is the security (the role's 'customers' switches, 403); these
 * only keep the page from offering what would be refused.
 */
import { FonderieApiError } from '@fonderie/client'
import type {
  CustomerType,
  IAddAddressInput,
  ICreateCustomerInput,
  ICustomerAddressDTO,
  ICustomerDTO,
  IDeletedCustomerDTO,
  IListCustomersInput,
  IUpdateCustomerInput,
} from '@fonderie/client'
import type { TranslationKey } from '../locales'
import { errorMessage } from './apiErrors'
import { DEFAULT_PHONE_COUNTRY, asCountry, isValidPhone } from './phone'
import type { IAddressParts } from './placeParts'

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

// ── Names ────────────────────────────────────────────────────────────────────

type INamed = Pick<ICustomerDTO, 'firstName' | 'lastName' | 'companyName' | 'referenceCode'> & { displayName?: string }

/**
 * The name to show. The server's `displayName` writes it in the customer's own
 * order (family name first in Chinese, Japanese, Korean); the parts are the
 * fallback.
 */
export function customerDisplayName(c: INamed): string {
  if (c.displayName) return c.displayName
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ')
  return full || c.companyName || c.referenceCode || 'Unknown'
}

export function customerInitials(c: INamed): string {
  return (
    customerDisplayName(c)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  )
}

/** A deleted customer's name in the bin: company, else first + last, else "#ref", else "—". */
export const binName = (c: Pick<IDeletedCustomerDTO, 'companyName' | 'firstName' | 'lastName' | 'referenceCode'>): string =>
  c.companyName || [c.firstName, c.lastName].filter(Boolean).join(' ') || (c.referenceCode ? `#${c.referenceCode}` : '—')

export const isBlacklisted = (c: Pick<ICustomerDTO, 'blacklisted'> | null | undefined): boolean => !!c?.blacklisted?.status
export const isArchived = (c: Pick<ICustomerDTO, 'archived'> | null | undefined): boolean => !!c?.archived?.status

/** DELETE answered 409 CUSTOMER_IN_USE: a job, quote or invoice points at the customer — archive instead. */
export const isCustomerInUse = (error: unknown): boolean => error instanceof FonderieApiError && error.reason === 'CUSTOMER_IN_USE'

/** The record is gone or not in this workspace (deleted, or a workspace switch). */
export const isNotFound = (error: unknown): boolean => error instanceof FonderieApiError && error.status === 404

export function primaryPhone(c: { phones?: readonly { phone: string; isPrimary: boolean }[] }): string | null {
  const phones = c.phones ?? []
  return (phones.find((x) => x.isPrimary) ?? phones[0])?.phone ?? null
}

// ── Permissions ──────────────────────────────────────────────────────────────

export interface ICustomerPermissions {
  canCreate: boolean
  /** Every edit of a saved customer: fields, contacts, notes, tags, links, blacklist, archive. */
  canUpdate: boolean
  canDelete: boolean
  /** Restoring from the bin takes the create switch. */
  canRestore: boolean
  /** Emptying the bin is the owner's alone: a manager who could would delete and erase the undo. */
  canPurge: boolean
}

/**
 * What the signed-in member may do with customers here: the role's
 * 'customers' switches (false until known), the owner for the bin, and
 * nothing at all while the workspace is archived (read-only).
 */
export function customerPermissions(opts: {
  can: (operation: 'create' | 'read' | 'update' | 'delete', resource: string) => boolean
  isOwner: boolean
  workspaceArchived: boolean
}): ICustomerPermissions {
  if (opts.workspaceArchived) return { canCreate: false, canUpdate: false, canDelete: false, canRestore: false, canPurge: false }
  const canCreate = opts.can('create', 'customers')
  return {
    canCreate,
    canUpdate: opts.can('update', 'customers'),
    canDelete: opts.can('delete', 'customers'),
    canRestore: canCreate,
    canPurge: opts.isOwner,
  }
}

// ── List ─────────────────────────────────────────────────────────────────────

export type CustomerFilter = 'active' | 'archived' | 'deleted'
export const CUSTOMER_FILTERS: readonly CustomerFilter[] = ['active', 'archived', 'deleted']

/** Rows read per page; "Show more" reads the next one. */
export const CUSTOMERS_PAGE_SIZE = 25

/** Typing waits this long before the server is asked; a cleared box applies at once. */
export const searchDelay = (query: string): number => (query.trim() ? 300 : 0)

/** What the list asks the server: its own search (name, reference, email, phone), the filter, a page. */
export function listParams(search: string, filter: Exclude<CustomerFilter, 'deleted'>): IListCustomersInput {
  const q = search.trim()
  return { ...(q ? { search: q } : {}), archived: filter === 'archived', limit: CUSTOMERS_PAGE_SIZE }
}

/** "Show more": offered while the server says more rows match and none is being read. */
export const canShowMore = (opts: { hasMore: boolean; isLoading: boolean; rows: number }): boolean =>
  opts.rows > 0 && opts.hasMore && !opts.isLoading

/** The empty list's title and body. */
export function emptyListCopy(opts: { search: string; filter: Exclude<CustomerFilter, 'deleted'>; canCreate: boolean }): {
  title: TranslationKey
  body: TranslationKey
} {
  if (opts.search.trim()) return { title: 'customers.list.noResults', body: 'customers.list.emptySearch' }
  if (opts.filter === 'archived') return { title: 'customers.list.emptyArchivedTitle', body: 'customers.list.emptyArchived' }
  return { title: 'customers.list.emptyTitle', body: opts.canCreate ? 'customers.list.emptyCanCreate' : 'customers.list.emptyReadOnly' }
}

/** The customer picker (links): the customer itself and archived ones are never offered. */
export const pickable = <C extends Pick<ICustomerDTO, 'id' | 'archived'>>(rows: readonly C[], excludeId?: string): C[] =>
  rows.filter((c) => c.id !== excludeId && !isArchived(c))

// ── Refusals ─────────────────────────────────────────────────────────────────

const CUSTOMER_REASONS: Record<string, TranslationKey> = {
  DUPLICATE_EMAIL: 'customers.reason.DUPLICATE_EMAIL',
  DUPLICATE_PHONE: 'customers.reason.DUPLICATE_PHONE',
  DUPLICATE_ADDRESS: 'customers.reason.DUPLICATE_ADDRESS',
  DUPLICATE_REFERENCE_CODE: 'customers.reason.DUPLICATE_REFERENCE_CODE',
  LABEL_IN_USE: 'customers.reason.LABEL_IN_USE',
}

/**
 * What a refused customers request says: the customers' own refusals, then the
 * shared table (CUSTOMER_ARCHIVED, WORKSPACE_ARCHIVED, OWNER_REQUIRED…), then
 * the server's explanation, then by status. A restore refused because the
 * reference is taken names it.
 */
export function customerErrorMessage(t: T, err: unknown, opts?: { referenceCode?: string | null }): string {
  if (err instanceof FonderieApiError) {
    if (err.reason === 'RESTORE_CONFLICT') return t('customers.bin.conflict', { code: opts?.referenceCode ?? '' })
    const key = CUSTOMER_REASONS[err.reason]
    if (key) return t(key)
  }
  return errorMessage(t, err)
}

/**
 * One undo-bin action (restore or delete for good) and what the bin then
 * says: `done` when it worked (nothing for a purge), the refusal otherwise —
 * a reference taken since the delete names it.
 */
export async function binAction(
  t: T,
  c: Pick<IDeletedCustomerDTO, 'referenceCode'>,
  fn: () => Promise<unknown>,
  done: string,
): Promise<{ text: string; tone: 'info' | 'error' } | null> {
  try {
    await fn()
    return done ? { text: done, tone: 'info' } : null
  } catch (err) {
    return { text: customerErrorMessage(t, err, { referenceCode: c.referenceCode }), tone: 'error' }
  }
}

// ── Labels ───────────────────────────────────────────────────────────────────

/**
 * Contact labels are free text stored on the server ('mobile', 'billing', or
 * whatever a user typed). The defaults are shown in the reader's language; a
 * custom label is shown as typed.
 */
export const LABEL_DEFAULTS = {
  phone: ['mobile', 'office', 'home', 'fax', 'other'],
  email: ['work', 'personal', 'billing', 'other'],
  address: ['service', 'billing', 'from', 'to', 'other'],
} as const

export type ContactKind = keyof typeof LABEL_DEFAULTS
type KnownLabel = (typeof LABEL_DEFAULTS)[ContactKind][number]

const KNOWN_LABELS = new Set<string>(Object.values(LABEL_DEFAULTS).flat())

export function customerLabelText(t: T, label: string | null | undefined): string {
  if (!label) return ''
  return KNOWN_LABELS.has(label) ? t(`customers.label.${label as KnownLabel}`) : label
}

/** The add-address label chips (the mobile AddAddressSheet). */
export const ADDRESS_LABEL_CHIPS = ['service', 'billing', 'other'] as const

/** Relationship suggestions, stored as these English words, shown translated. */
export const RELATIONSHIP_SUGGESTIONS = ['contact', 'employee', 'employer', 'spouse', 'partner', 'subsidiary'] as const
type KnownRelationship = (typeof RELATIONSHIP_SUGGESTIONS)[number]
const KNOWN_RELATIONSHIPS = new Set<string>(RELATIONSHIP_SUGGESTIONS)

export function relationshipText(t: T, relationship: string): string {
  return KNOWN_RELATIONSHIPS.has(relationship) ? t(`customers.relationship.${relationship as KnownRelationship}`) : relationship
}

/** "other" with a custom word typed: the word; "other" alone stays "other". */
export const effectiveLabel = (chosen: string, custom: string): string => (chosen === 'other' ? custom.trim() || 'other' : chosen)

/** The label picker's options: the defaults, the workspace's saved ones, then "other" last. */
export function labelOptions(
  kind: ContactKind,
  saved: readonly { id: string; type: string; value: string; createdAt: string }[],
): { id: string; value: string; saved: boolean }[] {
  const own = saved.filter((l) => l.type === kind && l.value !== 'other')
  const defaults = LABEL_DEFAULTS[kind].filter((v) => v !== 'other' && !own.some((l) => l.value === v)).map((v) => ({ id: v, value: v, saved: false }))
  return [...defaults, ...own.map((l) => ({ id: l.id, value: l.value, saved: !!l.createdAt })), { id: 'other', value: 'other', saved: false }]
}

// ── Values ───────────────────────────────────────────────────────────────────

/** Server limits (customers schemas) — the form stops there instead of a 422. */
export const CUSTOMER_LIMITS = {
  name: 100,
  companyName: 200,
  referenceCode: 100,
  label: 100,
  tag: 100,
  note: 10000,
  relationship: 100,
  email: 254,
  phone: 30,
  unit: 50,
  accessCode: 20,
} as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (value: string): boolean => EMAIL.test(value.trim())

/**
 * A phone the customer can be reached at: a real number for its country
 * (libphonenumber — E.164 from PhoneInput), within the server's rule (7–15
 * digits, optional leading +, spaces / dashes / brackets ignored).
 */
export const isCustomerPhone = (value: string, country: string = DEFAULT_PHONE_COUNTRY): boolean =>
  /^\+?[1-9]\d{6,14}$/.test(value.replace(/[\s\-()]/g, '')) && isValidPhone(value, asCountry(country) ?? DEFAULT_PHONE_COUNTRY)

export type EntryKind = 'phone' | 'email' | 'note' | 'tag'

/** Normalized as the server stores it: emails and tags lower-case. */
export function normalizeEntry(kind: EntryKind, raw: string): string {
  const v = raw.trim()
  return kind === 'email' || kind === 'tag' ? v.toLowerCase() : v
}

/** Why an entry cannot be added yet (the message key), or null. */
export function entryProblem(kind: EntryKind, value: string, country?: string): TranslationKey | null {
  if (!value) return 'customers.validation.empty'
  if (kind === 'email' && !isEmail(value)) return 'customers.validation.email'
  if (kind === 'phone' && !isCustomerPhone(value, country)) return 'customers.validation.phone'
  return null
}

export const ENTRY_MAX: Record<EntryKind, number> = {
  phone: CUSTOMER_LIMITS.phone,
  email: CUSTOMER_LIMITS.email,
  note: CUSTOMER_LIMITS.note,
  tag: CUSTOMER_LIMITS.tag,
}

// ── Identity form ────────────────────────────────────────────────────────────

export interface ICustomerIdentityValues {
  type: CustomerType
  firstName: string
  lastName: string
  companyName: string
  referenceCode: string
  /** '' = the business's language. */
  locale: string
  /** IANA zone; '' = none set (the business's zone applies). */
  timezone: string
  /** Create only: the first phone / email, optional. */
  phone: string
  email: string
}

export const EMPTY_IDENTITY: ICustomerIdentityValues = {
  type: 'individual',
  firstName: '',
  lastName: '',
  companyName: '',
  referenceCode: '',
  locale: '',
  timezone: '',
  phone: '',
  email: '',
}

/** Trimmed, email lower-case — what is sent. */
export function normalizeIdentity(v: ICustomerIdentityValues): ICustomerIdentityValues {
  return {
    ...v,
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    companyName: v.companyName.trim(),
    referenceCode: v.referenceCode.trim(),
    phone: v.phone.trim(),
    email: v.email.trim().toLowerCase(),
  }
}

/** The form's checks: field → message key. Empty when it may be sent. */
export function identityProblems(v: ICustomerIdentityValues, opts: { withContact: boolean; country: string }): Partial<Record<keyof ICustomerIdentityValues, TranslationKey>> {
  const out: Partial<Record<keyof ICustomerIdentityValues, TranslationKey>> = {}
  const n = normalizeIdentity(v)
  if (n.type === 'individual' && !n.firstName) out.firstName = 'customers.validation.empty'
  if (n.type === 'business' && !n.companyName) out.companyName = 'customers.validation.empty'
  if (opts.withContact && n.phone && !isCustomerPhone(n.phone, opts.country)) out.phone = 'customers.validation.phone'
  if (opts.withContact && n.email && !isEmail(n.email)) out.email = 'customers.validation.email'
  return out
}

/** The longest each identity field may be (the "At most {max} characters" check). */
export const IDENTITY_MAX: Partial<Record<keyof ICustomerIdentityValues, number>> = {
  firstName: CUSTOMER_LIMITS.name,
  lastName: CUSTOMER_LIMITS.name,
  companyName: CUSTOMER_LIMITS.companyName,
  referenceCode: CUSTOMER_LIMITS.referenceCode,
  email: CUSTOMER_LIMITS.email,
}

/** Form values → the update the server takes (blank → null clears it; a business has no person name). */
export function identityToInput(v: ICustomerIdentityValues): IUpdateCustomerInput {
  const individual = v.type === 'individual'
  return {
    type: v.type,
    firstName: individual ? v.firstName || null : null,
    lastName: individual ? v.lastName || null : null,
    companyName: v.companyName || null,
    referenceCode: v.referenceCode || null,
    locale: v.locale || null,
    timezone: v.timezone || null,
  }
}

/** Form values → the create (blank → not sent). */
export function identityToCreate(v: ICustomerIdentityValues): ICreateCustomerInput {
  const input = identityToInput(v)
  return Object.fromEntries(Object.entries(input).filter(([, x]) => x !== null)) as ICreateCustomerInput
}

export function customerToIdentity(c: ICustomerDTO): ICustomerIdentityValues {
  return {
    type: c.type === 'business' ? 'business' : 'individual',
    firstName: c.firstName ?? '',
    lastName: c.lastName ?? '',
    companyName: c.companyName ?? '',
    referenceCode: c.referenceCode ?? '',
    locale: c.locale ?? '',
    timezone: c.timezone ?? '',
    phone: '',
    email: '',
  }
}

// ── Languages ────────────────────────────────────────────────────────────────

/** The app's languages, named in their own language (never translated). */
export const CUSTOMER_APP_LANGUAGES: readonly { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
]

/** A language tag named in its own language ('fr-CA' → 'Français (Canada)'); the app list, then the tag. */
export function languageName(tag: string): string {
  try {
    const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag)
    if (name && name !== tag) return name.charAt(0).toLocaleUpperCase(tag) + name.slice(1)
  } catch {
    /* a tag the engine refuses */
  }
  return CUSTOMER_APP_LANGUAGES.find((l) => l.code === tag.split('-')[0])?.name ?? tag
}

/** The languages a customer can be written to in: the ones the business serves, else the app's. */
export function customerLanguages(workspaceLanguages: readonly string[] | null | undefined): { code: string; name: string }[] {
  const tags = (workspaceLanguages ?? []).filter((x) => typeof x === 'string' && x.trim())
  return tags.length ? tags.map((code) => ({ code, name: languageName(code) })) : [...CUSTOMER_APP_LANGUAGES]
}

/** The option a stored locale selects: the same tag, else the same language ('fr' ↔ 'fr-CA'); '' when none. */
export function matchLanguage(locale: string | null | undefined, options: readonly { code: string }[]): string {
  const l = (locale ?? '').trim()
  if (!l) return ''
  const exact = options.find((o) => o.code.toLowerCase() === l.toLowerCase())
  if (exact) return exact.code
  const base = l.split('-')[0]!.toLowerCase()
  return options.find((o) => o.code.split('-')[0]!.toLowerCase() === base)?.code ?? ''
}

// ── Addresses ────────────────────────────────────────────────────────────────

/** The parts a picked place must have; anything less is refused, never patched by hand. */
export const missingPlaceParts = (p: IAddressParts): ('line1' | 'city' | 'state' | 'zip' | 'country')[] =>
  (['line1', 'city', 'state', 'zip', 'country'] as const).filter((k) => !p[k]?.trim())

export interface IAddressDraft {
  /** The picked place — the only source of the address (street, city, province / state, postal code, country, point). */
  place: IAddressParts | null
  /** Typed: Unit / Suite. */
  unit: string
  /** Typed: the buzzer / door code. */
  accessCode: string
  label: string
}

/** Why the address cannot be saved (the message key), or null. */
export function addressProblem(d: IAddressDraft): TranslationKey | null {
  if (!d.place) return 'customers.address.required'
  if (missingPlaceParts(d.place).length) return 'customers.address.imprecise'
  return null
}

/**
 * The address as the server stores it: everything but the unit and the buzzer
 * from the picked place — the city and the point included — and those two as
 * typed. The first address is the primary one.
 */
export function addressInput(d: IAddressDraft, isFirst: boolean): IAddAddressInput {
  const p = d.place!
  return {
    line1: p.line1.trim(),
    unit: d.unit.trim() || null,
    city: p.city.trim() || null,
    subdivision1Iso: p.state.trim().toUpperCase(),
    zipPostalCode: p.zip.trim(),
    countryIso: p.country.trim().toUpperCase(),
    accessCode: d.accessCode.trim() || null,
    latitude: p.lat,
    longitude: p.lng,
    label: d.label,
    isPrimary: isFirst,
  }
}

/** "Unit 4B" / "Buzzer 12" — the words a one-line address uses. */
export interface IAddressWords {
  unit: (unit: string) => string
  buzzer: (code: string) => string
}

type IAddressFields = Partial<Record<'line1' | 'line2' | 'unit' | 'city' | 'subdivision1Iso' | 'zipPostalCode' | 'countryIso' | 'accessCode', string | null>>

/**
 * "1 Main St, Unit 4B, Montréal QC H2X 1Y4, CA · Buzzer 12" — what a row shows.
 * Without `words` (a maps search, a menu title) the unit is bare and the
 * buzzer left out. `line2` stays for an address written before the city had
 * its own field.
 */
export function addressLine(x: IAddressFields | null | undefined, words: IAddressWords | null = null): string {
  if (!x) return ''
  const v = (s: string | null | undefined) => (s ?? '').trim()
  const unit = v(x.unit)
  const line = [
    v(x.line1),
    unit ? (words ? words.unit(unit) : unit) : '',
    v(x.line2),
    [v(x.city), v(x.subdivision1Iso).replace(/^[A-Z]{2}-/, ''), v(x.zipPostalCode)].filter(Boolean).join(' '),
    v(x.countryIso),
  ].filter(Boolean).join(', ')
  const code = v(x.accessCode)
  return code && words ? `${line} · ${words.buzzer(code)}` : line
}

/** A customer address row on one line (see addressLine). */
export function addressText(a: Pick<ICustomerAddressDTO, 'address'>, words: IAddressWords | null = null): string {
  return a?.address ? addressLine(a.address, words) : ''
}
