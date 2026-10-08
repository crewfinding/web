import type { IWorkspaceDTO, IWorkspaceLocationDTO } from '@fonderie/client'
import { useWorkspaceId } from '@fonderie/react'
import {
  useCurrentWorkspace as useWorkspaceRead,
  usePermissions,
  useWorkspaceLocations,
  useWorkspaceSettings,
} from '@fonderie/react-workspaces'
import { Button } from '../../components/Button'
import { Notice } from '../../components/Notice'
import { useTranslation } from '../../hooks/useTranslation'
import { errorMessage } from '../../lib/apiErrors'
import { homeCountry } from '../../lib/business'
import { fonderie } from '../../lib/fonderie'
import { ContactCard } from './business/ContactCard'
import { LocationsCard } from './business/LocationsCard'
import { ProfileCard } from './business/ProfileCard'
import { NumbersCard, RegionalCard } from './business/SettingsCards'
import { TaxesCard } from './business/TaxesCard'

// Business info — the mobile app's BusinessInfoScreen (docs/parity/3-business.md):
// six cards, each saving only its own fields.

/** A key that changes when the stored values a card edits change — the card then remounts on them. */
const cardKey = (...parts: unknown[]) => JSON.stringify(parts)
const isBn = (r: { type: string }) => r.type === 'BN' || r.type === 'EIN'

function BusinessCards({ workspace, canEdit }: { workspace: IWorkspaceDTO; canEdit: boolean }) {
  const locationsHook = useWorkspaceLocations()
  const locations: IWorkspaceLocationDTO[] = locationsHook.locations ?? []
  const settingsHook = useWorkspaceSettings()
  const country = homeCountry(workspace, locations)
  const head = locations.find((l) => l.isHeadOffice && !l.isArchived)
  const regs = workspace.taxRegistrations ?? []
  const settings = settingsHook.settings ?? null

  return (
    <div className="space-y-4">
      <ProfileCard
        key={cardKey('profile', workspace.id, country, workspace.name, workspace.motto, workspace.industry, workspace.legalName, workspace.businessType, regs.filter(isBn))}
        workspace={workspace}
        country={country}
        canEdit={canEdit}
      />
      <ContactCard key={cardKey('contact', workspace.id, workspace.website)} workspace={workspace} canEdit={canEdit} country={country} />
      <LocationsCard workspace={workspace} canEdit={canEdit} country={country} hook={locationsHook} />
      <TaxesCard
        key={cardKey('taxes', workspace.id, head?.address.country, head?.address.state, regs.filter((r) => !isBn(r)))}
        workspace={workspace}
        locations={locations}
        canEdit={canEdit}
      />
      <NumbersCard
        key={cardKey('numbers', workspace.id, settings?.documentPrefixes ?? null)}
        settings={settings}
        settingsLoading={settingsHook.isLoading}
        settingsError={!!settingsHook.error}
        canEdit={canEdit}
      />
      <RegionalCard
        key={cardKey('regional', workspace.id, settings?.locale, settings?.timezone, settings?.currency, workspace.languages, head?.address.state)}
        workspace={workspace}
        settings={settings}
        settingsLoading={settingsHook.isLoading}
        settingsError={!!settingsHook.error}
        locations={locations}
        country={country}
        canEdit={canEdit}
      />
    </div>
  )
}

export default function Business() {
  const { t } = useTranslation()
  const { workspace, isLoading, error, refresh } = useWorkspaceRead()
  const { isManager, isLoading: checkingAccess } = usePermissions()
  const activeId = useWorkspaceId(fonderie)

  // Right after a workspace switch the read may still hold the previous
  // workspace — never show (or let anyone edit) it under the new one.
  const current = workspace && (!activeId || workspace.id === activeId) ? workspace : null
  const retry = () => void refresh({ force: true }).catch(() => undefined)

  let body
  if (current) {
    // While the permissions load, everyone sees the read-only cards. An
    // archived workspace is read-only for everyone (409 WORKSPACE_ARCHIVED).
    const archived = !!current.isArchived
    const canEdit = isManager && !checkingAccess && !archived
    body = (
      <div className="space-y-4" data-testid={canEdit ? 'business-form' : 'business-details'}>
        {archived ? (
          <Notice tone="warning">{t('business.archived')}</Notice>
        ) : !canEdit && !checkingAccess ? (
          <Notice>{t('business.readonly')}</Notice>
        ) : null}
        <BusinessCards key={current.id} workspace={current} canEdit={canEdit} />
      </div>
    )
  } else if (error) {
    body = (
      <div className="space-y-3" data-testid="business-error">
        <Notice tone="error">{`${t('business.errorLoad')} ${errorMessage(t, error)}`}</Notice>
        <Button onClick={retry}>{t('business.retry')}</Button>
      </div>
    )
  } else if (isLoading || workspace) {
    body = (
      <p role="status" className="py-6 text-center text-sm text-ink-subtle" data-testid="business-loading">
        {t('business.loading')}
      </p>
    )
  } else {
    body = (
      <div className="space-y-3" data-testid="business-not-found">
        <p className="text-sm text-ink">{t('business.notFound')}</p>
        <Button onClick={retry}>{t('business.retry')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-card-title text-ink">{t('business.title')}</h2>
        <p className="mt-1 text-sm text-ink-subtle">{t('business.intro')}</p>
      </div>
      {body}
    </div>
  )
}
