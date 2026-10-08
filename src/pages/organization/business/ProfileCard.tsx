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
import {
  BUSINESS_TYPES,
  MAX,
  profileErrorField,
  profileInput,
  profileValues,
  type IProfileValues,
} from '../../../lib/business'
import { TRADES, isTrade } from '../../../lib/trades'
import type { TranslationKey } from '../../../locales'
import { CardError, Detail, Disclosure, LabeledSelect, SaveBar, SectionCard } from './parts'

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

const tradeLabel = (t: T, industry: string) => (isTrade(industry) ? t(`business.trades.${industry}`) : industry)
const typeLabel = (t: T, type: string) =>
  (BUSINESS_TYPES as readonly string[]).includes(type) ? t(`business.types.${type as (typeof BUSINESS_TYPES)[number]}`) : type
const numberLabel = (t: T, country: 'CA' | 'US') => t(country === 'US' ? 'business.taxTypes.EIN' : 'business.taxTypes.BN')

// The same checks as the profile photo (Settings): what @fonderie/media accepts.
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const LOGO_MAX_BYTES = 1_000_000

function Logo({ workspace }: { workspace: IWorkspaceDTO }) {
  const { t } = useTranslation()
  if (workspace.logoUrl) {
    return <img src={workspace.logoUrl} alt={t('business.logo.a11y')} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
  }
  const initials = (workspace.name || '?').trim().slice(0, 2).toUpperCase()
  return (
    <span
      role="img"
      aria-label={t('business.logo.a11y')}
      className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-lg font-semibold text-ink-subtle"
    >
      {initials}
    </span>
  )
}

/**
 * Pick → upload → set as the workspace logo, at once (like the profile photo)
 * — it does not wait for the card's save. The previous logo is deleted when
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
      <Button size="sm" variant="secondary" loading={working} disabled={working} onClick={() => fileRef.current?.click()}>
        {working ? t('business.logo.uploading') : t(workspace.logoUrl ? 'business.logo.change' : 'business.logo.add')}
      </Button>
      {workspace.logoUrl && !working ? (
        <Button size="sm" variant="ghost" aria-label={t('business.logo.deleteA11y')} onClick={() => void onDelete()}>
          {t('business.logo.delete')}
        </Button>
      ) : null}
    </div>
  )
}

export function ProfileCard({ workspace, country, canEdit }: { workspace: IWorkspaceDTO; country: 'CA' | 'US'; canEdit: boolean }) {
  const { t } = useTranslation()
  const { updateWorkspace } = useWorkspaceProfile()
  const initial = useMemo(() => profileValues(workspace, country), []) // eslint-disable-line react-hooks/exhaustive-deps
  const d = useCardDraft<IProfileValues>(initial)
  const [legalOpen, setLegalOpen] = useState(false)
  const optional = (label: string) => `${label} ${t('business.optional')}`
  const tooLong = (max: number) => t('business.tooLong', { max })
  const title = t('business.profile.title')

  if (!canEdit) {
    return (
      <SectionCard title={title} testId="card-profile">
        <Logo workspace={workspace} />
        <Detail label={t('business.profile.name')} value={workspace.name} />
        <Detail label={t('business.profile.slogan')} value={workspace.motto} />
        <Detail label={t('business.profile.sector')} value={tradeLabel(t, workspace.industry ?? '')} />
        <Disclosure label={t('business.profile.legal')} open={legalOpen} onToggle={() => setLegalOpen(!legalOpen)}>
          <Detail label={t('business.profile.legalName')} value={workspace.legalName} />
          <Detail label={t('business.profile.type')} value={typeLabel(t, workspace.businessType ?? '')} />
          <Detail label={numberLabel(t, country)} value={initial.businessNumber} />
        </Disclosure>
      </SectionCard>
    )
  }

  const v = d.values
  const text = (name: keyof IProfileValues, label: string) => (
    <Input label={label} value={v[name]} error={d.errors[name]} onChange={(e) => d.set({ [name]: e.target.value } as Partial<IProfileValues>)} />
  )
  const check = () => {
    const e: Record<string, string> = {}
    if (!v.name.trim()) e.name = t('business.empty')
    const lengths: [keyof IProfileValues, number][] = [
      ['name', MAX.name],
      ['motto', MAX.motto],
      ['legalName', MAX.legalName],
      ['businessNumber', MAX.taxNumber],
    ]
    for (const [k, max] of lengths) if (!e[k] && v[k].trim().length > max) e[k] = tooLong(max)
    if (e.legalName || e.businessNumber) setLegalOpen(true)
    return e
  }
  const onSave = () =>
    void d.save(
      check,
      async () => {
        await updateWorkspace(profileInput(v, initial, workspace, country))
      },
      (path) => {
        const f = profileErrorField(path)
        if (f === 'legalName' || f === 'businessType' || f === 'businessNumber') setLegalOpen(true)
        return f
      },
    )

  const tradeOptions = TRADES.map((k) => ({ label: t(`business.trades.${k}`), value: k as string }))
  if (v.industry && !isTrade(v.industry)) tradeOptions.push({ label: v.industry, value: v.industry })

  return (
    <SectionCard title={title} testId="card-profile">
      <CardError message={d.formError} />
      <div className="grid gap-4 lg:grid-cols-[auto_1fr_1fr] lg:items-end">
        <LogoEditor workspace={workspace} />
        {text('name', t('business.profile.name'))}
        {text('motto', optional(t('business.profile.slogan')))}
      </div>
      <LabeledSelect
        label={t('business.profile.sector')}
        value={v.industry}
        options={tradeOptions}
        onChange={(x) => d.set({ industry: x })}
        error={d.errors.industry}
      />
      <Disclosure label={t('business.profile.legal')} open={legalOpen} onToggle={() => setLegalOpen(!legalOpen)}>
        <div className="grid gap-4 md:grid-cols-3">
          {text('legalName', optional(t('business.profile.legalName')))}
          <LabeledSelect
            label={t('business.profile.type')}
            value={v.businessType}
            options={BUSINESS_TYPES.map((x) => ({ label: t(`business.types.${x}`), value: x }))}
            onChange={(x) => d.set({ businessType: x })}
            error={d.errors.businessType}
          />
          {text('businessNumber', optional(numberLabel(t, country)))}
        </div>
      </Disclosure>
      <SaveBar visible={d.dirty} saving={d.saving} onSave={onSave} onCancel={d.reset} />
    </SectionCard>
  )
}
