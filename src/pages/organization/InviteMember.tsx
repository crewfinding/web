import { useInvitations, useMembers, usePermissions, useRoles } from '@fonderie/react-workspaces'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Notice } from '../../components/Notice'
import { usePlanLimitPrompt } from '../../components/PlanLimitDialog'
import { useTranslation } from '../../hooks/useTranslation'
import { errorMessage } from '../../lib/apiErrors'
import { customRolesOf, inviteConflict, inviteEmailProblem, normalizeEmail } from '../../lib/members'
import { useCurrentWorkspace } from '../../lib/workspace'

// Invite a member — the mobile app's InviteMemberScreen (docs/parity/1-members.md).

// The role picker's "no custom role" entry: the server's default (GUEST).
const DEFAULT_ROLE = 'default'
const MEMBERS = '/organization/members'

interface IInviteForm {
  email: string
  role: string
}

/** The invitation itself: one email, optionally a custom role. Keyed by the workspace. */
function InviteForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const perms = usePermissions()
  const { roles } = useRoles()
  const { members } = useMembers()
  const { invitations, invite } = useInvitations()
  const { prompt: promptPlanLimit, element: planLimitDialog } = usePlanLimitPrompt()
  const [error, setError] = useState<string | null>(null)

  const customRoles = customRolesOf(roles)
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<IInviteForm>({ defaultValues: { email: '', role: DEFAULT_ROLE }, mode: 'onSubmit' })

  const onSubmit = async (data: IInviteForm) => {
    setError(null)
    const email = normalizeEmail(data.email)
    const conflict = inviteConflict(email, members, invitations)
    if (conflict) {
      setFieldError('email', { message: t(conflict === 'member' ? 'team.invite.error.member' : 'team.invite.error.pending') })
      return
    }
    try {
      await invite({ email, ...(data.role !== DEFAULT_ROLE ? { roleId: data.role } : {}) })
      navigate(MEMBERS)
    } catch (err) {
      // Over the plan's seats: explain it and offer the way out.
      if (promptPlanLimit(err, perms.isManager)) return
      setError(errorMessage(t, err))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {planLimitDialog}
      {error && <Notice tone="error">{error}</Notice>}
      <Card className="p-5">
        <Input
          type="email"
          autoComplete="off"
          label={t('team.invite.email')}
          error={errors.email?.message}
          {...register('email', {
            validate: (value) => {
              const problem = inviteEmailProblem(value ?? '')
              return problem ? t(problem) : true
            },
          })}
        />
      </Card>

      {customRoles.length > 0 ? (
        <Card as="fieldset" className="p-5">
          <legend className="sr-only">{t('team.invite.role.title')}</legend>
          <h3 className="text-base font-semibold text-ink" aria-hidden="true">
            {t('team.invite.role.title')}
          </h3>
          <p className="mt-1 mb-3 text-sm text-ink-subtle">{t('team.invite.role.text')}</p>
          <div className="space-y-1">
            {[{ id: DEFAULT_ROLE, name: t('team.invite.role.default') }, ...customRoles].map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink hover:bg-surface-2">
                <input type="radio" value={r.id} {...register('role')} />
                {r.name}
              </label>
            ))}
          </div>
        </Card>
      ) : (
        <p className="text-sm text-ink-subtle">{t('team.invite.role.none')}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(MEMBERS)}>
          {t('team.invite.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {t('team.invite.submit')}
        </Button>
      </div>
    </form>
  )
}

export default function InviteMember() {
  const { t } = useTranslation()
  const { current: workspace } = useCurrentWorkspace()
  const perms = usePermissions()

  let body
  if (!workspace || (perms.isLoading && !perms.isManager)) {
    body = (
      <p role="status" className="py-6 text-center text-sm text-ink-subtle">
        {t('team.loading')}
      </p>
    )
  } else if (workspace.isPersonal) {
    body = <Notice>{t('team.invite.personal')}</Notice>
  } else if (!perms.isManager) {
    // The server refuses (403 MANAGER_REQUIRED): no form that can only fail.
    body = <Notice>{t('team.invite.managerOnly')}</Notice>
  } else {
    body = <InviteForm key={workspace.id} />
  }

  return (
    <div>
      <h2 className="text-card-title text-ink">{t('team.invite.title')}</h2>
      <p className="mt-1 mb-4 text-sm text-ink-subtle">{t('team.invite.intro')}</p>
      {body}
    </div>
  )
}
