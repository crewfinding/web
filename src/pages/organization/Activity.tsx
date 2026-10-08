import type { IAuditEventDTO, IMemberDTO } from '@fonderie/client'
import { useAuditEvents } from '@fonderie/react-audit'
import { useMembers, usePermissions } from '@fonderie/react-workspaces'
import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Notice } from '../../components/Notice'
import { useDatePreference } from '../../hooks/useDatePreference'
import { useTranslation } from '../../hooks/useTranslation'
import { OPEN_KEYS, activityHref, dayLabel, describeActivity, groupByDay, relativeTime } from '../../lib/activity'
import { errorMessage } from '../../lib/apiErrors'
import { formatDateTime, formatTime } from '../../lib/dateFormat'
import { actorOf } from '../../lib/lifecycle'
import { memberName } from '../../lib/members'
import { useAppSession } from '../../lib/session'
import { useCurrentWorkspace } from '../../lib/workspace'

// The activity log (docs/parity/4-lifecycle.md; the mobile app's LogScreen):
// the API's audit trail (GET /audit, @fonderie/react-audit), for those holding
// the 'audit' right. Each row reads who, what — one sentence per event type —
// and when (relative today, the time under a day header), grouped by day;
// opening a row shows the exact date and time, and a link to what it was
// about when the web has a page for it.

const PAGE_SIZE = 25
/** Enough of the team to name nearly every actor from one read. */
const MEMBERS_PAGE_SIZE = 100

function ActivityList() {
  const { t, locale } = useTranslation()
  const formatDate = useDatePreference()
  const { user } = useAppSession()
  const prefs = user?.preferences
  const { events, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useAuditEvents({ limit: PAGE_SIZE })
  const membersQ = useMembers(undefined, { pageSize: MEMBERS_PAGE_SIZE })
  const { members, hasMore: moreMembers, isLoadingMore: loadingMembers, loadMore: loadMoreMembers } = membersQ
  const [open, setOpen] = useState<string | null>(null)

  const nameOfMember = useCallback((m: IMemberDTO) => memberName(m, locale), [locale])
  const nameOf = useCallback(
    (userId: string) => {
      const m = members.find((x) => x.userId === userId)
      return m ? nameOfMember(m) : t('org.activity.someone')
    },
    [members, nameOfMember, t],
  )
  const who = (e: IAuditEventDTO) => {
    const actor = actorOf(e, members, nameOfMember)
    return actor.kind === 'member' ? actor.name : actor.kind === 'system' ? t('org.activity.system') : t('org.activity.someone')
  }

  // Someone not on the first page of the team reads as a former member until
  // the rest of the team is read: read it while names are missing.
  const missing = events.some((e) => e.actorId && !members.some((m) => m.userId === e.actorId))
  useEffect(() => {
    if (missing && moreMembers && !loadingMembers) void loadMoreMembers()
  }, [missing, moreMembers, loadingMembers, loadMoreMembers])

  const sections = useMemo(() => groupByDay(events), [events])
  // "5 min ago" moves on by itself: the clock ticks each minute.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (isLoading && events.length === 0) {
    return (
      <p role="status" className="py-6 text-center text-sm text-ink-subtle" data-testid="activity-loading">
        {t('org.activity.loading')}
      </p>
    )
  }
  if (error && events.length === 0) {
    return (
      <div className="space-y-3" data-testid="activity-error">
        <Notice tone="error">
          <span className="font-medium">{t('org.activity.error')}</span> {errorMessage(t, error)}
        </Notice>
        <Button variant="secondary" onClick={() => void refresh({ force: true })}>
          {t('org.activity.retry')}
        </Button>
      </div>
    )
  }
  if (events.length === 0) {
    return (
      <p className="text-sm text-ink-subtle" data-testid="activity-empty">
        {t('org.activity.empty')}
      </p>
    )
  }

  return (
    <div className="space-y-4" data-testid="activity-list">
      {sections.map((s) => (
        <section key={s.key} aria-labelledby={`activity-day-${s.key}`}>
          <h3 id={`activity-day-${s.key}`} className="mb-2 px-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
            {dayLabel(t, s.day, now, formatDate)}
          </h3>
          <Card>
            <ul className="divide-y divide-hairline">
              {s.data.map((e) => {
                const line = describeActivity(t, e, nameOf)
                return (
                  <ActivityRow
                    key={e.id}
                    event={e}
                    who={who(e)}
                    what={line.text}
                    rawType={line.unknown ? e.type : null}
                    when={relativeTime(t, e.createdAt, now, (v) => formatTime(v, prefs?.timeFormat))}
                    exact={formatDateTime(e.createdAt, prefs?.dateFormat, prefs?.timeFormat)}
                    href={activityHref(line.target)}
                    openLabel={line.target ? t(OPEN_KEYS[line.target.kind]) : ''}
                    open={open === e.id}
                    onToggle={() => setOpen(open === e.id ? null : e.id)}
                  />
                )
              })}
            </ul>
          </Card>
        </section>
      ))}
      {isLoadingMore ? (
        <p role="status" className="text-center text-sm text-ink-subtle">
          {t('org.activity.loadingMore')}
        </p>
      ) : error ? (
        // A page that failed after the first: say so under what is shown, and offer it again.
        <div className="space-y-2 text-center" data-testid="activity-more-error">
          <p className="text-sm text-ink-subtle">{errorMessage(t, error)}</p>
          <Button variant="secondary" onClick={() => void loadMore()}>
            {t('org.activity.retry')}
          </Button>
        </div>
      ) : hasMore ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => void loadMore()}>
            {t('org.activity.showMore')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ActivityRow({
  event,
  who,
  what,
  rawType,
  when,
  exact,
  href,
  openLabel,
  open,
  onToggle,
}: {
  event: IAuditEventDTO
  who: string
  what: string
  rawType: string | null
  when: string
  exact: string
  href: string | null
  openLabel: string
  open: boolean
  onToggle: () => void
}) {
  const detailsId = `activity-details-${event.id}`
  return (
    <li data-testid={`activity-${event.id}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{who}</span>
          <span className="mt-0.5 block text-sm text-ink">{what}</span>
          {rawType ? <span className="mt-0.5 block font-mono text-xs text-ink-subtle">{rawType}</span> : null}
        </span>
        <span className="shrink-0 text-xs whitespace-nowrap text-ink-subtle">{when}</span>
        {open ? (
          <CaretDown size={14} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden="true" />
        ) : (
          <CaretRight size={14} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden="true" />
        )}
      </button>
      {open ? (
        <div id={detailsId} className="space-y-1 px-4 pb-3">
          <p className="text-sm text-ink-subtle">{exact}</p>
          {href ? (
            <Link to={href} className="text-sm font-medium text-link hover:underline">
              {openLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export default function Activity() {
  const { t } = useTranslation()
  const { current } = useCurrentWorkspace()
  const { can, isLoading } = usePermissions()
  const allowed = can('read', 'audit')
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-card-title text-ink">{t('org.activity.title')}</h2>
        <p className="mt-1 text-sm text-ink-subtle">{t('org.activity.intro')}</p>
      </div>
      {allowed ? (
        // Keyed by workspace: a switch reads the new workspace's trail from the top.
        <ActivityList key={current?.id ?? 'none'} />
      ) : isLoading ? (
        <p role="status" className="py-6 text-center text-sm text-ink-subtle">
          {t('org.activity.loading')}
        </p>
      ) : (
        <Notice>{t('org.activity.noAccess')}</Notice>
      )}
    </div>
  )
}
