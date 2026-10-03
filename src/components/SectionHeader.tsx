import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

// Shared Settings-section header: an icon, a title, and a one-line description,
// with an optional right-aligned action (a button or control). Every Settings
// card uses this so the sections read as one consistent set.
export function SectionHeader({
  icon: IconCmp,
  title,
  description,
  tone = 'default',
  action,
}: {
  icon: Icon
  title: string
  description: string
  tone?: 'default' | 'error'
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <IconCmp
          className={cn('mt-0.5 h-5 w-5 shrink-0', tone === 'error' ? 'text-error' : 'text-ink-subtle')}
          aria-hidden="true"
        />
        <div>
          <h2 className={cn('text-card-title', tone === 'error' ? 'text-error' : 'text-ink')}>{title}</h2>
          <p className="mt-1 text-sm text-ink-subtle">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}
