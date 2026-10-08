import { useWorkspaceId } from '@fonderie/react'
import { useCurrentWorkspace as useWorkspaceRead } from '@fonderie/react-workspaces'
import { fonderie } from '../../../lib/fonderie'

/** The read of the selected workspace, with its loading / failed / not-found states. */
export function useSelectedWorkspace() {
  const { workspace, isLoading, error, refresh } = useWorkspaceRead()
  const activeId = useWorkspaceId(fonderie)
  // Right after a workspace switch the read may still hold the previous
  // workspace — never show (or let anyone edit) it under the new one.
  const current = workspace && (!activeId || workspace.id === activeId) ? workspace : null
  const retry = () => void refresh({ force: true }).catch(() => undefined)
  return { current, pending: !current && (isLoading || !!workspace), error: current ? null : error, retry }
}
