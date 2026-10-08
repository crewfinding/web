import { useWorkspaceContacts } from '@fonderie/react-workspaces'
import { PencilSimple, Plus, Star, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { ActionMenu } from '../../../components/ActionMenu'
import { Button } from '../../../components/Button'
import { IconButton } from '../../../components/IconButton'
import { Input } from '../../../components/Input'
import { PhoneInput } from '../../../components/PhoneInput'
import { businessOption } from '../../../constants/businessMenu'
import { useTranslation } from '../../../hooks/useTranslation'
import { EMAIL, legacyEmail, legacyPhone } from '../../../lib/business'
import { listControls } from '../../../lib/businessPages'
import { asCountry, isValidPhone, normalizePhone } from '../../../lib/phone'
import { CardError, Prompt, SectionCard } from './parts'
import { BusinessPage, type IBusinessContext } from './Shell'
import { useAction } from './useAction'

// Emails / Phone numbers (the mobile app's ContactList): one list each, with
// "+" at the right of its title opening the add form in place, under the
// list. Each action saves at once (owner / manager); the primary email /
// phone ARE the workspace's (the server keeps them in step).

type Kind = 'email' | 'phone'
const BLANK = { value: '', label: '', error: '' }

const COPY = {
  email: {
    title: 'business.contact.emails',
    empty: 'business.contact.emailEmpty',
    add: 'business.contact.emailAdd',
    field: 'business.locations.email',
    legacy: 'business.legacy.email',
    error: 'business.contact.emailError',
  },
  phone: {
    title: 'business.contact.phones',
    empty: 'business.contact.phoneEmpty',
    add: 'business.contact.phoneAdd',
    field: 'business.locations.phone',
    legacy: 'business.legacy.phone',
    error: 'business.contact.phoneError',
  },
} as const

function ContactList({ kind, workspace, canEdit, country, write }: IBusinessContext & { kind: Kind }) {
  const { t } = useTranslation()
  const { emails, phones, addEmail, updateEmail, removeEmail, addPhone, updatePhone, removePhone } = useWorkspaceContacts()
  const action = useAction(write)
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(BLANK)
  // The phone field restarts from what is set here (a legacy value to fix).
  const [phoneKey, setPhoneKey] = useState(0)
  const copy = COPY[kind]
  const controls = listControls(canEdit, adding)
  const cc = asCountry(country) ?? undefined

  const rows =
    kind === 'email'
      ? emails.map((e) => ({ id: e.id, value: e.email, label: e.label ?? '', isPrimary: e.isPrimary }))
      : phones.map((p) => ({ id: p.id, value: p.extension ? `${p.phone} ext. ${p.extension}` : p.phone, label: p.label ?? '', isPrimary: p.isPrimary }))
  const legacy = kind === 'email' ? legacyEmail(workspace, emails) : legacyPhone(workspace, phones, country)

  const closeAdd = () => {
    setAdding(false)
    setDraft(BLANK)
  }
  const onAdd = async () => {
    const label = draft.label.trim() || null
    if (kind === 'email') {
      const value = draft.value.trim().toLowerCase()
      if (!EMAIL.test(value)) return setDraft((s) => ({ ...s, error: t(copy.error) }))
      if (await action.run(() => addEmail({ email: value, label }))) closeAdd()
    } else {
      if (!isValidPhone(draft.value, cc)) return setDraft((s) => ({ ...s, error: t(copy.error) }))
      if (await action.run(() => addPhone({ phone: draft.value, label }))) closeAdd()
    }
  }
  // The legacy value: added as is when valid (a phone in E.164 for the head
  // office's country); otherwise the add form opens on it, with its error.
  const onAddLegacy = () => {
    if (!legacy) return
    const valid = kind === 'email' ? EMAIL.test(legacy) : isValidPhone(legacy, cc)
    if (!valid) {
      setDraft({ value: legacy, label: '', error: t(copy.error) })
      setPhoneKey((k) => k + 1)
      setAdding(true)
      return
    }
    void action.run(() => (kind === 'email' ? addEmail({ email: legacy.toLowerCase() }) : addPhone({ phone: normalizePhone(legacy, cc) ?? legacy })))
  }
  const saveLabel = async () => {
    if (!editing) return
    const label = editing.label.trim() || null
    if (await action.run(() => (kind === 'email' ? updateEmail(editing.id, { label }) : updatePhone(editing.id, { label })))) setEditing(null)
  }
  const makePrimary = (id: string) => void action.run(() => (kind === 'email' ? updateEmail(id, { isPrimary: true }) : updatePhone(id, { isPrimary: true })))
  const remove = (id: string) => void action.run(() => (kind === 'email' ? removeEmail(id) : removePhone(id)))

  return (
    <SectionCard
      title={t(copy.title)}
      testId={`list-${kind}`}
      action={
        controls.plus ? (
          <IconButton icon={Plus} size="sm" variant="ghost" aria-label={t(copy.add)} data-testid={`add-${kind}`} onClick={() => setAdding(true)} />
        ) : undefined
      }
    >
      <CardError message={action.error} />
      {!rows.length && !legacy ? <p className="text-sm text-ink-subtle">{t(copy.empty)}</p> : null}
      {rows.length ? (
        <ul className="divide-y divide-hairline">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-2 py-2" data-testid={`${kind}-row-${r.id}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm text-ink">{r.value}</p>
                  {r.isPrimary ? (
                    <span
                      className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-link"
                      aria-label={t('business.contact.primary')}
                      title={t('business.contact.primary')}
                      data-testid={`${kind}-primary-${r.id}`}
                    >
                      {`★ ${t('business.contact.primaryBadge')}`}
                    </span>
                  ) : null}
                </div>
                {editing?.id === r.id ? (
                  <div className="mt-2 space-y-2">
                    <Input
                      label={t('business.contact.label')}
                      placeholder={t('business.contact.labelPlaceholder')}
                      value={editing.label}
                      onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void saveLabel()} loading={action.busy} disabled={action.busy}>
                        {t('business.save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        {t('business.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : r.label ? (
                  <p className="text-xs text-ink-subtle">{r.label}</p>
                ) : null}
              </div>
              {controls.itemMenu ? (
                <ActionMenu
                  label={t('business.more')}
                  title={r.value}
                  disabled={action.busy}
                  items={[
                    ...(r.isPrimary ? [] : [{ label: t('business.contact.makePrimary'), icon: Star, onSelect: () => makePrimary(r.id) }]),
                    { label: t('business.contact.editLabel'), icon: PencilSimple, onSelect: () => setEditing({ id: r.id, label: r.label }) },
                    { label: t('business.contact.remove'), icon: Trash, danger: true, onSelect: () => remove(r.id) },
                  ]}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {legacy ? (
        canEdit ? (
          <Prompt testId={`legacy-${kind}`} text={t(copy.legacy, { value: legacy })} action={t('business.legacy.add')} onClick={onAddLegacy} />
        ) : (
          <p className="text-sm text-ink" data-testid={`legacy-${kind}`}>
            {legacy}
          </p>
        )
      ) : null}
      {controls.form ? (
        <div className="grid gap-3 rounded-lg border border-hairline p-3 md:grid-cols-2" data-testid={`${kind}-add-form`}>
          {kind === 'email' ? (
            <Input
              type="email"
              label={t(copy.field)}
              value={draft.value}
              error={draft.error || undefined}
              autoFocus
              onChange={(e) => setDraft((s) => ({ ...s, value: e.target.value, error: '' }))}
            />
          ) : (
            <PhoneInput
              key={phoneKey}
              label={t(copy.field)}
              value={draft.value}
              defaultCountry={country}
              error={draft.error || undefined}
              onChange={(v) => setDraft((s) => ({ ...s, value: v, error: '' }))}
            />
          )}
          <Input
            label={t('business.contact.labelOptional')}
            placeholder={t('business.contact.labelPlaceholder')}
            value={draft.label}
            onChange={(e) => setDraft((s) => ({ ...s, label: e.target.value }))}
          />
          <div className="flex gap-2 md:col-span-2">
            <Button size="sm" onClick={() => void onAdd()} loading={action.busy} disabled={action.busy}>
              {t(copy.add)}
            </Button>
            <Button size="sm" variant="ghost" onClick={closeAdd}>
              {t('business.cancel')}
            </Button>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export function BusinessEmailsPage() {
  const { t } = useTranslation()
  const o = businessOption('emails')
  return (
    <BusinessPage title={t(o.label)} paragraph={t(o.paragraph)} testId="business-emails">
      {(ctx) => <ContactList kind="email" {...ctx} />}
    </BusinessPage>
  )
}

export function BusinessPhonesPage() {
  const { t } = useTranslation()
  const o = businessOption('phones')
  return (
    <BusinessPage title={t(o.label)} paragraph={t(o.paragraph)} testId="business-phones">
      {(ctx) => <ContactList kind="phone" {...ctx} />}
    </BusinessPage>
  )
}
