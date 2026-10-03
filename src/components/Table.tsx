import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface TableProps {
  children: ReactNode
  /** Extra classes for the <table> element. */
  className?: string
  /** Extra classes for the horizontal-scroll wrapper (e.g. a max-height). */
  wrapperClassName?: string
  // Tables are display surfaces, not copy targets, so text selection is OFF by
  // default — dragging across cells just highlights them and looks broken. Opt
  // back in where copying the data is the point (e.g. scraped results for
  // subscribers).
  selectable?: boolean
}

// Shared table shell: the overflow-x scroll wrapper + a consistently-styled
// <table>. Callers pass their own <thead>/<tbody> and keep whatever outer
// border/Card chrome they need. select-none lives here so every table in the
// app is unselectable by default without each one remembering to add it.
export function Table({ children, className, wrapperClassName, selectable = false }: TableProps) {
  return (
    <div className={cn('overflow-x-auto', wrapperClassName)}>
      <table className={cn('w-full text-sm whitespace-nowrap', !selectable && 'select-none', className)}>
        {children}
      </table>
    </div>
  )
}
