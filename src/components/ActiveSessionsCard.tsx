import { useState } from 'react'
import { Laptop, DeviceMobile, Devices, SignOut } from '@phosphor-icons/react'
import { useSessions } from '@fonderie/react-auth'
import type { ISessionDTO } from '@fonderie/react-auth'
import { toast } from 'sonner'
import { Button } from './Button'
import { Card } from './Card'
import { ConfirmDialog } from './ConfirmDialog'
import { SectionHeader } from './SectionHeader'
import { parseUserAgent } from '../lib/userAgent'
import { RECENT_LIST_LIMIT } from '../constants/lists'
import { useTranslation } from '../hooks/useTranslation'
import { toastError } from '../lib/errors'
import { localeTags } from '../locales'
import { formatLocation } from '../lib/location'

function SessionRow({
  session,
  onTerminate,
}: {
  session: ISessionDTO
  onTerminate: (id: string) => void
}) {
  const { t, locale } = useTranslation()
  const ua = parseUserAgent(session.userAgent)
  const Icon = ua.device === 'phone' ? DeviceMobile : Laptop
  // "Signed in Sep 7, 2026" — honest until Phase 5 adds last_active_at; we only
  // know when the session was created, not last used, so we say so plainly.
  const signedIn = t('settings.sessions.signedIn', {
    date: new Date(session.createdAt).toLocaleDateString(localeTags[locale], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  })
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-hairline p-4">
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{ua.os}</span>
            {session.current && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-on-primary">
                {t('settings.sessions.current')}
              </span>
            )}
          </div>
          <div className="space-y-0.5 text-sm text-ink-subtle">
            <div>{ua.summary}</div>
            <div>{session.ipAddress ?? t('settings.sessions.unknownIp')}</div>
            {formatLocation(session.location) && <div>{formatLocation(session.location)}</div>}
            <div>{signedIn}</div>
          </div>
        </div>
      </div>
      {!session.current && (
        <Button variant="secondary" size="sm" onClick={() => onTerminate(session.id)}>
          <SignOut className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t('settings.sessions.terminate')}
        </Button>
      )}
    </div>
  )
}

export function ActiveSessionsCard() {
  const { t } = useTranslation()
  const { sessions, isLoading, error, terminate, terminateOthers } = useSessions()
  // null = closed; 'others' = the bulk confirm; a string id = terminate that one.
  const [confirming, setConfirming] = useState<string | 'others' | null>(null)
  const [busy, setBusy] = useState(false)

  const others = sessions.filter((s) => !s.current)

  const runTerminate = async () => {
    if (confirming === null) return
    setBusy(true)
    try {
      if (confirming === 'others') {
        await terminateOthers()
        toast.success(t('settings.sessions.othersTerminated'))
      } else {
        await terminate(confirming)
        toast.success(t('settings.sessions.terminated'))
      }
    } catch (err) {
      toastError(err, t('settings.sessions.terminateFailed'))
    } finally {
      setBusy(false)
      setConfirming(null)
    }
  }

  return (
    <Card as="section" id="sessions" className="scroll-mt-20 p-5">
      <SectionHeader
        icon={Devices}
        title={t('settings.sessions.title')}
        description={t('settings.sessions.description')}
        action={
          others.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => setConfirming('others')}>
              <SignOut className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t('settings.sessions.terminateOthers')}
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <p className="mt-4 text-sm text-error">{t('settings.sessions.loadFailed')} {error.message}</p>
      ) : isLoading ? (
        <p className="mt-4 text-sm text-ink-subtle">{t('settings.sessions.loading')}</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-ink-subtle">{t('settings.sessions.empty')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {/* Show only the most recent RECENT_LIST_LIMIT until pagination lands;
              "Terminate all others" still acts on every other session. */}
          {sessions.slice(0, RECENT_LIST_LIMIT).map((s) => (
            <SessionRow key={s.id} session={s} onTerminate={(id) => setConfirming(id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming === 'others'
            ? t('settings.sessions.confirmOthersTitle')
            : t('settings.sessions.confirmOneTitle')
        }
        description={
          confirming === 'others'
            ? t('settings.sessions.confirmOthersDescription')
            : t('settings.sessions.confirmOneDescription')
        }
        confirmLabel={busy ? t('settings.sessions.terminating') : t('settings.sessions.terminate')}
        danger
        onConfirm={() => void runTerminate()}
        onClose={() => !busy && setConfirming(null)}
      />
    </Card>
  )
}
