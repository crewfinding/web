import { usePermissions } from '@fonderie/react-workspaces'
import { Buildings, ClockCounterClockwise, CreditCard, ShieldCheck, UsersThree } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { WorkspaceArchiveCard } from '../../components/WorkspaceArchiveCard'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../locales'
import { cn } from '../../lib/cn'
import { useCurrentWorkspace } from '../../lib/workspace'

// The Organization area — the mobile app's Organization hub as a section
// nav, in its groups: Business Details (Business Info), Team (Team Members,
// Roles & Permissions, Activity log) and Billing (Billing & Payment), each
// with its title and one-line description; then the owner's Workspace card
// (archive / restore) under Business Info. A personal workspace has no team:
// its team links are not offered (their pages still answer with the
// personal-workspace explanation) and its Activity log sits with the business.
interface ISection {
  to: string
  label: TranslationKey
  icon: Icon
  team?: boolean
  /** Shown only to those who may read the activity log. */
  audit?: boolean
}

interface IGroup {
  id: 'business' | 'team' | 'billing'
  title: TranslationKey
  description: TranslationKey
  sections: ISection[]
}

const ACTIVITY: ISection = { to: '/organization/activity', label: 'org.nav.activity', icon: ClockCounterClockwise, audit: true }

const GROUPS: IGroup[] = [
  {
    id: 'business',
    title: 'org.groups.business.title',
    description: 'org.groups.business.description',
    sections: [{ to: '/organization/business', label: 'org.nav.info', icon: Buildings }],
  },
  {
    id: 'team',
    title: 'org.groups.team.title',
    description: 'org.groups.team.description',
    sections: [
      { to: '/organization/members', label: 'org.nav.members', icon: UsersThree, team: true },
      { to: '/organization/roles', label: 'org.nav.roles', icon: ShieldCheck, team: true },
      { ...ACTIVITY, team: true },
    ],
  },
  {
    id: 'billing',
    title: 'org.groups.billing.title',
    description: 'org.groups.billing.description',
    sections: [{ to: '/billing', label: 'org.nav.billing', icon: CreditCard }],
  },
]

function SectionLink({ s, label }: { s: ISection; label: string }) {
  return (
    <NavLink
      to={s.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-surface-2 hover:text-ink',
          isActive ? 'bg-surface-2 font-medium text-link' : 'text-ink-muted',
        )
      }
    >
      <s.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  )
}

export default function OrganizationLayout() {
  const { t } = useTranslation()
  const { current } = useCurrentWorkspace()
  const isPersonal = current?.isPersonal === true
  const { can } = usePermissions()
  const { pathname } = useLocation()
  const canAudit = can('read', 'audit')
  const groups = GROUPS.map((g) => ({
    ...g,
    sections: [
      ...g.sections.filter((s) => !(s.team && isPersonal) && !(s.audit && !canAudit)),
      // No team in a personal workspace: its log sits with the business.
      ...(g.id === 'business' && isPersonal && canAudit ? [ACTIVITY] : []),
    ],
  })).filter((g) => g.sections.length > 0)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-6 text-headline text-ink">{t('org.title')}</h1>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav aria-label={t('org.nav.label')} className="shrink-0 lg:sticky lg:top-20 lg:w-[240px] lg:self-start">
          {/* Narrow screens: one scrolling row of links. */}
          <ul className="flex gap-1 overflow-x-auto lg:hidden">
            {groups.flatMap((g) => g.sections).map((s) => (
              <li key={s.to}>
                <SectionLink s={s} label={t(s.label)} />
              </li>
            ))}
          </ul>
          {/* Wide screens: the app's hub cards, each with its title and description. */}
          <div className="hidden space-y-5 lg:block">
            {groups.map((g) => (
              <section key={g.id} aria-labelledby={`org-group-${g.id}`} data-testid={`org-group-${g.id}`}>
                <h2 id={`org-group-${g.id}`} className="px-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  {t(g.title)}
                </h2>
                <p className="mt-0.5 mb-1.5 px-3 text-xs text-ink-subtle">{t(g.description)}</p>
                <ul className="flex flex-col gap-1">
                  {g.sections.map((s) => (
                    <li key={s.to}>
                      <SectionLink s={s} label={t(s.label)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
          {/* The mobile app's Organization hub ends with the Workspace card. */}
          {pathname === '/organization/business' ? (
            <div className="mt-4">
              <WorkspaceArchiveCard />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
