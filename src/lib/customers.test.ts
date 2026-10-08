import { FonderieApiError } from '@fonderie/client'
import { describe, expect, it } from 'vitest'
import en from '../locales/lang/en'
import fr from '../locales/lang/fr'
import { translate, type TranslationKey } from '../locales'
import {
  EMPTY_IDENTITY,
  addressInput,
  addressLine,
  addressProblem,
  addressText,
  binAction,
  binName,
  canShowMore,
  customerDisplayName,
  customerErrorMessage,
  customerLabelText,
  customerLanguages,
  customerPermissions,
  effectiveLabel,
  emptyListCopy,
  entryProblem,
  identityProblems,
  identityToCreate,
  identityToInput,
  isCustomerInUse,
  labelOptions,
  listParams,
  matchLanguage,
  missingPlaceParts,
  normalizeEntry,
  pickable,
  searchDelay,
  type IAddressDraft,
} from './customers'
import type { IAddressParts } from './placeParts'

// The Customers pages' rules (docs/parity/5-customers.md).

const t = (key: TranslationKey, params?: Record<string, string | number>) => translate(en, key, params)
const tFr = (key: TranslationKey, params?: Record<string, string | number>) => translate(fr, key, params)
const refusal = (reason: string, status: number, explanation = 'server words') => new FonderieApiError(reason, explanation, status)

describe('who may do what with customers', () => {
  const grants = (ops: string[]) => (op: string, resource: string) => resource === 'customers' && ops.includes(op)

  it('a role that may only read: no create, edit, delete, restore — and no purge', () => {
    expect(customerPermissions({ can: grants(['read']), isOwner: false, workspaceArchived: false })).toEqual({
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canRestore: false,
      canPurge: false,
    })
  })
  it('each switch opens its own action; restoring from the bin rides on create', () => {
    const p = customerPermissions({ can: grants(['read', 'create']), isOwner: false, workspaceArchived: false })
    expect(p).toMatchObject({ canCreate: true, canRestore: true, canUpdate: false, canDelete: false })
    expect(customerPermissions({ can: grants(['update']), isOwner: false, workspaceArchived: false }).canUpdate).toBe(true)
    expect(customerPermissions({ can: grants(['delete']), isOwner: false, workspaceArchived: false }).canDelete).toBe(true)
  })
  it('only the owner deletes for good — a manager with every switch cannot empty the bin', () => {
    const all = grants(['read', 'create', 'update', 'delete'])
    expect(customerPermissions({ can: all, isOwner: false, workspaceArchived: false }).canPurge).toBe(false)
    expect(customerPermissions({ can: all, isOwner: true, workspaceArchived: false }).canPurge).toBe(true)
  })
  it('switches for another resource grant nothing here', () => {
    const p = customerPermissions({ can: (_op, resource) => resource === 'jobs', isOwner: false, workspaceArchived: false })
    expect(Object.values(p).filter(Boolean)).toEqual([])
  })
  it('an archived workspace is read-only, even for the owner', () => {
    const p = customerPermissions({ can: () => true, isOwner: true, workspaceArchived: true })
    expect(Object.values(p).some(Boolean)).toBe(false)
  })
})

describe('refusals said in the reader’s words', () => {
  it('the shared table: archived customer, archived workspace, owner only', () => {
    expect(customerErrorMessage(t, refusal('CUSTOMER_ARCHIVED', 422))).toBe(en.errors.reason.CUSTOMER_ARCHIVED)
    expect(customerErrorMessage(t, refusal('WORKSPACE_ARCHIVED', 409))).toBe(en.errors.reason.WORKSPACE_ARCHIVED)
    expect(customerErrorMessage(t, refusal('OWNER_REQUIRED', 403))).toBe(en.errors.reason.OWNER_REQUIRED)
  })
  it('the customers’ own: duplicates and a label still in use', () => {
    expect(customerErrorMessage(t, refusal('DUPLICATE_EMAIL', 409))).toBe('This email is already on this customer.')
    expect(customerErrorMessage(t, refusal('DUPLICATE_REFERENCE_CODE', 409))).toBe('Another customer already has this reference.')
    expect(customerErrorMessage(tFr, refusal('DUPLICATE_PHONE', 409))).toBe('Ce numéro de téléphone figure déjà sur ce client.')
    expect(customerErrorMessage(t, refusal('LABEL_IN_USE', 409))).toMatch(/still in use/)
  })
  it('a restore whose reference was taken names the reference', () => {
    expect(customerErrorMessage(t, refusal('RESTORE_CONFLICT', 409), { referenceCode: 'A-12' })).toBe(
      'Another customer now has the reference #A-12. Change theirs, then restore.',
    )
  })
  it('anything else: the server’s explanation, then a message by status, then the network', () => {
    expect(customerErrorMessage(t, refusal('SOMETHING', 422, 'firstName: too long'))).toBe('firstName: too long')
    expect(customerErrorMessage(t, refusal('SOMETHING', 403, ''))).toBe(en.errors.status.s403)
    expect(customerErrorMessage(t, new TypeError('Failed to fetch'))).toBe(en.errors.network)
  })
  it('delete refused because a job, quote or invoice uses the customer: archive is offered instead', () => {
    expect(isCustomerInUse(refusal('CUSTOMER_IN_USE', 409))).toBe(true)
    expect(isCustomerInUse(refusal('WORKSPACE_ARCHIVED', 409))).toBe(false)
  })
})

describe('the list: the server searches and pages', () => {
  it('asks the server with its own search, the filter and a page size — never filters in memory', () => {
    expect(listParams('  ana ', 'active')).toEqual({ search: 'ana', archived: false, limit: 25 })
    expect(listParams('', 'archived')).toEqual({ archived: true, limit: 25 })
  })
  it('typing waits for a pause; a cleared box applies at once', () => {
    expect(searchDelay('an')).toBe(300)
    expect(searchDelay('   ')).toBe(0)
  })
  it('"Show more" while the server has more and nothing is being read', () => {
    expect(canShowMore({ hasMore: true, isLoading: false, rows: 25 })).toBe(true)
    expect(canShowMore({ hasMore: true, isLoading: true, rows: 25 })).toBe(false)
    expect(canShowMore({ hasMore: false, isLoading: false, rows: 25 })).toBe(false)
    expect(canShowMore({ hasMore: true, isLoading: false, rows: 0 })).toBe(false)
  })
  it('the empty list never tells a read-only member to add one', () => {
    expect(emptyListCopy({ search: '', filter: 'active', canCreate: true }).body).toBe('customers.list.emptyCanCreate')
    expect(emptyListCopy({ search: '', filter: 'active', canCreate: false }).body).toBe('customers.list.emptyReadOnly')
    expect(emptyListCopy({ search: 'zz', filter: 'active', canCreate: true })).toEqual({ title: 'customers.list.noResults', body: 'customers.list.emptySearch' })
    expect(emptyListCopy({ search: '', filter: 'archived', canCreate: true }).title).toBe('customers.list.emptyArchivedTitle')
  })
  it('the picker leaves out the customer itself and archived ones', () => {
    const rows = [
      { id: 'a', archived: { status: false, at: null } },
      { id: 'b', archived: { status: true, at: '2026-01-01' } },
      { id: 'c', archived: { status: false, at: null } },
    ]
    expect(pickable(rows, 'a').map((r) => r.id)).toEqual(['c'])
  })
  it('names: the server’s displayName, else the parts', () => {
    expect(customerDisplayName({ displayName: '王小明', firstName: '小明', lastName: '王', companyName: '', referenceCode: '' })).toBe('王小明')
    expect(customerDisplayName({ firstName: '', lastName: '', companyName: 'Acme', referenceCode: '' })).toBe('Acme')
    expect(customerDisplayName({ firstName: '', lastName: '', companyName: '', referenceCode: '' })).toBe('Unknown')
  })
})

describe('the undo bin', () => {
  const deleted = { referenceCode: 'R-7' }
  it('restored: the bin says so', async () => {
    expect(await binAction(t, deleted, async () => undefined, t('customers.bin.restored', { name: 'Ana' }))).toEqual({ text: '“Ana” restored.', tone: 'info' })
  })
  it('deleted for good: nothing to say', async () => {
    expect(await binAction(t, deleted, async () => undefined, '')).toBeNull()
  })
  it('a reference taken since: the conflict names it — another 409 keeps its own words', async () => {
    const conflict = await binAction(t, deleted, () => Promise.reject(refusal('RESTORE_CONFLICT', 409)), 'done')
    expect(conflict).toEqual({ text: 'Another customer now has the reference #R-7. Change theirs, then restore.', tone: 'error' })
    const archived = await binAction(t, deleted, () => Promise.reject(refusal('WORKSPACE_ARCHIVED', 409)), 'done')
    expect(archived?.text).toBe(en.errors.reason.WORKSPACE_ARCHIVED)
  })
  it('a row is named by company, person, reference, or a dash', () => {
    expect(binName({ companyName: 'Acme', firstName: 'Ana', lastName: 'Li', referenceCode: null })).toBe('Acme')
    expect(binName({ companyName: null, firstName: 'Ana', lastName: 'Li', referenceCode: null })).toBe('Ana Li')
    expect(binName({ companyName: null, firstName: null, lastName: null, referenceCode: '42' })).toBe('#42')
    expect(binName({ companyName: null, firstName: null, lastName: null, referenceCode: null })).toBe('—')
  })
})

describe('addresses: only from the places search', () => {
  const place: IAddressParts = { line1: '1 Main St', city: 'Montréal', state: 'QC', zip: 'H2X 1Y4', country: 'CA', lat: 45.5, lng: -73.6 }
  const draft = (p: IAddressParts | null, unit = '', accessCode = ''): IAddressDraft => ({ place: p, unit, accessCode, label: 'service' })

  it('nothing picked: search and pick', () => expect(addressProblem(draft(null))).toBe('customers.address.required'))
  it('a city or a region is not an address: pick a more precise result', () => {
    expect(missingPlaceParts({ ...place, line1: '' })).toEqual(['line1'])
    expect(missingPlaceParts({ ...place, zip: ' ', state: '' })).toEqual(['state', 'zip'])
    expect(addressProblem(draft({ ...place, line1: '' }))).toBe('customers.address.imprecise')
  })
  it('a full place is saved as the server stores it: city and point from the pick, the typed unit and buzzer, the first one primary', () => {
    expect(addressProblem(draft(place, ' 4B ', ' 1234 '))).toBeNull()
    expect(addressInput(draft(place, ' 4B ', ' 1234 '), true)).toEqual({
      line1: '1 Main St',
      unit: '4B',
      city: 'Montréal',
      subdivision1Iso: 'QC',
      zipPostalCode: 'H2X 1Y4',
      countryIso: 'CA',
      accessCode: '1234',
      latitude: 45.5,
      longitude: -73.6,
      label: 'service',
      isPrimary: true,
    })
    expect(addressInput(draft(place), false)).toMatchObject({ unit: null, accessCode: null, isPrimary: false })
    expect(addressInput(draft(place), false)).not.toHaveProperty('line2')
  })
  it('a row reads street, unit, city province postal code, country, then the buzzer', () => {
    const words = { unit: (u: string) => `Unit ${u}`, buzzer: (c: string) => `Buzzer ${c}` }
    const a = { address: { unit: '4B', line1: '1 Main St', line2: '', city: 'Montréal', zipPostalCode: 'H2X 1Y4', subdivision1Iso: 'QC', subdivision2Iso: '', countryIso: 'CA', accessCode: '1234', latitude: 45.5, longitude: -73.6 } }
    expect(addressText(a, words)).toBe('1 Main St, Unit 4B, Montréal QC H2X 1Y4, CA · Buzzer 1234')
    expect(addressText(a)).toBe('1 Main St, 4B, Montréal QC H2X 1Y4, CA')
    expect(addressLine({ ...a.address, subdivision1Iso: 'CA-QC', unit: '', accessCode: '' }, words)).toBe('1 Main St, Montréal QC H2X 1Y4, CA')
  })
})

describe('contacts, labels and the identity form', () => {
  it('phones are real numbers for their country; emails and tags lower-case', () => {
    expect(entryProblem('phone', '+15145550100', 'CA')).toBeNull()
    expect(entryProblem('phone', '+1555', 'CA')).toBe('customers.validation.phone')
    expect(entryProblem('email', 'ana@', 'CA')).toBe('customers.validation.email')
    expect(entryProblem('note', '', 'CA')).toBe('customers.validation.empty')
    expect(normalizeEntry('tag', '  VIP ')).toBe('vip')
    expect(normalizeEntry('note', '  Hello ')).toBe('Hello')
  })
  it('known labels are translated, a custom one shown as typed; "other" with a word keeps the word', () => {
    expect(customerLabelText(tFr, 'mobile')).toBe('cellulaire')
    expect(customerLabelText(tFr, 'dispatch')).toBe('dispatch')
    expect(effectiveLabel('other', ' dispatch ')).toBe('dispatch')
    expect(effectiveLabel('other', '')).toBe('other')
  })
  it('the label picker: defaults, the workspace’s saved labels (forgettable), "other" last', () => {
    const opts = labelOptions('phone', [
      { id: 'l1', type: 'phone', value: 'dispatch', createdAt: '2026-01-01' },
      { id: 'l2', type: 'email', value: 'billing', createdAt: '2026-01-01' },
    ])
    expect(opts.map((o) => o.value)).toEqual(['mobile', 'office', 'home', 'fax', 'dispatch', 'other'])
    expect(opts.filter((o) => o.saved).map((o) => o.id)).toEqual(['l1'])
  })
  it('a blank first name (individual) or company (business) is refused before any request', () => {
    expect(identityProblems({ ...EMPTY_IDENTITY, firstName: '  ' }, { withContact: true, country: 'CA' })).toEqual({ firstName: 'customers.validation.empty' })
    expect(identityProblems({ ...EMPTY_IDENTITY, type: 'business' }, { withContact: true, country: 'CA' })).toEqual({ companyName: 'customers.validation.empty' })
    expect(identityProblems({ ...EMPTY_IDENTITY, firstName: 'Ana', phone: '+1555' }, { withContact: true, country: 'CA' })).toEqual({ phone: 'customers.validation.phone' })
  })
  it('edit sends blanks as null (clears them); create leaves them out; a business has no person name', () => {
    const v = { ...EMPTY_IDENTITY, type: 'business' as const, firstName: 'Ana', companyName: 'Acme' }
    expect(identityToInput(v)).toEqual({ type: 'business', firstName: null, lastName: null, companyName: 'Acme', referenceCode: null, locale: null, timezone: null })
    expect(identityToCreate({ ...EMPTY_IDENTITY, firstName: 'Ana', timezone: 'America/Toronto' })).toEqual({ type: 'individual', firstName: 'Ana', timezone: 'America/Toronto' })
  })
  it('languages: the business’s, else the app’s seven; a stored "fr" selects "fr-CA"', () => {
    expect(customerLanguages([]).map((l) => l.code)).toEqual(['en', 'fr', 'es', 'zh', 'ru', 'ko', 'ja'])
    const served = customerLanguages(['en-CA', 'fr-CA'])
    expect(served.map((l) => l.code)).toEqual(['en-CA', 'fr-CA'])
    expect(matchLanguage('fr', served)).toBe('fr-CA')
    expect(matchLanguage('de', served)).toBe('')
  })
})
