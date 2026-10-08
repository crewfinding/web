import { useCallback, useEffect, useRef, useState } from 'react'
import { places, type IPlaceDetails, type IPlaceSuggestion } from '../lib/places'

const DEBOUNCE_MS = 300

/**
 * Debounced address search against the API's places proxy (/places/*) — the
 * mobile app's usePlaceSearch. Searches only from `minLength` characters.
 */
export function usePlaceSearch(query: string, options?: { minLength?: number }) {
  const minLength = options?.minLength ?? 2
  const [suggestions, setSuggestions] = useState<IPlaceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)
  const trimmed = query.trim()
  const active = trimmed.length >= minLength

  useEffect(() => {
    if (!active) {
      requestIdRef.current += 1 // invalidate any in-flight search
      return undefined
    }
    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setIsLoading(true)
      setError(null)
      try {
        const items = await places.autocomplete(trimmed)
        if (requestId === requestIdRef.current) setSuggestions(items)
      } catch (e) {
        if (requestId === requestIdRef.current) {
          setSuggestions([])
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed, active])

  const getDetails = useCallback((placeId: string): Promise<IPlaceDetails> => places.details(placeId), [])
  const clear = useCallback(() => {
    requestIdRef.current += 1
    setSuggestions([])
    setIsLoading(false)
  }, [])

  return {
    suggestions: active ? suggestions : [],
    isLoading: active && isLoading,
    error: active ? error : null,
    getDetails,
    clear,
  }
}
