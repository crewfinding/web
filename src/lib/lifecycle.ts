import type { IAuditEventDTO, IMemberDTO } from '@fonderie/client'

// The lifecycle and activity rules (docs/parity/4-lifecycle.md), pure.

/** What the Workspace card shows: nothing, the owner's Archive, or the archived state (Restore for the owner). */
export function archiveCardMode(opts: {
  isPersonal: boolean
  isArchived: boolean
  isOwner: boolean
  permsLoading: boolean
}): 'none' | 'archive' | 'archived' {
  if (opts.isPersonal) return 'none'
  if (opts.isArchived) return 'archived'
  // A manager or member of an active workspace has nothing to do here.
  return opts.isOwner && !opts.permsLoading ? 'archive' : 'none'
}

/** Roles may be written by managers — never while the workspace is archived. */
export const canWriteRoles = (isManager: boolean, isArchived: boolean): boolean => isManager && !isArchived

/** Who did it: a member's name, "System" without an actor, "A former member" otherwise. */
export function actorOf<M extends Pick<IMemberDTO, 'userId'>>(
  event: Pick<IAuditEventDTO, 'actorId'>,
  members: readonly M[],
  name: (m: M) => string,
): { kind: 'system' } | { kind: 'member'; name: string } | { kind: 'former' } {
  if (!event.actorId) return { kind: 'system' }
  const m = members.find((x) => x.userId === event.actorId)
  return m ? { kind: 'member', name: name(m) } : { kind: 'former' }
}
