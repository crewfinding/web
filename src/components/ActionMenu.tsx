import { DotsThree, type Icon } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { IconButton } from './IconButton'

export interface IActionMenuItem {
  label: string
  icon?: Icon
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
}

// The "⋯" on a row: what may be done to it, as a menu (the mobile app's
// action sheet). Offered only when there is at least one item.
export function ActionMenu({
  label,
  title,
  items,
  disabled,
}: {
  /** The button's accessible name ("Actions for Ana"). */
  label: string
  /** Shown at the top of the open menu. */
  title?: string
  items: IActionMenuItem[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (items.length === 0) return null
  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <IconButton
        icon={DotsThree}
        variant="ghost"
        size="sm"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div id={menuId} role="menu" aria-label={title ?? label} className="card absolute top-full right-0 z-40 mt-1 w-64 p-1">
          {title && <p className="truncate px-2 pt-1 pb-1.5 text-xs font-medium text-ink-subtle">{title}</p>}
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50',
                item.danger ? 'text-error' : 'text-ink-muted hover:text-ink',
              )}
            >
              {item.icon && <item.icon size={14} aria-hidden="true" className="w-4 shrink-0" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
