import { FonderieApiError } from '@fonderie/client'
import type { IWorkspaceDTO, IWorkspaceLocationDTO } from '@fonderie/client'
import { describe, expect, it } from 'vitest'
import {
  addressOneLine,
  draftOf,
  formatReference,
  legacyAddress,
  legacyEmail,
  legacyPhone,
  locationProblems,
  missingAddressParts,
  normalizeWebsite,
  prefixInput,
  prefixValues,
  previewOf,
  legalErrorField,
  legalInput,
  legalValues,
  profileErrorField,
  profileInput,
  profileValues,
  ratesCustomized,
  reasonKey,
  regionTaxes,
  taxRegions,
  usualRate,
  regionalInput,
  regionalValues,
  serverRefusal,
  sortLocations,
  taxErrorField,
  taxHome,
  taxInput,
  taxValues,
  toLocationUpdate,
} from './business'
import { isValidPhone, normalizePhone, toE164 } from './phone'
import { partsFromDetails } from './placeParts'
import { regionTimeZone } from './timeZones'

// The Business pages' rules (docs/ux/BUSINESS-SCREEN.md of the mobile app) — the same cases as the
// mobile app's business-screen-rules test where they are pure.

const GST = { code: 'GST', label: 'GST', rate: 0.05 }
const PRESETS = {
  country: 'CA',
  region: 'QC',
  currency: 'CAD',
  default: [],
  presets: {
    CA: {
      QC: [GST, { code: 'QST', label: 'QST', rate: 0.09975 }],
      ON: [{ code: 'HST', label: 'HST', rate: 0.13 }],
      NS: [{ code: 'HST', label: 'HST', rate: 0.14 }],
      BC: [GST, { code: 'PST', label: 'PST', rate: 0.07 }],
      MB: [GST, { code: 'RST', label: 'RST', rate: 0.07 }],
      AB: [GST],
    },
    US: [{ code: 'SALES_TAX', label: 'Sales tax', rate: null }],
  },
}
const GST_REG = { country: 'CA', type: 'GST_HST', number: '123456789RT0001', region: null, label: null, rate: null }
const BN = { country: 'CA', type: 'BN', number: '123456789', region: null, label: null, rate: null }

const ws = (patch: Partial<IWorkspaceDTO> = {}): IWorkspaceDTO =>
  ({
    id: 'ws-a',
    name: 'Acme',
    motto: '',
    industry: 'moving',
    legalName: '',
    businessType: '',
    phone: '',
    email: '',
    website: '',
    address: { line1: '', line2: '', city: '', state: '', zip: '', country: '' },
    taxRegistrations: [],
    languages: [],
    ...patch,
  }) as unknown as IWorkspaceDTO

const loc = (patch: Partial<IWorkspaceLocationDTO> = {}): IWorkspaceLocationDTO =>
  ({
    id: 'l1',
    name: 'Head office',
    isHeadOffice: true,
    isArchived: false,
    phone: '',
    email: '',
    taxRegion: 'CA-QC',
    latitude: null,
    longitude: null,
    address: { line1: '500 Rue Sherbrooke O', line2: '4', city: 'Montréal', state: 'QC', zip: 'H3A 3G4', country: 'CA', accessCode: '12' },
    ...patch,
  }) as unknown as IWorkspaceLocationDTO

const rowsFor = (province: string, country: 'CA' | 'US' = 'CA', regs: unknown[] = []) =>
  taxValues(ws({ taxRegistrations: regs as never }), { country, province }, regionTaxes(PRESETS as never, { country, province })).rows

// Each page saves ONLY its own fields (docs/ux/BUSINESS-SCREEN.md §3).
describe('Business profile page', () => {
  it('sends { name, motto, industry, website } only — blanks as null, a website without scheme gets https://', () => {
    const w = ws({ taxRegistrations: [GST_REG, BN] as never, legalName: 'Acme Inc.', businessType: 'INC' })
    const initial = profileValues(w)
    const out = profileInput({ ...initial, name: ' Acme Moving ', motto: '  ', website: 'acme.ca' })
    expect(out).toEqual({ name: 'Acme Moving', motto: null, industry: 'moving', website: 'https://acme.ca' })
    expect(Object.keys(out).sort()).toEqual(['industry', 'motto', 'name', 'website'])
  })
  it('a 422 lands on its own field, anything else above the form', () => {
    expect(profileErrorField('website')).toBe('website')
    expect(profileErrorField('legalName')).toBeNull()
    expect(profileErrorField(null)).toBeNull()
  })
})

describe('Legal details page', () => {
  it('sends { legalName, businessType } only while the number is unchanged', () => {
    const w = ws({ taxRegistrations: [GST_REG, BN] as never })
    const initial = legalValues(w, 'CA')
    expect(initial.businessNumber).toBe('123456789')
    expect(legalInput({ ...initial, legalName: 'Acme Inc.' }, initial, w, 'CA')).toEqual({ legalName: 'Acme Inc.', businessType: null })
  })
  it('a changed number rebuilds taxRegistrations from the SERVER list, swapping only the BN', () => {
    const w = ws({ taxRegistrations: [GST_REG, BN] as never })
    const initial = legalValues(w, 'CA')
    const out = legalInput({ ...initial, businessNumber: '987654321' }, initial, w, 'CA')
    expect(Object.keys(out).sort()).toEqual(['businessType', 'legalName', 'taxRegistrations'])
    expect(out.taxRegistrations).toEqual([
      { country: 'CA', type: 'GST_HST', number: '123456789RT0001', region: null, label: null, rate: null },
      { country: 'CA', type: 'BN', number: '987654321', region: null, label: null, rate: null },
    ])
  })
  it('a US business number is the EIN', () => {
    const w = ws()
    const initial = legalValues(w, 'US')
    expect(legalInput({ ...initial, businessNumber: '12-3456789' }, initial, w, 'US').taxRegistrations).toEqual([
      { country: 'US', type: 'EIN', number: '12-3456789', region: null, label: null, rate: null },
    ])
  })
  it('a 422 on a registration lands on the number', () => {
    expect(legalErrorField('taxRegistrations.1.number')).toBe('businessNumber')
    expect(legalErrorField('businessType')).toBe('businessType')
    expect(legalErrorField('name')).toBeNull()
  })
  it('a 422 is split into its field path', () => {
    expect(serverRefusal(new FonderieApiError('VALIDATION', 'legalName: too long', 422))).toEqual({ path: 'legalName', message: 'too long' })
    expect(serverRefusal(new FonderieApiError('X', 'nope', 409))).toBeNull()
  })
})

describe('Contact', () => {
  it('website gets https://', () => {
    expect(normalizeWebsite('acme.ca')).toBe('https://acme.ca')
    expect(normalizeWebsite('http://acme.ca')).toBe('http://acme.ca')
    expect(normalizeWebsite('  ')).toBeNull()
  })
  it('legacy values only when the list does not carry them', () => {
    expect(legacyPhone(ws({ phone: '(514) 555-0100' }), [], 'CA')).toBe('(514) 555-0100')
    expect(legacyPhone(ws({ phone: '(514) 555-0100' }), [{ phone: '+15145550100' }], 'CA')).toBeNull()
    expect(legacyEmail(ws({ email: 'Hi@Acme.ca' }), [{ email: 'hi@acme.ca' }])).toBeNull()
    expect(legacyEmail(ws({ email: 'hi@acme.ca' }), [])).toBe('hi@acme.ca')
  })
  it('known refusals read in words', () => {
    expect(reasonKey(new FonderieApiError('PRIMARY_REQUIRED', '', 409))).toBe('business.reason.PRIMARY_REQUIRED')
    expect(reasonKey(new FonderieApiError('WORKSPACE_LOCATION_ARCHIVED', '', 409))).toBe('business.reason.LOCATION_ARCHIVED')
    expect(reasonKey(new FonderieApiError('OTHER', '', 409))).toBeNull()
  })
  it('phones are stored E.164 and validated with libphonenumber', () => {
    expect(toE164('(514) 555-0100', 'CA')).toBe('+15145550100')
    expect(isValidPhone('514555', 'CA')).toBe(false)
    expect(normalizePhone('5145550100', 'CA')).toBe('+15145550100')
  })
})

describe('Locations', () => {
  it('one line with unit and buzzer; head office first, archived last', () => {
    const words = { unit: (u: string) => `Unit ${u}`, buzzer: (c: string) => `Buzzer ${c}` }
    expect(addressOneLine(loc().address, words)).toBe('500 Rue Sherbrooke O, Unit 4, Montréal QC H3A 3G4, CA · Buzzer 12')
    const sorted = sortLocations([loc({ id: 'a', isHeadOffice: false, isArchived: true }), loc({ id: 'b', isHeadOffice: false }), loc({ id: 'c' })])
    expect(sorted.map((l) => l.id)).toEqual(['c', 'b', 'a'])
  })
  it('a place must be a street address', () => {
    const parts = partsFromDetails({ line1: '', city: 'Montréal', subdivision1Iso: 'qc', zipPostalCode: '', countryIso: 'ca', location: { lat: 0, lng: 0 } })
    expect(parts).toMatchObject({ state: 'QC', country: 'CA', lat: null, lng: null })
    expect(missingAddressParts(parts)).toEqual(['line1', 'zip'])
    expect(partsFromDetails({ line1: '1 A', city: 'B', subdivision1Iso: 'QC', zipPostalCode: 'H2X1Y4', countryIso: 'CA', location: { lat: 1, lng: 2 } }).zip).toBe('H2X 1Y4')
  })
  it('no address picked, a bad email or phone are refused', () => {
    expect(locationProblems(draftOf(), 'CA')).toEqual({ name: 'business.empty', address: 'business.locations.pick' })
    expect(locationProblems({ ...draftOf(loc()), email: 'x', phone: '12' }, 'CA')).toEqual({
      email: 'business.contact.emailError',
      phone: 'business.contact.phoneError',
    })
  })
  it('an edit re-sends the address only when it changed', () => {
    const start = draftOf(loc())
    expect(toLocationUpdate({ ...start, name: 'HQ' }, start)).toEqual({ name: 'HQ', phone: null, email: null })
    expect(toLocationUpdate({ ...start, line2: '5' }, start).address).toMatchObject({ line2: '5', country: 'CA' })
  })
  it('the legacy address is offered only without a head office', () => {
    const w = ws({ address: { line1: '1 Main', line2: '', city: 'Laval', state: 'QC', zip: '', country: 'CA' } as never })
    expect(legacyAddress(w, [])).not.toBeNull()
    expect(legacyAddress(w, [loc()])).toBeNull()
  })
})

describe('Taxes follow the head office', () => {
  it('per province and the US', () => {
    const brief = (rows: ReturnType<typeof rowsFor>) => rows.map((r) => `${r.code} ${r.rate}`)
    expect(brief(rowsFor('QC'))).toEqual(['GST 5', 'QST 9.975'])
    expect(brief(rowsFor('ON'))).toEqual(['HST 13'])
    expect(brief(rowsFor('BC'))).toEqual(['GST 5', 'PST 7'])
    expect(brief(rowsFor('MB'))).toEqual(['GST 5', 'RST 7'])
    expect(brief(rowsFor('NY', 'US'))).toEqual(['SALES_TAX '])
    expect(taxHome([loc()])).toEqual({ country: 'CA', province: 'QC' })
    expect(taxHome([])).toBeNull()
  })
  it('usual rates are not stored; one changed rate stores every rate; BN carried over', () => {
    const rows = rowsFor('QC', 'CA', [GST_REG])
    expect(ratesCustomized(rows)).toBe(false)
    expect(taxInput(rows, ws({ taxRegistrations: [GST_REG, BN] as never })).input.taxRegistrations).toEqual([
      { country: 'CA', type: 'GST_HST', number: '123456789RT0001', rate: null, region: null, label: null },
      { country: 'CA', type: 'BN', number: '123456789', region: null, label: null, rate: null },
    ])
    const custom = rows.map((r) => (r.code === 'QST' ? { ...r, rate: '10' } : r))
    expect(ratesCustomized(custom)).toBe(true)
    expect(taxInput(custom, ws()).input.taxRegistrations).toEqual([
      { country: 'CA', type: 'GST_HST', number: '123456789RT0001', rate: 5, region: null, label: null },
      { country: 'CA', type: 'QST', number: null, rate: 10, region: null, label: null },
    ])
  })
  it('the Taxes page sends { taxRegistrations } only', () => {
    expect(Object.keys(taxInput(rowsFor('QC', 'CA', [GST_REG]), ws()).input)).toEqual(['taxRegistrations'])
  })
  it('a 422 lands on the row it came from', () => {
    const built = taxInput(rowsFor('QC', 'CA', [GST_REG]), ws({ taxRegistrations: [GST_REG, BN] as never }))
    expect(taxErrorField('taxRegistrations.0.number', built.sources)).toBe('derived-GST.number')
    expect(taxErrorField('taxRegistrations.1', built.sources)).toBeNull()
  })
})

describe('Document numbers', () => {
  it('the API formats: prefix before INV / EST, replaces JOB', () => {
    expect(previewOf({ invoice: '', estimate: '', job: '' })).toEqual({ invoice: 'INV-0001', estimate: 'EST-0001', job: 'JOB-0042' })
    expect(previewOf({ invoice: 'ACME', estimate: 'ACME', job: 'ACME' })).toEqual({
      invoice: 'ACME-INV-0001',
      estimate: 'ACME-EST-0001',
      job: 'ACME-0042',
    })
    expect(formatReference('job', 7, 'job')).toBe('JOB-0007')
  })
  it('one prefix saved for all three kinds, other kinds kept; differing ones open customised', () => {
    const settings = { documentPrefixes: { receipt: 'R' } } as never
    expect(prefixInput({ ...prefixValues(settings), single: 'acme' }, settings)).toEqual({
      documentPrefixes: { receipt: 'R', invoice: 'ACME', estimate: 'ACME', job: 'ACME' },
    })
    expect(prefixValues({ documentPrefixes: { invoice: 'A', estimate: 'B', job: 'A' } } as never).customized).toBe(true)
    expect(Object.keys(prefixInput(prefixValues(settings), settings))).toEqual(['documentPrefixes'])
  })
})

describe('Regional settings', () => {
  const settings = { locale: 'fr-CA', timezone: 'UTC', currency: 'cad' } as never
  it('reads the base language, an unset zone, the currency', () => {
    expect(regionalValues(ws({ languages: ['en-CA', 'fr-CA', 'fr'] }), settings)).toEqual({
      locale: 'fr',
      timezone: '',
      currency: 'CAD',
      languages: ['en', 'fr'],
    })
  })
  it('writes only what changed; stored tags kept; the document language keeps the country', () => {
    const w = ws({ languages: ['fr-CA'] })
    const initial = regionalValues(w, settings)
    expect(regionalInput({ ...initial, currency: 'USD' }, initial, w, 'CA')).toEqual({ settings: { currency: 'USD' }, workspace: null })
    expect(regionalInput({ ...initial, languages: ['fr', 'es'] }, initial, w, 'CA')).toEqual({
      settings: null,
      workspace: { languages: ['fr-CA', 'es-CA'] },
    })
    expect(regionalInput({ ...initial, locale: 'en', timezone: 'America/Toronto' }, initial, w, 'US').settings).toEqual({
      locale: 'en-US',
      timezone: 'America/Toronto',
    })
  })
  it('the head office suggests its zone', () => {
    expect(regionTimeZone('CA', 'BC')).toBe('America/Vancouver')
    expect(regionTimeZone('CA', 'CA-QC')).toBe('America/Toronto')
    expect(regionTimeZone('FR', 'X')).toBeNull()
  })
})

describe('Taxes: a province / state only where the tax has one', () => {
  const WITH_STATES = { ...PRESETS, presets: { ...PRESETS.presets, US_STATES: { TX: [{ code: 'SALES_TAX', label: 'Sales tax', rate: 0.0625 }], OR: [] } } }

  it('the server’s rules: PST in BC / MB / SK, a state permit in any state; GST/HST and QST none', () => {
    expect(taxRegions('CA', 'PST')).toEqual(['BC', 'MB', 'SK'])
    expect(taxRegions('CA', 'GST_HST')).toEqual([])
    expect(taxRegions('CA', 'QST')).toEqual([])
    expect(taxRegions('US', 'STATE_SALES_TAX')).toHaveLength(56)
    expect(usualRate(PRESETS as never, 'CA', 'PST', 'MB')).toBe('7')
    expect(usualRate(WITH_STATES as never, 'US', 'STATE_SALES_TAX', 'TX')).toBe('6.25')
    expect(usualRate(PRESETS as never, 'US', 'STATE_SALES_TAX', 'TX')).toBeNull()
  })

  it('a US head office starts at its state’s base rate (none in a state without one); an older API leaves it to the owner', () => {
    const rows = (presets: unknown, state: string) => regionTaxes(presets as never, { country: 'US', province: state })
    expect(rows(WITH_STATES, 'TX')).toEqual([{ code: 'SALES_TAX', label: 'Sales tax', rate: '6.25' }])
    expect(rows(WITH_STATES, 'OR')).toEqual([])
    expect(rows(PRESETS, 'TX')).toEqual([{ code: 'SALES_TAX', label: 'Sales tax', rate: null }])
  })
})
