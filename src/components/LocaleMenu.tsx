import { Check } from '@phosphor-icons/react'
import { useLocale } from '../hooks/useLocale'
import { localeNames, locales } from '../locales'

type Props = {
  className?: string
  onSelect: () => void
}

export default function LocaleMenu({ className = '', onSelect }: Props) {
  const { locale, setLocale } = useLocale()
  return (
    <div role="menu" className={`card absolute z-40 p-1 ${className}`}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          role="menuitemradio"
          aria-checked={l === locale}
          onClick={() => {
            setLocale(l)
            onSelect()
          }}
          className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-sm px-2 text-left text-sm transition-colors hover:bg-surface-2 ${
            l === locale ? 'font-medium text-ink' : 'text-ink-muted'
          }`}
        >
          {localeNames[l]}
          {l === locale && <Check size={14} aria-hidden="true" className="text-link" />}
        </button>
      ))}
    </div>
  )
}
