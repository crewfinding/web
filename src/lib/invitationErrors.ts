import { FonderieApiError } from '@fonderie/react-workspaces'
import type { TranslationKey } from '../locales'
import type { MessageParams } from '../locales/types'

// Every refusal of POST /workspaces/invitations/accept, keyed by the server's
// reason code, as the join-a-team spec words it (same copy as the mobile
// app). `wrongAccount` offers "Sign out and switch account".
export interface InvitationRefusal {
  message: string
  wrongAccount: boolean
  /** Worth trying again as is: connectivity, rate limit, an unexpected failure. */
  retryable: boolean
}

type T = (key: TranslationKey, params?: MessageParams) => string

export function describeInvitationError(t: T, err: unknown): InvitationRefusal {
  const plain = (key: TranslationKey, params?: MessageParams, retryable = false) => ({
    message: t(key, params),
    wrongAccount: false,
    retryable,
  })
  // status 0 = no HTTP response (offline, CORS, a client-side throw)
  if (!(err instanceof FonderieApiError) || err.status === 0) return plain('invite.errors.network', undefined, true)
  switch (err.reason) {
    case 'INVITATION_EMAIL_MISMATCH': {
      // The server sends the invited address masked (a***@acme.example)
      const email = (err.details as { email?: unknown } | undefined)?.email
      return {
        message: t('invite.errors.wrongEmail', {
          email: typeof email === 'string' && email ? email : t('invite.errors.emailFallback'),
        }),
        wrongAccount: true,
        retryable: false,
      }
    }
    case 'INVITATION_EXPIRED':
      // The accept route names no inviter; the spec's fallback wording
      return plain('invite.errors.expired', { inviter: t('invite.errors.inviterFallback') })
    case 'INVITATION_ALREADY_USED':
      return plain('invite.errors.alreadyUsed')
    case 'INVITATION_REVOKED':
      return plain('invite.errors.revoked')
    case 'INVITATION_ROLE_UNAVAILABLE':
      return plain('invite.errors.roleGone')
    case 'INVITATION_NOT_FOUND':
      return plain('invite.errors.notFound')
    case 'RATE_LIMITED':
      return plain('invite.errors.rateLimited', undefined, true)
  }
  if (err.status === 429) return plain('invite.errors.rateLimited', undefined, true)
  return plain('invite.errors.network', undefined, true)
}
