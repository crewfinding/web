import { isMfaRequired, useLogin, useMfaLogin, useAuthProviders } from '@fonderie/react-auth'
import { Envelope } from '@phosphor-icons/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { API_BASE_URL } from '../lib/fonderie'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { OtpInput } from '../components/OtpInput'
import { ProviderIcon } from '../components/ProviderIcon'
import { useTranslation } from '../hooks/useTranslation'
import { applyAuthError } from '../lib/authErrors'
import { toastError } from '../lib/errors'
import { useAppSession } from '../lib/session'

interface LoginValues {
  email: string
  password: string
}

// The server accepts either a 6-digit TOTP code or one of the 8-character
// backup codes on the same verify call; the UI just has to let both in.
const BACKUP_CODE = /^[A-Z0-9]{8}$/i

export default function Login() {
  const providers = useAuthProviders()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { login, isLoading } = useLogin()
  const { verifyLogin, isLoading: verifying } = useMfaLogin()
  const { refresh } = useAppSession()
  // RequireAuth stashes the page the visitor was headed for
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  // Set when the password step answers MFA_REQUIRED; the challenge step
  // replaces the form until the code is accepted or the user backs out.
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>()

  const finishLogin = async () => {
    await refresh({ force: true })
    navigate(from, { replace: true })
  }

  const onSubmit = async ({ email, password }: LoginValues) => {
    try {
      const result = await login({ email: email.trim(), password })
      if (isMfaRequired(result)) {
        setMfaCode('')
        setUseBackupCode(false)
        setMfaToken(result.mfaToken)
        return
      }
      await finishLogin()
    } catch (err) {
      applyAuthError(
        err,
        setError,
        { INVALID_CREDENTIALS: 'password', email: 'email', password: 'password' },
        t('auth.login.failed'),
      )
    }
  }

  const submitMfa = async (code: string) => {
    if (!mfaToken) return
    try {
      await verifyLogin(mfaToken, code.trim())
      await finishLogin()
    } catch (err) {
      // The challenge token is single-use per attempt on the server side
      // only when it succeeds; a wrong code leaves it valid, so keep the
      // step open and let the user retry rather than sending them back.
      setMfaCode('')
      toastError(err, t('auth.login.mfa.failed'))
    }
  }

  const backupReady = useBackupCode && BACKUP_CODE.test(mfaCode.trim())
  const totpReady = !useBackupCode && mfaCode.length === 6

  if (mfaToken) {
    return (
      <AuthCard title={t('auth.login.mfa.title')} subtitle={t('auth.login.mfa.subtitle')}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submitMfa(mfaCode)
          }}
        >
          {useBackupCode ? (
            <Input
              label={t('auth.login.mfa.backupCode')}
              id="mfa-backup-code"
              type="text"
              autoComplete="one-time-code"
              placeholder="ABCD1234"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.toUpperCase())}
              containerClassName="mb-4"
            />
          ) : (
            <div className="mb-4">
              <p id="mfa-login-label" className="mb-3 text-sm font-medium text-ink">
                {t('auth.login.mfa.code')}
              </p>
              <OtpInput
                value={mfaCode}
                onChange={setMfaCode}
                onComplete={(code) => void submitMfa(code)}
                length={6}
                aria-labelledby="mfa-login-label"
              />
            </div>
          )}
          <div className="space-y-2">
            <Button type="submit" fullWidth loading={verifying} disabled={!(totpReady || backupReady)}>
              {t('auth.login.mfa.submit')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => {
                setMfaCode('')
                setUseBackupCode((v) => !v)
              }}
            >
              {useBackupCode ? t('auth.login.mfa.useAuthenticator') : t('auth.login.mfa.useBackupCode')}
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-ink-subtle">
            <button
              type="button"
              className="text-link underline"
              onClick={() => {
                setMfaToken(null)
                setMfaCode('')
              }}
            >
              {t('auth.login.mfa.back')}
            </button>
          </p>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={t('auth.login.email')}
          id="email"
          type="email"
          placeholder={t('auth.login.emailPlaceholder')}
          iconLeft={Envelope}
          error={errors.email?.message}
          containerClassName="mb-4"
          {...register('email', {
            required: t('auth.login.errors.emailRequired'),
            pattern: { value: /^\S+@\S+\.\S+$/, message: t('auth.login.errors.emailInvalid') },
          })}
        />
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            {t('auth.login.password')}
          </label>
          <Link to="/forgot-password" className="text-sm text-link underline">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••"
          error={errors.password?.message}
          containerClassName="mb-6"
          {...register('password', { required: t('auth.login.errors.passwordRequired') })}
        />
        <div className="space-y-2">
          <Button type="submit" fullWidth loading={isLoading}>{t('auth.login.submit')}</Button>
          {/* Rendered only when the API says it can honour Google. The server
              holds the credentials, so it is the only honest source — a
              build-time flag here would let the two disagree and the user
              would land on Google's error page. Navigate TOP-LEVEL rather
              than fetch(): the API's start route sets the CSRF state cookie,
              and a cross-site fetch cannot reliably store it. */}
          {providers.has('google') && (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                window.location.href = `${API_BASE_URL}/auth/google/start`
              }}
            >
              <ProviderIcon provider="google" />
              {t('auth.login.google')}
            </Button>
          )}
          {providers.has('apple') && (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                window.location.href = `${API_BASE_URL}/auth/apple/start`
              }}
            >
              <ProviderIcon provider="apple" />
              {t('auth.login.apple')}
            </Button>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-link underline">{t('auth.login.signUp')}</Link>
        </p>
      </form>
    </AuthCard>
  )
}
