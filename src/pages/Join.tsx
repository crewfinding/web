import { useEffect } from 'react'
import AuthCard from '../components/AuthCard'
import { JoinWithCode } from '../components/JoinWithCode'
import { SignInToJoin } from '../components/SignInToJoin'
import { useTranslation } from '../hooks/useTranslation'
import { clearReturnTo } from '../lib/returnTo'
import { useAppSession } from '../lib/session'

// /join — "Join a team" with the 6-digit code from the invitation email.
// Signed out: sign in or sign up first, then back here.
export default function Join() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading } = useAppSession()

  useEffect(() => {
    document.title = `${t('common.appName')} — ${t('invite.title')}`
  }, [t])

  // Back from sign-in: the detour is done
  useEffect(() => {
    if (isAuthenticated) clearReturnTo()
  }, [isAuthenticated])

  if (isLoading) return null

  return (
    <AuthCard title={t('invite.title')} subtitle={t('invite.body')}>
      {isAuthenticated ? (
        <>
          {user && <p className="mb-4 text-sm text-ink-subtle">{user.email}</p>}
          <JoinWithCode returnPath="/join" />
        </>
      ) : (
        <SignInToJoin returnPath="/join" />
      )}
    </AuthCard>
  )
}
