import type { IAuditEventDTO } from '@fonderie/client'
import { useAuditEvents } from '@fonderie/react-audit'
import { useMembers, usePermissions } from '@fonderie/react-workspaces'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Notice } from '../../components/Notice'
import { useTranslation } from '../../hooks/useTranslation'
import { errorMessage } from '../../lib/apiErrors'
import { formatTime } from '../../lib/dateFormat'
import { actorOf } from '../../lib/lifecycle'
import { memberName } from '../../lib/members'
import { useAppSession } from '../../lib/session'
import { useDatePreference } from '../../hooks/useDatePreference'
import { useCurrentWorkspace } from '../../lib/workspace'

// The activity log (docs/parity/4-lifecycle.md): the API's audit trail
// (GET /audit, @fonderie/react-audit), for those holding the 'audit' right.

const PAGE_SIZE = 25

function ActivityList() {
  const { t, locale } = useTranslation()
  const formatDate = useDatePreference()
  const { user } = useAppSession()
  const timeFormat = user?.preferences?.timeFormat
  const { events, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useAuditEvents({ limit: PAGE_SIZE })
  const { members } = useMembers()
  const [open, setOpen] = useState<string | null>(null)

  const who = (e: IAuditEventDTO) => {
    const actor = actorOf(e, members, (m) => memberName(m, locale))
    return actor.kind === 'member' ? actor.name : actor.kind === 'system' ? t('org.activity.system') : t('org.activity.someone')
  }

  if (isLoading && events.length === 0) {
    return (
      <p role="status" className="py-6 text-center text-sm text-ink-subtle">
        {t('org.activity.loading')}
      </p>
    )
  }
  if (error && events.length === 0) {
    return (
      <div className="space-y-3">
        <Notice tone="error">{errorMessage(t, error)}</Notice>
        <Button variant="secondary" onClick={() => void refresh({ force: true })}>
          {t('org.activity.retry')}
        </Button>
      </div>
    )
  }
  if (events.length === 0) return <p className="text-sm text-ink-subtle">{t('org.activity.empty')}</p>

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hairline text-xs text-ink-subtle">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">{t('org.activity.when')}</th>
              <th scope="col" className="px-4 py-2 font-medium">{t('org.activity.who')}</th>
              <th scope="col" className="px-4 py-2 font-medium">{t('org.activity.what')}</th>
              <th scope="col" className="px-4 py-2"><span className="sr-only">{t('org.activity.details')}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {events.map((e) => (
              <ActivityRow
                key={e.id}
                event={e}
                when={`${formatDate(e.createdAt)} ${formatTime(e.createdAt, timeFormat)}`}
                who={who(e)}
                open={open === e.id}
                onToggle={() => setOpen(open === e.id ? null : e.id)}
              />
            ))}
          </tbody>
        </table>
      </Card>
      {isLoadingMore ? (
        <p role="status" className="text-center text-sm text-ink-subtle">{t('org.activity.loadingMore')}</p>
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
  when,
  who,
  open,
  onToggle,
}: {
  event: IAuditEventDTO
  when: string
  who: string
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <tr data-testid={`activity-${event.id}`}>
        <td className="px-4 py-2 whitespace-nowrap text-ink-muted">{when}</td>
        <td className="px-4 py-2 text-ink">{who}</td>
        <td className="px-4 py-2 font-mono text-xs text-ink">{event.type}</td>
        <td className="px-4 py-2 text-right">
          <Button size="xs" variant="ghost" aria-expanded={open} onClick={onToggle}>
            {t('org.activity.details')}
          </Button>
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={4} className="bg-surface-2/50 px-4 py-2">
            <pre className="overflow-x-auto text-xs whitespace-pre-wrap text-ink-muted">{JSON.stringify(event.payload, null, 2)}</pre>
          </td>
        </tr>
      ) : null}
    </>
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
        <p role="status" className="py-6 text-center text-sm text-ink-subtle">{t('org.activity.loading')}</p>
      ) : (
        <Notice>{t('org.activity.noAccess')}</Notice>
      )}
    </div>
  )
}
