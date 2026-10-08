/**
 * The team screens' rules, kept pure so a test can pin them: who may do what
 * to whom, how seats and pages are read, what an invitation conflict means.
 * The same rules as the mobile app's utils/members.ts (docs/parity/1-members.md).
 *
 * The server is the security (workspaces routes: requireManager / owner-only /
 * personal-workspace refusals); these only keep the page from offering a
 * button whose one outcome is a 403.
 */
import { formatPersonName } from '@fonderie/client'
import type { IInvitationDTO, IMemberDTO, IMemberRoleDTO, IRoleDTO, IWorkspaceDTO } from '@fonderie/client'
import type { TranslationKey } from '../locales'

/** Rows read per page; "Show more" reads the next one. */
export const MEMBERS_PAGE_SIZE = 25

/** Emails are compared and sent trimmed and lower-cased (the server does the same). */
export const normalizeEmail = (value: string): string => value.trim().toLowerCase()

/** The longest address the server stores (RFC 5321). */
export const EMAIL_MAX_LENGTH = 254

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (value: string): boolean => EMAIL.test(value.trim())

/** A person's name in the order their language writes it, else their email. */
export function memberName(member: Pick<IMemberDTO, 'firstName' | 'lastName' | 'email'>, locale: string): string {
  return formatPersonName(member.firstName, member.lastName, locale) || member.email || ''
}

/** Initials for an avatar without a photo. */
export function memberInitials(member: Pick<IMemberDTO, 'firstName' | 'lastName' | 'email'>): string {
  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.trim()
  return (initials || member.email?.[0] || '?').toUpperCase()
}

export interface IMemberViewer {
  userId: string
  /** The workspace owner. */
  isOwner: boolean
  /** The owner or a manager (usePermissions). False until known. */
  isManager: boolean
}

export interface IMemberActions {
  /** Add / remove custom roles — managers (POST/DELETE /members/:id/roles, requireManager). */
  assignRoles: boolean
  /** Owner only. */
  makeManager: boolean
  /** Owner only; never on the owner (the server refuses). */
  unsetManager: boolean
  /** Owner only, to another member (an offer, after a step-up). */
  transferOwnership: boolean
  /** Managers; never the owner, never yourself (the server refuses both). */
  remove: boolean
  /** Yourself, when you are not the owner (the owner transfers first). */
  leave: boolean
  /** Owner only: someone the velocity brake paused may delete again. */
  releaseBrake: boolean
}

const NONE: IMemberActions = {
  assignRoles: false,
  makeManager: false,
  unsetManager: false,
  transferOwnership: false,
  remove: false,
  leave: false,
  releaseBrake: false,
}

/** What `viewer` may do to `member`'s row. A personal workspace has no team: nothing. */
export function memberActions(
  viewer: IMemberViewer,
  member: Pick<IMemberDTO, 'userId' | 'isOwner' | 'isManager' | 'paused'>,
  opts: { isPersonal: boolean; hasCustomRoles: boolean; isArchived?: boolean },
): IMemberActions {
  if (opts.isPersonal || !viewer.userId) return NONE
  const self = member.userId === viewer.userId
  const assignRoles = viewer.isManager && opts.hasCustomRoles && !member.isOwner
  const can: IMemberActions = self
    ? { ...NONE, assignRoles, leave: !member.isOwner && !viewer.isOwner }
    : {
        assignRoles,
        makeManager: viewer.isOwner && !member.isManager && !member.isOwner,
        unsetManager: viewer.isOwner && member.isManager && !member.isOwner,
        transferOwnership: viewer.isOwner && !member.isOwner,
        remove: viewer.isManager && !member.isOwner,
        leave: false,
        releaseBrake: viewer.isOwner && !!member.paused && !member.isOwner,
      }
  // Archived: only what the server still allows there — handing the team
  // over and leaving.
  return opts.isArchived
    ? { ...can, assignRoles: false, makeManager: false, unsetManager: false, releaseBrake: false, remove: false }
    : can
}

export const hasAnyAction = (actions: IMemberActions): boolean => Object.values(actions).some(Boolean)

/**
 * Whether a custom role may be taken off this member here: only roles the
 * role picker manages (not system ones — ADMIN goes through "manager"), and
 * never the last one (the server refuses: "Cannot remove last role").
 */
export const canUnassignRole = (role: IMemberRoleDTO, held: readonly IMemberRoleDTO[]): boolean =>
  !role.isSystem && held.length > 1

/** The roles a manager hands out: the workspace's own, still active. */
export const customRolesOf = (roles: readonly IRoleDTO[]): IRoleDTO[] =>
  roles.filter((r) => !r.isSystem && r.active !== false)

/** Still waiting for an answer: listed, not accepted, not cancelled, not past its expiry. */
export const isOpenInvitation = (inv: Pick<IInvitationDTO, 'isExpired' | 'status'>): boolean =>
  !inv.isExpired && (!inv.status || inv.status.toUpperCase() === 'PENDING')

/** Why an address cannot simply be invited: already on the team, or already invited. */
export function inviteConflict(
  email: string,
  members: readonly Pick<IMemberDTO, 'email'>[],
  invitations: readonly Pick<IInvitationDTO, 'email' | 'isExpired' | 'status'>[],
): 'member' | 'pending' | null {
  const target = normalizeEmail(email)
  if (!target) return null
  if (members.some((m) => normalizeEmail(m.email ?? '') === target)) return 'member'
  if (invitations.some((i) => isOpenInvitation(i) && normalizeEmail(i.email) === target)) return 'pending'
  return null
}

/** The invite form's email check: the message key, or null when it is fine. */
export function inviteEmailProblem(value: string): TranslationKey | null {
  const email = normalizeEmail(value)
  if (!email) return 'team.invite.error.empty'
  if (email.length > EMAIL_MAX_LENGTH || !isEmail(email)) return 'team.invite.error.email'
  return null
}

/** System roles read as what they mean here; custom roles keep the owner's name. */
export function roleLabelKey(role: Pick<IRoleDTO | IMemberRoleDTO, 'name' | 'isSystem'>): TranslationKey | null {
  if (!role.isSystem) return null
  switch (role.name.toUpperCase()) {
    case 'GUEST':
      return 'team.role.guest'
    case 'ADMIN':
      return 'team.role.admin'
    case 'OWNER':
      return 'team.role.owner'
    default:
      return null
  }
}

export function roleLabel(
  t: (key: TranslationKey) => string,
  role: Pick<IRoleDTO | IMemberRoleDTO, 'name' | 'isSystem'>,
): string {
  if (!role.isSystem) return role.name
  const key = roleLabelKey(role)
  return key ? t(key) : role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase()
}

/** The badges already say owner / manager: no second chip for the same thing. */
export const chipRoles = (member: Pick<IMemberDTO, 'roles' | 'isOwner' | 'isManager'>): IMemberRoleDTO[] =>
  (member.roles ?? []).filter((r) => {
    if (!r.isSystem) return true
    const name = r.name.toUpperCase()
    if (name === 'OWNER' && member.isOwner) return false
    if (name === 'ADMIN' && member.isManager) return false
    return true
  })

/**
 * The lists are paged: the members first, then (for managers, who see them)
 * the invitations, a page at a time. Which list "Show more" reads next, or
 * null when both are complete.
 */
export function nextPage(opts: {
  membersHasMore: boolean
  invitationsHasMore: boolean
  isManager: boolean
}): 'members' | 'invitations' | null {
  if (opts.membersHasMore) return 'members'
  if (opts.isManager && opts.invitationsHasMore) return 'invitations'
  return null
}

/** Removed from this workspace (or it is gone): say so — never spin forever. */
export const lostAccess = (error: { status: number } | null, rows: number): boolean =>
  !!error && (error.status === 403 || error.status === 404) && rows === 0

/** The workspaces an ownership offer to me could be waiting in: not personal, not mine, not `exceptId`. */
export const offerCandidates = <W extends Pick<IWorkspaceDTO, 'id' | 'isPersonal' | 'ownerId'>>(
  workspaces: readonly W[],
  meId: string | undefined,
  exceptId?: string,
): W[] => workspaces.filter((w) => w.id !== exceptId && !w.isPersonal && w.ownerId !== meId)
