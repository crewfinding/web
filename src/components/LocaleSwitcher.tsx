import { Globe } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { localeNames } from '../locales'
import { IconButton } from './IconButton'
import LocaleMenu from './LocaleMenu'

// The navbar's globe menu packaged for layouts that have no navbar (auth
// screens, legal pages), so visitors can pick a language before signing in.
export default function LocaleSwitcher() {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <IconButton
        icon={Globe}
        variant="ghost"
        size="sm"
        aria-label={t('nav.language', { name: localeNames[locale] })}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      />
      {open && <LocaleMenu className="top-full right-0 mt-1 w-36" onSelect={() => setOpen(false)} />}
    </div>
  )
}
