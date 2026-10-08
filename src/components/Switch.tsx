import { cn } from '../lib/cn'

// An on/off switch (the mobile app's Switch): one tab stop, aria-checked.
export function Switch({
  checked,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label': string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-surface-3',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
