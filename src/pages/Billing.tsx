import { FonderieApiError, type ICheckoutInput, type IInvoiceDTO, type IPlanDTO, type ISubscriptionDTO } from '@fonderie/client'
import {
  useBillingPortal,
  useCancelSubscription,
  useCheckout,
  useInvoices,
  usePaymentMethod,
  usePlans,
  useReactivateSubscription,
  useRemovePaymentMethod,
  useSubscription,
} from '@fonderie/react-billing'
import { useMembers } from '@fonderie/react-workspaces'
import { useVerifyEmail } from '@fonderie/react-auth'
import { CreditCard, Receipt } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useJobQuota } from '../api/jobs'
import { AddPaymentMethod } from '../components/AddPaymentMethod'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SectionHeader } from '../components/SectionHeader'
import { ToggleGroup } from '../components/Toggle'
import { UsageBar } from '../components/UsageBar'
import { useTranslation } from '../hooks/useTranslation'
import { billingErrorMessage, capitalize, formatMoney, isLiveSubscription, useIsWorkspaceManager } from '../lib/billing'
import { useCurrentWorkspace } from '../lib/workspace'

// The workspace's billing: the plan and what it allows, the plans to move to,
// the card on file and the invoices. Web is where CrewFinding sells (Stripe):
// the phone apps show this read-only (store rules). The same rules as the
// mobile screen — upgrades apply in place, anything else is cancel then
// resubscribe; cancelling keeps the plan to the end of the paid period.

type Interval = 'month' | 'year'
type Pending =
  | { kind: 'upgrade'; plan: IPlanDTO }
  | { kind: 'cancel' }
  | { kind: 'remove-card' }
  | { kind: 'trial-unavailable'; plan: IPlanDTO }
  | { kind: 'trial-verify' }
  | null

// Stripe's webhook, not the return, changes the plan: re-read now and once
// more after it has had time to land.
const WEBHOOK_SETTLE_MS = 4000

export default function Billing() {
  const { t, locale } = useTranslation()
  const isManager = useIsWorkspaceManager()
  const { current: workspace } = useCurrentWorkspace()
  const [params, setParams] = useSearchParams()

  const subQ = useSubscription()
  const plansQ = usePlans()
  const cardQ = usePaymentMethod()
  const invoicesQ = useInvoices()
  const quotaQ = useJobQuota()
  const { members } = useMembers()
  const { checkout } = useCheckout()
  const { openPortal } = useBillingPortal()
  const { cancel } = useCancelSubscription()
  const { reactivate } = useReactivateSubscription()
  const { remove: removeCard } = useRemovePaymentMethod()
  const { resend: resendVerification } = useVerifyEmail()

  const [interval, setBillingInterval] = useState<Interval>('month')
  const [busy, setBusy] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [addingCard, setAddingCard] = useState(false)

  const subscription = subQ.subscription
  const live = isLiveSubscription(subscription) ? subscription : null
  const plans = useMemo(() => [...plansQ.plans].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0)), [plansQ.plans])
  const freePlan = plans[0]
  const currentPlan = plans.find((p) => p.name === (live?.plan ?? freePlan?.name))
  const money = (minor: number | string, currency: string) => formatMoney(minor, currency, locale)
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })

  const refreshAll = () =>
    Promise.all([subQ.refresh({ force: true }), cardQ.refresh({ force: true }), invoicesQ.refresh({ force: true }), quotaQ.refresh({ force: true })])

  // Back from Stripe (/billing/success|cancelled forward here).
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (settle.current && clearTimeout(settle.current)), [])
  useEffect(() => {
    const outcome = params.get('checkout')
    if (!outcome) return
    setParams({}, { replace: true })
    void refreshAll()
    if (outcome === 'success') {
      toast.success(t('billing.checkout-success.text'))
      settle.current = setTimeout(() => void refreshAll(), WEBHOOK_SETTLE_MS)
    } else {
      toast.info(t('billing.checkout-cancelled.text'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key)
    try {
      await action()
    } catch (err) {
      toast.error(billingErrorMessage(t, err))
    } finally {
      setBusy(null)
    }
  }

  const startCheckout = (plan: IPlanDTO, opts: { skipTrial?: boolean } = {}) =>
    run(`checkout:${plan.name}`, async () => {
      let url: string
      try {
        url = await checkout({ plan: plan.name, interval, ...opts } as ICheckoutInput)
      } catch (err) {
        // The free-trial gate refuses the TRIAL, never the plan.
        if (err instanceof FonderieApiError && err.reason === 'TRIAL_NOT_AVAILABLE') return setPending({ kind: 'trial-unavailable', plan })
        if (err instanceof FonderieApiError && err.reason === 'TRIAL_RISK_CHALLENGE') return setPending({ kind: 'trial-verify' })
        throw err
      }
      if (url) {
        window.location.assign(url) // Stripe Checkout; returns to /billing/success|cancelled
        return
      }
      // An upgrade applied in place (prorated) — nothing to pay on a page.
      await refreshAll()
      toast.success(t('billing.upgraded.text', { plan: capitalize(plan.name) }))
    })

  const onChoose = (plan: IPlanDTO) => {
    if (live) setPending({ kind: 'upgrade', plan })
    else void startCheckout(plan)
  }

  const onPortal = () =>
    run('portal', async () => {
      window.location.assign(await openPortal())
    })

  const confirmCancel = () =>
    run('cancel', async () => {
      setPending(null)
      // At period end: the workspace keeps what it paid for.
      const result = await cancel({ atPeriodEnd: true })
      await refreshAll()
      toast.success(
        t('billing.canceled-notice.text', {
          date: result.currentPeriodEnd ? date(result.currentPeriodEnd) : t('billing.period-end.text'),
        }),
      )
    })

  const onReactivate = () =>
    run('reactivate', async () => {
      try {
        await reactivate()
      } catch (err) {
        // 409: it already ended — the way back is a new subscription.
        if (err instanceof FonderieApiError && err.status === 409) {
          await refreshAll()
          throw new Error(t('billing.reactivate-failed.text'))
        }
        throw err
      }
      await refreshAll()
      toast.success(t('billing.reactivated-notice.text'))
    })

  const confirmRemoveCard = () =>
    run('remove-card', async () => {
      setPending(null)
      await removeCard()
      await cardQ.refresh({ force: true })
      toast.success(t('billing.card.payment.removed'))
    })

  // Seats: members other than the owner (a personal workspace counts everyone)
  // — the same count the server checks an invitation against.
  const occupied = workspace?.isPersonal ? members.length : Math.max(0, members.length - 1)
  const quota = quotaQ.data

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-headline text-ink">{t('billing.header.text')}</h1>
        <p className="mt-1 text-sm text-ink-subtle">{t('billing.paragraph.text')}</p>
      </div>

      <CurrentPlan
        live={live}
        planName={capitalize(live?.plan ?? freePlan?.name ?? '') || t('billing.plan.free.label')}
        date={date}
        isManager={isManager}
        busy={busy}
        onCancel={() => setPending({ kind: 'cancel' })}
        onReactivate={() => void onReactivate()}
        onFixPayment={() => void onPortal()}
      >
        {quota && (
          <UsageBar
            label={t('billing.usage.jobs.text')}
            used={quota.used}
            total={quota.unlimited || quota.limit === null ? Math.max(quota.used, 1) : quota.limit}
            valueText={
              quota.unlimited || quota.limit === null
                ? t('billing.usage.unlimited.text', { used: quota.used })
                : t('billing.usage.of.text', { used: quota.used, limit: quota.limit })
            }
          />
        )}
        {currentPlan && typeof currentPlan.seats === 'number' && (
          <UsageBar
            label={t('billing.usage.seats.text')}
            used={occupied}
            total={currentPlan.seats}
            valueText={t('billing.usage.of.text', { used: occupied, limit: currentPlan.seats })}
          />
        )}
      </CurrentPlan>

      {plans.length > 0 && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-card-title text-ink">{t('billing.card.plans.title')}</h2>
            <ToggleGroup<Interval>
              aria-label={t('billing.card.plans.title')}
              value={interval}
              onValueChange={setBillingInterval}
              options={[
                { value: 'month', label: t('billing.interval.monthly.option') },
                { value: 'year', label: t('billing.interval.yearly.option') },
              ]}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                interval={interval}
                live={live}
                currentName={currentPlan?.name}
                currentTier={currentPlan?.tier ?? 0}
                isManager={isManager}
                busy={busy}
                money={money}
                onChoose={() => onChoose(plan)}
              />
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <SectionHeader icon={CreditCard} title={t('billing.card.payment.title')} description={t('billing.card.payment.portal-hint')} />
        <div className="mt-4">
          {addingCard ? (
            <AddPaymentMethod
              onSaved={() => {
                setAddingCard(false)
                void cardQ.refresh({ force: true })
              }}
              onCancel={() => setAddingCard(false)}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PaymentMethodLine method={cardQ.paymentMethod} loading={cardQ.isLoading} />
              {isManager && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setAddingCard(true)} disabled={!!busy}>
                    {cardQ.paymentMethod ? t('billing.btn.update-card.text') : t('billing.btn.add-card.text')}
                  </Button>
                  {cardQ.paymentMethod && (
                    <Button variant="ghost" onClick={() => setPending({ kind: 'remove-card' })} disabled={!!busy}>
                      {t('billing.btn.remove-card.text')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Receipt} title={t('billing.card.invoices.title')} description="" />
        <Invoices
          invoices={invoicesQ.invoices}
          loading={invoicesQ.isLoading}
          hasMore={invoicesQ.hasMore}
          onMore={() => void invoicesQ.loadMore().catch((err) => toast.error(billingErrorMessage(t, err)))}
          money={money}
          date={date}
        />
      </Card>

      {!isManager && <p className="text-sm text-ink-subtle">{t('billing.members-readonly.text')}</p>}

      <ConfirmDialog
        open={pending?.kind === 'upgrade'}
        title={pending?.kind === 'upgrade' ? t('billing.confirm-upgrade.title', { plan: capitalize(pending.plan.name) }) : ''}
        description={t('billing.confirm-upgrade.text')}
        confirmLabel={t('billing.btn.upgrade.text')}
        cancelLabel={t('billing.not-now.text')}
        onConfirm={() => {
          if (pending?.kind === 'upgrade') void startCheckout(pending.plan)
          setPending(null)
        }}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'cancel'}
        danger
        title={live ? t('billing.confirm-cancel.title', { plan: capitalize(live.plan) }) : ''}
        description={
          live
            ? t('billing.confirm-cancel.text', {
                plan: capitalize(live.plan),
                date: live.currentPeriodEnd ? date(live.currentPeriodEnd) : t('billing.period-end.text'),
              })
            : ''
        }
        confirmLabel={t('billing.confirm-cancel.confirm.text')}
        cancelLabel={t('billing.confirm-cancel.keep.text')}
        onConfirm={() => void confirmCancel()}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'remove-card'}
        danger
        title={t('billing.confirm-remove.title')}
        description={t('billing.confirm-remove.text')}
        confirmLabel={t('billing.btn.remove-card.text')}
        cancelLabel={t('billing.not-now.text')}
        onConfirm={() => void confirmRemoveCard()}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'trial-unavailable'}
        title={t('billing.trial-unavailable.title')}
        description={t('billing.trial-unavailable.text')}
        confirmLabel={t('billing.btn.subscribe-no-trial.text')}
        cancelLabel={t('billing.not-now.text')}
        onConfirm={() => {
          if (pending?.kind === 'trial-unavailable') void startCheckout(pending.plan, { skipTrial: true })
          setPending(null)
        }}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'trial-verify'}
        title={t('billing.trial-verify.title')}
        description={t('billing.trial-verify.text')}
        confirmLabel={t('billing.btn.verify-email.text')}
        cancelLabel={t('billing.not-now.text')}
        onConfirm={() => {
          setPending(null)
          void run('verify', async () => {
            await resendVerification()
            window.location.assign('/verify')
          })
        }}
        onClose={() => setPending(null)}
      />
    </div>
  )
}

function CurrentPlan({
  live,
  planName,
  date,
  isManager,
  busy,
  onCancel,
  onReactivate,
  onFixPayment,
  children,
}: {
  live: ISubscriptionDTO | null
  planName: string
  date: (iso: string) => string
  isManager: boolean
  busy: string | null
  onCancel: () => void
  onReactivate: () => void
  onFixPayment: () => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const ending = !!live?.cancelAtPeriodEnd
  const pastDue = live?.status === 'past_due' || live?.status === 'unpaid'
  const status = live ? (ending ? 'ending' : live.status) : null
  const when = !live
    ? null
    : live.status === 'trialing' && live.trialEndsAt
      ? t('billing.trial-ends-on.text', { date: date(live.trialEndsAt) })
      : live.currentPeriodEnd
        ? t(ending ? 'billing.ends-on.text' : 'billing.renews-on.text', { date: date(live.currentPeriodEnd) })
        : null

  return (
    <Card className="p-6">
      <h2 className="text-card-title text-ink">{t('billing.card.current.title')}</h2>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-xl font-semibold text-ink">{planName}</p>
        {status && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pastDue ? 'bg-error/10 text-error' : ending ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
            {t(`billing.status.${status}` as 'billing.status.active')}
          </span>
        )}
        {live?.interval && (
          <span className="text-sm text-ink-subtle">
            {t(live.interval === 'year' ? 'billing.interval.year.text' : 'billing.interval.month.text')}
          </span>
        )}
      </div>
      {when && <p className="mt-1 text-sm text-ink-subtle">{when}</p>}
      <div className="mt-5 space-y-4">{children}</div>
      {live && isManager && (
        <div className="mt-6 flex flex-wrap gap-2">
          {pastDue ? (
            <Button variant="primary" loading={busy === 'portal'} onClick={onFixPayment}>
              {t('billing.btn.fix-payment.text')}
            </Button>
          ) : ending ? (
            <Button variant="primary" loading={busy === 'reactivate'} onClick={onReactivate}>
              {t('billing.btn.reactivate.text')}
            </Button>
          ) : (
            <Button variant="secondary" loading={busy === 'cancel'} onClick={onCancel}>
              {t('billing.btn.cancel.text')}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function PlanCard({
  plan,
  interval,
  live,
  currentName,
  currentTier,
  isManager,
  busy,
  money,
  onChoose,
}: {
  plan: IPlanDTO
  interval: Interval
  live: ISubscriptionDTO | null
  currentName: string | undefined
  currentTier: number
  isManager: boolean
  busy: string | null
  money: (minor: number, currency: string) => string
  onChoose: () => void
}) {
  const { t, locale } = useTranslation()
  const price = interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly
  const n = (count: number) => count.toLocaleString(locale)
  const isCurrent = plan.name === currentName
  const lines: string[] = []
  if (typeof plan.seats === 'number')
    lines.push(plan.seats === 1 ? t('billing.seats.one') : t('billing.seats.text', { count: n(plan.seats) }))
  for (const f of plan.features) {
    if (f.name === 'jobs' && typeof f.limit === 'number') lines.push(t('billing.limit.jobs.text', { count: n(f.limit) }))
    else if (f.name === 'api-calls' && typeof f.limit === 'number') lines.push(t('billing.limit.api-calls.text', { count: n(f.limit) }))
    else if (f.enabled && ['analytics', 'sso', 'sla', 'support'].includes(f.name)) lines.push(t(`billing.feature.${f.name}.text` as 'billing.feature.sso.text'))
  }
  const label = live ? t('billing.btn.upgrade.text') : plan.trialDays > 0 ? t('billing.btn.start-trial.text') : t('billing.btn.subscribe.text')
  const ending = !!live?.cancelAtPeriodEnd
  const pastDue = live?.status === 'past_due' || live?.status === 'unpaid'
  // A live plan moves UP in place; down (or sideways) is cancel, then
  // subscribe once it ends — billing's plan-change model, as on mobile.
  const lower = !!live && (plan.tier ?? 0) <= currentTier
  const note =
    !isManager || isCurrent || !live
      ? null
      : ending
        ? t('billing.checkout.scheduled_to_cancel')
        : pastDue
          ? t('billing.checkout.past_due')
          : lower
            ? t('billing.downgrade.note')
            : null

  return (
    <div className={`flex flex-col rounded-lg border p-4 ${isCurrent ? 'border-primary' : 'border-hairline'}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">{capitalize(plan.name)}</p>
        {isCurrent && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-link">{t('billing.current.badge')}</span>}
      </div>
      <p className="mt-2 text-lg font-semibold text-ink">
        {t(interval === 'year' ? 'billing.price.per-year' : 'billing.price.per-month', { price: money(price, plan.pricing.currency) })}
        {plan.pricingStale && <span className="ml-1 text-xs font-normal text-ink-subtle">{t('billing.price.indicative')}</span>}
      </p>
      {plan.trialDays > 0 && !live && <p className="mt-1 text-xs text-ink-subtle">{t('billing.trial.text', { days: plan.trialDays })}</p>}
      <ul className="mt-3 flex-1 space-y-1 text-sm text-ink-muted">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {note && <p className="mt-3 text-xs text-ink-subtle">{note}</p>}
      {isManager && !isCurrent && price > 0 && !lower && !ending && !pastDue && (
        <Button className="mt-4" variant={live ? 'secondary' : 'primary'} loading={busy === `checkout:${plan.name}`} disabled={!!busy && busy !== `checkout:${plan.name}`} onClick={onChoose}>
          {label}
        </Button>
      )}
    </div>
  )
}

function PaymentMethodLine({ method, loading }: { method: ReturnType<typeof usePaymentMethod>['paymentMethod']; loading: boolean }) {
  const { t } = useTranslation()
  if (!method) return <p className="text-sm text-ink-subtle">{loading ? t('billing.loading.text') : t('billing.card.payment.none')}</p>
  // Stripe Link has no card details: the Link account is what pays.
  if (method.type === 'link') return <p className="text-sm font-medium text-ink">Link{method.email ? ` · ${method.email}` : ''}</p>
  return (
    <div>
      <p className="text-sm font-medium text-ink">
        {capitalize(method.brand)} •••• {method.last4}
      </p>
      <p className="text-xs text-ink-subtle">
        {t('billing.card.payment.expires', { month: String(method.expMonth).padStart(2, '0'), year: method.expYear })}
      </p>
    </div>
  )
}

function Invoices({
  invoices,
  loading,
  hasMore,
  onMore,
  money,
  date,
}: {
  invoices: IInvoiceDTO[]
  loading: boolean
  hasMore: boolean
  onMore: () => void
  money: (minor: string, currency: string) => string
  date: (iso: string) => string
}) {
  const { t } = useTranslation()
  if (loading) return <p className="mt-4 text-sm text-ink-subtle">{t('billing.loading.text')}</p>
  if (invoices.length === 0) return <p className="mt-4 text-sm text-ink-subtle">{t('billing.invoices.empty')}</p>
  return (
    <div className="mt-4">
      <ul className="divide-y divide-hairline">
        {invoices.map((inv) => {
          const url = inv.hostedInvoiceUrl ?? inv.invoicePdf
          const status = `billing.invoices.status.${inv.status}` as 'billing.invoices.status.paid'
          return (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="text-ink">
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="text-link underline">
                    {t('billing.invoices.view', { date: date(inv.created) })}
                  </a>
                ) : (
                  t('billing.invoices.view', { date: date(inv.created) })
                )}
                {inv.number && <span className="ml-2 text-ink-subtle">{inv.number}</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-medium text-ink">{money(inv.amountPaid !== '0' ? inv.amountPaid : inv.amountDue, inv.currency)}</span>
                <span className="text-ink-subtle">{t(status)}</span>
              </span>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <Button variant="ghost" className="mt-3" onClick={onMore}>
          {t('billing.invoices.more')}
        </Button>
      )}
    </div>
  )
}
