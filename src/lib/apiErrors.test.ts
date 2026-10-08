import { FonderieApiError } from '@fonderie/client'
import { describe, expect, it } from 'vitest'
import { errorMessageKey, planLimitOf } from './apiErrors'
import { stepUpCodeChannel, stepUpMode } from './stepUp'

describe('errorMessageKey (the app getErrorMessage)', () => {
  it('a known reason wins over the server text', () => {
    expect(errorMessageKey(new FonderieApiError('WORKSPACE_ARCHIVED', 'Workspace is archived', 409))).toBe(
      'errors.reason.WORKSPACE_ARCHIVED',
    )
    expect(errorMessageKey(new FonderieApiError('OWNER_REQUIRED', 'x', 403))).toBe('errors.reason.OWNER_REQUIRED')
  })
  it('else the server explanation, else the status', () => {
    expect(errorMessageKey(new FonderieApiError('MANAGER_REQUIRED', 'Managers only', 403))).toEqual({
      explanation: 'Managers only',
    })
    expect(errorMessageKey(new FonderieApiError('X', '', 429))).toBe('errors.status.s429')
    expect(errorMessageKey(new FonderieApiError('X', '', 418))).toBe('errors.unknown')
  })
  it('no answer at all reads as the network', () => {
    expect(errorMessageKey(new FonderieApiError('unknown', 'TypeError: Failed to fetch', 0))).toBe('errors.network')
    expect(errorMessageKey(new TypeError('Failed to fetch'))).toBe('errors.network')
    expect(errorMessageKey(new Error('boom'))).toBe('errors.unknown')
  })
})

describe('planLimitOf', () => {
  it('seats and jobs, with the plan limit', () => {
    expect(planLimitOf(new FonderieApiError('SEAT_LIMIT_REACHED', '', 402, { limit: 5 }))).toEqual({ kind: 'seats', count: 5 })
    expect(planLimitOf(new FonderieApiError('PLAN_LIMIT_REACHED', '', 402, { limit: 20 }))).toEqual({ kind: 'jobs', count: 20 })
    expect(planLimitOf(new FonderieApiError('MANAGER_REQUIRED', '', 403))).toBeNull()
  })
})

describe('step-up proof', () => {
  it('authenticator first, then password, then a code', () => {
    expect(stepUpMode(['password', 'mfa', 'email'], false)).toBe('mfa')
    expect(stepUpMode(['password', 'email'], false)).toBe('password')
    expect(stepUpMode(['password', 'email'], true)).toBe('code')
    expect(stepUpMode(['sms'], false)).toBe('code')
  })
  it('a code goes by email first, else SMS', () => {
    expect(stepUpCodeChannel(['sms', 'email'])).toBe('email')
    expect(stepUpCodeChannel(['password', 'sms'])).toBe('sms')
    expect(stepUpCodeChannel(['password'])).toBeNull()
  })
})
