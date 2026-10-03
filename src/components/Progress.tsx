import { cn } from '../lib/cn'

interface ProgressProps {
  value: number
  max?: number
  /** Activity with no measurable fraction — renders a pulsing full bar. */
  indeterminate?: boolean
  'aria-label': string
  className?: string
}

export function Progress({ value, max = 100, indeterminate, 'aria-label': ariaLabel, className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-primary/10', className)}
    >
      {/* Fill stays w-full; translateX hides the unused portion so the width
          never reflows during transitions */}
      <div
        className={cn('h-full w-full bg-primary transition-all', indeterminate && 'animate-pulse')}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - pct}%)` }}
      />
    </div>
  )
}
