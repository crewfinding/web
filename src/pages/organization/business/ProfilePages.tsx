import type { IWorkspaceDTO } from '@fonderie/client'
import { useFonderieClient } from '@fonderie/react'
import { useUploadMedia } from '@fonderie/react-media'
import { useWorkspaceProfile } from '@fonderie/react-workspaces'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'
import { useCardDraft } from '../../../hooks/useCardDraft'
import { useTranslation } from '../../../hooks/useTranslation'
import { errorMessage } from '../../../lib/apiErrors'
import { businessOption } from '../../../constants/businessMenu'
import {
  BUSINESS_TYPES,
  MAX,
  legalErrorField,
  legalInput,
  legalValues,
  profileErrorField,
  profileInput,
  profileValues,
  type ILegalValues,
  type IProfileValues,
} from '../../../lib/business'
import { TRADES, isTrade } from '../../../lib/trades'
import type { TranslationKey } from '../../../locales'
import { CardError, FormFooter, LabeledSelect } from './parts'
import { BusinessPage, type IBusinessContext } from './Shell'

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

const numberLabel = (t: T, country: 'CA' | 'US') => t(country === 'US' ? 'business.taxTypes.EIN' : 'business.taxTypes.BN')

// The same checks as the profile photo (Settings): what @fonderie/media accepts.
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const LOGO_MAX_BYTES = 1_000_000

function Logo({ workspace }: { workspace: IWorkspaceDTO }) {
  const { t } = useTranslation()
  if (workspace.logoUrl) {
    return <img src={workspace.logoUrl} alt={t('business.logo.a11y')} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
  }
  const initials = (workspace.name || '?').trim().slice(0, 2).toUpperCase()
  return (
    <span
      role="img"
      aria-label={t('business.logo.a11y')}
      className="inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-2 text-lg font-semibold text-ink-subtle"
    >
      {initials}
    </span>
  )
}

/**
 * Pick → upload → set as the workspace logo, at once (like the profile photo)
 * — it does not wait for the page's Save. The previous logo is deleted when
 * it was one of ours.
 */
function LogoEditor({ workspace }: { workspace: IWorkspaceDTO }) {
  const { t } = useTranslation()
  const client = useFonderieClient()
  const { upload, isUploading } = useUploadMedia()
  const { updateWorkspace } = useWorkspaceProfile()
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = async (file: File | undefined) => {
    if (!file) return
    if (!LOGO_TYPES.includes(file.type) || file.size > LOGO_MAX_BYTES) {
      toast.error(t('business.logo.prepareError'))
      return
    }
    setBusy(true)
    try {
      const asset = await upload(file, { purpose: 'logo', ownerType: 'workspace', ownerId: workspace.id })
      await updateWorkspace({ logoUrl: client.media.assetUrl(asset.id) })
      const priorId = client.media.assetIdFromUrl(workspace.logoUrl)
      // Best effort: an orphaned old logo costs storage, not correctness.
      if (priorId && priorId !== asset.id) client.media.delete(priorId).catch(() => undefined)
    } catch (err) {
      toast.error(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  // Delete: clear the workspace's logo first, then drop the file when it was ours.
  const onDelete = async () => {
    setBusy(true)
    try {
      await updateWorkspace({ logoUrl: null })
      const priorId = client.media.assetIdFromUrl(workspace.logoUrl)
      if (priorId) client.media.delete(priorId).catch(() => undefined)
    } catch (err) {
      toast.error(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  const working = busy || isUploading
  return (
    <div className="flex items-center gap-3">
      <Logo workspace={workspace} />
      <input
        ref={fileRef}
        type="file"
        accept={LOGO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void onPick(file)
        }}
      />
      <Button size="sm" loading={working} disabled={working} onClick={() => fileRef.current?.click()}>
        {working ? t('business.logo.uploading') : t(workspace.logoUrl ? 'business.logo.change' : 'business.logo.add')}
      </Button>
      {workspace.logoUrl && !working ? (
        <Button size="sm" variant="secondary" onClick={() => void onDelete()}>
          {t('business.logo.delete')}
        </Button>
      ) : null}
    </div>
  )
}

// ── Business profile: logo, name, slogan, sector, website ─────────────────────

const PROFILE_FIELDS: (keyof IProfileValues)[] = ['name', 'motto', 'industry', 'website']

function ProfileForm({ workspace, canEdit, write, back }: IBusinessContext) {
  const { t } = useTranslation()
  const { updateWorkspace } = useWorkspaceProfile()
  const initial = useMemo(() => profileValues(workspace), []) // eslint-disable-line react-hooks/exhaustive-deps
  const d = useCardDraft<IProfileValues>(initial)
  const v = d.values
  const optional = (label: string) => `${label} ${t('business.optional')}`

  const check = () => {
    const e: Record<string, string> = {}
    if (!v.name.trim()) e.name = t('business.empty')
    else if (v.name.trim().length > MAX.name) e.name = t('business.tooLong', { max: MAX.name })
    if (v.motto.trim().length > MAX.motto) e.motto = t('business.tooLong', { max: MAX.motto })
    return e
  }
  const onSave = async () => {
    const ok = await d.save(
      check,
      async () => {
        await write(() => updateWorkspace(profileInput(v)))
      },
      profileErrorField,
    )
    if (ok) back()
  }

  const tradeOptions = TRADES.map((k) => ({ label: t(`business.trades.${k}`), value: k as string }))
  if (v.industry && !isTrade(v.industry)) tradeOptions.push({ label: v.industry, value: v.industry })
  const field = (name: (typeof PROFILE_FIELDS)[number], label: string, extra: { placeholder?: string } = {}) => (
    <Input label={label} value={v[name]} error={d.errors[name]} onChange={(e) => d.set({ [name]: e.target.value } as Partial<IProfileValues>)} {...extra} />
  )

  return (
    <div className="space-y-4">
      <CardError message={d.formError} />
      {canEdit ? <LogoEditor workspace={workspace} /> : <Logo workspace={workspace} />}
      <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
        {field('name', t('business.profile.name'))}
        {field('motto', optional(t('business.profile.slogan')))}
        <LabeledSelect label={t('business.profile.sector')} value={v.industry} options={tradeOptions} onChange={(x) => d.set({ industry: x })} error={d.errors.industry} />
        {field('website', optional(t('business.contact.website')), { placeholder: 'https://' })}
      </fieldset>
      {canEdit ? <FormFooter saving={d.saving} onSave={() => void onSave()} onDiscard={back} /> : null}
    </div>
  )
}

/** The fields a page edits, as a key: the form restarts on them when the stored values change. */
const formKey = (...parts: unknown[]) => JSON.stringify(parts)

export function BusinessProfilePage() {
  const { t } = useTranslation()
  const o = businessOption('profile')
  return (
    <BusinessPage title={t(o.label)} paragraph={t(o.paragraph)} testId="business-profile">
      {(ctx) => <ProfileForm key={formKey(ctx.workspace.name, ctx.workspace.motto, ctx.workspace.industry, ctx.workspace.website)} {...ctx} />}
    </BusinessPage>
  )
}

// ── Legal details: legal name, legal form, BN / EIN ──────────────────────────

function LegalForm({ workspace, canEdit, country, write, back }: IBusinessContext) {
  const { t } = useTranslation()
  const { updateWorkspace } = useWorkspaceProfile()
  const initial = useMemo(() => legalValues(workspace, country), []) // eslint-disable-line react-hooks/exhaustive-deps
  const d = useCardDraft<ILegalValues>(initial)
  const v = d.values
  const optional = (label: string) => `${label} ${t('business.optional')}`

  const check = () => {
    const e: Record<string, string> = {}
    if (v.legalName.trim().length > MAX.legalName) e.legalName = t('business.tooLong', { max: MAX.legalName })
    if (v.businessNumber.trim().length > MAX.taxNumber) e.businessNumber = t('business.tooLong', { max: MAX.taxNumber })
    return e
  }
  const onSave = async () => {
    const ok = await d.save(
      check,
      async () => {
        await write(() => updateWorkspace(legalInput(v, initial, workspace, country)))
      },
      legalErrorField,
    )
    if (ok) back()
  }

  return (
    <div className="space-y-4">
      <CardError message={d.formError} />
      <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
        <Input
          label={optional(t('business.profile.legalName'))}
          value={v.legalName}
          error={d.errors.legalName}
          onChange={(e) => d.set({ legalName: e.target.value })}
        />
        <LabeledSelect
          label={t('business.profile.type')}
          value={v.businessType}
          options={BUSINESS_TYPES.map((x) => ({ label: t(`business.types.${x}`), value: x as string }))
            .concat(v.businessType && !(BUSINESS_TYPES as readonly string[]).includes(v.businessType) ? [{ label: v.businessType, value: v.businessType }] : [])}
          onChange={(x) => d.set({ businessType: x })}
          error={d.errors.businessType}
        />
        <Input
          label={optional(numberLabel(t, country))}
          value={v.businessNumber}
          error={d.errors.businessNumber}
          onChange={(e) => d.set({ businessNumber: e.target.value })}
        />
      </fieldset>
      {canEdit ? <FormFooter saving={d.saving} onSave={() => void onSave()} onDiscard={back} /> : null}
    </div>
  )
}

const isBn = (r: { type: string }) => r.type === 'BN' || r.type === 'EIN'

export function BusinessLegalPage() {
  const { t } = useTranslation()
  const o = businessOption('legal')
  return (
    <BusinessPage title={t(o.label)} paragraph={t(o.paragraph)} testId="business-legal">
      {(ctx) => (
        <LegalForm
          key={formKey(ctx.country, ctx.workspace.legalName, ctx.workspace.businessType, (ctx.workspace.taxRegistrations ?? []).filter(isBn))}
          {...ctx}
        />
      )}
    </BusinessPage>
  )
}
