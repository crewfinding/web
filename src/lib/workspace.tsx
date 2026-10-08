import type { IWorkspaceDTO } from '@fonderie/client'
import { useWorkspaceId } from '@fonderie/react'
import { useWorkspaces } from '@fonderie/react-workspaces'
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react'
import { fonderie } from './fonderie'

// Everything CrewFinding keeps — jobs, customers, members, the plan and its
// invoices — belongs to a WORKSPACE, sent as X-Workspace-ID by the client.
// The selection lives on the client (fonderie.setWorkspaceId), so every hook
// re-reads the new workspace on a switch, and is remembered in this browser.

const STORAGE_KEY = 'crewfinding.workspace'

interface IWorkspaceContext {
  workspaces: IWorkspaceDTO[]
  current: IWorkspaceDTO | null
  select: (id: string) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<IWorkspaceContext | null>(null)

function remembered(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function remember(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // blocked storage: the next visit picks the default again
  }
}

/**
 * Open the app on this workspace — after joining one, for instance. Callable
 * outside <WorkspaceProvider> (the invitation pages sit outside it): the
 * provider keeps the selection as long as its list holds the id, so refresh
 * the workspace list BEFORE calling this.
 */
export function switchToWorkspace(id: string): void {
  remember(id)
  fonderie.setWorkspaceId(id)
}

/** The one to open on: the last one used here, else the personal one, else the first. */
export function pickWorkspace(list: IWorkspaceDTO[], last: string | null): IWorkspaceDTO | null {
  return list.find((w) => w.id === last) ?? list.find((w) => w.type === 'PERSONAL') ?? list[0] ?? null
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspaces, isLoading } = useWorkspaces()
  const currentId = useWorkspaceId(fonderie)

  useEffect(() => {
    if (isLoading || workspaces.length === 0) return
    // Keep a valid selection; recover from one that no longer exists (left,
    // removed, archived) without showing its data for a moment.
    if (currentId && workspaces.some((w) => w.id === currentId)) return
    const next = pickWorkspace(workspaces, remembered())
    if (next) fonderie.setWorkspaceId(next.id)
  }, [isLoading, workspaces, currentId])

  const select = useCallback((id: string) => switchToWorkspace(id), [])

  const current = workspaces.find((w) => w.id === currentId) ?? null
  return (
    <WorkspaceContext.Provider value={{ workspaces, current, select, isLoading }}>{children}</WorkspaceContext.Provider>
  )
}

export function useCurrentWorkspace(): IWorkspaceContext {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useCurrentWorkspace: wrap the app in <WorkspaceProvider>.')
  return ctx
}
