import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/cn'

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  error?: boolean
  /** id of the visible label element naming the group */
  'aria-labelledby'?: string
  className?: string
}

const onlyDigits = (s: string) => s.replace(/\D/g, '')

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error = false,
  'aria-labelledby': ariaLabelledby,
  className,
}: OtpInputProps) {
  const { t } = useTranslation()
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const commit = (next: string[]) => {
    const joined = next.join('')
    onChange(joined)
    if (joined.length === length) onComplete?.(joined)
  }

  // Writes a run of digits starting at an index; used by typing, paste, and
  // OS one-time-code autofill (which drops the whole code into one input)
  const insertAt = (index: number, raw: string) => {
    const incoming = onlyDigits(raw)
    if (!incoming) return
    const next = digits.slice()
    let cursor = index
    for (const digit of incoming) {
      if (cursor >= length) break
      next[cursor] = digit
      cursor += 1
    }
    commit(next)
    refs.current[Math.min(cursor, length - 1)]?.focus()
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.slice()
      if (digits[index]) {
        next[index] = ''
        commit(next)
      } else if (index > 0) {
        next[index - 1] = ''
        commit(next)
        refs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    insertAt(index, e.clipboardData.getData('text'))
  }

  return (
    <div role="group" aria-labelledby={ariaLabelledby} className={cn('flex justify-center gap-2', className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={t('auth.otp.digit', { index: i + 1, total: length })}
          aria-invalid={error || undefined}
          onChange={(e) => insertAt(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-11 w-10 rounded-md border bg-surface-1 text-center text-lg text-ink transition-colors outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary-focus/50',
            'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-subtle',
            error ? 'border-error' : 'border-hairline',
          )}
        />
      ))}
    </div>
  )
}
