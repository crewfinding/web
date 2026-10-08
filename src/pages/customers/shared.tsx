import { ArrowLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { customerInitials } from '../../lib/customers'

// Pieces every Customers page shares (docs/parity/5-customers.md).

export function CustomerAvatar({
  customer,
  blacklisted,
  size = 'md',
}: {
  customer: Parameters<typeof customerInitials>[0]
  blacklisted: boolean
  size?: 'md' | 'lg'
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-hairline bg-surface-2 font-semibold text-ink-subtle',
          size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm',
        )}
        aria-hidden="true"
      >
        {customerInitials(customer)}
      </span>
      {blacklisted ? (
        <span
          className={cn('absolute right-0 bottom-0 rounded-full border-2 border-surface-1 bg-error', size === 'lg' ? 'h-4 w-4' : 'h-3 w-3')}
          aria-hidden="true"
        />
      ) : null}
    </span>
  )
}

/** A pill to pick from a few (label chips, type, language). */
export function Chip({
  on,
  onClick,
  children,
  role = 'radio',
  testId,
}: {
  on: boolean
  onClick: () => void
  children: ReactNode
  role?: 'radio' | 'button'
  testId?: string
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? on : undefined}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors',
        on ? 'border-primary bg-primary/10 font-medium text-link' : 'border-hairline text-ink-muted hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  )
}

/** A centred state (loading, empty, error) with an optional action. */
export function StateBlock({ title, body, action, testId }: { title?: string; body?: string; action?: ReactNode; testId?: string }) {
  return (
    <div className="py-12 text-center" data-testid={testId}>
      {title ? <p className="text-base font-semibold text-ink">{title}</p> : null}
      {body ? <p className="mx-auto mt-1 max-w-md text-sm text-ink-subtle">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

/** "← Back" to the list. */
export function BackLink() {
  const { t } = useTranslation()
  return (
    <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-link hover:underline">
      <ArrowLeft size={14} aria-hidden="true" />
      {t('customers.back')}
    </Link>
  )
}
