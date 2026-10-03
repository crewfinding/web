import { User } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

interface AvatarProps {
  /** The user's uploaded avatar URL; a neutral icon is shown when absent. */
  src?: string | null
  alt?: string
  /** Sizing (and any extra) classes, e.g. 'h-16 w-16'. */
  className?: string
}

// The default avatar is a generic, gender-neutral user glyph rather than a stock
// photo of a specific person — we don't assume anyone's identity. We draw our own
// thin circle around the plain User icon (UserCircle's built-in ring is too
// heavy). Once the user uploads an image, that image is shown instead.
export function Avatar({ src, alt = '', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={alt} className={cn('rounded-full object-cover', className)} />
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-ink-subtle',
        className,
      )}
    >
      <User aria-hidden className="h-3/5 w-3/5" />
    </span>
  )
}
