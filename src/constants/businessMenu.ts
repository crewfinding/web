import type { TranslationKey } from '../locales'

// The Business menu (the mobile app's constants/businessMenu.ts and
// docs/ux/BUSINESS-SCREEN.md): a hub of groups — each a card with a title
// and a one-line description — whose rows open one page each, with one
// focused form (or one list) and its own Save. Free of React so tests can
// read it; the hub maps each icon name onto its glyph.

export const BUSINESS_HUB = '/organization/business'

export const BUSINESS_PATHS = {
  profile: `${BUSINESS_HUB}/profile`,
  legal: `${BUSINESS_HUB}/legal`,
  emails: `${BUSINESS_HUB}/emails`,
  phones: `${BUSINESS_HUB}/phones`,
  locations: `${BUSINESS_HUB}/locations`,
  taxes: `${BUSINESS_HUB}/taxes`,
  numbers: `${BUSINESS_HUB}/numbers`,
  regional: `${BUSINESS_HUB}/regional`,
} as const

export type BusinessSection = keyof typeof BUSINESS_PATHS

/** Not a menu entry: the add / edit form a location row or "+" opens. */
export const locationPath = (id?: string): string =>
  id ? `${BUSINESS_PATHS.locations}/${encodeURIComponent(id)}` : `${BUSINESS_PATHS.locations}/new`

/** The app's icon per row (domain, report, mail, call, location_on, credit_card, inventory, translate). */
export type BusinessIcon = 'domain' | 'report' | 'mail' | 'call' | 'location' | 'card' | 'inventory' | 'translate'

export interface IBusinessOption {
  key: BusinessSection
  path: string
  icon: BusinessIcon
  /** The row's label, which is also its page's heading. */
  label: TranslationKey
  /** The page's one-line paragraph. */
  paragraph: TranslationKey
}

export interface IBusinessGroup {
  id: 'business' | 'contact' | 'documents' | 'preferences'
  title: TranslationKey
  description: TranslationKey
  options: IBusinessOption[]
}

const option = (key: BusinessSection, icon: BusinessIcon): IBusinessOption => ({
  key,
  path: BUSINESS_PATHS[key],
  icon,
  label: `business.option.${key}` as TranslationKey,
  paragraph: `business.paragraph.${key}` as TranslationKey,
})

const group = (id: IBusinessGroup['id'], options: IBusinessOption[]): IBusinessGroup => ({
  id,
  title: `business.group.${id}.title` as TranslationKey,
  description: `business.group.${id}.description` as TranslationKey,
  options,
})

export const BUSINESS_GROUPS: IBusinessGroup[] = [
  group('business', [option('profile', 'domain'), option('legal', 'report')]),
  group('contact', [option('emails', 'mail'), option('phones', 'call'), option('locations', 'location')]),
  group('documents', [option('taxes', 'card'), option('numbers', 'inventory')]),
  group('preferences', [option('regional', 'translate')]),
]

export const BUSINESS_OPTIONS: IBusinessOption[] = BUSINESS_GROUPS.flatMap((g) => g.options)

export const businessOption = (key: BusinessSection): IBusinessOption => BUSINESS_OPTIONS.find((o) => o.key === key)!
