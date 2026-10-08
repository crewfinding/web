import type { PermissionOperation } from '@fonderie/client'
import { usePermissionCatalog, usePermissions, useRole, useRolePermissions, useRoles } from '@fonderie/react-workspaces'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Notice } from '../../components/Notice'
import { Switch } from '../../components/Switch'
import { useTranslation } from '../../hooks/useTranslation'
import {
  OPERATIONS,
  type PermGrid,
  descriptionProblem,
  gridFrom,
  isNotFound,
  mergeGrid,
  nameProblem,
  operationSwitchLabel,
  operationWord,
  payloadFrom,
  ROLES,
  resourceLabel,
  roleActionError,
  roleDisplayName,
  sameGrid,
} from '../../lib/roles'
import { useCurrentWorkspace } from '../../lib/workspace'
import { LoadErrorState, LoadingState, SystemRoleRights } from '../../components/RoleParts'

// A role — the mobile app's RoleDetailScreen (docs/parity/2-roles.md).

type FormValues = { name: string; description: string }

function RoleDetailContent({ roleId }: { roleId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const back = () => navigate(ROLES)

  const { role, error: roleError, refresh: refreshRole } = useRole(roleId)
  const { permissions, isLoading: permsLoading, error: permsError, refresh: refreshPerms, setRolePermissions } =
    useRolePermissions(roleId)
  const { catalog, declared, isLoading: catalogLoading, error: catalogError, refresh: refreshCatalog } =
    usePermissionCatalog()
  const { isManager, isLoading: meLoading } = usePermissions()
  const { updateRole } = useRoles()

  // Only the switches the user flipped; the rest read from the server.
  const [edits, setEdits] = useState<PermGrid>({})
  const [saving, setSaving] = useState(false)
  // useRolePermissions folds a failed save into `error`: after a save attempt
  // that error is the save's (shown in saveError), not a failed read.
  const [saveAttempted, setSaveAttempted] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: { name: '', description: '' }, mode: 'all' })

  // Ready = the role, its stored rows and the catalog have all landed. Until
  // then nothing is editable: a grid built from defaults would, once saved,
  // wipe the role's real rights.
  const catalogReady = !catalogLoading && !catalogError
  const permsLoadError = permsError && !permsLoading && !saveAttempted ? permsError : null
  const permsReady = !permsLoading && !permsLoadError
  const isCustom = !!role && !role.isSystem

  // Fill the form from the server — again whenever its copy changes, unless the user is editing.
  useEffect(() => {
    if (!role || role.isSystem || isDirty) return
    reset({ name: role.name, description: role.description ?? '' })
  }, [role, isDirty, reset])

  const ready = isCustom && catalogReady && permsReady
  const server = useMemo(() => (ready ? gridFrom(catalog, permissions) : null), [ready, catalog, permissions])
  const grid = useMemo(() => (server ? mergeGrid(server, edits) : null), [server, edits])
  const editable = ready && isManager && !saving
  const gridDirty = grid !== null && server !== null && !sameGrid(grid, server)

  const toggle = (key: string, op: PermissionOperation, value: boolean) => {
    setSaveError(null)
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], [op]: value } }))
  }

  const onSave = async (data: FormValues) => {
    if (!ready || !grid || !role) return
    setSaveError(null)
    setSaveAttempted(true)
    setSaving(true)
    let renamed = false
    try {
      if (isDirty) {
        await updateRole(roleId, { name: data.name.trim(), description: data.description.trim() || null })
        renamed = true
      }
      if (gridDirty) await setRolePermissions(payloadFrom(catalog, grid))
      back()
    } catch (err) {
      const message = roleActionError(err, t)
      setSaveError(renamed && gridDirty ? t('roles.detail.partial', { error: message }) : message)
    } finally {
      setSaving(false)
    }
  }

  const backButton = (
    <Button variant="secondary" onClick={back}>
      {t('roles.back')}
    </Button>
  )

  if (!roleId || (isNotFound(roleError) && !role)) {
    return (
      <div className="space-y-3">
        <Notice tone="warning">{t('roles.detail.notFound')}</Notice>
        {backButton}
      </div>
    )
  }
  if (!role) {
    return roleError ? (
      <LoadErrorState error={roleError} onRetry={() => void refreshRole({ force: true })} />
    ) : (
      <LoadingState label={t('roles.loading')} />
    )
  }

  const header = (
    <div className="space-y-3">
      <h2 className="text-card-title text-ink">{roleDisplayName(role, t)}</h2>
      {role.isSystem ? (
        <p className="text-sm text-ink-subtle">{t('roles.system.readonly')}</p>
      ) : !meLoading && !isManager ? (
        <Notice>{t('roles.detail.readonly')}</Notice>
      ) : null}
      {saveError ? <Notice tone="error">{saveError}</Notice> : null}
    </div>
  )

  // A built-in role: what it means, nothing to edit.
  if (role.isSystem) {
    return (
      <div className="space-y-4">
        {header}
        <Card className="p-5">
          <SystemRoleRights role={role} />
        </Card>
        {backButton}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSave)} className="space-y-4">
      {header}

      <Card as="section" className="space-y-4 p-5">
        <h3 className="text-base font-semibold text-ink">{t('roles.detail.general')}</h3>
        <Input
          label={t('roles.form.name')}
          disabled={!editable}
          error={errors.name?.message}
          {...register('name', { validate: (v) => nameProblem(v, t) })}
        />
        <Input
          label={t('roles.form.description')}
          disabled={!editable}
          error={errors.description?.message}
          {...register('description', { validate: (v) => descriptionProblem(v, t) })}
        />
      </Card>

      <Card as="section" className="p-5">
        <h3 className="text-base font-semibold text-ink">{t('roles.detail.permissions')}</h3>
        <p className="mt-1 mb-3 text-sm text-ink-subtle">{t('roles.detail.permissionsIntro')}</p>
        {catalogError && !catalogLoading ? (
          <LoadErrorState error={catalogError} onRetry={() => void refreshCatalog({ force: true })} />
        ) : permsLoadError ? (
          <LoadErrorState error={permsLoadError} onRetry={() => void refreshPerms({ force: true })} />
        ) : !ready || !grid ? (
          <LoadingState label={t('roles.loading')} />
        ) : catalog.length === 0 ? (
          <p className="text-sm text-ink-subtle">
            {declared ? t('roles.detail.permissionsNone') : t('roles.detail.permissionsUndeclared')}
          </p>
        ) : (
          <div className="divide-y divide-hairline">
            {catalog.map((entry) => {
              const label = resourceLabel(entry, t)
              return (
                <div key={entry.key} className="py-3" data-testid={`permission-${entry.key}`}>
                  <p className="text-sm font-medium text-ink">{label}</p>
                  {entry.description ? <p className="text-xs text-ink-subtle">{entry.description}</p> : null}
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                    {OPERATIONS.filter((op) => entry.operations.includes(op)).map((op) => (
                      <label key={op} className="flex items-center justify-between gap-2 text-sm text-ink-muted">
                        <span aria-hidden="true">{operationSwitchLabel(op, t)}</span>
                        <Switch
                          aria-label={t('roles.switchLabel', { resource: label, operation: operationWord(op, t) })}
                          checked={!!grid[entry.key]?.[op]}
                          disabled={!editable}
                          onChange={(v) => toggle(entry.key, op, v)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {editable || (ready && isManager && saving) ? (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="danger" onClick={back}>
            {t('roles.detail.discard')}
          </Button>
          <Button type="submit" loading={saving} disabled={saving || !(isDirty || gridDirty)}>
            {t('roles.detail.save')}
          </Button>
        </div>
      ) : (
        backButton
      )}
    </form>
  )
}

// Keyed by workspace: a switch drops the edits made in the previous one.
export default function RoleDetail() {
  const { roleId = '' } = useParams()
  const { current } = useCurrentWorkspace()
  return <RoleDetailContent key={`${current?.id ?? 'none'}:${roleId}`} roleId={roleId} />
}
