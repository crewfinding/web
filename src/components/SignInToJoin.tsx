import { Link } from 'react-router-dom'
import { Button } from './Button'
import { useTranslation } from '../hooks/useTranslation'
import { setReturnTo } from '../lib/returnTo'

// Signed out on a join screen: sign in or sign up with the invited email,
// then come back to `returnPath` (code or token kept in the path).
export function SignInToJoin({ returnPath }: { returnPath: string }) {
  const { t } = useTranslation()
  return (
    <>
      <p className="mb-4 text-sm text-ink-subtle">{t('invite.signedOut.body')}</p>
      <div className="space-y-2">
        <Button fullWidth asChild>
          <Link to="/login" state={{ from: { pathname: returnPath } }} onClick={() => setReturnTo(returnPath)}>
            {t('invite.signedOut.signIn')}
          </Link>
        </Button>
        <Button variant="secondary" fullWidth asChild>
          <Link to="/register" onClick={() => setReturnTo(returnPath)}>
            {t('invite.signedOut.register')}
          </Link>
        </Button>
      </div>
    </>
  )
}
