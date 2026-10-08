import type { ICustomerDetailDTO } from '@fonderie/client'
import { useCustomer, useCustomers } from '@fonderie/react-customers'
import { Archive, ArrowCounterClockwise, Prohibit, PencilSimple, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActionMenu, type IActionMenuItem } from '../../components/ActionMenu'
import { ArchivedWorkspaceBanner } from '../../components/ArchivedWorkspaceBanner'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Notice } from '../../components/Notice'
import { useConfirm } from '../../hooks/useConfirm'
import { useTranslation } from '../../hooks/useTranslation'
import {
  customerDisplayName,
  customerErrorMessage,
  customerToIdentity,
  identityToInput,
  isArchived,
  isBlacklisted,
  isCustomerInUse,
  isNotFound,
  type ICustomerIdentityValues,
} from '../../lib/customers'
import { timeZoneLabel } from '../../lib/timeZones'
import { localeTags } from '../../locales'
import { IdentityForm } from './IdentityForm'
import { CustomerSections } from './Sections'
import { BackLink, CustomerAvatar, StateBlock } from './shared'
import { useCustomerPermissions, useWorkspaceKey } from './hooks'

// A customer — the mobile app's CustomerDetailScreen (docs/parity/5-customers.md):
// who they are, the actions menu, the blacklist / archived banners and the
// sections. One read (depth 1); every write refreshes it.

function CustomerView({ customerId }: { customerId: string }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const perms = useCustomerPermissions()
  const { customer: raw, isLoading, error, refresh, updateCustomer, deleteCustomer, archiveCustomer, unarchiveCustomer } = useCustomer(customerId, 1)
  // useCustomer has no blacklist action (hook gap) — the list hook carries it;
  // one row is the smallest read it can make (as on the mobile app).
  const { blacklistCustomer, unblacklistCustomer } = useCustomers({ limit: 1 })
  const customer = raw as ICustomerDetailDTO | null
  const { confirm, element: confirmDialog } = useConfirm()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [inUse, setInUse] = useState(false)

  if (!customer) {
    if (isNotFound(error)) {
      return (
        <StateBlock
          title={t('customers.detail.notFoundTitle')}
          body={t('customers.detail.notFound')}
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/customers')}>
              {t('customers.back')}
            </Button>
          }
          testId="customer-not-found"
        />
      )
    }
    if (error && !isLoading) {
      return (
        <StateBlock
          title={t('customers.errorTitle')}
          body={customerErrorMessage(t, error)}
          action={
            <Button variant="secondary" size="sm" onClick={() => void refresh({ force: true })}>
              {t('customers.retry')}
            </Button>
          }
          testId="customer-error"
        />
      )
    }
    return <StateBlock body={t('customers.loading')} testId="customer-loading" />
  }

  const name = customerDisplayName(customer)
  const archived = isArchived(customer)
  const blacklisted = isBlacklisted(customer)
  const { canUpdate, canDelete } = perms
  const fail = (e: unknown) => setActionError(customerErrorMessage(t, e))
  const act = (p: Promise<unknown>) => {
    setActionError(null)
    p.catch(fail)
  }

  const save = async (v: ICustomerIdentityValues) => {
    setSaving(true)
    setSaveError(null)
    try {
      await updateCustomer(identityToInput(v))
      setEditing(false)
    } catch (e) {
      setSaveError(customerErrorMessage(t, e))
    } finally {
      setSaving(false)
    }
  }

  const archive = () => act(archiveCustomer())
  const confirmArchive = () =>
    confirm({
      title: t('customers.detail.archiveTitle'),
      description: t('customers.detail.archiveMessage', { name }),
      confirmLabel: t('customers.detail.archive'),
      cancelLabel: t('customers.detail.cancel'),
      onConfirm: archive,
    })
  const remove = async () => {
    setActionError(null)
    try {
      await deleteCustomer()
      navigate('/customers')
    } catch (e) {
      // On a job, quote or invoice: keep it, hide it (archive).
      if (!isCustomerInUse(e)) fail(e)
      else if (canUpdate) setInUse(true)
      else setActionError(t('customers.detail.inUseNoArchive', { name }))
    }
  }
  const confirmDelete = () =>
    confirm({
      title: t('customers.detail.deleteTitle'),
      description: t('customers.detail.deleteMessage', { name }),
      confirmLabel: t('customers.detail.deleteOk'),
      cancelLabel: t('customers.detail.cancel'),
      danger: true,
      onConfirm: () => void remove(),
    })
  const toggleBlacklist = () =>
    blacklisted
      ? confirm({
          title: t('customers.detail.unblacklistTitle'),
          description: t('customers.detail.unblacklistMessage', { name }),
          confirmLabel: t('customers.detail.remove'),
          cancelLabel: t('customers.detail.cancel'),
          onConfirm: () => act(unblacklistCustomer(customerId)),
        })
      : confirm({
          title: t('customers.detail.blacklistTitle'),
          description: t('customers.detail.blacklistMessage', { name }),
          confirmLabel: t('customers.detail.blacklist'),
          cancelLabel: t('customers.detail.cancel'),
          danger: true,
          onConfirm: () => act(blacklistCustomer(customerId)),
        })

  const menu: IActionMenuItem[] = []
  if (canUpdate) {
    menu.push({ label: t('customers.detail.edit'), icon: PencilSimple, onSelect: () => (setSaveError(null), setEditing(true)) })
    menu.push({ label: blacklisted ? t('customers.detail.unblacklist') : t('customers.detail.blacklist'), icon: Prohibit, danger: !blacklisted, onSelect: toggleBlacklist })
    menu.push(
      archived
        ? { label: t('customers.detail.unarchive'), icon: ArrowCounterClockwise, onSelect: () => act(unarchiveCustomer()) }
        : { label: t('customers.detail.archive'), icon: Archive, onSelect: confirmArchive },
    )
  }
  if (canDelete) menu.push({ label: t('customers.detail.delete'), icon: Trash, danger: true, onSelect: confirmDelete })

  if (editing) {
    return (
      <div className="space-y-4">
        <h1 className="text-headline text-ink">{t('customers.detail.edit')}</h1>
        <Card className="p-6">
          <IdentityForm
            initial={customerToIdentity(customer)}
            withContact={false}
            submitText={t('customers.detail.save')}
            submitting={saving}
            serverError={saveError}
            addresses={customer.addresses}
            onSubmit={(v) => void save(v)}
            onDiscard={() => setEditing(false)}
          />
        </Card>
      </div>
    )
  }

  const tag = localeTags[locale]
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4 p-5" data-testid="customer-hero">
        <CustomerAvatar customer={customer} blacklisted={blacklisted} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-headline break-words text-ink">{name}</h1>
          <p className="text-sm text-ink-subtle">
            {[t(customer.type === 'business' ? 'customers.form.business' : 'customers.form.individual'), customer.referenceCode ? `#${customer.referenceCode}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {customer.timezone ? (
            <p className="text-sm text-ink-subtle">
              {t('customers.detail.timezone', { zone: `${timeZoneLabel(customer.timezone, tag)} · ${customer.timezone}` })}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {canUpdate ? (
            <Button variant="secondary" size="sm" iconLeft={PencilSimple} onClick={() => (setSaveError(null), setEditing(true))} data-testid="customer-edit">
              {t('customers.detail.edit')}
            </Button>
          ) : null}
          <ActionMenu label={t('customers.detail.moreActions')} title={name} items={menu} />
        </div>
      </Card>

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {blacklisted ? (
        <Notice tone="error">
          <p className="font-semibold">{t('customers.list.blacklisted')}</p>
          {customer.blacklisted.reason ? <p>{customer.blacklisted.reason}</p> : null}
        </Notice>
      ) : null}

      {archived ? (
        <Notice
          tone="info"
          action={
            canUpdate ? (
              <Button variant="link" size="sm" onClick={() => act(unarchiveCustomer())}>
                {t('customers.detail.unarchive')}
              </Button>
            ) : undefined
          }
        >
          <p className="font-semibold">{t('customers.detail.archivedTitle')}</p>
          <p>{t('customers.detail.archivedBody')}</p>
        </Notice>
      ) : null}

      <CustomerSections customer={customer} canEdit={canUpdate} />

      <ConfirmDialog
        open={inUse}
        title={t('customers.detail.inUseTitle')}
        description={t('customers.detail.inUse', { name })}
        confirmLabel={t('customers.detail.archive')}
        cancelLabel={t('customers.detail.cancel')}
        onConfirm={() => {
          setInUse(false)
          archive()
        }}
        onClose={() => setInUse(false)}
      />
      {confirmDialog}
    </div>
  )
}

/** Keyed by workspace and id: a switch never keeps another workspace's customer on screen. */
export default function CustomerDetail() {
  const { customerId = '' } = useParams<{ customerId: string }>()
  const key = useWorkspaceKey()
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <BackLink />
      <ArchivedWorkspaceBanner />
      <CustomerView key={`${key}:${customerId}`} customerId={customerId} />
    </div>
  )
}
