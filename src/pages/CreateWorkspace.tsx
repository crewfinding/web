import { useWorkspaces } from '@fonderie/react-workspaces'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { useTranslation } from '../hooks/useTranslation'
import { billingErrorMessage } from '../lib/billing'
import { useCurrentWorkspace } from '../lib/workspace'

// A new organization workspace — its own jobs, customers, team and plan.
// Created, then selected, then home.
export default function CreateWorkspace() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createWorkspace } = useWorkspaces()
  const { select } = useCurrentWorkspace()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>()

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      const ws = await createWorkspace({ name: name.trim(), type: 'ORGANIZATION' })
      select(ws.id)
      toast.success(t('home.newWorkspace.created'))
      navigate('/')
    } catch (err) {
      toast.error(billingErrorMessage(t, err))
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-6">
        <h1 className="text-card-title text-ink">{t('home.newWorkspace.title')}</h1>
        <p className="mt-1 text-sm text-ink-subtle">{t('home.newWorkspace.description')}</p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label={t('home.newWorkspace.name')}
            error={errors.name?.message}
            autoFocus
            {...register('name', { required: t('home.newWorkspace.nameRequired'), validate: (v) => !!v.trim() || t('home.newWorkspace.nameRequired') })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              {t('home.newWorkspace.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('home.newWorkspace.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
