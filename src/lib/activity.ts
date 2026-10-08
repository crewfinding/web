import type { IAuditEventDTO } from '@fonderie/client'
import type { TranslationKey } from '../locales'
import type { MessageParams } from '../locales/types'

// The activity log's rules (the mobile app's utils/activity.ts), pure so a
// test can pin them: the sentence each event type reads as, the page it
// opens, and how rows group by day. The feed is the API's audit trail
// (GET /audit) — ids, numbers and statuses only, never names or amounts, so
// names come from the team list.

type TFn = (key: TranslationKey, params?: MessageParams) => string

// ── What ──────────────────────────────────────────────────────────────────────

/**
 * Every event type the log knows, to the key of its sentence. A sentence may
 * use {number} (the document's number), {status} (the new status, in the
 * reader's language), {name} (the member the change was about) and {names}
 * (the people put on a job). Anything else reads "Something changed".
 */
export const ACTIVITY_SENTENCES: Record<string, TranslationKey> = {
  // Jobs (api: domain/jobs/jobs.events.ts)
  'crewfinding.job.created': 'org.activity.event.job.created',
  'crewfinding.job.updated': 'org.activity.event.job.updated',
  'crewfinding.job.status_changed': 'org.activity.event.job.statusChanged',
  'crewfinding.job.deleted': 'org.activity.event.job.deleted',
  'crewfinding.job.assigned': 'org.activity.event.job.assigned',
  // Quotes (api: emitDocEvent)
  'crewfinding.estimate.created': 'org.activity.event.estimate.created',
  'crewfinding.estimate.updated': 'org.activity.event.estimate.updated',
  'crewfinding.estimate.revised': 'org.activity.event.estimate.revised',
  'crewfinding.estimate.status_changed': 'org.activity.event.estimate.statusChanged',
  'crewfinding.estimate.sent': 'org.activity.event.estimate.sent',
  'crewfinding.estimate.accepted': 'org.activity.event.estimate.accepted',
  'crewfinding.estimate.declined': 'org.activity.event.estimate.declined',
  'crewfinding.estimate.links_revoked': 'org.activity.event.estimate.linksRevoked',
  // Invoices
  'crewfinding.invoice.created': 'org.activity.event.invoice.created',
  'crewfinding.invoice.updated': 'org.activity.event.invoice.updated',
  'crewfinding.invoice.status_changed': 'org.activity.event.invoice.statusChanged',
  'crewfinding.invoice.sent': 'org.activity.event.invoice.sent',
  'crewfinding.invoice.links_revoked': 'org.activity.event.invoice.linksRevoked',
  // Bills of lading
  'crewfinding.bol.created': 'org.activity.event.bol.created',
  'crewfinding.bol.updated': 'org.activity.event.bol.updated',
  'crewfinding.bol.signed': 'org.activity.event.bol.signed',
  'crewfinding.bol.status_changed': 'org.activity.event.bol.voided',
  'crewfinding.bol.sent': 'org.activity.event.bol.sent',
  // The workspace trail (@fonderie/workspaces EVENT_KEYS)
  'fonderie.workspace.created': 'org.activity.event.workspace.created',
  'fonderie.workspace.personal.created': 'org.activity.event.workspace.created',
  'fonderie.workspace.updated': 'org.activity.event.workspace.updated',
  'fonderie.workspace.archived': 'org.activity.event.workspace.archived',
  'fonderie.workspace.restored': 'org.activity.event.workspace.restored',
  'fonderie.workspace.settings.updated': 'org.activity.event.workspace.settingsUpdated',
  'fonderie.workspace.member.removed': 'org.activity.event.member.removed',
  'fonderie.workspace.member.left': 'org.activity.event.member.left',
  'fonderie.workspace.member.role.added': 'org.activity.event.member.roleAdded',
  'fonderie.workspace.member.role.removed': 'org.activity.event.member.roleRemoved',
  'fonderie.workspace.manager.set': 'org.activity.event.manager.set',
  'fonderie.workspace.manager.unset': 'org.activity.event.manager.unset',
  'fonderie.workspace.manager.paused': 'org.activity.event.manager.paused',
  'fonderie.workspace.manager.released': 'org.activity.event.manager.released',
  'fonderie.workspace.ownership.offered': 'org.activity.event.ownership.offered',
  'fonderie.workspace.ownership.transferred': 'org.activity.event.ownership.transferred',
  'fonderie.workspace.ownership.declined': 'org.activity.event.ownership.declined',
  'fonderie.workspace.ownership.withdrawn': 'org.activity.event.ownership.withdrawn',
  'fonderie.workspace.invitation.created': 'org.activity.event.invitation.created',
  'fonderie.workspace.invitation.cancelled': 'org.activity.event.invitation.cancelled',
  'fonderie.workspace.invitation.resent': 'org.activity.event.invitation.resent',
  'fonderie.workspace.invitation.accepted': 'org.activity.event.invitation.accepted',
  'fonderie.workspace.role.created': 'org.activity.event.role.created',
  'fonderie.workspace.role.updated': 'org.activity.event.role.updated',
  'fonderie.workspace.role.deleted': 'org.activity.event.role.deleted',
  'fonderie.workspace.role.restored': 'org.activity.event.role.restored',
  'fonderie.workspace.role.bin.purged': 'org.activity.event.role.binPurged',
  'fonderie.workspace.role.permissions.set': 'org.activity.event.role.permissionsSet',
  'fonderie.workspace.email.added': 'org.activity.event.email.added',
  'fonderie.workspace.email.updated': 'org.activity.event.email.updated',
  'fonderie.workspace.email.removed': 'org.activity.event.email.removed',
  'fonderie.workspace.phone.added': 'org.activity.event.phone.added',
  'fonderie.workspace.phone.updated': 'org.activity.event.phone.updated',
  'fonderie.workspace.phone.removed': 'org.activity.event.phone.removed',
  'fonderie.workspace.location.created': 'org.activity.event.location.created',
  'fonderie.workspace.location.updated': 'org.activity.event.location.updated',
  'fonderie.workspace.location.archived': 'org.activity.event.location.archived',
  'fonderie.workspace.location.restored': 'org.activity.event.location.restored',
  // Customers (@fonderie/customers)
  'fonderie.customer.created': 'org.activity.event.customer.created',
  'fonderie.customer.updated': 'org.activity.event.customer.updated',
  'fonderie.customer.deleted': 'org.activity.event.customer.deleted',
  'fonderie.customer.blacklisted': 'org.activity.event.customer.blacklisted',
  'fonderie.customer.unblacklisted': 'org.activity.event.customer.unblacklisted',
  // Webhooks (@fonderie/webhooks)
  'fonderie.webhook.endpoint.created': 'org.activity.event.webhook.created',
  'fonderie.webhook.endpoint.updated': 'org.activity.event.webhook.updated',
  'fonderie.webhook.endpoint.deleted': 'org.activity.event.webhook.deleted',
  'fonderie.webhook.endpoint.restored': 'org.activity.event.webhook.restored',
  // The plan (@fonderie/billing)
  'fonderie.billing.subscription.created': 'org.activity.event.plan.started',
  'fonderie.billing.subscription.updated': 'org.activity.event.plan.changed',
  'fonderie.billing.subscription.canceled': 'org.activity.event.plan.ended',
  'fonderie.billing.subscription.cancel_requested': 'org.activity.event.plan.cancelRequested',
  'fonderie.billing.subscription.past_due': 'org.activity.event.plan.pastDue',
  'fonderie.billing.subscription.trial_will_end': 'org.activity.event.plan.trialEnding',
  'fonderie.billing.invoice.paid': 'org.activity.event.plan.invoicePaid',
  'fonderie.billing.invoice.payment_failed': 'org.activity.event.plan.paymentFailed',
  'fonderie.billing.payment.failed': 'org.activity.event.plan.paymentFailed',
  'fonderie.billing.payment.refunded': 'org.activity.event.plan.refunded',
}

export const UNKNOWN_SENTENCE: TranslationKey = 'org.activity.event.unknown'

export type ActivityTargetKind = 'job' | 'estimate' | 'invoice' | 'bol' | 'customer'

export interface IActivityTarget {
  kind: ActivityTargetKind
  params: Record<string, string>
}

/** "Open the job" / "Open the quote" / … */
export const OPEN_KEYS: Record<ActivityTargetKind, TranslationKey> = {
  job: 'org.activity.open.job',
  estimate: 'org.activity.open.estimate',
  invoice: 'org.activity.open.invoice',
  bol: 'org.activity.open.bol',
  customer: 'org.activity.open.customer',
}

/**
 * The web page each kind opens. The web app has no job, quote, invoice, bill
 * of lading or customer page yet, so none links: a kind gains its route here
 * when its page ships (e.g. customer: (p) => `/customers/${p.customerId}`).
 */
export const ACTIVITY_ROUTES: Partial<Record<ActivityTargetKind, (params: Record<string, string>) => string>> = {}

export interface IActivityLine {
  /** The sentence, in the reader's language. */
  text: string
  /** True when the type is not one the log knows: the row also shows the raw type. */
  unknown: boolean
  target: IActivityTarget | null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : typeof v === 'number' ? String(v) : null)

/** What an event was about — none once the thing is deleted. */
export function activityTarget(event: Pick<IAuditEventDTO, 'type' | 'payload'>): IActivityTarget | null {
  const p = event.payload ?? {}
  const type = event.type
  if (type.endsWith('.deleted')) return null
  const estimateId = str(p['estimateId'])
  const invoiceId = str(p['invoiceId'])
  const jobId = str(p['jobId'])
  const bolId = str(p['bolId'])
  const customerId = str(p['customerId'])
  if (type.startsWith('crewfinding.invoice.') && invoiceId) return { kind: 'invoice', params: { invoiceId } }
  if (type.startsWith('crewfinding.estimate.') && estimateId) return { kind: 'estimate', params: { estimateId } }
  // A bill of lading opens on its job — only events that name the job can.
  if (type.startsWith('crewfinding.bol.')) return bolId && jobId ? { kind: 'bol', params: { jobId, bolId } } : null
  if (type.startsWith('crewfinding.job.') && jobId) return { kind: 'job', params: { jobId } }
  if (type.startsWith('fonderie.customer.') && customerId) return { kind: 'customer', params: { customerId } }
  return null
}

/** The web route a target opens, or null when the web has no page for it. */
export function activityHref(
  target: IActivityTarget | null,
  routes: Partial<Record<ActivityTargetKind, (params: Record<string, string>) => string>> = ACTIVITY_ROUTES,
): string | null {
  if (!target) return null
  const route = routes[target.kind]
  return route ? route(target.params) : null
}

/** "Created quote Q-0012", "Put Ana and Luc on a job", "Something changed". */
export function describeActivity(t: TFn, event: Pick<IAuditEventDTO, 'type' | 'payload'>, nameOf: (userId: string) => string): IActivityLine {
  const key = ACTIVITY_SENTENCES[event.type]
  const target = activityTarget(event)
  if (!key) return { text: t(UNKNOWN_SENTENCE), unknown: true, target }
  const p = event.payload ?? {}
  const to = str(p['to'])
  const statusKey = to ? (`org.activity.status.${to}` as TranslationKey) : null
  const status = statusKey ? (t(statusKey) === statusKey ? to! : t(statusKey)) : ''
  const targetUserId = str(p['targetUserId'])
  const assigned = Array.isArray(p['targetUserIds']) ? (p['targetUserIds'] as unknown[]).map(str).filter((x): x is string => !!x) : []
  const text = t(key, {
    number: str(p['number']) ?? '',
    status,
    name: targetUserId ? nameOf(targetUserId) : t('org.activity.someone'),
    names: assigned.map(nameOf).join(', '),
  })
  // A document without a number must not read "Created quote  ".
  return { text: text.replace(/\s{2,}/g, ' ').trim(), unknown: false, target }
}

// ── When ──────────────────────────────────────────────────────────────────────

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const DAY = 24 * 60 * 60 * 1000

/** The local calendar day an instant falls on, as a sortable key ("2026-10-08"). */
export function dayKey(value: string | Date): string {
  const d = new Date(value)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** "Today", "Yesterday", or the date in the reader's format. */
export function dayLabel(t: TFn, value: string | Date, now: Date, formatDate: (v: string | Date) => string): string {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(value))) / DAY)
  if (days === 0) return t('org.activity.today')
  if (days === 1) return t('org.activity.yesterday')
  return formatDate(value)
}

/**
 * When, at a glance: "Just now", "5 min ago", "3 h ago" today; the time of
 * day before that (the day is the section's header). The exact date and time
 * shows on opening the row.
 */
export function relativeTime(t: TFn, value: string | Date, now: Date, formatTime: (v: string | Date) => string): string {
  const at = new Date(value)
  const diff = now.getTime() - at.getTime()
  if (startOfDay(at) !== startOfDay(now) || diff < 0) return formatTime(value)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('org.activity.justNow')
  if (minutes < 60) return t('org.activity.minutesAgo', { count: minutes })
  return t('org.activity.hoursAgo', { count: Math.floor(minutes / 60) })
}

export interface IActivitySection<E> {
  key: string
  /** Any instant of that day, to label it. */
  day: string
  data: E[]
}

/** Newest first, one section per calendar day, in the order the feed gave. */
export function groupByDay<E extends Pick<IAuditEventDTO, 'createdAt'>>(events: readonly E[]): IActivitySection<E>[] {
  const sections: IActivitySection<E>[] = []
  for (const e of events) {
    const key = dayKey(e.createdAt)
    const last = sections[sections.length - 1]
    if (last && last.key === key) last.data.push(e)
    else sections.push({ key, day: e.createdAt, data: [e] })
  }
  return sections
}
