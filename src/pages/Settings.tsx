import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BellRinging,
  Camera,
  Clock,
  ClockCounterClockwise,
  Devices,
  Envelope,
  Phone,
  Key,
  ShieldCheck,
  Trash,
  User,
  Warning,
} from '@phosphor-icons/react'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { ProviderIcon } from '../components/ProviderIcon'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { Toggle } from '../components/Toggle'
import { toastError } from '../lib/errors'
import { useAppSession, userDisplayName } from '../lib/session'
import { useTranslation } from '../hooks/useTranslation'
import { localeNames, locales } from '../locales'
import { useFonderieClient } from '@fonderie/react'
import { FonderieApiError, useChangePassword, useMfaSetup } from '@fonderie/react-auth'
import { useUploadAvatar } from '@fonderie/react-media'
import { OtpInput } from '../components/OtpInput'
import { LoginHistoryCard } from '../components/LoginHistoryCard'
import { ActiveSessionsCard } from '../components/ActiveSessionsCard'
import { DateTimeFormatCard } from '../components/DateTimeFormatCard'
import { NotificationsCard } from '../components/NotificationsCard'
import { API_BASE_URL } from '../lib/fonderie'
import { SectionHeader } from '../components/SectionHeader'
import { useAccountData, useAuthProviders, useUnlinkOauth } from '@fonderie/react-auth'
import { cn } from '../lib/cn'

// Icons mirror each section's SectionHeader so the nav item visually maps to
// its card. Labels come from the settings.sections dictionary, keyed by id.
const sections = [
  { id: 'profile', icon: User },
  { id: 'datetime', icon: Clock },
  { id: 'notifications', icon: BellRinging },
  { id: 'security', icon: ShieldCheck },
  { id: 'signin', icon: Key },
  { id: 'activity', icon: ClockCounterClockwise },
  { id: 'sessions', icon: Devices },
  { id: 'danger', icon: Warning },
] as const

// The full IANA timezone list straight from the runtime (Intl) — no dependency
// and nothing to maintain; the browser/Node keeps it current. Engines without
// Intl.supportedValuesOf (pre-2022 browsers) fall back to a short common set.
// The sign-in section is conditional — a deployment with no OAuth provider has
// nothing to link. The nav is filtered by the SAME decision that renders the
// card, or the sidebar offers a link to a section that does not exist. Filtered
// rather than spliced so `sections` stays `as const` and the translation keys
// stay type-checked.
function visibleSections(showSignIn: boolean) {
  return showSignIn ? sections : sections.filter((s) => s.id !== 'signin')
}

const TIMEZONE_FALLBACK = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']
const timeZoneNames =
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : TIMEZONE_FALLBACK
// Guarantee UTC (the stored default) is selectable even if the runtime omits it.
const timezoneOptions = (timeZoneNames.includes('UTC') ? timeZoneNames : ['UTC', ...timeZoneNames]).map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
}))
const languageOptions = locales.map((l) => ({ value: l, label: localeNames[l] }))

const labelClass = 'mb-1 block text-sm font-medium text-ink'

// Client-side pre-checks mirror @fonderie/media's server defaults so bad files
// are rejected before the round-trip (the server enforces them regardless):
// 1 MB cap and raster image types only — SVG is rejected server-side as a
// stored-XSS vector. The upload/encode/persist/cleanup itself lives in
// @fonderie/react-media's useUploadAvatar.
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_AVATAR_BYTES = 1_000_000

function ProfileCard() {
  const { t, locale, setLocale } = useTranslation()
  const { user, refresh } = useAppSession()
  const client = useFonderieClient()
  const [saving, setSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadAvatar, isUploading } = useUploadAvatar()
  const hasAvatar = !!user?.profileImageUrl

  // Avatar upload is one call: @fonderie/react-media's useUploadAvatar encodes
  // the file, POSTs it to /media, sets it as the profile avatar, and deletes the
  // previous asset — the whole flow that used to live here as a hand-rolled
  // fetch. We keep only the client-side pre-checks (UX) and refresh the shared
  // session so the new avatar shows everywhere.
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Allow re-selecting the same file later (change fires only on a new value).
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error(t('settings.profile.avatarTypeError'))
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t('settings.profile.avatarSizeError'))
      return
    }
    try {
      await uploadAvatar(file)
      await refresh({ force: true })
      toast.success(t('settings.profile.avatarUpdated'))
    } catch (err) {
      toastError(err, t('settings.profile.avatarUploadFailed'))
    }
  }

  // Remove the current avatar: clear it on the profile (avatarUrl: null) and
  // best-effort delete the stored asset, then refresh the shared session so the
  // placeholder shows everywhere.
  const handleAvatarRemove = async () => {
    const currentId = client.media.assetIdFromUrl(user?.profileImageUrl)
    setIsRemoving(true)
    try {
      await client.auth.updateProfile({ avatarUrl: null })
      if (currentId) await client.media.delete(currentId).catch(() => undefined)
      await refresh({ force: true })
      toast.success(t('settings.profile.avatarRemoved'))
    } catch (err) {
      toastError(err, t('settings.profile.avatarRemoveFailed'))
    } finally {
      setIsRemoving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const timezone = String(data.get('timezone') ?? '')
    const [firstName = '', ...rest] = name.split(/\s+/)
    setSaving(true)
    try {
      await client.auth.updateProfile({ firstName, lastName: rest.join(' ') })
      if (phone && phone !== user?.phone) await client.auth.updatePhone(phone)
      if (timezone) await client.auth.updatePreferences({ timezone, locale })
      await refresh({ force: true })
      toast.success(t('settings.profile.updated'))
    } catch (err) {
      toastError(err, t('settings.profile.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card as="section" id="profile" className="scroll-mt-20 p-5">
      <SectionHeader
        icon={User}
        title={t('settings.profile.title')}
        description={t('settings.profile.description')}
      />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar src={user?.profileImageUrl} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-ink">{userDisplayName(user)}</h2>
          <p className="truncate text-sm text-ink-subtle">{user?.email}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_AVATAR_TYPES.join(',')}
          className="hidden"
          onChange={(e) => void handleAvatarChange(e)}
        />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="xs"
              iconLeft={Camera}
              loading={isUploading}
              disabled={isRemoving}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('settings.profile.changeAvatar')}
            </Button>
            {hasAvatar && (
              <Button
                variant="secondary"
                size="xs"
                iconLeft={Trash}
                loading={isRemoving}
                disabled={isUploading}
                onClick={() => void handleAvatarRemove()}
              >
                {t('settings.profile.removeAvatar')}
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-subtle">{t('settings.profile.avatarHint')}</p>
        </div>
      </div>
      <form noValidate onSubmit={handleSubmit}>
        <div className="mt-4 grid gap-x-6 gap-y-3 lg:grid-cols-2 xl:grid-cols-3">
          <Input label={t('settings.profile.fullName')} name="name" id="name" defaultValue={userDisplayName(user)} iconLeft={User} />
          <Input
            label={t('settings.profile.email')}
            type="email"
            id="email"
            value={user?.email ?? ''}
            disabled
            iconLeft={Envelope}
            helperText={t('settings.profile.emailHelper')}
          />
          <Input
            label={t('settings.profile.phone')}
            name="phone"
            id="phone"
            type="tel"
            format="phone"
            iconLeft={Phone}
            placeholder={t('settings.profile.phonePlaceholder')}
            defaultValue={user?.phone ?? ''}
          />
          <div>
            <label className={labelClass} htmlFor="timezone">{t('settings.profile.timezone')}</label>
            <Select
              inputId="timezone"
              name="timezone"
              options={timezoneOptions}
              defaultValue={timezoneOptions.find((o) => o.value === (user?.preferences.timezone ?? 'UTC'))}
              isSearchable
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="language">{t('settings.profile.language')}</label>
            <Select
              inputId="language"
              options={languageOptions}
              value={languageOptions.find((o) => o.value === locale)}
              onChange={(option) => option && setLocale(option.value)}
              placeholder={t('settings.profile.languagePlaceholder')}
              isSearchable
            />
            <p className="mt-1 text-xs text-ink-subtle">{t('settings.profile.languageHint')}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={saving}>{t('settings.profile.save')}</Button>
        </div>
      </form>
    </Card>
  )
}

type MfaMode = 'idle' | 'enrolling' | 'disabling' | 'regenerating'

// Sign-in methods.
//
// Which providers exist is decided by the SERVER, not by this build. Shipping a
// "Connect Google" button that a deployment cannot honour sends the user to
// Google and lands them on an error page this app cannot explain — so the whole
// card is gated on /auth/providers, exactly as the login screen is.
//
// Two further facts come from the user, not from config:
//   • `provider` — what this account is actually linked to
//   • `hasPassword` — whether unlinking is even permitted. An account created BY
//     the provider has no other credential, so removing it would be account
//     deletion. The server refuses (409), and the button is disabled with a
//     reason rather than letting the user discover that by being refused.
function SignInMethodsCard() {
  const { t } = useTranslation()
  const { user, refresh } = useAppSession()
  const providers = useAuthProviders()
  const { unlinkOauth, isLoading } = useUnlinkOauth()

  const OAUTH = ['google', 'apple'] as const
  const supported = OAUTH.filter((p) => providers.has(p))
  const linked = (user?.provider ?? '') as string

  // Nothing to offer and nothing to undo — render nothing at all rather than an
  // empty card explaining its own emptiness.
  if (supported.length === 0 && !linked) return null

  const handleUnlink = async (p: string) => {
    try {
      await unlinkOauth(p)
      toast.success(t('settings.signIn.disconnected', { provider: labelFor(p) }))
      await refresh()
    } catch (err) {
      toastError(err, t('settings.signIn.disconnectFailed'))
    }
  }

  function labelFor(p: string) {
    return p.charAt(0).toUpperCase() + p.slice(1)
  }

  return (
    <Card as="section" id="signin" className="scroll-mt-20 p-5">
      <SectionHeader
        icon={Key}
        title={t('settings.signIn.title')}
        description={t('settings.signIn.description')}
      />
      <ul className="mt-4 space-y-3">
        {/* A provider the account is linked to is listed even when the server no
            longer offers it, so a stale link can still be removed. */}
        {Array.from(new Set([...supported, ...(linked ? [linked] : [])])).map((p) => {
          const isLinked = linked === p
          const canUnlink = isLinked && (user?.hasPassword ?? false)
          return (
            <li key={p} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* The brand mark is what a user scans for — it identifies the
                    row faster than reading the word, and matches the button
                    they originally clicked on the sign-in screen. */}
                <ProviderIcon provider={p as 'google' | 'apple'} className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{labelFor(p)}</p>
                  <p className="text-sm text-ink-subtle">
                    {isLinked
                      ? user?.hasPassword
                        ? t('settings.signIn.connected')
                        : t('settings.signIn.connectedOnlyMethod')
                      : t('settings.signIn.notConnected')}
                  </p>
                </div>
              </div>
              {isLinked ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!canUnlink || isLoading}
                  onClick={() => void handleUnlink(p)}
                >
                  {t('settings.signIn.disconnect')}
                </Button>
              ) : (
                providers.has(p) && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { window.location.href = `${API_BASE_URL}/auth/${p}/start` }}
                  >
                    {t('settings.signIn.connect')}
                  </Button>
                )
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function SecurityCard() {
  const { t } = useTranslation()
  const { user, refresh } = useAppSession()
  const client = useFonderieClient()
  const { changePassword, isLoading: changingPassword } = useChangePassword()
  const { setup, setupData, verify, disable, regenerateBackupCodes, isLoading: mfaBusy } = useMfaSetup()
  const [mfaMode, setMfaMode] = useState<MfaMode>('idle')
  const [mfaCode, setMfaCode] = useState('')
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null)

  const mfaEnabled = user?.mfaEnabled ?? false

  const enterMode = (mode: MfaMode) => {
    setMfaCode('')
    setFreshCodes(null)
    setMfaMode(mode)
  }

  const startEnroll = async () => {
    try {
      await setup()
      enterMode('enrolling')
    } catch (err) {
      toastError(err, t('settings.security.mfa.setupFailed'))
    }
  }

  const submitMfaCode = async () => {
    try {
      if (mfaMode === 'enrolling') {
        try {
          await verify(mfaCode)
        } catch (err) {
          // API rejections propagate; anything else is the token-rotation
          // shape drift on older servers — server state decides below
          if (err instanceof FonderieApiError) throw err
        }
        const { result } = await client.auth.getUser({ bust: true })
        if (!result.user.mfaEnabled) throw new Error(t('settings.security.mfa.verifyFailed'))
        await refresh({ force: true })
        enterMode('idle')
        toast.success(t('settings.security.mfa.enabledToast'))
      } else if (mfaMode === 'disabling') {
        await disable(mfaCode)
        await refresh({ force: true })
        enterMode('idle')
        toast.success(t('settings.security.mfa.disabledToast'))
      } else if (mfaMode === 'regenerating') {
        const codes = await regenerateBackupCodes(mfaCode)
        setMfaMode('idle')
        setMfaCode('')
        setFreshCodes(codes)
        toast.success(t('settings.security.mfa.codesGenerated'))
      }
    } catch (err) {
      toastError(err, t('settings.security.mfa.invalidCode'))
    }
  }

  const handlePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    if (newPassword !== data.get('repeatPassword')) {
      toast.error(t('settings.security.passwordMismatch'))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t('settings.security.passwordTooShort'))
      return
    }
    try {
      await changePassword({ currentPassword, newPassword })
      toast.success(t('settings.security.passwordChanged'))
      form.reset()
    } catch (err) {
      toastError(err, t('settings.security.passwordChangeFailed'))
    }
  }

  return (
    <Card as="section" id="security" className="scroll-mt-20 p-5">
      <SectionHeader
        icon={ShieldCheck}
        title={t('settings.security.title')}
        description={t('settings.security.description')}
      />
      <form noValidate onSubmit={handlePassword}>
        <div className="mt-4 grid gap-x-6 gap-y-3 lg:grid-cols-2 xl:grid-cols-3">
          <Input label={t('settings.security.currentPassword')} type="password" required name="currentPassword" id="currentPassword" />
          <Input label={t('settings.security.newPassword')} type="password" required name="newPassword" id="newPassword" />
          <Input label={t('settings.security.repeatPassword')} type="password" required name="repeatPassword" id="repeatPassword" />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={changingPassword}>{t('settings.security.changePassword')}</Button>
        </div>
      </form>
      <hr className="my-4 border-hairline" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink">{t('settings.security.mfa.title')}</h3>
          <p className="text-xs text-ink-subtle">{t('settings.security.mfa.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          {mfaEnabled && mfaMode === 'idle' && (
            <Button variant="secondary" size="xs" onClick={() => enterMode('regenerating')}>
              {t('settings.security.mfa.regenerate')}
            </Button>
          )}
          <Toggle
            pressed={mfaEnabled}
            onPressedChange={(next) => {
              if (next && !mfaEnabled) void startEnroll()
              else if (!next && mfaEnabled) enterMode('disabling')
            }}
            unpressedLabel={t('settings.security.mfa.disabled')}
            pressedLabel={t('settings.security.mfa.enabled')}
            aria-label={t('settings.security.mfa.title')}
          />
        </div>
      </div>

      {mfaMode === 'enrolling' && setupData && (
        <div className="mt-4 rounded-lg bg-surface-2 p-4">
          <div className="flex flex-wrap gap-6">
            <img
              src={setupData.qr}
              alt={t('settings.security.mfa.qrAlt')}
              className="h-36 w-36 rounded-md bg-white p-2"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t('settings.security.mfa.scan')}</p>
              <p id="mfa-enroll-label" className="mt-1 text-xs text-ink-subtle">
                {t('settings.security.mfa.scanHint')}
              </p>
              <div className="mt-3">
                <OtpInput value={mfaCode} onChange={setMfaCode} length={6} aria-labelledby="mfa-enroll-label" />
              </div>
              <div className="mt-3 flex justify-center gap-2">
                <Button size="sm" onClick={() => void submitMfaCode()} loading={mfaBusy} disabled={mfaCode.length !== 6}>
                  {t('settings.security.mfa.enable')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => enterMode('idle')}>{t('settings.security.mfa.cancel')}</Button>
              </div>
            </div>
          </div>
          <p className="mt-4 mb-2 text-xs text-ink-subtle">
            {t('settings.security.mfa.backupCodesEnroll')}
          </p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs text-ink sm:grid-cols-4">
            {setupData.backupCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
        </div>
      )}

      {(mfaMode === 'disabling' || mfaMode === 'regenerating') && (
        <div className="mt-4 rounded-lg bg-surface-2 p-4">
          <p id="mfa-code-label" className="text-sm font-medium text-ink">
            {mfaMode === 'disabling'
              ? t('settings.security.mfa.disablePrompt')
              : t('settings.security.mfa.regeneratePrompt')}
          </p>
          <div className="mt-3">
            <OtpInput value={mfaCode} onChange={setMfaCode} length={6} aria-labelledby="mfa-code-label" />
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              size="sm"
              variant={mfaMode === 'disabling' ? 'danger' : 'primary'}
              onClick={() => void submitMfaCode()}
              loading={mfaBusy}
              disabled={mfaCode.length !== 6}
            >
              {mfaMode === 'disabling' ? t('settings.security.mfa.disable') : t('settings.security.mfa.generateCodes')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => enterMode('idle')}>{t('settings.security.mfa.cancel')}</Button>
          </div>
        </div>
      )}

      {freshCodes && (
        <div className="mt-4 rounded-lg bg-surface-2 p-4">
          <p className="mb-2 text-xs text-ink-subtle">
            {t('settings.security.mfa.backupCodesFresh')}
          </p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs text-ink sm:grid-cols-4">
            {freshCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function DangerCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { deleteUser, isLoading } = useAccountData()
  const { refresh } = useAppSession()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // The server soft-deletes and clears the auth cookies; the hook then drops the
  // stored token, so the client is already signed out by the time this resolves.
  // The session context still holds the old user, so refresh() is what makes the
  // rest of the app agree — without it the user lands on a logged-in shell for
  // an account that no longer exists.
  const handleDelete = async () => {
    setConfirmingDelete(false)
    try {
      await deleteUser()
      toast.success(t('settings.danger.deleted'))
      await refresh()
      navigate('/login', { replace: true })
    } catch (err) {
      toastError(err, t('settings.danger.deleteFailed'))
    }
  }

  return (
    <Card as="section" id="danger" className="scroll-mt-20 border-error/40 bg-error/5 p-5">
      <SectionHeader
        icon={Warning}
        title={t('settings.danger.title')}
        description={t('settings.danger.description')}
        tone="error"
      />
      <div className="mt-4">
        <Button variant="danger" disabled={isLoading} onClick={() => setConfirmingDelete(true)}>
          {t('settings.danger.delete')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        title={t('settings.danger.confirmTitle')}
        description={t('settings.danger.confirmDescription')}
        confirmLabel={t('settings.danger.delete')}
        danger
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmingDelete(false)}
      />
    </Card>
  )
}

// Whether this deployment can link ANY provider, plus whether this account
// already has one. Asked of the server, never assumed from the build.
function useShowSignInMethods() {
  const providers = useAuthProviders()
  const { user } = useAppSession()
  const supported = (['google', 'apple'] as const).some((p) => providers.has(p))
  return supported || !!user?.provider
}

export default function Settings() {
  const showSignIn = useShowSignInMethods()
  const { t } = useTranslation()
  return (
    <div className="w-full">
      <h1 className="text-headline mb-6 text-ink">{t('settings.title')}</h1>
      <div className="mb-4 lg:hidden">
        <label className="sr-only" htmlFor="settings-section">{t('settings.sectionPicker')}</label>
        <select
          id="settings-section"
          className="input"
          defaultValue="profile"
          onChange={(e) => document.getElementById(e.target.value)?.scrollIntoView({ behavior: 'smooth' })}
        >
          {visibleSections(showSignIn).map((s) => (
            <option key={s.id} value={s.id}>{t(`settings.sections.${s.id}`)}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-8">
        <nav
          className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-[180px] shrink-0 self-start overflow-y-auto lg:block"
          aria-label={t('settings.sectionsNav')}
        >
          <ul className="space-y-1">
            {visibleSections(showSignIn).map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-2 hover:text-ink',
                    s.id === 'danger' ? 'text-error/80 hover:text-error' : 'text-ink-muted',
                  )}
                >
                  <s.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t(`settings.sections.${s.id}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1 space-y-4">
          <ProfileCard />
          <DateTimeFormatCard />
          <NotificationsCard />
          {showSignIn && <SignInMethodsCard />}
          <SecurityCard />
          <LoginHistoryCard />
          <ActiveSessionsCard />
          <DangerCard />
        </div>
      </div>
    </div>
  )
}
