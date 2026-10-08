import { useCallback } from 'react'
import { formatDate } from '../lib/dateFormat'
import { useAppSession } from '../lib/session'

/** A date in the signed-in person's date-format preference (Settings → Date & time). */
export function useDatePreference(): (input: string | number | Date) => string {
  const { user } = useAppSession()
  const fmt = user?.preferences?.dateFormat
  return useCallback((input) => formatDate(input, fmt), [fmt])
}
