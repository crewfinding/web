import { describeLocation, type IRequestLocationDTO } from '@fonderie/client'
import { currentLocale } from '../hooks/useLocale'
import { localeTags } from '../locales'

// "Mountain View, CA, United States" — the country localised to the UI language. The API only
// sends a location when it resolves one (Vercel edge headers); country is
// reliable, region/city approximate. Nothing known → null, render nothing.
export function formatLocation(loc: IRequestLocationDTO | null | undefined): string | null {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames([localeTags[currentLocale()]], { type: 'region' })
  } catch {
    names = null
  }
  return describeLocation(loc, (code) => names?.of(code))
}
