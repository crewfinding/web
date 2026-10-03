import { Globe, List, Monitor, Moon, Sun } from '@phosphor-icons/react'
import { useSubscription } from '@fonderie/react-billing'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'
import { BrandMark } from './BrandMark'
import { IconButton } from './IconButton'
import LocaleMenu from './LocaleMenu'
import WorkspaceMenu from './WorkspaceMenu'
import { planLabel } from '../lib/billing'
import { useAppSession, userDisplayName } from '../lib/session'
import { useCurrentWorkspace } from '../lib/workspace'
import { useTranslation } from '../hooks/useTranslation'
import { localeNames } from '../locales'
import { themeModes, useTheme } from '../hooks/useTheme'

export default function Navbar({ onToggleNav }: { onToggleNav: () => void }) {
  const { theme, mode, setThemeMode } = useTheme()
  const { t, locale } = useTranslation()
  const { user, logout } = useAppSession()
  const { current: workspace } = useCurrentWorkspace()
  const [localeOpen, setLocaleOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const ThemeIcon = mode === 'system' ? Monitor : theme === 'dark' ? Moon : Sun

  return (
    <nav className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-hairline bg-surface-1 pr-3 pl-1 md:pr-4 md:pl-0">
      {/* Brand slab: md+ only, 200px to align with the sidebar edge, gone on mobile */}
      <Link
        to="/"
        aria-label={t('common.appName')}
        className="hidden h-full w-[200px] shrink-0 items-center border-r border-hairline px-5 md:flex"
      >
        <BrandMark className="h-6 w-auto" />
      </Link>
      <IconButton icon={List} variant="ghost" aria-label={t('nav.toggleNavigation')} onClick={onToggleNav} className="md:ml-2" />
      <Link to="/" aria-label={t('common.appName')} className="ml-1 flex items-center md:hidden">
        <BrandMark className="h-5 w-auto" />
      </Link>

      <div className="ml-auto flex items-center">
        <WorkspaceMenu className="mr-2" />

        <div
          className="relative mr-1 hidden md:block"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setLocaleOpen(false)
          }}
        >
          <IconButton
            icon={Globe}
            variant="ghost"
            size="sm"
            aria-label={t('nav.language', { name: localeNames[locale] })}
            aria-haspopup="menu"
            aria-expanded={localeOpen}
            onClick={() => setLocaleOpen((o) => !o)}
          />
          {localeOpen && (
            <LocaleMenu className="top-full right-0 mt-1 w-36" onSelect={() => setLocaleOpen(false)} />
          )}
        </div>
        <div
          className="relative mr-3 hidden md:block"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setThemeOpen(false)
          }}
        >
          <IconButton
            icon={ThemeIcon}
            variant="ghost"
            size="sm"
            aria-label={t('nav.theme.label', { name: t(`nav.theme.${mode}`) })}
            aria-haspopup="menu"
            aria-expanded={themeOpen}
            onClick={() => setThemeOpen((o) => !o)}
          />
          {themeOpen && (
            <div role="menu" className="card absolute top-full right-0 z-40 mt-1 w-28 p-1">
              {themeModes.map((themeMode) => (
                <button
                  key={themeMode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={themeMode === mode}
                  onClick={() => {
                    setThemeMode(themeMode)
                    setThemeOpen(false)
                  }}
                  className={`block w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2 ${themeMode === mode ? 'font-medium text-ink' : 'text-ink-muted'}`}
                >
                  {t(`nav.theme.${themeMode}`)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setAccountOpen(false)
          }}
        >
          <button
            type="button"
            aria-label={t('nav.account.label', { name: userDisplayName(user) })}
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((o) => !o)}
            className="flex h-11 cursor-pointer items-center gap-2 p-1 text-sm text-ink-subtle hover:text-ink"
          >
            <span className="hidden text-right lg:block">
              <span className="block text-sm font-medium text-ink">{userDisplayName(user)}</span>
              {/* Only once a workspace is selected: the plan is the workspace's, and
                  a read without one is refused (400) and wasted. */}
              {workspace && <PlanLine />}
            </span>
            <Avatar src={user?.profileImageUrl} className="h-9 w-9" />
          </button>
          {accountOpen && (
            <div role="menu" className="card absolute top-full right-0 z-40 mt-1 w-52 p-1">
              <div className="border-b border-hairline px-2 pt-1.5 pb-2">
                <p className="truncate text-sm font-medium text-ink">{userDisplayName(user)}</p>
                <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
              </div>
              <Link
                role="menuitem"
                to="/settings"
                onClick={() => setAccountOpen(false)}
                className="mt-1 block w-full rounded-sm px-2 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {t('nav.account.settings')}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void logout()}
                className="block w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {t('nav.account.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

// The selected workspace's plan, under the user's name. Nothing until the
// first read — never a "Free" flash at a subscribed workspace.
function PlanLine() {
  const { t } = useTranslation()
  const { subscription, isLoading } = useSubscription()
  if (isLoading) return null
  return <span className="block text-xs text-ink-subtle">{t('nav.account.plan', { plan: planLabel(t, subscription) })}</span>
}
