import { usePermissions } from '@fonderie/react-workspaces'
import { Buildings, CaretRight, CreditCard, Envelope, Info, MapPin, Package, Phone, Translate } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { BUSINESS_GROUPS, type BusinessIcon } from '../../constants/businessMenu'
import { useTranslation } from '../../hooks/useTranslation'
import { pageAccess } from '../../lib/businessPages'
import { AccessBanner, PageHeading, WorkspaceStates } from './business/Shell'
import { useSelectedWorkspace } from './business/useSelectedWorkspace'

// Business info — the mobile app's BusinessInfoScreen (docs/ux/BUSINESS-SCREEN.md):
// the account-settings pattern. A hub of groups, each a card with a title and
// a one-line description, whose rows open one page each (one focused form or
// one list, its own Save). No form and no value here; every row opens its
// page for everyone — read-only people see the values there.

const ICONS: Record<BusinessIcon, Icon> = {
  domain: Buildings,
  report: Info,
  mail: Envelope,
  call: Phone,
  location: MapPin,
  card: CreditCard,
  inventory: Package,
  translate: Translate,
}

export default function Business() {
  const { t } = useTranslation()
  const { current, pending, error, retry } = useSelectedWorkspace()
  const { isManager, isLoading: permsLoading } = usePermissions()
  const access = current ? pageAccess({ isManager, permsLoading, isArchived: !!current.isArchived }) : null

  return (
    <div className="space-y-4" data-testid="business-hub">
      <PageHeading title={t('business.title')} paragraph={t('business.intro')} focus={false} />
      {current && access ? (
        <>
          <AccessBanner banner={access.banner} />
          {BUSINESS_GROUPS.map((g) => (
            <Card as="section" key={g.id} className="p-5" aria-labelledby={`business-group-${g.id}`} data-testid={`business-group-${g.id}`}>
              <h3 id={`business-group-${g.id}`} className="text-base font-semibold text-ink">
                {t(g.title)}
              </h3>
              <p className="mt-1 text-sm text-ink-subtle">{t(g.description)}</p>
              <ul className="mt-3 divide-y divide-hairline">
                {g.options.map((o) => {
                  const Glyph = ICONS[o.icon]
                  return (
                    <li key={o.key}>
                      <Link
                        to={o.path}
                        className="-mx-2 flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm text-ink transition-colors hover:bg-surface-2"
                        data-testid={`business-row-${o.key}`}
                      >
                        <Glyph className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
                        <span className="flex-1">{t(o.label)}</span>
                        <CaretRight className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </>
      ) : (
        <WorkspaceStates error={error} pending={pending} retry={retry} />
      )}
    </div>
  )
}
