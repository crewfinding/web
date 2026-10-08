import { usePermissions, useRoles } from '@fonderie/react-workspaces'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Notice } from '../../components/Notice'
import { useTranslation } from '../../hooks/useTranslation'
import { ROLES, descriptionProblem, nameProblem, roleActionError } from '../../lib/roles'
import { useCurrentWorkspace } from '../../lib/workspace'
import { LoadErrorState, LoadingState } from '../../components/RoleParts'

// Create a role — the mobile app's CreateRoleScreen (docs/parity/2-roles.md).

type FormValues = { name: string; description: string }

function CreateRoleContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createRole } = useRoles()
  const { isManager, isLoading: meLoading, error: meError, refresh: refreshMe } = usePermissions()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: '', description: '' }, mode: 'all' })

  const onCreate = async (data: FormValues) => {
    setError(null)
    try {
      const role = await createRole({ name: data.name.trim(), description: data.description.trim() || undefined })
      // A new role has no rights yet: go straight to choosing them.
      navigate(`${ROLES}/${encodeURIComponent(role.id)}`, { replace: true })
    } catch (err) {
      setError(roleActionError(err, t))
    }
  }

  if (meLoading) return <LoadingState label={t('roles.loading')} />
  if (meError && !isManager) return <LoadErrorState error={meError} onRetry={() => void refreshMe({ force: true })} />
  if (!isManager) {
    return (
      <div className="space-y-3">
        <Notice>{t('roles.create.readonly')}</Notice>
        <Button variant="secondary" onClick={() => navigate(ROLES)}>
          {t('roles.back')}
        </Button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onCreate)} className="space-y-4">
      <div>
        <h2 className="text-card-title text-ink">{t('roles.create.title')}</h2>
        <p className="mt-1 text-sm text-ink-subtle">{t('roles.create.intro')}</p>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Card className="space-y-4 p-5">
        <Input
          label={t('roles.form.name')}
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register('name', {
            validate: (v) => nameProblem(v, t),
            // The server's refusal goes away once the name is edited.
            onChange: () => setError(null),
          })}
        />
        <Input
          label={t('roles.form.description')}
          disabled={isSubmitting}
          error={errors.description?.message}
          {...register('description', { validate: (v) => descriptionProblem(v, t) })}
        />
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="danger" onClick={() => navigate(ROLES)}>
          {t('roles.detail.discard')}
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {t('roles.create.submit')}
        </Button>
      </div>
    </form>
  )
}

// Keyed by workspace: a half-typed role never carries over to another workspace.
export default function CreateRole() {
  const { current } = useCurrentWorkspace()
  return <CreateRoleContent key={current?.id ?? 'none'} />
}
