// The places proxy's shapes and the pure conversion to address parts (kept
// apart from the client so the rules can be tested without one).

export interface IPlaceSuggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

export interface IPlaceDetails {
  line1: string
  city: string
  subdivision1Iso: string
  zipPostalCode: string
  countryIso: string
  location: { lat: number; lng: number }
}

/** The address parts a chosen place fills — the shape every address form edits. */
export interface IAddressParts {
  line1: string
  city: string
  /** Province / state code: 'QC', 'NY'. */
  state: string
  zip: string
  /** ISO 3166-1 alpha-2: 'CA', 'US'. */
  country: string
  lat: number | null
  lng: number | null
}

/** The API's tax tables (GET /estimates/tax-presets). */
export interface ITaxPresets {
  country: string | null
  region: string | null
  currency: string
  default: Array<{ code: string; label: string; rate: number }>
  presets: { CA: Record<string, Array<{ code: string; label: string; rate: number }>>; US: Array<{ code: string; label: string; rate: null }> }
}

/** "H2X1Y4" → "H2X 1Y4" (the proxy strips spaces; a Canadian code reads with one). */
const formatZip = (zip: string, country: string): string => {
  const z = zip.replace(/\s/g, '').toUpperCase()
  return country === 'CA' && /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(z) ? `${z.slice(0, 3)} ${z.slice(3)}` : zip.trim()
}

/** The places proxy's details as address parts; (0, 0) means "no coordinates". */
export const partsFromDetails = (d: IPlaceDetails): IAddressParts => {
  const country = (d.countryIso ?? '').toUpperCase()
  const hasPoint = !!d.location && (d.location.lat !== 0 || d.location.lng !== 0)
  return {
    line1: d.line1 ?? '',
    city: d.city ?? '',
    state: (d.subdivision1Iso ?? '').toUpperCase(),
    zip: formatZip(d.zipPostalCode ?? '', country),
    country,
    lat: hasPoint ? d.location.lat : null,
    lng: hasPoint ? d.location.lng : null,
  }
}
