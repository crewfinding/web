import { Info, WarningCircle, XCircle } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

// An inline message in the page: a refusal to explain, a read that failed, a
// state to know about (archived, offered). The mobile app's ErrorAlert.
const tones = {
  info: { box: 'border-primary/30 bg-primary/5', icon: Info, iconClass: 'text-link' },
  warning: { box: 'border-warning/40 bg-warning/10', icon: WarningCircle, iconClass: 'text-warning' },
  error: { box: 'border-error/40 bg-error/5', icon: XCircle, iconClass: 'text-error' },
} as const

export function Notice({
  tone = 'info',
  children,
  action,
  className,
}: {
  tone?: keyof typeof tones
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { box, icon: IconCmp, iconClass } = tones[tone]
  return (
    <div
      role={tone === 'info' ? 'status' : 'alert'}
      className={cn('flex flex-wrap items-start gap-2 rounded-lg border px-4 py-3 text-sm text-ink', box, className)}
    >
      <IconCmp size={18} weight="fill" aria-hidden="true" className={cn('mt-0.5 shrink-0', iconClass)} />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  )
}
