import { FonderieApiError } from '@fonderie/react-auth'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toastError } from './errors'

// Routes a FonderieApiError onto the form field it belongs to; anything
// unmapped falls back to a toast so no rejection is ever silent.
// fieldMap keys are error reasons (USER_ALREADY_EXISTS) and, for
// INVALID_PARAMETER, the server-side parameter names ("password: too short").
export function applyAuthError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Partial<Record<string, Path<T>>>,
  fallbackMessage: string,
) {
  if (err instanceof FonderieApiError) {
    const byReason = fieldMap[err.reason]
    if (byReason) {
      setError(byReason, { type: 'server', message: err.explanation })
      return
    }
    if (err.reason === 'INVALID_PARAMETER') {
      const idx = err.explanation.indexOf(':')
      if (idx > 0) {
        const param = err.explanation.slice(0, idx).trim()
        const message = err.explanation.slice(idx + 1).trim()
        const byParam = fieldMap[param]
        if (byParam) {
          setError(byParam, {
            type: 'server',
            message: message.charAt(0).toUpperCase() + message.slice(1),
          })
          return
        }
      }
    }
    toastError(err, fallbackMessage)
    return
  }
  toastError(err, fallbackMessage)
}
