import { fonderie } from './fonderie'
import type { IPlaceDetails, IPlaceSuggestion, ITaxPresets } from './placeParts'

export { partsFromDetails } from './placeParts'
export type { IAddressParts, IPlaceDetails, IPlaceSuggestion, ITaxPresets } from './placeParts'

// Google Places, proxied through the API (/places/*) — the Google key lives
// server-side only, as for the mobile app (api/places.ts there).

export const places = {
  autocomplete: (input: string): Promise<IPlaceSuggestion[]> =>
    fonderie
      .post<{ suggestions: IPlaceSuggestion[] }>('/places/autocomplete', { input })
      .then((r) => r.result.suggestions ?? []),
  // Place details are immutable for practical purposes — cache 5 minutes.
  details: (placeId: string): Promise<IPlaceDetails> =>
    fonderie.get<IPlaceDetails>(`/places/${encodeURIComponent(placeId)}`, { cache: 300_000 }).then((r) => r.result),
  taxPresets: (): Promise<ITaxPresets> =>
    fonderie.get<ITaxPresets>('/estimates/tax-presets', { cache: 300_000 }).then((r) => r.result),
}
