import { FonderieApiError, type ISubscriptionDTO } from '@fonderie/client'
import { useMemberRoles } from '@fonderie/react-workspaces'
import type { TranslationKey } from '../locales'
import { useAppSession } from './session'
import { useCurrentWorkspace } from './workspace'

// Billing helpers — the same rules as the mobile app's utils/billing.ts, so
// both clients agree on what "live", a plan's name and a refusal mean.

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

// A subscription in one of these is still paying (or in dunning) — billing's
// own "live" set. Incomplete (checkout never paid) and canceled are not.
const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'paused'])

export const isLiveSubscription = (sub: ISubscriptionDTO | null | undefined): sub is ISubscriptionDTO =>
  !!sub && LIVE_STATUSES.has(sub.status)

/** Plan names are ids ("pro"); show them capitalised. */
export const capitalize = (name: string): string => (name ? name.charAt(0).toUpperCase() + name.slice(1) : name)

/** The workspace's plan as a label: the live subscription's, else Free. */
export function planLabel(t: T, sub: ISubscriptionDTO | null | undefined): string {
  return isLiveSubscription(sub) ? capitalize(sub.plan) : t('billing.plan.free.label')
}

/** A billing amount (smallest currency unit, as number or string) in the page's language. */
export function formatMoney(minor: number | string, currency: string, locale: string): string {
  const amount = Number(minor) / 100
  if (!Number.isFinite(amount)) return ''
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`
  }
}

// A checkout or plan change refused for a reason that is a choice to explain,
// not an error to apologise for (billing's plan-change model: upgrades happen
// in place, anything else is cancel → resubscribe).
const BLOCK_KEYS: Record<string, TranslationKey> = {
  PLAN_CHANGE_REQUIRES_CANCEL: 'billing.checkout.plan_change_requires_cancel',
  SUBSCRIPTION_SCHEDULED_TO_CANCEL: 'billing.checkout.scheduled_to_cancel',
  SUBSCRIPTION_PAST_DUE: 'billing.checkout.past_due',
  PLAN_UNCHANGED: 'billing.checkout.plan_unchanged',
  MANAGER_REQUIRED: 'billing.manager-required.text',
  TRIAL_GATE_UNAVAILABLE: 'billing.trial-gate-unavailable.text',
}

/** The sentence to show for a failed billing action, in the page's language when we know the reason. */
export function billingErrorMessage(t: T, err: unknown): string {
  if (err instanceof FonderieApiError) {
    const key = BLOCK_KEYS[err.reason]
    if (key) return t(key)
    if (err.status === 0) return t('common.errors.network')
    if (err.explanation) return err.explanation
  }
  return t('common.errors.unknown')
}

// The roles billing lets manage money besides the owner — the server's
// requireBillingManager default (the seeded ADMIN role).
const MANAGER_ROLES = new Set(['ADMIN'])

/**
 * Whether the signed-in user may manage the selected workspace's billing: a
 * personal workspace's user, the owner, or an ADMIN. The server enforces it
 * (403 MANAGER_REQUIRED); the page uses it only not to offer buttons that
 * would fail — the same rule as the mobile app.
 */
export function useIsWorkspaceManager(): boolean {
  const { user } = useAppSession()
  const { current } = useCurrentWorkspace()
  const owner = !!current && (current.isPersonal || (!!user?.id && user.id === current.ownerId))
  // Signed-in pages only: user is always there. An owner's own roles are a
  // harmless extra read (hooks cannot be called conditionally).
  const { roles } = useMemberRoles(user?.id ?? '')
  if (!current) return false
  if (owner) return true
  return roles.some((r) => MANAGER_ROLES.has(String(r.name).toUpperCase()))
}
