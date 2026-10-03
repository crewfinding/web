import type { CSSProperties } from 'react'
import { cn } from '../lib/cn'

interface StatusIconProps {
  status: 'success' | 'error'
  className?: string
}

/**
 * Animated result icon (sweetalert-style, no dependency): the ring draws on
 * first, then the check or cross strokes draw in. Pure SVG + the theme's
 * `draw` keyframe; prefers-reduced-motion shows the finished icon instantly.
 * Color comes from currentColor — override via className (e.g. a muted
 * "cancelled" uses status="error" with text-ink-subtle).
 */
export function StatusIcon({ status, className }: StatusIconProps) {
  const success = status === 'success'

  // stroke-dasharray must match each shape's real length for a clean draw
  const stroke = (length: number, delayMs: number): CSSProperties =>
    ({
      strokeDasharray: length,
      '--draw-length': length,
      animationDelay: `${delayMs}ms`,
    }) as CSSProperties

  return (
    <svg
      viewBox="0 0 52 52"
      className={cn('mx-auto h-12 w-12', success ? 'text-success' : 'text-error', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="26" cy="26" r="24" className="motion-reduce:animate-none animate-draw" style={stroke(151, 0)} />
      {success ? (
        <path d="M15 27l7.5 7.5L37 20" className="motion-reduce:animate-none animate-draw" style={stroke(36, 250)} />
      ) : (
        <>
          <path d="M18 18l16 16" className="motion-reduce:animate-none animate-draw" style={stroke(24, 250)} />
          <path d="M34 18L18 34" className="motion-reduce:animate-none animate-draw" style={stroke(24, 400)} />
        </>
      )}
    </svg>
  )
}
