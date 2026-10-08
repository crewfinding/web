import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'

export interface IConfirmRequest {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
}

// One confirm dialog per page, opened with what to ask — the mobile app's
// confirmAction / confirmDestructive.
export function useConfirm() {
  const [request, setRequest] = useState<IConfirmRequest | null>(null)
  const element = (
    <ConfirmDialog
      open={request !== null}
      title={request?.title ?? ''}
      description={request?.description ?? ''}
      confirmLabel={request?.confirmLabel ?? ''}
      cancelLabel={request?.cancelLabel}
      danger={request?.danger}
      onConfirm={() => {
        const run = request?.onConfirm
        setRequest(null)
        run?.()
      }}
      onClose={() => setRequest(null)}
    />
  )
  return { confirm: setRequest, element }
}
