import { usePermissions } from '@fonderie/react-workspaces'
import { Link } from 'react-router-dom'
import { Notice } from './Notice'
import { useTranslation } from '../hooks/useTranslation'
import { useWorkspaceArchived } from '../hooks/useWorkspaceArchived'

/**
 * "This workspace is archived: read-only." on the pages people work from
 * while the SELECTED workspace is archived. The owner gets the way to restore
 * it (the Organization page); everyone else is told only the owner can.
 */
export function ArchivedWorkspaceBanner({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { isArchived } = useWorkspaceArchived()
  const { isOwner } = usePermissions()
  if (!isArchived) return null
  return (
    <Notice
      tone="warning"
      className={className}
      action={
        isOwner ? (
          <Link to="/organization" className="text-sm font-semibold text-ink underline" data-testid="archived-workspace-restore">
            {t('org.archived.restore')}
          </Link>
        ) : undefined
      }
    >
      <span data-testid="archived-workspace-banner">{t(isOwner ? 'org.archived.owner' : 'org.archived.member')}</span>
    </Notice>
  )
}
