import type { Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

const segmentBase = 'rounded-full px-3 py-1 text-xs font-medium transition-colors'
const activeSegment = 'bg-surface-1 text-ink shadow-sm'

export interface ToggleProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  pressedLabel: string
  unpressedLabel: string
  'aria-label': string
  className?: string
}

// One switch control with two visual segments: a single tab stop whose
// aria-checked state maps to the highlighted side.
export function Toggle({
  pressed,
  onPressedChange,
  pressedLabel,
  unpressedLabel,
  'aria-label': ariaLabel,
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      // The visible segment words must be part of the accessible name (WCAG 2.5.3)
      aria-label={`${ariaLabel}: ${unpressedLabel} ${pressedLabel}`}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'flex cursor-pointer items-center rounded-full border border-hairline bg-surface-2 p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:outline-none',
        className,
      )}
    >
      <span className={cn(segmentBase, !pressed ? activeSegment : 'text-ink-subtle')}>{unpressedLabel}</span>{' '}
      <span className={cn(segmentBase, pressed ? activeSegment : 'text-ink-subtle')}>{pressedLabel}</span>
    </button>
  )
}

export interface ToggleGroupOption<T extends string> {
  value: T
  /** Icon-only segment (the label becomes its accessible name). Omit to show the label as text. */
  icon?: Icon
  label: string
}

export interface ToggleGroupProps<T extends string> {
  type?: 'single'
  value: T
  onValueChange: (value: T) => void
  options: ToggleGroupOption<T>[]
  'aria-label': string
  className?: string
}

export function ToggleGroup<T extends string>({
  value,
  onValueChange,
  options,
  'aria-label': ariaLabel,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex rounded-lg border border-hairline bg-surface-2 p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        const OptionIcon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={OptionIcon ? option.label : undefined}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'flex h-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:outline-none',
              OptionIcon ? 'w-9' : 'px-3 text-sm',
              active ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-subtle hover:text-ink',
            )}
          >
            {OptionIcon ? <OptionIcon size={16} weight={active ? 'fill' : 'regular'} aria-hidden="true" /> : option.label}
          </button>
        )
      })}
    </div>
  )
}
