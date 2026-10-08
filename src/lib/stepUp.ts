import type { StepUpMethod } from '@fonderie/client'

// Which proof the step-up prompt asks for — the mobile app's StepUp rules
// (docs/parity/1-members.md): the authenticator when there is one, else the
// password (with a code as the way out), else a code by email or SMS.

export type StepUpMode = 'mfa' | 'password' | 'code'

export function stepUpMode(methods: readonly StepUpMethod[], codeSent: boolean): StepUpMode {
  if (methods.includes('mfa')) return 'mfa'
  if (methods.includes('password') && !codeSent) return 'password'
  return 'code'
}

/** Where a code can be sent: email first, else SMS, else nowhere. */
export function stepUpCodeChannel(methods: readonly StepUpMethod[]): 'email' | 'sms' | null {
  if (methods.includes('email')) return 'email'
  if (methods.includes('sms')) return 'sms'
  return null
}
