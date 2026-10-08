import {
  useCurrentWorkspace as useWorkspaceRead,
  usePermissions,
  useWorkspaceProfile,
  useWorkspaces,
} from '@fonderie/react-workspaces'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './Button'
import { Card } from './Card'
import { useConfirm } from '../hooks/useConfirm'
import { useDatePreference } from '../hooks/useDatePreference'
import { useTranslation } from '../hooks/useTranslation'
import { useWorkspaceArchived } from '../hooks/useWorkspaceArchived'
import { errorMessage } from '../lib/apiErrors'
import { archiveCardMode } from '../lib/lifecycle'
import { useCurrentWorkspace } from '../lib/workspace'

/**
 * Archive / restore — the owner's alone (the server answers 403
 * OWNER_REQUIRED to anyone else). Archived, the workspace is read-only for
 * everyone and its plan ends at the end of the billing period; restoring
 * before then keeps the plan. The mobile app's WorkspaceArchiveCard.
 */
export function WorkspaceArchiveCard() {
  const { t } = useTranslation()
  const formatDate = useDatePreference()
  const { current } = useCurrentWorkspace()
  const { isOwner, isLoading: permsLoading } = usePermissions()
  const { isArchived, archivedAt } = useWorkspaceArchived()
  const { archiveWorkspace, restoreWorkspace } = useWorkspaceProfile()
  const { refresh: refreshList } = useWorkspaces()
  const { refresh: refreshWorkspace } = useWorkspaceRead()
  const { confirm, element: confirmDialog } = useConfirm()
  const [busy, setBusy] = useState(false)

  if (!current) return null
  const name = current.name
  const mode = archiveCardMode({ isPersonal: !!current.isPersonal, isArchived, isOwner, permsLoading })
  if (mode === 'none') return null

  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true)
    try {
      await action()
      toast.success(done)
      // The badge, the banners and the read-only pages follow.
      await Promise.all([refreshWorkspace({ force: true }), refreshList({ force: true })]).catch(() => undefined)
    } catch (err) {
      toast.error(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card as="section" className="space-y-3 p-5" data-testid="workspace-archive-card" aria-labelledby="workspace-card-title">
      {confirmDialog}
      <h3 id="workspace-card-title" className="text-base font-semibold text-ink">
        {t('org.workspace.title')}
      </h3>
      {mode === 'archived' ? (
        <>
          <p className="text-sm text-ink-subtle">
            {archivedAt ? t('org.workspace.archivedOn', { date: formatDate(archivedAt) }) : t('org.workspace.archivedUndated')}
          </p>
          {isOwner ? (
            <Button
              loading={busy}
              disabled={busy}
              onClick={() =>
                confirm({
                  title: t('org.workspace.restoreTitle', { workspace: name }),
                  description: t('org.workspace.restoreConfirm'),
                  confirmLabel: t('org.workspace.restoreOk'),
                  cancelLabel: t('org.workspace.cancel'),
                  onConfirm: () => void run(restoreWorkspace, t('org.workspace.restoreDone', { workspace: name })),
                })
              }
            >
              {t('org.workspace.restore')}
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm text-ink-subtle">{t('org.workspace.archiveText')}</p>
          <Button
            variant="danger"
            loading={busy}
            disabled={busy}
            onClick={() =>
              confirm({
                title: t('org.workspace.archiveTitle', { workspace: name }),
                description: t('org.workspace.archiveConfirm'),
                confirmLabel: t('org.workspace.archiveOk'),
                cancelLabel: t('org.workspace.cancel'),
                danger: true,
                onConfirm: () => void run(archiveWorkspace, t('org.workspace.archiveDone', { workspace: name })),
              })
            }
          >
            {t('org.workspace.archive')}
          </Button>
        </>
      )}
    </Card>
  )
}
