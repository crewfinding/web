import { X } from '@phosphor-icons/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './IconButton'
import { useTranslation } from '../hooks/useTranslation'

interface DialogShellProps {
  open: boolean
  labelledBy: string
  onClose: () => void
  /** Wider panel for content-heavy dialogs (defaults to max-w-sm). */
  wide?: boolean
  children: ReactNode
}

/**
 * Shared modal scaffolding, portaled to <body>. In-place rendering let the
 * page's layout leak into the overlay: spacing utilities like space-y-8 put
 * a margin on the overlay, and for a fixed element with top/bottom insets
 * that margin enters the height constraint equation — leaving an undimmed
 * strip. The portal also keeps future ancestor stacking contexts or
 * transforms from capturing the dialog. Click-outside closes via the
 * overlay itself; Escape closes; focus returns to the opener on close.
 */
export function DialogShell({ open, labelledBy, onClose, wide, children }: DialogShellProps) {
  const { t } = useTranslation()
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    return () => restoreRef.current?.focus()
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-overlay/50 motion-reduce:animate-none animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
        className={`fixed inset-x-4 top-1/2 z-50 mx-auto -translate-y-1/2 motion-reduce:animate-none animate-dialog-in ${wide ? 'max-w-md' : 'max-w-sm'}`}
      >
        <div className="relative">
          {children}
          <IconButton
            icon={X}
            size="sm"
            variant="ghost"
            aria-label={t('common.dialog.close')}
            className="absolute top-2 right-2"
            onClick={onClose}
          />
        </div>
      </div>
    </>,
    document.body,
  )
}
