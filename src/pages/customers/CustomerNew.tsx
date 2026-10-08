import { usePermissions } from '@fonderie/react-workspaces'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArchivedWorkspaceBanner } from '../../components/ArchivedWorkspaceBanner'
import { Card } from '../../components/Card'
import { useTranslation } from '../../hooks/useTranslation'
import { EMPTY_IDENTITY, customerDisplayName, customerErrorMessage, identityToCreate, type ICustomerIdentityValues } from '../../lib/customers'
import { fonderie } from '../../lib/fonderie'
import { IdentityForm } from './IdentityForm'
import { BackLink, StateBlock } from './shared'
import { useCustomerPermissions, useWorkspaceKey } from './hooks'

// New customer — the mobile app's CustomerCreateForm. Create, then the first
// phone and email on the new id (no hook can own a not-yet-created id — the
// mobile app's same @skip-hook), then straight into the customer's page.

function CreateForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { canCreate } = useCustomerPermissions()
  const { isLoading: permsLoading } = usePermissions()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canCreate && permsLoading) return <StateBlock body={t('customers.loading')} />
  if (!canCreate) {
    return <StateBlock title={t('customers.create.notAllowedTitle')} body={t('customers.create.notAllowed')} testId="customer-create-not-allowed" />
  }

  const create = async (v: ICustomerIdentityValues) => {
    if (saving) return
    setSaving(true)
    setError(null)
    let customer
    try {
      customer = (await fonderie.customers.createCustomer(identityToCreate(v))).result.customer
    } catch (e) {
      setError(customerErrorMessage(t, e))
      setSaving(false)
      return
    }
    // The customer exists now; say which extra part did not make it.
    const failed: string[] = []
    if (v.phone) {
      await fonderie.customers.addPhone(customer.id, { phone: v.phone, label: 'mobile', isPrimary: true }).catch(() => failed.push(t('customers.form.phone')))
    }
    if (v.email) {
      await fonderie.customers.addEmail(customer.id, { email: v.email, label: 'work', isPrimary: true }).catch(() => failed.push(t('customers.form.email')))
    }
    setSaving(false)
    if (failed.length) toast.warning(t('customers.create.partial', { name: customerDisplayName(customer), items: failed.join(', ') }))
    // Straight into the one editor: addresses, notes, tags, links.
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  return (
    <Card className="p-6">
      <IdentityForm
        initial={EMPTY_IDENTITY}
        withContact
        submitText={t('customers.create.submit')}
        submitting={saving}
        serverError={error}
        onSubmit={(v) => void create(v)}
        onDiscard={() => navigate('/customers')}
      />
    </Card>
  )
}

export default function CustomerNew() {
  const { t } = useTranslation()
  const key = useWorkspaceKey()
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <BackLink />
      <h1 className="text-headline text-ink">{t('customers.create.title')}</h1>
      <ArchivedWorkspaceBanner />
      <CreateForm key={key} />
    </div>
  )
}
