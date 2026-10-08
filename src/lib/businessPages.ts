import { FonderieApiError } from '@fonderie/client'
import type { IWorkspaceLocationDTO } from '@fonderie/client'

// The Business pages' interaction rules (docs/ux/BUSINESS-SCREEN.md §2, §5),
// pure so a test can pin them: who may edit, which banner shows, when a
// list offers "+" and its add form, what a location's ⋯ offers.

export interface IPageAccess {
  /** Fields enabled and a Save footer. */
  canEdit: boolean
  /** One banner under the paragraph: archived (warning) or read-only (neutral); none while permissions load. */
  banner: 'archived' | 'readonly' | null
}

/**
 * Owner or manager edits, never while the permissions load and never in an
 * archived workspace (read-only for everyone). While the permissions load the
 * values show read-only, with no banner.
 */
export function pageAccess(opts: { isManager: boolean; permsLoading: boolean; isArchived: boolean }): IPageAccess {
  if (opts.isArchived) return { canEdit: false, banner: 'archived' }
  if (opts.permsLoading) return { canEdit: false, banner: null }
  return opts.isManager ? { canEdit: true, banner: null } : { canEdit: false, banner: 'readonly' }
}

export interface IListControls {
  /** The "+" at the right of the list's title. */
  plus: boolean
  /** The add form, in place under the list — only once "+" was pressed. */
  form: boolean
  /** The ⋯ on each item (make primary, edit label, remove). */
  itemMenu: boolean
}

/** Emails / Phone numbers: "+" opens the add form on demand; read-only has neither, nor the item ⋯. */
export function listControls(canEdit: boolean, adding: boolean): IListControls {
  return { plus: canEdit && !adding, form: canEdit && adding, itemMenu: canEdit }
}

export type LocationAction = 'edit' | 'maps' | 'makeHeadOffice' | 'archive' | 'restore'

/**
 * A location's ⋯: Edit · Open in Maps · Make head office (not on the head
 * office) · Archive; an archived one: Restore only. Read-only: Open in Maps
 * only (nothing on an archived one).
 */
export function locationActions(l: Pick<IWorkspaceLocationDTO, 'isArchived' | 'isHeadOffice'>, canEdit: boolean): LocationAction[] {
  if (l.isArchived) return canEdit ? ['restore'] : []
  const out: LocationAction[] = []
  if (canEdit) out.push('edit')
  out.push('maps')
  if (canEdit && !l.isHeadOffice) out.push('makeHeadOffice')
  if (canEdit) out.push('archive')
  return out
}

/** A live location opens its form when clicked — for those who may edit. */
export const locationOpens = (l: Pick<IWorkspaceLocationDTO, 'isArchived'>, canEdit: boolean): boolean => canEdit && !l.isArchived

/** The write was refused because the workspace is archived: the page re-reads it and turns read-only. */
export const isArchivedRefusal = (err: unknown): boolean => err instanceof FonderieApiError && err.reason === 'WORKSPACE_ARCHIVED'
