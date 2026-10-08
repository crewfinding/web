import type { IWorkspaceDTO } from '@fonderie/client'
import { useWorkspaceContacts, useWorkspaceProfile } from '@fonderie/react-workspaces'
import { PencilSimple, Plus, Star, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { ActionMenu } from '../../../components/ActionMenu'
import { Button } from '../../../components/Button'
import { IconButton } from '../../../components/IconButton'
import { Input } from '../../../components/Input'
import { PhoneInput } from '../../../components/PhoneInput'
import { useCardDraft } from '../../../hooks/useCardDraft'
import { useTranslation } from '../../../hooks/useTranslation'
import { EMAIL, legacyEmail, legacyPhone, normalizeWebsite } from '../../../lib/business'
import { asCountry, isValidPhone, normalizePhone } from '../../../lib/phone'
import { useAction } from './useAction'
import { CardError, Detail, Prompt, SaveBar, SectionCard } from './parts'

// The Contact card (the mobile app's ContactCard): emails, phones, website.
// The lists save each action at once (manager-only); the primary email /
// phone ARE the workspace's (the server keeps them in step).

type Kind = 'email' | 'phone'
const BLANK = { value: '', label: '', error: '' }

export function ContactCard({ workspace, canEdit, country }: { workspace: IWorkspaceDTO; canEdit: boolean; country: string }) {
  const { t } = useTranslation()
  const { emails, phones, addEmail, updateEmail, removeEmail, addPhone, updatePhone, removePhone } = useWorkspaceContacts()
  const { updateWorkspace } = useWorkspaceProfile()
  const action = useAction()
  const [editing, setEditing] = useState<{ kind: Kind; id: string; label: string } | null>(null)
  const [adding, setAdding] = useState<null | Kind>(null)
  const [newEmail, setNewEmail] = useState(BLANK)
  const [newPhone, setNewPhone] = useState(BLANK)
  // The phone field restarts from what is set here (a legacy value to fix).
  const [phoneKey, setPhoneKey] = useState(0)
  const site = useCardDraft({ website: workspace.website ?? '' })

  const oldPhone = legacyPhone(workspace, phones, country)
  const oldEmail = legacyEmail(workspace, emails)

  const onAddEmail = async () => {
    const value = newEmail.value.trim().toLowerCase()
    if (!EMAIL.test(value)) return setNewEmail((s) => ({ ...s, error: t('business.contact.emailError') }))
    if (await action.run(() => addEmail({ email: value, label: newEmail.label.trim() || null }))) {
      setNewEmail(BLANK)
      setAdding(null)
    }
  }
  const onAddPhone = async () => {
    if (!isValidPhone(newPhone.value, asCountry(country) ?? undefined)) {
      return setNewPhone((s) => ({ ...s, error: t('business.contact.phoneError') }))
    }
    if (await action.run(() => addPhone({ phone: newPhone.value, label: newPhone.label.trim() || null }))) {
      setNewPhone(BLANK)
      setAdding(null)
    }
  }
  // The legacy phone: added as is when it reads as a number in the business's
  // country; otherwise it is put in the "Another phone number" field to fix.
  const onAddLegacyPhone = () => {
    if (!oldPhone) return
    const cc = asCountry(country) ?? undefined
    if (!isValidPhone(oldPhone, cc)) {
      setNewPhone({ value: oldPhone, label: '', error: t('business.contact.phoneError') })
      setPhoneKey((k) => k + 1)
      setAdding('phone')
      return
    }
    void action.run(() => addPhone({ phone: normalizePhone(oldPhone, cc) ?? oldPhone }))
  }
  const onAddLegacyEmail = () => {
    if (!oldEmail) return
    if (!EMAIL.test(oldEmail)) {
      setNewEmail({ value: oldEmail, label: '', error: t('business.contact.emailError') })
      setAdding('email')
      return
    }
    void action.run(() => addEmail({ email: oldEmail.toLowerCase() }))
  }
  const saveLabel = async () => {
    if (!editing) return
    const label = editing.label.trim() || null
    const ok = await action.run(() =>
      editing.kind === 'email' ? updateEmail(editing.id, { label }) : updatePhone(editing.id, { label }),
    )
    if (ok) setEditing(null)
  }
  const saveWebsite = () =>
    void site.save(
      () => ({}),
      async () => {
        await updateWorkspace({ website: normalizeWebsite(site.values.website) })
      },
      (path) => (path === 'website' ? 'website' : null),
    )

  const rows = [
    ...emails.map((e) => ({ kind: 'email' as const, id: e.id, value: e.email, label: e.label ?? '', isPrimary: e.isPrimary })),
    ...phones.map((p) => ({
      kind: 'phone' as const,
      id: p.id,
      value: p.extension ? `${p.phone} ext. ${p.extension}` : p.phone,
      label: p.label ?? '',
      isPrimary: p.isPrimary,
    })),
  ]
  const makePrimary = (kind: Kind, id: string) =>
    void action.run(() => (kind === 'email' ? updateEmail(id, { isPrimary: true }) : updatePhone(id, { isPrimary: true })))
  const remove = (kind: Kind, id: string) => void action.run(() => (kind === 'email' ? removeEmail(id) : removePhone(id)))

  const list = (kind: Kind) => {
    const items = rows.filter((r) => r.kind === kind)
    const legacy = kind === 'email' ? oldEmail : oldPhone
    if (!items.length && !legacy)
      return <p className="text-sm text-ink-subtle">{t(kind === 'email' ? 'business.contact.emailEmpty' : 'business.contact.phoneEmpty')}</p>
    return (
      <ul className="divide-y divide-hairline">
        {items.map((r) => (
          <li key={r.id} className="flex items-start gap-2 py-2" data-testid={`${kind}-row-${r.id}`}>
            <IconButton
              icon={Star}
              size="sm"
              variant="ghost"
              className={r.isPrimary ? 'text-warning' : 'text-ink-subtle'}
              aria-label={t(r.isPrimary ? 'business.contact.primary' : 'business.contact.makePrimary')}
              aria-pressed={r.isPrimary}
              disabled={!canEdit || r.isPrimary || action.busy}
              onClick={() => makePrimary(kind, r.id)}
            />
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate text-sm text-ink">{r.value}</p>
              {editing?.id === r.id ? (
                <div className="mt-2 space-y-2">
                  <Input label={t('business.contact.label')} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveLabel()} disabled={action.busy}>
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
            {canEdit ? (
              <ActionMenu
                label={t('business.more')}
                title={r.value}
                disabled={action.busy}
                items={[
                  ...(r.isPrimary
                    ? []
                    : [{ label: t('business.contact.makePrimary'), icon: Star, onSelect: () => makePrimary(r.kind, r.id) }]),
                  {
                    label: t('business.contact.editLabel'),
                    icon: PencilSimple,
                    onSelect: () => setEditing({ kind: r.kind, id: r.id, label: r.label }),
                  },
                  { label: t('business.contact.remove'), icon: Trash, danger: true, onSelect: () => remove(r.kind, r.id) },
                ]}
              />
            ) : null}
          </li>
        ))}
        {legacy ? (
          <li className="py-2">
            {canEdit ? (
              <Prompt
                testId={`legacy-${kind}`}
                text={t(kind === 'email' ? 'business.legacy.email' : 'business.legacy.phone', { value: legacy })}
                action={t('business.legacy.add')}
                onClick={kind === 'email' ? onAddLegacyEmail : onAddLegacyPhone}
              />
            ) : (
              <p className="text-sm text-ink" data-testid={`legacy-${kind}`}>
                {legacy}
              </p>
            )}
          </li>
        ) : null}
      </ul>
    )
  }

  const subHeader = (kind: Kind) => (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-ink">{t(kind === 'email' ? 'business.contact.emails' : 'business.contact.phones')}</h4>
      {canEdit && adding !== kind ? (
        <IconButton
          icon={Plus}
          size="sm"
          variant="ghost"
          aria-label={t(kind === 'email' ? 'business.contact.emailAdd' : 'business.contact.phoneAdd')}
          onClick={() => setAdding(kind)}
        />
      ) : null}
    </div>
  )

  return (
    <SectionCard title={t('business.contact.title')} testId="card-contact">
      <CardError message={action.error} />

      <div>
        {subHeader('email')}
        {list('email')}
        {canEdit && adding === 'email' ? (
          <div className="mt-2 grid gap-3 rounded-lg border border-hairline p-3 md:grid-cols-2">
            <Input
              type="email"
              label={t('business.contact.emailAddLabel')}
              value={newEmail.value}
              error={newEmail.error || undefined}
              onChange={(e) => setNewEmail((s) => ({ ...s, value: e.target.value, error: '' }))}
            />
            <Input
              label={t('business.contact.labelOptional')}
              placeholder={t('business.contact.labelPlaceholder')}
              value={newEmail.label}
              onChange={(e) => setNewEmail((s) => ({ ...s, label: e.target.value }))}
            />
            <div className="flex gap-2 md:col-span-2">
              <Button size="sm" onClick={() => void onAddEmail()} disabled={action.busy}>
                {t('business.contact.emailAdd')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(null)
                  setNewEmail(BLANK)
                }}
              >
                {t('business.cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        {subHeader('phone')}
        {list('phone')}
        {canEdit && adding === 'phone' ? (
          <div className="mt-2 grid gap-3 rounded-lg border border-hairline p-3 md:grid-cols-2">
            <PhoneInput
              key={phoneKey}
              label={t('business.contact.phoneAddLabel')}
              value={newPhone.value}
              defaultCountry={country}
              error={newPhone.error || undefined}
              onChange={(v) => setNewPhone((s) => ({ ...s, value: v, error: '' }))}
            />
            <Input
              label={t('business.contact.labelOptional')}
              placeholder={t('business.contact.labelPlaceholder')}
              value={newPhone.label}
              onChange={(e) => setNewPhone((s) => ({ ...s, label: e.target.value }))}
            />
            <div className="flex gap-2 md:col-span-2">
              <Button size="sm" onClick={() => void onAddPhone()} disabled={action.busy}>
                {t('business.contact.phoneAdd')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(null)
                  setNewPhone(BLANK)
                }}
              >
                {t('business.cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {canEdit ? (
          <>
            <CardError message={site.formError} />
            <Input
              label={t('business.contact.website')}
              placeholder="https://"
              value={site.values.website}
              error={site.errors.website}
              onChange={(e) => site.set({ website: e.target.value })}
            />
            <SaveBar visible={site.dirty} saving={site.saving} onSave={saveWebsite} onCancel={site.reset} />
          </>
        ) : (
          <Detail label={t('business.contact.website')} value={workspace.website} />
        )}
      </div>
    </SectionCard>
  )
}
