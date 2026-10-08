import { FonderieApiError } from '@fonderie/client'
import type {
  IMemberDTO,
  IPermissionCatalogEntryDTO,
  IRoleDTO,
  IRolePermission,
  IRolePermissionInput,
  PermissionOperation,
} from '@fonderie/client'
import type { TranslationKey } from '../locales'
import { errorMessage } from './apiErrors'

// What the roles pages share — the mobile app's roles.shared.tsx and the
// detail screen's grid helpers (docs/parity/2-roles.md), kept pure.

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

/** The server's super role (everything) and the role every invitee lands on. */
export const MANAGER_ROLE = 'ADMIN'
export const DEFAULT_ROLE = 'GUEST'

export const OPERATIONS: PermissionOperation[] = ['create', 'read', 'update', 'delete']
export const NAME_MAX = 200
export const DESCRIPTION_MAX = 1000

/**
 * What a built-in role may do, as the server declares it (the catalog's
 * systemGrants). Null while unknown: then no list rather than a guess. An
 * empty object is the server saying "nothing".
 */
export function systemRoleGrants(
  systemGrants: Record<string, Record<string, PermissionOperation[]>> | undefined,
  roleName: string,
): Record<string, PermissionOperation[]> | null {
  if (!systemGrants) return null
  const name = roleName.toUpperCase()
  const key = Object.keys(systemGrants).find((k) => k.toUpperCase() === name)
  return key ? (systemGrants[key] ?? null) : null
}

/** How a role is called on screen: the built-in ones by what they mean. */
export function roleDisplayName(role: Pick<IRoleDTO, 'name' | 'isSystem'>, t: T): string {
  if (!role.isSystem) return role.name
  const name = role.name.toUpperCase()
  if (name === MANAGER_ROLE) return t('roles.system.adminName')
  if (name === DEFAULT_ROLE) return t('roles.system.guestName')
  return role.name
}

/** A built-in role's meaning, in words. */
export function systemExplanationKey(roleName: string): TranslationKey {
  const name = roleName.toUpperCase()
  if (name === MANAGER_ROLE) return 'roles.system.adminExplanation'
  if (name === DEFAULT_ROLE) return 'roles.system.guestExplanation'
  return 'roles.system.otherExplanation'
}

const RESOURCE_KEYS = new Set(['jobs', 'job_templates', 'estimates', 'invoices', 'customers', 'analytics', 'settings', 'audit'])

/** The catalog's label, in the reader's language when the app knows the key. */
export function resourceLabel(entry: Pick<IPermissionCatalogEntryDTO, 'key' | 'label'>, t: T): string {
  if (RESOURCE_KEYS.has(entry.key)) return t(`roles.resource.${entry.key}` as TranslationKey)
  return entry.label || entry.key
}

export const operationWord = (op: PermissionOperation, t: T): string => t(`roles.operation.${op}.short`)
export const operationSwitchLabel = (op: PermissionOperation, t: T): string => t(`roles.operation.${op}.switch`)

/**
 * "Jobs: can view, edit" lines for a set of grants, in catalog order, keeping
 * only what the catalog lists.
 */
export function grantLines(
  catalog: IPermissionCatalogEntryDTO[],
  grants: Record<string, PermissionOperation[]>,
  t: T,
): string[] {
  return catalog.flatMap((entry) => {
    const ops = OPERATIONS.filter((op) => entry.operations.includes(op) && grants[entry.key]?.includes(op))
    if (ops.length === 0) return []
    return [t('roles.grants.line', { resource: resourceLabel(entry, t), operations: ops.map((op) => operationWord(op, t)).join(', ') })]
  })
}

/** The built-in role's full list: its grant lines, plus the jobs caveat for Member. */
export function systemRoleLines(
  catalog: IPermissionCatalogEntryDTO[],
  grants: Record<string, PermissionOperation[]>,
  roleName: string,
  t: T,
): string[] {
  const lines = grantLines(catalog, grants, t)
  // The API lets a non-manager edit only the jobs they are assigned to or
  // created (403 JOB_NOT_ASSIGNED): say so rather than promise every job.
  if (lines.length > 0 && roleName.toUpperCase() === DEFAULT_ROLE && grants['jobs']?.includes('update'))
    return [...lines, t('roles.system.guestJobsAssigned')]
  return lines
}

/** How many people hold a role (members carry every role they hold). */
export const membersHolding = (members: Pick<IMemberDTO, 'roles' | 'roleId'>[], roleId: string): number =>
  members.filter((m) => (m.roles?.length ? m.roles.some((r) => r.id === roleId) : m.roleId === roleId)).length

/** The delete confirmation's text for what is known about its holders. */
export function deleteMessage(count: number | null, t: T): string {
  if (count === null) return t('roles.delete.unknown')
  if (count === 0) return t('roles.delete.none')
  return t('roles.delete.some', { count })
}

/** A roles action's failure, with a plain sentence for a 403 (rights can change while a page is open). */
export const roleActionError = (err: unknown, t: T): string =>
  err instanceof FonderieApiError && err.status === 403 ? t('roles.forbidden') : errorMessage(t, err)

export const isNotFound = (err: unknown): boolean => err instanceof FonderieApiError && err.status === 404

/** Name / description checks: the message, or true. */
export function nameProblem(value: string, t: T): string | true {
  const v = value.trim()
  if (!v) return t('roles.form.empty')
  if (v.length > NAME_MAX) return t('roles.form.nameTooLong', { max: NAME_MAX })
  return true
}
export const descriptionProblem = (value: string, t: T): string | true =>
  value.trim().length > DESCRIPTION_MAX ? t('roles.form.descriptionTooLong', { max: DESCRIPTION_MAX }) : true

// ── The permission grid ──────────────────────────────────────────────────────

/** resource key → operation → on. Only what the catalog lists is ever in it. */
export type PermGrid = Record<string, Partial<Record<PermissionOperation, boolean>>>

const FIELD: Record<PermissionOperation, keyof IRolePermission> = {
  create: 'canCreate',
  read: 'canRead',
  update: 'canUpdate',
  delete: 'canDelete',
}

/** The switches the catalog offers, set from the role's stored rows. */
export const gridFrom = (catalog: IPermissionCatalogEntryDTO[], stored: IRolePermission[]): PermGrid =>
  Object.fromEntries(
    catalog.map((entry) => {
      const row = stored.find((p) => p.permissionKey === entry.key)
      return [entry.key, Object.fromEntries(entry.operations.map((op) => [op, !!row?.[FIELD[op]]]))]
    }),
  )

/** One row per catalog entry; an operation the entry does not list is never sent. */
export const payloadFrom = (catalog: IPermissionCatalogEntryDTO[], grid: PermGrid): IRolePermissionInput[] =>
  catalog.map((entry) => {
    const input: IRolePermissionInput = { permissionKey: entry.key }
    for (const op of entry.operations) input[FIELD[op] as 'canCreate'] = !!grid[entry.key]?.[op]
    return input
  })

export const mergeGrid = (server: PermGrid, edits: PermGrid): PermGrid =>
  Object.fromEntries(Object.entries(server).map(([key, ops]) => [key, { ...ops, ...edits[key] }]))

export const sameGrid = (a: PermGrid, b: PermGrid): boolean => JSON.stringify(a) === JSON.stringify(b)

/** The roles list page. */
export const ROLES = '/organization/roles'
