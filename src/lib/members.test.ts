import { describe, expect, it } from 'vitest'
import {
  MEMBERS_PAGE_SIZE,
  canUnassignRole,
  chipRoles,
  customRolesOf,
  hasAnyAction,
  inviteConflict,
  inviteEmailProblem,
  isOpenInvitation,
  lostAccess,
  memberActions,
  memberInitials,
  nextPage,
  offerCandidates,
  roleLabelKey,
} from './members'

const owner = { userId: 'o', isOwner: true, isManager: true }
const manager = { userId: 'm', isOwner: false, isManager: true }
const member = { userId: 'u', isOwner: false, isManager: false }
const team = { isPersonal: false, hasCustomRoles: true }

describe('memberActions (who may do what to whom)', () => {
  it('owner on a member: everything but leave', () => {
    expect(memberActions(owner, member, team)).toEqual({
      assignRoles: true,
      makeManager: true,
      unsetManager: false,
      transferOwnership: true,
      remove: true,
      leave: false,
      releaseBrake: false,
    })
  })

  it('owner on a manager: unset, not make', () => {
    const a = memberActions(owner, manager, team)
    expect(a.makeManager).toBe(false)
    expect(a.unsetManager).toBe(true)
  })

  it('owner on a paused member: may let them delete again', () => {
    expect(memberActions(owner, { ...member, paused: true }, team).releaseBrake).toBe(true)
    expect(memberActions(manager, { ...member, paused: true }, team).releaseBrake).toBe(false)
  })

  it('manager: roles and remove, never owner-only moves', () => {
    const a = memberActions(manager, member, team)
    expect(a).toMatchObject({ assignRoles: true, remove: true, makeManager: false, unsetManager: false, transferOwnership: false })
  })

  it('nobody acts on the owner (not even a manager), and roles need custom roles', () => {
    expect(hasAnyAction(memberActions(manager, owner, team))).toBe(false)
    expect(memberActions(manager, member, { ...team, hasCustomRoles: false }).assignRoles).toBe(false)
  })

  it('a member sees nothing on others; on self only leave (and roles if a manager)', () => {
    expect(hasAnyAction(memberActions(member, manager, team))).toBe(false)
    expect(memberActions(member, member, team)).toMatchObject({ leave: true, assignRoles: false, remove: false })
    expect(memberActions(manager, manager, team)).toMatchObject({ leave: true, assignRoles: true, remove: false })
  })

  it('the owner cannot leave (transfers first)', () => {
    expect(hasAnyAction(memberActions(owner, owner, { ...team, hasCustomRoles: false }))).toBe(false)
  })

  it('a personal workspace or an unknown viewer: nothing', () => {
    expect(hasAnyAction(memberActions(owner, member, { ...team, isPersonal: true }))).toBe(false)
    expect(hasAnyAction(memberActions({ ...owner, userId: '' }, member, team))).toBe(false)
  })

  it('archived: only transfer and leave remain', () => {
    const archived = { ...team, isArchived: true }
    expect(memberActions(owner, { ...member, paused: true }, archived)).toEqual({
      assignRoles: false,
      makeManager: false,
      unsetManager: false,
      transferOwnership: true,
      remove: false,
      leave: false,
      releaseBrake: false,
    })
    expect(memberActions(member, member, archived).leave).toBe(true)
  })
})

describe('roles', () => {
  const custom = { id: 'c', name: 'Dispatcher', isSystem: false }
  const guest = { id: 'g', name: 'GUEST', isSystem: true }
  it('never takes off a system role or the last role', () => {
    expect(canUnassignRole(custom, [custom])).toBe(false)
    expect(canUnassignRole(custom, [guest, custom])).toBe(true)
    expect(canUnassignRole(guest, [guest, custom])).toBe(false)
  })
  it('system roles read as Member / Manager / Owner', () => {
    expect(roleLabelKey(guest)).toBe('team.role.guest')
    expect(roleLabelKey({ name: 'admin', isSystem: true })).toBe('team.role.admin')
    expect(roleLabelKey(custom)).toBeNull()
  })
  it('drops the chips the badges already say', () => {
    const roles = [{ id: 'o', name: 'OWNER', isSystem: true }, { id: 'a', name: 'ADMIN', isSystem: true }, custom]
    expect(chipRoles({ roles, isOwner: true, isManager: true }).map((r) => r.id)).toEqual(['c'])
    expect(chipRoles({ roles, isOwner: false, isManager: false }).map((r) => r.id)).toEqual(['o', 'a', 'c'])
  })
  it('hands out only active custom roles', () => {
    const list = [
      { ...custom, active: true, description: '', workspaceId: 'w' },
      { ...custom, id: 'x', active: false, description: '', workspaceId: 'w' },
      { ...guest, active: true, description: '', workspaceId: 'w' },
    ]
    expect(customRolesOf(list).map((r) => r.id)).toEqual(['c'])
  })
})

describe('invitations', () => {
  const pending = { email: 'ana@acme.example', isExpired: false, status: 'PENDING' }
  it('open = pending and not expired', () => {
    expect(isOpenInvitation(pending)).toBe(true)
    expect(isOpenInvitation({ ...pending, isExpired: true })).toBe(false)
    expect(isOpenInvitation({ ...pending, status: 'ACCEPTED' })).toBe(false)
  })
  it('refuses a member or an open invitation, case- and space-insensitively', () => {
    expect(inviteConflict(' ANA@acme.example ', [], [pending])).toBe('pending')
    expect(inviteConflict('bo@acme.example', [{ email: 'Bo@Acme.example' }], [])).toBe('member')
    expect(inviteConflict('ana@acme.example', [], [{ ...pending, isExpired: true }])).toBeNull()
  })
  it('checks the email like the app', () => {
    expect(inviteEmailProblem('  ')).toBe('team.invite.error.empty')
    expect(inviteEmailProblem('nope')).toBe('team.invite.error.email')
    expect(inviteEmailProblem(`${'a'.repeat(250)}@x.io`)).toBe('team.invite.error.email')
    expect(inviteEmailProblem('ana@acme.example')).toBeNull()
  })
})

describe('paging and access', () => {
  it('reads 25 rows a page', () => expect(MEMBERS_PAGE_SIZE).toBe(25))
  it('members first, then invitations for managers', () => {
    expect(nextPage({ membersHasMore: true, invitationsHasMore: true, isManager: true })).toBe('members')
    expect(nextPage({ membersHasMore: false, invitationsHasMore: true, isManager: true })).toBe('invitations')
    expect(nextPage({ membersHasMore: false, invitationsHasMore: true, isManager: false })).toBeNull()
    expect(nextPage({ membersHasMore: false, invitationsHasMore: false, isManager: true })).toBeNull()
  })
  it('lost access = 403/404 with nothing shown', () => {
    expect(lostAccess({ status: 403 }, 0)).toBe(true)
    expect(lostAccess({ status: 404 }, 0)).toBe(true)
    expect(lostAccess({ status: 403 }, 2)).toBe(false)
    expect(lostAccess({ status: 500 }, 0)).toBe(false)
    expect(lostAccess(null, 0)).toBe(false)
  })
  it('asks for offers only in teams I am in but do not own', () => {
    const ws = [
      { id: 'p', isPersonal: true, ownerId: 'me' },
      { id: 'mine', isPersonal: false, ownerId: 'me' },
      { id: 'here', isPersonal: false, ownerId: 'x' },
      { id: 'there', isPersonal: false, ownerId: 'x' },
    ]
    expect(offerCandidates(ws, 'me', 'here').map((w) => w.id)).toEqual(['there'])
  })
  it('initials from the name, else the email', () => {
    expect(memberInitials({ firstName: 'ana', lastName: 'lima', email: 'a@x.io' })).toBe('AL')
    expect(memberInitials({ firstName: '', lastName: '', email: 'bo@x.io' })).toBe('B')
  })
})
