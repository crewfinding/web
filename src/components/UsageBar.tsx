import { cn } from '../lib/cn'
import { Progress } from './Progress'

type UsageStatus = 'success' | 'warning' | 'error'

const statusColor: Record<UsageStatus, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
}

export function UsageBar({
  label,
  used,
  total,
  suffix = '',
  status,
  valueText,
}: {
  label: string
  used: number
  total: number
  suffix?: string
  status?: UsageStatus
  valueText?: string
}) {
  const unlimited = total === Infinity
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <p className="text-ink-subtle">{label}</p>
        <p className={cn('font-medium', status ? statusColor[status] : 'text-ink')}>
          {valueText ?? `${used} / ${total}${suffix ? ` ${suffix}` : ''}`}
        </p>
      </div>
      <Progress aria-label={label} value={unlimited ? 100 : used} max={unlimited ? 100 : total} />
    </div>
  )
}
