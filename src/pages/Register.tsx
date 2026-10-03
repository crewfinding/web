import { useRemoteConfig } from '@fonderie/react'
import { useRegister, useAuthProviders } from '@fonderie/react-auth'
import { Envelope, User } from '@phosphor-icons/react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { API_BASE_URL } from '../lib/fonderie'
import { Button } from '../components/Button'
import { ProviderIcon } from '../components/ProviderIcon'
import { Input } from '../components/Input'
import { useLocale } from '../hooks/useLocale'
import { useTranslation } from '../hooks/useTranslation'
import { applyAuthError } from '../lib/authErrors'
import { useAppSession } from '../lib/session'

interface RegisterValues {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export default function Register() {
  const providers = useAuthProviders()
  const navigate = useNavigate()
  const { t } = useTranslation()
  // The same addresses as the mobile app: remote config, so they change for
  // both clients at once (they live on the landing site, crewfinding.com).
  const termsUrl = useRemoteConfig('TERMS_URL', '')
  const privacyUrl = useRemoteConfig('PRIVACY_URL', '')
  const { locale } = useLocale()
  const { register: registerAccount, isLoading } = useRegister()
  const { refresh } = useAppSession()

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>()

  const onSubmit = async ({ name, email, password }: RegisterValues) => {
    const [firstName, ...rest] = name.trim().split(/\s+/)
    try {
      await registerAccount({
        email: email.trim(),
        password,
        firstName,
        lastName: rest.join(' ') || undefined,
        // The language this page is in: the verification email arrives in it
        // instead of the account default, before any preference sync runs.
        locale,
      })
      await refresh({ force: true })
      navigate('/')
    } catch (err) {
      applyAuthError(
        err,
        setError,
        {
          USER_ALREADY_EXISTS: 'email',
          email: 'email',
          password: 'password',
          firstName: 'name',
          lastName: 'name',
        },
        t('auth.register.failed'),
      )
    }
  }

  return (
    <AuthCard title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={t('auth.register.name')}
          id="name"
          iconLeft={User}
          error={errors.name?.message}
          containerClassName="mb-4"
          {...register('name', { required: t('auth.register.errors.nameRequired') })}
        />
        <Input
          label={t('auth.register.email')}
          id="email"
          type="email"
          placeholder={t('auth.register.emailPlaceholder')}
          iconLeft={Envelope}
          error={errors.email?.message}
          containerClassName="mb-4"
          {...register('email', {
            required: t('auth.register.errors.emailRequired'),
            pattern: { value: /^\S+@\S+\.\S+$/, message: t('auth.register.errors.emailInvalid') },
          })}
        />
        <Input
          label={t('auth.register.password')}
          id="password"
          type="password"
          error={errors.password?.message}
          containerClassName="mb-4"
          {...register('password', {
            required: t('auth.register.errors.passwordRequired'),
            minLength: { value: 8, message: t('auth.register.errors.passwordMinLength') },
          })}
        />
        <Input
          label={t('auth.register.confirmPassword')}
          id="confirmPassword"
          type="password"
          error={errors.confirmPassword?.message}
          containerClassName="mb-4"
          {...register('confirmPassword', {
            required: t('auth.register.errors.confirmRequired'),
            validate: (value) =>
              value === getValues('password') || t('auth.register.errors.passwordMismatch'),
          })}
        />
        <div className="mb-6">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="accept-terms"
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={errors.acceptTerms ? 'accept-terms-message' : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              {...register('acceptTerms', {
                required: t('auth.register.errors.termsRequired'),
              })}
            />
            <label htmlFor="accept-terms" className="text-sm text-ink-subtle">
              {t('auth.register.termsAgree')}{' '}
              <LegalLink href={termsUrl}>{t('auth.register.termsOfService')}</LegalLink>{' '}
              {t('auth.register.termsAnd')}{' '}
              <LegalLink href={privacyUrl}>{t('auth.register.privacyPolicy')}</LegalLink>
            </label>
          </div>
          {errors.acceptTerms && (
            <p id="accept-terms-message" className="mt-1.5 text-xs text-error">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Button type="submit" fullWidth loading={isLoading}>{t('auth.register.submit')}</Button>
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
              {t('auth.register.google')}
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
              {t('auth.register.apple')}
            </Button>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="text-link underline">{t('auth.register.logIn')}</Link>
        </p>
      </form>
    </AuthCard>
  )
}

// Opens the landing site's page in a new tab; plain text until configured.
function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return <span>{children}</span>
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-link underline">
      {children}
    </a>
  )
}
