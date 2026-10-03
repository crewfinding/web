import { FonderieApiError } from '@fonderie/react-auth'
import { toast } from 'sonner'
import { tNow } from '../hooks/useTranslation'

// 'warning' = transient and not the user's or our fault (connectivity) —
// amber icon, retry and it may just work. 'error' = a real rejection or an
// unexpected failure — the standard error icon.
export type ErrorSeverity = 'warning' | 'error'

// What a failed action may show. Server explanations (FonderieApiError) are
// written for users and pass through; every other error message is an
// implementation detail ("TypeError: Failed to fetch") that must not reach
// the screen — browser-level fetch failures read as a connectivity problem,
// the rest get the caller's contextual fallback or the generic copy.
//
// Caveat: the react hooks wrap ANY client-side throw as
// FonderieApiError('unknown', String(err), 0) — status 0 means no HTTP
// response ever arrived, so that explanation is String(err) debris, not a
// server message, and gets the same treatment as a bare error.
export function describeError(
  err: unknown,
  fallback?: string,
): { message: string; severity: ErrorSeverity } {
  if (err instanceof FonderieApiError && err.status !== 0) {
    return {
      message: err.explanation || fallback || tNow('common.errors.unknown'),
      severity: 'error',
    }
  }
  const text = err instanceof FonderieApiError ? err.explanation : err instanceof Error ? String(err) : ''
  if (/TypeError|NetworkError|Load failed/i.test(text)) {
    return { message: tNow('common.errors.network'), severity: 'warning' }
  }
  return { message: fallback ?? tNow('common.errors.unknown'), severity: 'error' }
}

// One-call toast for a failed action; the severity picks the icon.
export function toastError(err: unknown, fallback?: string): void {
  const { message, severity } = describeError(err, fallback)
  if (severity === 'warning') toast.warning(message)
  else toast.error(message)
}
