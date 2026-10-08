import { DeviceMobile } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { Button } from '../components/Button'
import { SignInToJoin } from '../components/SignInToJoin'
import { useTranslation } from '../hooks/useTranslation'
import { useJoinTeam } from '../lib/joinTeam'
import { clearReturnTo } from '../lib/returnTo'
import { useAppSession } from '../lib/session'
import { mobilePlatform } from '../lib/userAgent'

// /invite/:token — the link in the invitation email. The same "Join a team"
// screen as /join with the token pre-filled, so there is no code step:
// signed in, it joins at once; signed out, it asks to sign in or sign up
// with the invited email and comes back here. With the app installed, the
// universal / app link opens the app instead of this page; on a phone where
// it did not (opened from another app's browser), a button hands it over.
export default function Invite() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading } = useAppSession()
  const { join, busy, refusal, switchAccount } = useJoinTeam()
  const attempted = useRef(false)
  const returnPath = `/invite/${encodeURIComponent(token)}`
  const platform = mobilePlatform()

  useEffect(() => {
    document.title = `${t('common.appName')} — ${t('invite.title')}`
  }, [t])

  // Signed in (now, or back from signing in): join once
  useEffect(() => {
    if (isLoading || !isAuthenticated || !token || attempted.current) return
    attempted.current = true
    clearReturnTo()
    void join({ token })
  }, [isLoading, isAuthenticated, token, join])

  if (isLoading) return null

  const openInApp = platform && (
    <Button variant="secondary" fullWidth asChild className="mt-2">
      {/* The app's own scheme: expo-router maps crewfinding://invite/<token>
          to the same invite screen the universal link opens */}
      <a href={`crewfinding://invite/${encodeURIComponent(token)}`}>
        <DeviceMobile className="h-4 w-4" aria-hidden="true" />
        {t('invite.openInApp')}
      </a>
    </Button>
  )

  if (!isAuthenticated) {
    return (
      <AuthCard title={t('invite.title')}>
        <SignInToJoin returnPath={returnPath} />
        {openInApp}
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('invite.title')}>
      {user && <p className="mb-4 text-sm text-ink-subtle">{user.email}</p>}
      {refusal ? (
        <>
          <p role="alert" className="text-sm text-error">
            {refusal.message}
          </p>
          <div className="mt-6 space-y-2">
            {refusal.wrongAccount && (
              <Button fullWidth onClick={() => void switchAccount(returnPath)}>
                {t('invite.switchAccount')}
              </Button>
            )}
            {refusal.retryable && (
              <Button fullWidth loading={busy} onClick={() => void join({ token })}>
                {t('invite.retry')}
              </Button>
            )}
            <Button variant="secondary" fullWidth asChild>
              <Link to="/">{t('invite.goHome')}</Link>
            </Button>
          </div>
        </>
      ) : (
        <p role="status" className="text-sm text-ink-subtle">
          {/* No invitation preview route: the team's name is known only once joined */}
          {t('invite.joiningGeneric')}
        </p>
      )}
      {openInApp}
    </AuthCard>
  )
}
