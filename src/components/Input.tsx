import { Eye, EyeSlash, type Icon } from '@phosphor-icons/react'
import { forwardRef, useCallback, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/cn'

export type InputFormat = 'none' | 'phone' | 'credit-card'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  helperText?: string
  error?: string
  warning?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'url' | 'number'
  iconLeft?: Icon
  iconRight?: Icon
  format?: InputFormat
  containerClassName?: string
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatCreditCard(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      warning,
      type = 'text',
      iconLeft: IconLeft,
      iconRight: IconRight,
      format = 'none',
      className,
      containerClassName,
      disabled,
      onChange,
      value,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation()
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        let nextValue = e.target.value

        if (format === 'phone') nextValue = formatPhone(nextValue)
        if (format === 'credit-card') nextValue = formatCreditCard(nextValue)

        // A formatted value is written back natively so the re-dispatched input
        // event reaches React with the final text exactly once
        if (nextValue !== e.target.value) {
          const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
          native?.set?.call(e.target, nextValue)
          e.target.dispatchEvent(new Event('input', { bubbles: true }))
          return
        }

        onChange?.(e)
      },
      [format, onChange],
    )

    const hasError = !!error
    const hasWarning = !!warning && !hasError
    const message = error || warning || helperText
    const messageId = props.id && message ? `${props.id}-message` : undefined

    const stateClasses = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : hasWarning
        ? 'border-warning focus:border-warning focus:ring-warning/20'
        : 'border-hairline focus:border-primary focus:ring-primary/20'

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={props.id} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        )}

        <div className="relative">
          {IconLeft && (
            <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              <IconLeft className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            className={cn(
              'w-full rounded-lg border bg-surface-1 text-ink transition-all',
              'placeholder:text-ink-subtle',
              'focus:ring-2 focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-subtle',
              IconLeft ? 'pl-10' : 'pl-3',
              isPassword || IconRight ? 'pr-10' : 'pr-3',
              'h-11 py-2.5',
              stateClasses,
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={messageId}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink-subtle transition-colors hover:text-ink"
              aria-label={showPassword ? t('common.input.hidePassword') : t('common.input.showPassword')}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}

          {IconRight && !isPassword && (
            <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
              <IconRight className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            </div>
          )}
        </div>

        {message && (
          <p
            id={messageId}
            className={cn(
              'mt-1.5 text-xs',
              hasError ? 'text-error' : hasWarning ? 'text-warning' : 'text-ink-subtle',
            )}
          >
            {message}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
