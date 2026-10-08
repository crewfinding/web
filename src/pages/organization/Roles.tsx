import { FonderieApiError } from '@fonderie/client'
import type { IDeletedRoleDTO, IRoleDTO } from '@fonderie/client'
import {
  useDeletedRoles,
  useMembers,
  usePermissionCatalog,
  usePermissions,
  useRoles,
} from '@fonderie/react-workspaces'
import { ArrowCounterClockwise, Trash, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import { Notice } from '../../components/Notice'
import { useConfirm } from '../../hooks/useConfirm'
import { useDatePreference } from '../../hooks/useDatePreference'
import { useTranslation } from '../../hooks/useTranslation'
import { ROLES, deleteMessage, membersHolding, roleActionError, roleDisplayName } from '../../lib/roles'
import { LoadErrorState, LoadingState, SystemRoleRights } from '../../components/RoleParts'
import { useCurrentWorkspace } from '../../lib/workspace'

// Roles & Permissions — the mobile app's RolesScreen (docs/parity/2-roles.md).

/**
 * Recently deleted roles (kept 30 days): a manager restores one — rights and
 * holders come back — and only the owner deletes one for good.
 */
function RoleBin({ isOwner, onRestored }: { isOwner: boolean; onRestored: () => Promise<void> }) {
  const { t } = useTranslation()
  const formatDate = useDatePreference()
  const { roles, restore, purge } = useDeletedRoles()
  const { confirm, element: confirmDialog } = useConfirm()
  const [busyId, setBusyId] = useState<string | null>(null)

  if (roles.length === 0) return null

  const run = async (role: IDeletedRoleDTO, fn: () => Promise<void>, done: string) => {
    setBusyId(role.id)
    try {
      await fn()
      if (done) toast.success(done)
      await onRestored()
    } catch (err) {
      const conflict = err instanceof FonderieApiError && err.status === 409
      toast.error(conflict ? t('roles.bin.conflict', { name: role.name }) : roleActionError(err, t))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card as="section" className="p-5" aria-labelledby="role-bin-title">
      {confirmDialog}
      <h3 id="role-bin-title" className="text-base font-semibold text-ink">
        {t('roles.bin.title')}
      </h3>
      <p className="mt-1 text-sm text-ink-subtle">{t('roles.bin.description')}</p>
      <ul className="mt-2 divide-y divide-hairline">
        {roles.map((role) => (
          <li key={role.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{role.name}</p>
              <p className="text-xs text-ink-subtle">{t('roles.bin.until', { date: formatDate(role.purgeAt) })}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              iconLeft={ArrowCounterClockwise}
              aria-label={t('roles.bin.restoreA11y', { name: role.name })}
              loading={busyId === role.id}
              disabled={busyId !== null}
              onClick={() =>
                void run(
                  role,
                  () => restore(role.id),
                  role.holders > 0
                    ? t('roles.bin.restoredSome', { name: role.name, count: role.holders })
                    : t('roles.bin.restored', { name: role.name }),
                )
              }
            >
              {t('roles.bin.restore')}
            </Button>
            {isOwner ? (
              <IconButton
                icon={X}
                size="sm"
                variant="ghost"
                aria-label={t('roles.bin.purgeA11y', { name: role.name })}
                disabled={busyId !== null}
                onClick={() =>
                  confirm({
                    title: t('roles.bin.purgeTitle', { name: role.name }),
                    description: t('roles.bin.purgeMessage'),
                    confirmLabel: t('roles.bin.purge'),
                    cancelLabel: t('roles.bin.cancel'),
                    danger: true,
                    onConfirm: () => void run(role, () => purge(role.id), ''),
                  })
                }
              />
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function RolesContent() {
  const { t } = useTranslation()
  const { roles, isLoading, error, refresh, removeRole } = useRoles()
  const { members, isLoading: membersLoading, error: membersError, refresh: refreshMembers } = useMembers()
  const { isManager, isOwner, isLoading: permsLoading, refresh: refreshPerms } = usePermissions()
  const { refresh: refreshCatalog } = usePermissionCatalog()
  const { refresh: refreshBin } = useDeletedRoles()
  const { confirm, element: confirmDialog } = useConfirm()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshAll = useCallback(
    () =>
      Promise.all([
        refresh({ force: true }),
        refreshMembers({ force: true }),
        refreshPerms({ force: true }),
        refreshCatalog({ force: true }),
      ]).then(() => undefined),
    [refresh, refreshMembers, refreshPerms, refreshCatalog],
  )
  // Back from the editor or the create page: show what changed there.
  useEffect(() => {
    void refresh({ force: true })
    void refreshBin({ force: true })
  }, [refresh, refreshBin])

  const membersKnown = !membersLoading || members.length > 0
  const countFor = (roleId: string): number | null =>
    membersKnown && !(membersError && members.length === 0) ? membersHolding(members, roleId) : null

  const systemRoles = roles.filter((r) => r.isSystem)
  const customRoles = roles.filter((r) => !r.isSystem)

  const onDelete = (role: IRoleDTO) => {
    const name = role.name
    confirm({
      title: t('roles.delete.title', { name }),
      description: deleteMessage(countFor(role.id), t),
      confirmLabel: t('roles.delete.confirm'),
      cancelLabel: t('roles.delete.cancel'),
      danger: true,
      onConfirm: () => {
        setDeletingId(role.id)
        removeRole(role.id)
          .then(async (result) => {
            toast.success(
              result.movedToDefaultRole > 0
                ? t('roles.delete.doneMoved', { name, count: result.movedToDefaultRole })
                : t('roles.delete.done', { name }),
            )
            // Their roles changed: the member counts must follow; the bin shows it.
            await Promise.all([refreshMembers({ force: true }), refreshBin({ force: true })]).catch(() => undefined)
          })
          .catch((err) => toast.error(roleActionError(err, t)))
          .finally(() => setDeletingId(null))
      },
    })
  }

  // useRoles folds a failed write into `error`; only a read with nothing to
  // show is a load failure.
  const loadFailed = !!error && roles.length === 0 && !isLoading

  return (
    <div className="space-y-4">
      {confirmDialog}
      <div>
        <h2 className="text-card-title text-ink">{t('roles.title')}</h2>
        <p className="mt-1 text-sm text-ink-subtle">{t('roles.intro')}</p>
      </div>
      {!permsLoading && !isManager ? <Notice>{t('roles.readonly')}</Notice> : null}

      {isLoading && roles.length === 0 ? (
        <LoadingState label={t('roles.loading')} />
      ) : loadFailed ? (
        <LoadErrorState error={error} onRetry={() => void refresh({ force: true })} />
      ) : (
        <>
          <Card as="section" className="p-5" aria-labelledby="system-roles-title">
            <h3 id="system-roles-title" className="text-base font-semibold text-ink">
              {t('roles.section.system')}
            </h3>
            <p className="mt-1 text-sm text-ink-subtle">{t('roles.system.readonly')}</p>
            <ul className="mt-2 divide-y divide-hairline">
              {systemRoles.map((role) => {
                const count = countFor(role.id)
                return (
                  <li key={role.id} className="py-3" data-testid={`system-role-${role.name}`}>
                    <div className="flex items-center gap-2">
                      <Link to={`${ROLES}/${encodeURIComponent(role.id)}`} className="text-sm font-medium text-ink hover:underline">
                        {roleDisplayName(role, t)}
                      </Link>
                      <span className="text-xs text-ink-subtle">{t('roles.system.builtin')}</span>
                    </div>
                    <SystemRoleRights role={role} />
                    {count !== null ? (
                      <p className="mt-1 text-xs text-ink-subtle">{t('roles.membersCount', { count })}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card as="section" className="p-5" aria-labelledby="custom-roles-title">
            <h3 id="custom-roles-title" className="text-base font-semibold text-ink">
              {t('roles.section.custom')}
            </h3>
            {customRoles.length === 0 ? (
              <p className="mt-2 text-sm text-ink-subtle">
                {isManager ? t('roles.customEmpty.manager') : t('roles.customEmpty.readonly')}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {customRoles.map((role) => {
                  const count = countFor(role.id)
                  // The count names how many people lose the role, so wait for it.
                  const canDelete = isManager && membersKnown && deletingId === null
                  return (
                    <li key={role.id} className="flex items-center gap-3 py-3">
                      <Link to={`${ROLES}/${encodeURIComponent(role.id)}`} className="min-w-0 flex-1 rounded-md hover:bg-surface-2/50">
                        <p className="truncate text-sm font-medium text-ink">{role.name}</p>
                        {role.description ? <p className="text-sm text-ink-subtle">{role.description}</p> : null}
                        {count !== null ? (
                          <p className="text-xs text-ink-subtle">{t('roles.membersCount', { count })}</p>
                        ) : null}
                      </Link>
                      {isManager ? (
                        <IconButton
                          icon={Trash}
                          size="sm"
                          variant="ghost"
                          aria-label={t('roles.delete.a11y', { name: role.name })}
                          disabled={!canDelete}
                          loading={deletingId === role.id}
                          onClick={() => onDelete(role)}
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {isManager ? <RoleBin isOwner={isOwner} onRestored={refreshAll} /> : null}

          {isManager ? (
            <div className="flex justify-end">
              <Button asChild>
                <Link to={`${ROLES}/new`}>{t('roles.create.submit')}</Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

// Keyed by workspace: a switch drops the previous workspace's pending delete.
export default function Roles() {
  const { current } = useCurrentWorkspace()
  return <RolesContent key={current?.id ?? 'none'} />
}
