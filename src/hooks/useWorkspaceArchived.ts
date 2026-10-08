import { useCurrentWorkspace } from '../lib/workspace'

export interface IWorkspaceArchivedState {
  /** The selected workspace is archived: read-only until the owner restores it (writes answer 409 WORKSPACE_ARCHIVED). */
  isArchived: boolean
  archivedAt: string | null
}

/** Whether the SELECTED workspace is archived (the mobile app's useWorkspaceArchived). */
export function useWorkspaceArchived(): IWorkspaceArchivedState {
  const { current } = useCurrentWorkspace()
  const isArchived = !!current?.isArchived
  return { isArchived, archivedAt: isArchived ? current?.archivedAt || null : null }
}
