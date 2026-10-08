import { Buildings, CreditCard, ShieldCheck, UsersThree } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../locales'
import { cn } from '../../lib/cn'
import { useCurrentWorkspace } from '../../lib/workspace'

// The Organization area — the mobile app's Organization screen as a section
// nav: Business Info, Team Members, Roles & Permissions and Billing. A personal
// workspace has no team: its team links are not offered (their pages still
// answer with the personal-workspace explanation).
interface ISection {
  to: string
  label: TranslationKey
  icon: Icon
  team?: boolean
  end?: boolean
}

const SECTIONS: ISection[] = [
  { to: '/organization/business', label: 'org.nav.info', icon: Buildings },
  { to: '/organization/members', label: 'org.nav.members', icon: UsersThree, team: true },
  { to: '/organization/roles', label: 'org.nav.roles', icon: ShieldCheck, team: true },
  { to: '/billing', label: 'org.nav.billing', icon: CreditCard },
]

export default function OrganizationLayout() {
  const { t } = useTranslation()
  const { current } = useCurrentWorkspace()
  const isPersonal = current?.isPersonal === true
  const sections = SECTIONS.filter((s) => !(s.team && isPersonal))

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-headline text-ink">{t('org.title')}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-subtle">{t('org.intro')}</p>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav aria-label={t('org.nav.label')} className="shrink-0 lg:sticky lg:top-20 lg:w-[200px] lg:self-start">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {sections.map((s) => (
              <li key={s.to}>
                <NavLink
                  to={s.to}
                  end={s.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-surface-2 hover:text-ink',
                      isActive ? 'bg-surface-2 font-medium text-link' : 'text-ink-muted',
                    )
                  }
                >
                  <s.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t(s.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
