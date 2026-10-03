import { CaretDown, Coin, GearSix, Globe, Monitor, Moon, SquaresFour, Sun } from '@phosphor-icons/react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import LocaleMenu from './LocaleMenu'
import { ToggleGroup } from './Toggle'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from '../hooks/useTranslation'

// Labels resolve at render time: the closed `key` union makes the
// t(`nav.sidebar.links.${key}`) template typecheck against the dictionary.
const mainLinks = [
  { to: '/', key: 'dashboard', icon: SquaresFour, end: true },
  { to: '/billing', key: 'billing', icon: Coin },
  { to: '/settings', key: 'settings', icon: GearSix },
] as const

const categoryClass = 'mt-2.5 px-6 py-2 text-eyebrow text-ink'
const itemClass = 'mx-2 flex h-11 items-center rounded-lg px-4 transition-colors'
const linkClass = `${itemClass} text-ink-muted hover:bg-surface-2/50 hover:text-ink`
const activeClass = `${itemClass} bg-surface-2 font-medium text-link`

type Props = {
  open: boolean
  onNavigate: () => void
}

export default function Sidebar({ open, onNavigate }: Props) {
  const { mode, setThemeMode } = useTheme()
  const { t, locale } = useTranslation()
  const [localeOpen, setLocaleOpen] = useState(false)

  const themeOptions = [
    { value: 'system', icon: Monitor, label: t('nav.theme.system') },
    { value: 'light', icon: Sun, label: t('nav.theme.light') },
    { value: 'dark', icon: Moon, label: t('nav.theme.dark') },
  ] as const

  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 z-20 flex w-[280px] flex-col overflow-y-auto border-r border-hairline bg-sidebar pt-4 transition-transform duration-300 md:w-[200px] ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <nav className="flex-1">
        <ul>
          <li className={categoryClass}>{t('nav.sidebar.categories.main')}</li>
          {mainLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={'end' in link ? link.end : undefined}
                onClick={onNavigate}
                className={({ isActive }) => `${isActive ? activeClass : linkClass} gap-2.5`}
              >
                <link.icon size={16} aria-hidden="true" className="shrink-0" />
                {t(`nav.sidebar.links.${link.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Locale and theme live in the navbar on md+; the drawer hosts them on mobile */}
      <div className="space-y-2 border-t border-hairline px-4 py-3 md:hidden">
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setLocaleOpen(false)
          }}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={localeOpen}
            onClick={() => setLocaleOpen((o) => !o)}
            className="flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-1 text-sm transition-colors hover:bg-surface-2"
          >
            <span className="flex items-center gap-2 text-ink-muted">
              <Globe size={16} aria-hidden="true" className="text-ink-subtle" /> {t('nav.sidebar.language')}
            </span>
            <span className="flex items-center gap-1 text-ink">
              {locale.toUpperCase()} <CaretDown size={12} aria-hidden="true" className="text-ink-subtle" />
            </span>
          </button>
          {/* Opens upward: the trigger sits at the drawer bottom, and a downward
              menu would be clipped by the drawer's own scroll container */}
          {localeOpen && (
            <LocaleMenu className="bottom-full left-0 mb-1 w-full" onSelect={() => setLocaleOpen(false)} />
          )}
        </div>
        <div className="flex h-11 items-center justify-between px-1">
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <Monitor size={16} aria-hidden="true" className="text-ink-subtle" /> {t('nav.sidebar.theme')}
          </span>
          <ToggleGroup
            value={mode}
            onValueChange={setThemeMode}
            options={[...themeOptions]}
            aria-label={t('nav.sidebar.theme')}
          />
        </div>
      </div>
    </aside>
  )
}
