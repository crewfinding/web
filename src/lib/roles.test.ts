import { FonderieApiError } from '@fonderie/client'
import type { IPermissionCatalogEntryDTO } from '@fonderie/client'
import { describe, expect, it } from 'vitest'
import { getMessages, translate, type TranslationKey } from '../locales'
import {
  deleteMessage,
  gridFrom,
  membersHolding,
  mergeGrid,
  nameProblem,
  payloadFrom,
  roleActionError,
  roleDisplayName,
  sameGrid,
  systemRoleGrants,
  systemRoleLines,
} from './roles'

const t = (key: TranslationKey, params?: Record<string, string | number>) => translate(getMessages('en'), key, params)

const catalog: IPermissionCatalogEntryDTO[] = [
  { key: 'jobs', label: 'Jobs', description: '', operations: ['create', 'read', 'update', 'delete'] },
  { key: 'estimates', label: 'Quotes', description: '', operations: ['create', 'read', 'update'] },
  { key: 'bills_of_lading', label: 'Bills of lading', description: '', operations: ['read'] },
]

describe('built-in roles read the server grants', () => {
  it('finds a role case-insensitively; unknown = null (no guess)', () => {
    expect(systemRoleGrants({ guest: { jobs: ['read'] } }, 'GUEST')).toEqual({ jobs: ['read'] })
    expect(systemRoleGrants(undefined, 'GUEST')).toBeNull()
    expect(systemRoleGrants({}, 'GUEST')).toBeNull()
  })
  it('Member: lines in catalog order, the jobs caveat, the catalog label for unknown keys', () => {
    const lines = systemRoleLines(catalog, { jobs: ['update', 'read'], bills_of_lading: ['read'], other: ['read'] }, 'GUEST', t)
    expect(lines).toEqual([
      'Jobs: can view, edit',
      'Bills of lading: can view',
      'Jobs: they edit only the jobs they are assigned to or created.',
    ])
    expect(systemRoleLines(catalog, {}, 'GUEST', t)).toEqual([])
  })
  it('names built-in roles by meaning', () => {
    expect(roleDisplayName({ name: 'ADMIN', isSystem: true }, t)).toBe('Manager')
    expect(roleDisplayName({ name: 'GUEST', isSystem: true }, t)).toBe('Member')
    expect(roleDisplayName({ name: 'GUEST', isSystem: false }, t)).toBe('GUEST')
  })
})

describe('the permission grid', () => {
  it('reads only catalog operations and sends one row per entry', () => {
    const grid = gridFrom(catalog, [{ permissionKey: 'estimates', canCreate: true, canRead: true, canUpdate: false, canDelete: true }])
    expect(grid.estimates).toEqual({ create: true, read: true, update: false })
    expect(grid.jobs).toEqual({ create: false, read: false, update: false, delete: false })
    const payload = payloadFrom(catalog, mergeGrid(grid, { bills_of_lading: { read: true } }))
    expect(payload).toEqual([
      { permissionKey: 'jobs', canCreate: false, canRead: false, canUpdate: false, canDelete: false },
      { permissionKey: 'estimates', canCreate: true, canRead: true, canUpdate: false },
      { permissionKey: 'bills_of_lading', canRead: true },
    ])
  })
  it('knows when nothing changed', () => {
    const grid = gridFrom(catalog, [])
    expect(sameGrid(grid, mergeGrid(grid, {}))).toBe(true)
    expect(sameGrid(grid, mergeGrid(grid, { jobs: { read: true } }))).toBe(false)
  })
})

describe('deleting', () => {
  it('counts holders across all their roles', () => {
    const members = [{ roleId: 'g', roles: [{ id: 'g', name: 'GUEST', isSystem: true }, { id: 'c', name: 'C', isSystem: false }] }, { roleId: 'c', roles: [] }]
    expect(membersHolding(members, 'c')).toBe(2)
    expect(membersHolding(members, 'g')).toBe(1)
  })
  it('says what happens to holders', () => {
    expect(deleteMessage(null, t)).toMatch(/^We couldn't check/)
    expect(deleteMessage(0, t)).toBe('No one has this role. You can restore it for 30 days.')
    expect(deleteMessage(3, t)).toMatch(/^Members with this role: 3\./)
  })
  it('a 403 reads as the rights having changed', () => {
    expect(roleActionError(new FonderieApiError('MANAGER_REQUIRED', 'x', 403), t)).toMatch(/^Only the workspace owner or a manager can change roles/)
    expect(roleActionError(new FonderieApiError('X', 'Role name taken', 409), t)).toBe('Role name taken')
  })
  it('checks names like the app', () => {
    expect(nameProblem('  ', t)).toBe("Can't be blank")
    expect(nameProblem('x'.repeat(201), t)).toBe('Use 200 characters or fewer.')
    expect(nameProblem('Dispatcher', t)).toBe(true)
  })
})
