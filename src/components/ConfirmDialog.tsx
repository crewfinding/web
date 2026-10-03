import { Button } from './Button'
import { Card } from './Card'
import { DialogShell } from './DialogShell'
import { useTranslation } from '../hooks/useTranslation'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <DialogShell open={open} labelledBy="confirm-dialog-title" onClose={onClose}>
      <Card className="p-6">
        <h2 id="confirm-dialog-title" className="text-card-title text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-subtle">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} autoFocus>
            {cancelLabel ?? t('common.dialog.goBack')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </DialogShell>
  )
}
