import { describe, expect, it } from 'vitest'
import { actorOf, archiveCardMode, canWriteRoles } from './lifecycle'

describe('the Workspace card (archive / restore)', () => {
  const base = { isPersonal: false, isArchived: false, isOwner: true, permsLoading: false }
  it('owner of an active workspace: Archive', () => expect(archiveCardMode(base)).toBe('archive'))
  it('a manager or member of an active workspace, or while rights load: nothing', () => {
    expect(archiveCardMode({ ...base, isOwner: false })).toBe('none')
    expect(archiveCardMode({ ...base, permsLoading: true })).toBe('none')
  })
  it('archived: everyone sees the state (Restore is the owner’s)', () => {
    expect(archiveCardMode({ ...base, isArchived: true, isOwner: false })).toBe('archived')
  })
  it('a personal workspace is never archived', () => {
    expect(archiveCardMode({ ...base, isPersonal: true, isArchived: true })).toBe('none')
  })
})

describe('archived = read-only', () => {
  it('no role writes while archived, even for a manager', () => {
    expect(canWriteRoles(true, false)).toBe(true)
    expect(canWriteRoles(true, true)).toBe(false)
    expect(canWriteRoles(false, false)).toBe(false)
  })
})

describe('the activity log names who did it', () => {
  const members = [{ userId: 'u1', name: 'Ana' }]
  const name = (m: { name: string }) => m.name
  it('a member, the system, or someone no longer on the team', () => {
    expect(actorOf({ actorId: 'u1' }, members, name)).toEqual({ kind: 'member', name: 'Ana' })
    expect(actorOf({ actorId: null }, members, name)).toEqual({ kind: 'system' })
    expect(actorOf({ actorId: 'gone' }, members, name)).toEqual({ kind: 'former' })
  })
})
