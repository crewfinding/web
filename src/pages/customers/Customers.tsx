import type { ICustomerDTO, IDeletedCustomerDTO } from '@fonderie/client'
import { useCustomers, useDeletedCustomers } from '@fonderie/react-customers'
import { CaretRight, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArchivedWorkspaceBanner } from '../../components/ArchivedWorkspaceBanner'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Notice } from '../../components/Notice'
import { Tabs } from '../../components/Tabs'
import { useConfirm } from '../../hooks/useConfirm'
import { useDatePreference } from '../../hooks/useDatePreference'
import { useTranslation } from '../../hooks/useTranslation'
import {
  CUSTOMER_FILTERS,
  binAction,
  binName,
  canShowMore,
  customerDisplayName,
  customerErrorMessage,
  emptyListCopy,
  isBlacklisted,
  listParams,
  type CustomerFilter,
} from '../../lib/customers'
import { CustomerAvatar, StateBlock } from './shared'
import { useCustomerPermissions, useSearchQuery, useWorkspaceKey } from './hooks'

// Customers — the mobile app's CustomerScreen (docs/parity/5-customers.md):
// the server searches and pages; Active / Archived / Deleted (the undo bin).

function CustomerList({ filter, search }: { filter: Exclude<CustomerFilter, 'deleted'>; search: string }) {
  const { t } = useTranslation()
  const { canCreate } = useCustomerPermissions()
  const query = useSearchQuery(search)
  const { customers, isLoading, error, refresh, hasMore, loadMore } = useCustomers(listParams(query, filter))
  const retry = () => void refresh({ force: true })

  return (
    <div className="space-y-4">
      {/* A failed refresh over rows already shown: say so, keep the rows. */}
      {error && customers.length > 0 ? <Notice tone="error">{customerErrorMessage(t, error)}</Notice> : null}
      {customers.length === 0 ? (
        isLoading ? (
          <StateBlock body={t('customers.loading')} testId="customers-loading" />
        ) : error ? (
          <StateBlock
            title={t('customers.errorTitle')}
            body={customerErrorMessage(t, error)}
            action={
              <Button variant="secondary" size="sm" onClick={retry}>
                {t('customers.retry')}
              </Button>
            }
            testId="customers-error"
          />
        ) : (
          (() => {
            const copy = emptyListCopy({ search, filter, canCreate })
            return <StateBlock title={t(copy.title)} body={t(copy.body)} testId="customers-empty" />
          })()
        )
      ) : (
        <Card as="ul" className="divide-y divide-hairline" data-testid="customers-list">
          {customers.map((c) => (
            <CustomerRow key={c.id} customer={c} />
          ))}
        </Card>
      )}
      {canShowMore({ hasMore, isLoading, rows: customers.length }) || (isLoading && customers.length > 0) ? (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" loading={isLoading} disabled={isLoading} onClick={() => void loadMore()}>
            {isLoading ? t('customers.list.loadingMore') : t('customers.list.showMore')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function CustomerRow({ customer }: { customer: ICustomerDTO }) {
  const { t } = useTranslation()
  const name = customerDisplayName(customer)
  const blacklisted = isBlacklisted(customer)
  return (
    <li>
      <Link
        to={`/customers/${customer.id}`}
        className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50"
        aria-label={blacklisted ? `${name}, ${t('customers.list.blacklisted')}` : name}
      >
        <CustomerAvatar customer={customer} blacklisted={blacklisted} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{name}</span>
          {customer.referenceCode ? <span className="block text-xs text-ink-subtle">#{customer.referenceCode}</span> : null}
          {blacklisted ? <span className="block text-xs text-error">{t('customers.list.blacklisted')}</span> : null}
        </span>
        <CaretRight size={16} aria-hidden="true" className="text-ink-subtle" />
      </Link>
    </li>
  )
}

/**
 * Deleted customers (kept 30 days by the server, with all their contact
 * details). Restoring needs the create switch; deleting for good is the
 * owner's alone.
 */
function DeletedCustomers() {
  const { t } = useTranslation()
  const formatDate = useDatePreference()
  const { canRestore, canPurge } = useCustomerPermissions()
  const { customers, isLoading, error, restore, purge } = useDeletedCustomers()
  const { confirm, element: confirmDialog } = useConfirm()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)

  const run = async (c: IDeletedCustomerDTO, fn: () => Promise<void>, done: string) => {
    setMessage(null)
    setBusyId(c.id)
    setMessage(await binAction(t, c, fn, done))
    setBusyId(null)
  }

  return (
    <div className="space-y-4" data-testid="customers-bin">
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {customers.length === 0 ? (
        isLoading ? (
          <StateBlock body={t('customers.loading')} />
        ) : error ? (
          <StateBlock body={customerErrorMessage(t, error)} />
        ) : (
          <StateBlock title={t('customers.bin.emptyTitle')} body={t('customers.bin.empty')} testId="customers-bin-empty" />
        )
      ) : (
        <Card as="ul" className="divide-y divide-hairline">
          {customers.map((c) => {
            const name = binName(c)
            const busy = busyId !== null
            return (
              <li key={c.id} className="flex min-h-16 flex-wrap items-center gap-2 px-4 py-3" data-testid={`bin-${c.id}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                  <span className="block text-xs text-ink-subtle">{t('customers.bin.until', { date: formatDate(c.purgeAt) })}</span>
                </span>
                {canRestore ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    loading={busyId === c.id}
                    aria-label={t('customers.bin.restoreA11y', { name })}
                    onClick={() => void run(c, () => restore(c.id), t('customers.bin.restored', { name }))}
                  >
                    {t('customers.bin.restore')}
                  </Button>
                ) : null}
                {canPurge ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy}
                    aria-label={t('customers.bin.purgeA11y', { name })}
                    onClick={() =>
                      confirm({
                        title: t('customers.bin.purgeTitle', { name }),
                        description: t('customers.bin.purgeMessage'),
                        confirmLabel: t('customers.bin.purge'),
                        cancelLabel: t('customers.detail.cancel'),
                        danger: true,
                        onConfirm: () => void run(c, () => purge(c.id), ''),
                      })
                    }
                  >
                    {t('customers.bin.purge')}
                  </Button>
                ) : null}
              </li>
            )
          })}
        </Card>
      )}
      {confirmDialog}
    </div>
  )
}

function CustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { canCreate } = useCustomerPermissions()
  const [filter, setFilter] = useState<CustomerFilter>('active')
  // One search for Active and Archived; the bin has none.
  const [search, setSearch] = useState('')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-headline text-ink">{t('customers.title')}</h1>
        {canCreate ? (
          <Button iconLeft={Plus} onClick={() => navigate('/customers/new')} data-testid="customers-new">
            {t('customers.new')}
          </Button>
        ) : null}
      </div>
      <ArchivedWorkspaceBanner />
      <div aria-label={t('customers.filter.label')}>
        <Tabs
          tabs={CUSTOMER_FILTERS.map((f) => ({ id: f, label: t(`customers.filter.${f}`) }))}
          activeTab={filter}
          onChange={(id) => setFilter(id as CustomerFilter)}
        />
      </div>
      {filter !== 'deleted' ? (
        <Input
          type="search"
          iconLeft={MagnifyingGlass}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('customers.search')}
          aria-label={t('customers.search')}
          autoComplete="off"
          data-testid="customers-search"
        />
      ) : null}
      {filter === 'deleted' ? <DeletedCustomers /> : <CustomerList filter={filter} search={search} />}
    </div>
  )
}

/** Keyed by workspace: a switch drops the previous workspace's search and filter. */
export default function Customers() {
  const key = useWorkspaceKey()
  return <CustomersPage key={key} />
}
