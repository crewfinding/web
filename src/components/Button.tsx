import { Spinner, type Icon } from '@phosphor-icons/react'
import { cloneElement, forwardRef, isValidElement } from 'react'
import type { ButtonHTMLAttributes, ReactElement } from 'react'
import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: Icon
  iconRight?: Icon
  loading?: boolean
  fullWidth?: boolean
  asChild?: boolean
}

const base =
  'inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  secondary: 'border border-hairline bg-surface-1 text-ink hover:bg-surface-2',
  // Outline treatment: a filled red background cannot meet AA contrast in dark mode
  danger: 'border border-error bg-transparent text-error hover:bg-error/10',
  ghost: 'border border-transparent bg-transparent text-ink-subtle hover:bg-surface-2 hover:text-ink',
  link: 'border-none bg-transparent text-link hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 gap-1.5 px-2.5 text-xs',
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
}

const iconSizes: Record<ButtonSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      iconLeft: IconLeft,
      iconRight: IconRight,
      loading = false,
      fullWidth = false,
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const iconOnly = !children && !!(IconLeft || IconRight || loading)

    const classes = cn(
      base,
      variants[variant],
      // The link variant hugs its text: no fixed height or padding
      variant !== 'link' && sizes[size],
      variant !== 'link' && iconOnly && 'aspect-square px-0',
      fullWidth && 'w-full',
      className,
    )

    // Minimal slot: merge computed classes onto the child (e.g. a router <Link>).
    // The child keeps its own props and ref; icons and loading do not apply.
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>
      return cloneElement(child, { className: cn(classes, child.props.className) })
    }

    return (
      <button ref={ref} className={classes} aria-busy={loading || undefined} {...props}>
        {loading ? (
          <Spinner className={cn(iconSizes[size], 'animate-spin')} aria-hidden="true" />
        ) : (
          IconLeft && <IconLeft weight="bold" className={iconSizes[size]} aria-hidden="true" />
        )}
        {children}
        {IconRight && <IconRight weight="bold" className={iconSizes[size]} aria-hidden="true" />}
      </button>
    )
  },
)

Button.displayName = 'Button'
