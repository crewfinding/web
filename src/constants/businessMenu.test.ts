import { describe, expect, it } from 'vitest'
import en from '../locales/lang/en'
import es from '../locales/lang/es'
import fr from '../locales/lang/fr'
import { translate } from '../locales'
import { BUSINESS_GROUPS, BUSINESS_HUB, BUSINESS_OPTIONS, BUSINESS_PATHS, locationPath } from './businessMenu'

// The hub's groups and rows come from businessMenu.ts (docs/ux/BUSINESS-SCREEN.md §1, §6):
// every group card has a title AND a one-line description, in every language.

describe('Business hub menu', () => {
  it('four groups, in the app’s order, with its rows', () => {
    expect(BUSINESS_GROUPS.map((g) => [g.id, g.options.map((o) => o.key)])).toEqual([
      ['business', ['profile', 'legal']],
      ['contact', ['emails', 'phones', 'locations']],
      ['documents', ['taxes', 'numbers']],
      ['preferences', ['regional']],
    ])
  })
  it('the English copy is the app’s, verbatim', () => {
    const t = (k: Parameters<typeof translate>[1]) => translate(en, k)
    expect(BUSINESS_GROUPS.map((g) => [t(g.title), t(g.description)])).toEqual([
      ['Business', 'How your business appears on quotes, invoices and messages.'],
      ['Contact', 'How customers and your team reach you.'],
      ['Taxes & documents', 'The taxes you charge and how your documents are numbered.'],
      ['Preferences', 'Language, time zone and currency for your documents.'],
    ])
    expect(BUSINESS_OPTIONS.map((o) => t(o.label))).toEqual([
      'Business profile',
      'Legal details',
      'Emails',
      'Phone numbers',
      'Locations',
      'Taxes',
      'Document numbers',
      'Regional settings',
    ])
  })
  for (const [name, dict] of [['en', en], ['fr', fr], ['es', es]] as const) {
    it(`${name}: every group has a title and a description, every row a label and a page paragraph`, () => {
      for (const g of BUSINESS_GROUPS) {
        for (const key of [g.title, g.description]) {
          const text = translate(dict, key)
          expect(text, key).not.toBe(key)
          expect(text.trim().length, key).toBeGreaterThan(0)
        }
        for (const o of g.options) for (const key of [o.label, o.paragraph]) expect(translate(dict, key), key).not.toBe(key)
      }
    })
  }
  it('each row opens its own route under the hub; the location form has its own', () => {
    const paths = BUSINESS_OPTIONS.map((o) => o.path)
    expect(new Set(paths).size).toBe(paths.length)
    for (const p of paths) expect(p.startsWith(`${BUSINESS_HUB}/`)).toBe(true)
    expect(BUSINESS_PATHS.locations).toBe('/organization/business/locations')
    expect(locationPath()).toBe('/organization/business/locations/new')
    expect(locationPath('l 1')).toBe('/organization/business/locations/l%201')
  })
})
