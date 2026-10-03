import { useVerifyEmail } from '@fonderie/react-auth'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AuthCard from '../components/AuthCard'
import { Button } from '../components/Button'
import { OtpInput } from '../components/OtpInput'
import { useTranslation } from '../hooks/useTranslation'
import { applyAuthError } from '../lib/authErrors'
import { useAppSession } from '../lib/session'

const CODE_LENGTH = 6

interface VerifyValues {
  code: string
}

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { verifyEmail, resend, resent, isLoading } = useVerifyEmail()
  const { refresh } = useAppSession()

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<VerifyValues>({ defaultValues: { code: '' } })
  const code = watch('code')

  const onSubmit = async ({ code }: VerifyValues) => {
    try {
      await verifyEmail(code)
      await refresh({ force: true })
      toast.success(t('auth.verifyEmail.success'))
      navigate('/')
    } catch (err) {
      applyAuthError(
        err,
        setError,
        { VERIFICATION_FAILED: 'code', token: 'code' },
        t('auth.verifyEmail.failed'),
      )
    }
  }

  const handleResend = async () => {
    try {
      await resend()
      toast.success(t('auth.verifyEmail.resendSuccess'), { description: t('auth.verifyEmail.resendSuccessDescription') })
    } catch (err) {
      applyAuthError(err, setError, {}, t('auth.verifyEmail.resendFailed'))
    }
  }

  return (
    <AuthCard title={t('auth.verifyEmail.title')} subtitle={t('auth.verifyEmail.subtitle')}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6">
          <p id="otp-label" className="mb-1.5 text-sm font-medium text-ink">{t('auth.verifyEmail.codeLabel')}</p>
          <Controller
            control={control}
            name="code"
            rules={{
              validate: (value) =>
                value.length === CODE_LENGTH || t('auth.verifyEmail.errors.codeLength'),
            }}
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                length={CODE_LENGTH}
                aria-labelledby="otp-label"
              />
            )}
          />
          {errors.code && <p className="mt-1.5 text-center text-xs text-error">{errors.code.message}</p>}
          <p className="mt-1.5 text-center text-xs text-ink-subtle">{t('auth.verifyEmail.expires')}</p>
        </div>
        <Button type="submit" fullWidth loading={isLoading} disabled={code.length !== CODE_LENGTH}>
          {t('auth.verifyEmail.submit')}
        </Button>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          {t('auth.verifyEmail.noCode')}{' '}
          <Button variant="link" type="button" onClick={() => void handleResend()} disabled={resent}>
            {resent ? t('auth.verifyEmail.codeSent') : t('auth.verifyEmail.resend')}
          </Button>
        </p>
      </form>
    </AuthCard>
  )
}
