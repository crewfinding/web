import { useForgotPassword } from '@fonderie/react-auth'
import { CheckCircle, Envelope } from '@phosphor-icons/react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useTranslation } from '../hooks/useTranslation'
import { applyAuthError } from '../lib/authErrors'

interface ForgotValues {
  email: string
}

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { forgotPassword, isLoading, sent } = useForgotPassword()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotValues>()

  // The server answers identically whether the account exists or not
  const onSubmit = async ({ email }: ForgotValues) => {
    try {
      await forgotPassword(email.trim())
    } catch (err) {
      applyAuthError(err, setError, { email: 'email' }, t('auth.forgotPassword.failed'))
    }
  }

  if (sent) {
    return (
      <AuthCard title={t('auth.forgotPassword.sentTitle')} subtitle={t('auth.forgotPassword.sentSubtitle')}>
        <CheckCircle className="mx-auto mb-4 h-10 w-10 text-success" aria-hidden="true" />
        <Button fullWidth asChild>
          <Link to="/reset-password">{t('auth.forgotPassword.enterCode')}</Link>
        </Button>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          <Link to="/login" className="text-link underline">{t('auth.forgotPassword.backToLogin')}</Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.forgotPassword.title')} subtitle={t('auth.forgotPassword.subtitle')}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={t('auth.forgotPassword.email')}
          id="email"
          type="email"
          placeholder={t('auth.forgotPassword.emailPlaceholder')}
          iconLeft={Envelope}
          error={errors.email?.message}
          containerClassName="mb-6"
          {...register('email', {
            required: t('auth.forgotPassword.errors.emailRequired'),
            pattern: { value: /^\S+@\S+\.\S+$/, message: t('auth.forgotPassword.errors.emailInvalid') },
          })}
        />
        <Button type="submit" fullWidth loading={isLoading}>{t('auth.forgotPassword.submit')}</Button>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          {t('auth.forgotPassword.rememberPassword')}{' '}
          <Link to="/login" className="text-link underline">{t('auth.forgotPassword.logIn')}</Link>
        </p>
      </form>
    </AuthCard>
  )
}
