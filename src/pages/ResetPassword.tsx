import { useResetPassword } from '@fonderie/react-auth'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AuthCard from '../components/AuthCard'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { OtpInput } from '../components/OtpInput'
import { useTranslation } from '../hooks/useTranslation'
import { applyAuthError } from '../lib/authErrors'

const PIN_LENGTH = 6

interface ResetValues {
  pin: string
  password: string
  confirmPassword: string
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { resetPassword, isLoading } = useResetPassword()

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    control,
    formState: { errors },
  } = useForm<ResetValues>({ defaultValues: { pin: '' } })

  const onSubmit = async ({ pin, password }: ResetValues) => {
    try {
      await resetPassword({ pin, password })
      toast.success(t('auth.resetPassword.success'))
      navigate('/login')
    } catch (err) {
      applyAuthError(
        err,
        setError,
        { PASSWORD_RESET_FAILED: 'pin', pin: 'pin', password: 'password' },
        t('auth.resetPassword.failed'),
      )
    }
  }

  return (
    <AuthCard title={t('auth.resetPassword.title')} subtitle={t('auth.resetPassword.subtitle')}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <p id="pin-label" className="mb-1.5 text-sm font-medium text-ink">{t('auth.resetPassword.codeLabel')}</p>
          <Controller
            control={control}
            name="pin"
            rules={{
              validate: (value) =>
                value.length === PIN_LENGTH || t('auth.resetPassword.errors.codeLength'),
            }}
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                length={PIN_LENGTH}
                aria-labelledby="pin-label"
              />
            )}
          />
          {errors.pin && <p className="mt-1.5 text-center text-xs text-error">{errors.pin.message}</p>}
        </div>
        <Input
          label={t('auth.resetPassword.newPassword')}
          id="password"
          type="password"
          error={errors.password?.message}
          containerClassName="mb-4"
          {...register('password', {
            required: t('auth.resetPassword.errors.passwordRequired'),
            minLength: { value: 8, message: t('auth.resetPassword.errors.passwordMinLength') },
          })}
        />
        <Input
          label={t('auth.resetPassword.confirmPassword')}
          id="confirmPassword"
          type="password"
          error={errors.confirmPassword?.message}
          containerClassName="mb-6"
          {...register('confirmPassword', {
            required: t('auth.resetPassword.errors.confirmRequired'),
            validate: (value) =>
              value === getValues('password') || t('auth.resetPassword.errors.passwordMismatch'),
          })}
        />
        <Button type="submit" fullWidth loading={isLoading}>{t('auth.resetPassword.submit')}</Button>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          <Link to="/login" className="text-link underline">{t('auth.resetPassword.backToLogin')}</Link>
        </p>
      </form>
    </AuthCard>
  )
}
