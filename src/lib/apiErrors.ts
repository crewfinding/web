import { FonderieApiError } from '@fonderie/client'
import type { TranslationKey } from '../locales'

// What a refused request says on the workspace screens — the mobile app's
// getErrorMessage, the same words: a known refusal in the reader's language,
// the server's explanation when it has one, a message by status otherwise
// (docs/parity/1-members.md).

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

const REASON_KEYS: Record<string, TranslationKey> = {
  CUSTOMER_ARCHIVED: 'errors.reason.CUSTOMER_ARCHIVED',
  CUSTOMER_IN_USE: 'errors.reason.CUSTOMER_IN_USE',
  CUSTOMER_NOT_IN_WORKSPACE: 'errors.reason.CUSTOMER_NOT_IN_WORKSPACE',
  MEMBER_NOT_IN_WORKSPACE: 'errors.reason.MEMBER_NOT_IN_WORKSPACE',
  TEMPLATE_NOT_IN_WORKSPACE: 'errors.reason.TEMPLATE_NOT_IN_WORKSPACE',
  JOB_NOT_ASSIGNED: 'errors.reason.JOB_NOT_ASSIGNED',
  JOB_STATUS_CHANGED: 'errors.reason.JOB_STATUS_CHANGED',
  INVALID_STATUS_TRANSITION: 'errors.reason.INVALID_STATUS_TRANSITION',
  // An archived workspace is read-only until its owner restores it.
  WORKSPACE_ARCHIVED: 'errors.reason.WORKSPACE_ARCHIVED',
  WORKSPACE_NOT_ARCHIVED: 'errors.reason.WORKSPACE_NOT_ARCHIVED',
  OWNER_REQUIRED: 'errors.reason.OWNER_REQUIRED',
}

const STATUS_KEYS: Record<number, TranslationKey> = {
  400: 'errors.status.s400',
  401: 'errors.status.s401',
  403: 'errors.status.s403',
  404: 'errors.status.s404',
  409: 'errors.status.s409',
  422: 'errors.status.s422',
  429: 'errors.status.s429',
  500: 'errors.status.s500',
  502: 'errors.status.s502',
  503: 'errors.status.s503',
}

/** The request never got an HTTP answer (the hooks wrap that as status 0). */
export const isNetworkError = (err: unknown): boolean =>
  err instanceof TypeError || (err instanceof FonderieApiError && err.status === 0)

/** The key of the message for a failed request (exported for the tests). */
export function errorMessageKey(err: unknown): TranslationKey | { explanation: string } {
  if (isNetworkError(err)) return 'errors.network'
  if (err instanceof FonderieApiError) {
    const byReason = REASON_KEYS[err.reason]
    if (byReason) return byReason
    if (err.explanation) return { explanation: err.explanation }
    return STATUS_KEYS[err.status] ?? 'errors.unknown'
  }
  return 'errors.unknown'
}

export function errorMessage(t: T, err: unknown): string {
  const key = errorMessageKey(err)
  return typeof key === 'string' ? t(key) : key.explanation
}

const LIMIT_REASONS = new Set(['PLAN_LIMIT_REACHED', 'SEAT_LIMIT_REACHED'])

export interface IPlanLimit {
  kind: 'seats' | 'jobs'
  count: number
}

/** A refusal for being over the plan's limits (seats or open jobs), else null. */
export function planLimitOf(err: unknown): IPlanLimit | null {
  if (!(err instanceof FonderieApiError) || !LIMIT_REASONS.has(err.reason)) return null
  const details = (err.details ?? {}) as { limit?: number }
  return {
    kind: err.reason === 'SEAT_LIMIT_REACHED' ? 'seats' : 'jobs',
    count: typeof details.limit === 'number' ? details.limit : 0,
  }
}
