import type { ICustomerDetailDTO } from '@fonderie/client'
import {
  useCustomerAddresses,
  useCustomerEmails,
  useCustomerNotes,
  useCustomerPhones,
  useCustomerRelationships,
  useCustomerTags,
} from '@fonderie/react-customers'
import { Plus, Star, Trash, X } from '@phosphor-icons/react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ActionMenu, type IActionMenuItem } from '../../components/ActionMenu'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import { Notice } from '../../components/Notice'
import { useConfirm } from '../../hooks/useConfirm'
import { useDatePreference } from '../../hooks/useDatePreference'
import { useTranslation } from '../../hooks/useTranslation'
import {
  addressInput,
  addressText,
  customerDisplayName,
  customerErrorMessage,
  customerLabelText,
  primaryPhone,
  relationshipText,
  type ContactKind,
  type EntryKind,
} from '../../lib/customers'
import { AddressDialog, EntryDialog, LabelDialog, RelationshipDialog } from './dialogs'
import { useDefaultCountry } from './hooks'

// The one editor for a saved customer's contact data — phones, emails,
// addresses, notes, tags and linked customers (the mobile app's
// CustomerSections). Every section renders from the one detail read; the
// section hooks are used for their actions only (read: false), and every write
// refreshes everything under /customers — the detail included.

type Target =
  | { kind: 'phone' | 'email' | 'address' | 'relationship'; id: string; isPrimary: boolean; text: string }
  | { kind: 'note'; id: string; text: string }

function Section({
  title,
  addLabel,
  onAdd,
  empty,
  children,
  testId,
}: {
  title: string
  addLabel: string
  onAdd?: () => void
  empty: string | null
  children?: ReactNode
  testId: string
}) {
  const id = useId()
  return (
    <Card as="section" className="p-5" aria-labelledby={id} data-testid={testId}>
      <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
        <h2 id={id} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {onAdd ? <IconButton icon={Plus} size="sm" variant="ghost" aria-label={addLabel} onClick={onAdd} /> : null}
      </div>
      {empty ? <p className="text-sm text-ink-subtle">{empty}</p> : children}
    </Card>
  )
}

function PrimaryBadge() {
  const { t } = useTranslation()
  return <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-link">{t('customers.sections.primary')}</span>
}

/** label · value · primary · ⋯ — the mobile CustomerRow. */
function ContactRow({
  label,
  value,
  isPrimary,
  onLabel,
  menu,
}: {
  label: string
  value: string
  isPrimary: boolean
  onLabel?: () => void
  menu?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <li className="flex min-h-11 items-center gap-3 border-b border-hairline py-1 last:border-b-0">
      {onLabel ? (
        <button
          type="button"
          className="w-24 shrink-0 cursor-pointer truncate text-left text-xs text-link underline"
          onClick={onLabel}
          aria-label={t('customers.sections.changeLabel', { label })}
        >
          {label}
        </button>
      ) : (
        <span className="w-24 shrink-0 truncate text-xs text-link">{label}</span>
      )}
      <span className="min-w-0 flex-1 text-sm break-words text-ink">{value}</span>
      {isPrimary ? <PrimaryBadge /> : null}
      {menu}
    </li>
  )
}

export function CustomerSections({ customer, canEdit }: { customer: ICustomerDetailDTO; canEdit: boolean }) {
  const { t } = useTranslation()
  // One wording for every address in the app: the business locations' "Unit 4B" / "Buzzer 12".
  const words = {
    unit: (u: string) => t('business.locations.unitInline', { unit: u }),
    buzzer: (c: string) => t('business.locations.buzzerInline', { code: c }),
  }
  const formatDate = useDatePreference()
  const country = useDefaultCountry()
  const id = customer.id
  const phones = useCustomerPhones(id, { read: false })
  const emails = useCustomerEmails(id, { read: false })
  const addresses = useCustomerAddresses(id, { read: false })
  const notes = useCustomerNotes(id, { read: false })
  const tags = useCustomerTags(id, { read: false })
  const rels = useCustomerRelationships(id, { read: false })
  const { confirm, element: confirmDialog } = useConfirm()

  const [entry, setEntry] = useState<EntryKind | null>(null)
  const [addrOpen, setAddrOpen] = useState(false)
  const [relOpen, setRelOpen] = useState(false)
  const [labelTarget, setLabelTarget] = useState<{ kind: ContactKind; id: string; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = (p: Promise<unknown>) => {
    setError(null)
    p.catch((e) => setError(customerErrorMessage(t, e)))
  }

  const saveEntry = async ({ value, label }: { value: string; label?: string }) => {
    if (entry === 'phone') await phones.addPhone({ phone: value, label, isPrimary: customer.phones.length === 0 })
    if (entry === 'email') await emails.addEmail({ email: value, label, isPrimary: customer.emails.length === 0 })
    if (entry === 'note') await notes.createNote(value)
    if (entry === 'tag') await tags.addTag(value)
  }

  const menuFor = (tg: Target): ReactNode => {
    if (!canEdit) return null
    const items: IActionMenuItem[] = []
    if (tg.kind !== 'note' && !tg.isPrimary) {
      items.push({
        label: t('customers.sections.setPrimary'),
        icon: Star,
        onSelect: () => {
          if (tg.kind === 'phone') run(phones.setPrimaryPhone(tg.id))
          if (tg.kind === 'email') run(emails.setPrimaryEmail(tg.id))
          if (tg.kind === 'address') run(addresses.setPrimaryAddress(tg.id))
          if (tg.kind === 'relationship') run(rels.setPrimaryRelationship(tg.id))
        },
      })
    }
    items.push({
      label: t('customers.sections.remove'),
      icon: Trash,
      danger: true,
      onSelect: () =>
        confirm({
          title: t('customers.sections.confirm'),
          description: t('customers.sections.removeMessage', { item: tg.text }),
          confirmLabel: t('customers.sections.remove'),
          cancelLabel: t('customers.sections.cancel'),
          danger: true,
          onConfirm: () => {
            if (tg.kind === 'phone') run(phones.removePhone(tg.id))
            if (tg.kind === 'email') run(emails.removeEmail(tg.id))
            if (tg.kind === 'address') run(addresses.removeAddress(tg.id))
            if (tg.kind === 'note') run(notes.deleteNote(tg.id))
            if (tg.kind === 'relationship') run(rels.removeRelationship(tg.id))
          },
        }),
    })
    return <ActionMenu label={t('customers.sections.actionsFor', { item: tg.text })} title={tg.text} items={items} />
  }

  const relationships = customer.relationships ?? []
  const add = (fn: () => void) => (canEdit ? fn : undefined)

  return (
    <div className="space-y-4">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title={t('customers.sections.phone')}
          addLabel={t('customers.sections.addPhone')}
          onAdd={add(() => setEntry('phone'))}
          empty={customer.phones.length ? null : t('customers.sections.noPhone')}
          testId="section-phones"
        >
          <ul>
            {customer.phones.map((p) => (
              <ContactRow
                key={p.id}
                label={customerLabelText(t, p.label)}
                value={p.phone}
                isPrimary={p.isPrimary}
                onLabel={canEdit ? () => setLabelTarget({ kind: 'phone', id: p.id, label: p.label }) : undefined}
                menu={menuFor({ kind: 'phone', id: p.id, isPrimary: p.isPrimary, text: p.phone })}
              />
            ))}
          </ul>
        </Section>

        <Section
          title={t('customers.sections.email')}
          addLabel={t('customers.sections.addEmail')}
          onAdd={add(() => setEntry('email'))}
          empty={customer.emails.length ? null : t('customers.sections.noEmail')}
          testId="section-emails"
        >
          <ul>
            {customer.emails.map((e) => (
              <ContactRow
                key={e.id}
                label={customerLabelText(t, e.label)}
                value={e.email}
                isPrimary={e.isPrimary}
                onLabel={canEdit ? () => setLabelTarget({ kind: 'email', id: e.id, label: e.label }) : undefined}
                menu={menuFor({ kind: 'email', id: e.id, isPrimary: e.isPrimary, text: e.email })}
              />
            ))}
          </ul>
        </Section>
      </div>

      <Section
        title={t('customers.sections.address')}
        addLabel={t('customers.sections.addAddress')}
        onAdd={add(() => setAddrOpen(true))}
        empty={customer.addresses.length ? null : t('customers.sections.noAddress')}
        testId="section-addresses"
      >
        <ul>
          {customer.addresses.map((a) => (
            <ContactRow
              key={a.id}
              label={customerLabelText(t, a.label)}
              value={addressText(a, words)}
              isPrimary={a.isPrimary}
              onLabel={canEdit ? () => setLabelTarget({ kind: 'address', id: a.id, label: a.label }) : undefined}
              menu={menuFor({ kind: 'address', id: a.id, isPrimary: a.isPrimary, text: addressText(a) })}
            />
          ))}
        </ul>
      </Section>

      <Section
        title={t('customers.sections.notes')}
        addLabel={t('customers.sections.addNote')}
        onAdd={add(() => setEntry('note'))}
        empty={customer.notes.length ? null : t('customers.sections.noNotes')}
        testId="section-notes"
      >
        <ul>
          {customer.notes.map((n) => (
            <li key={n.id} className="border-b border-hairline py-2 last:border-b-0">
              <p className="text-sm whitespace-pre-wrap text-ink">{n.body}</p>
              <div className="flex min-h-8 items-center justify-between">
                <span className="text-xs text-ink-subtle">{n.createdAt ? formatDate(n.createdAt) : ''}</span>
                {menuFor({ kind: 'note', id: n.id, text: n.body.slice(0, 40) })}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={t('customers.sections.tags')}
        addLabel={t('customers.sections.addTag')}
        onAdd={add(() => setEntry('tag'))}
        empty={customer.tags.length ? null : t('customers.sections.noTags')}
        testId="section-tags"
      >
        <div className="flex flex-wrap gap-2">
          {customer.tags.map((tag) =>
            canEdit ? (
              <button
                key={tag}
                type="button"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-muted hover:text-ink"
                aria-label={t('customers.sections.removeTagA11y', { tag })}
                onClick={() =>
                  confirm({
                    title: t('customers.sections.removeTagTitle'),
                    description: t('customers.sections.removeTagMessage', { tag }),
                    confirmLabel: t('customers.sections.remove'),
                    cancelLabel: t('customers.sections.cancel'),
                    danger: true,
                    onConfirm: () => run(tags.removeTag(tag)),
                  })
                }
              >
                {tag}
                <X size={12} aria-hidden="true" />
              </button>
            ) : (
              <span key={tag} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-muted">
                {tag}
              </span>
            ),
          )}
        </div>
      </Section>

      <Section
        title={t('customers.sections.relationships')}
        addLabel={t('customers.sections.addRelationship')}
        onAdd={add(() => setRelOpen(true))}
        empty={relationships.length ? null : t('customers.sections.noRelationships')}
        testId="section-relationships"
      >
        <ul>
          {relationships.map((r) => {
            const name = customerDisplayName(r)
            const phone = primaryPhone(r)
            return (
              <li key={r.relationshipId ?? r.id} className="flex min-h-11 items-center gap-3 border-b border-hairline py-1 last:border-b-0">
                <Link to={`/customers/${r.relatedId}`} className="min-w-0 flex-1 hover:underline" aria-label={`${name}, ${relationshipText(t, r.relationship)}`}>
                  <span className="block truncate text-sm font-medium text-ink">{name}</span>
                  <span className="block text-xs text-ink-subtle">
                    {relationshipText(t, r.relationship)}
                    {phone ? ` · ${phone}` : ''}
                  </span>
                </Link>
                {r.isPrimary ? <PrimaryBadge /> : null}
                {menuFor({ kind: 'relationship', id: r.relatedId, isPrimary: r.isPrimary, text: name })}
              </li>
            )
          })}
        </ul>
      </Section>

      {canEdit && entry ? <EntryDialog kind={entry} defaultCountry={country} onClose={() => setEntry(null)} onSave={saveEntry} /> : null}
      {canEdit && addrOpen ? (
        <AddressDialog onClose={() => setAddrOpen(false)} onSave={(d) => addresses.addAddress(addressInput(d, customer.addresses.length === 0))} />
      ) : null}
      {canEdit && relOpen ? (
        <RelationshipDialog
          customerId={id}
          onClose={() => setRelOpen(false)}
          onSave={(relatedId, relationship) => rels.addRelationship({ relatedId, relationship, isPrimary: relationships.length === 0 })}
        />
      ) : null}
      {canEdit && labelTarget ? (
        <LabelDialog
          kind={labelTarget.kind}
          current={labelTarget.label}
          onClose={() => setLabelTarget(null)}
          onSave={async (label) => {
            if (labelTarget.kind === 'phone') await phones.updatePhoneLabel(labelTarget.id, label)
            if (labelTarget.kind === 'email') await emails.updateEmailLabel(labelTarget.id, label)
            if (labelTarget.kind === 'address') await addresses.updateAddressLabel(labelTarget.id, label)
          }}
        />
      ) : null}
      {confirmDialog}
    </div>
  )
}
