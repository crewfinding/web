import { MagnifyingGlass, Spinner } from '@phosphor-icons/react'
import { useId, useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { usePlaceSearch } from '../hooks/usePlaceSearch'
import { cn } from '../lib/cn'
import { partsFromDetails, type IAddressParts, type IPlaceSuggestion } from '../lib/places'

/**
 * An address search field (the API's places proxy — no Google key in the web
 * app): suggestions as it is typed, and the chosen place's parts handed back.
 * The mobile app's AddressAutocomplete, as a combobox.
 */
export function AddressAutocomplete({
  value,
  onChangeText,
  onSelect,
  label,
  placeholder,
  error,
}: {
  value: string
  onChangeText: (text: string) => void
  onSelect: (parts: IAddressParts) => void
  label: string
  placeholder?: string
  error?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const listId = `${id}-list`
  // Search only what the person typed — not a value set by a selection.
  const [typing, setTyping] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(-1)
  const { suggestions, isLoading, error: searchError, getDetails, clear } = usePlaceSearch(typing ? value : '', {
    minLength: 3,
  })
  const open = typing && suggestions.length > 0

  const choose = async (s: IPlaceSuggestion) => {
    setTyping(false)
    clear()
    setFailed(false)
    setResolving(true)
    try {
      onSelect(partsFromDetails(await getDetails(s.placeId)))
    } catch {
      setFailed(true)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={!!error}
          autoComplete="off"
          value={value}
          placeholder={placeholder ?? t('business.address.placeholder')}
          onChange={(e) => {
            setTyping(true)
            setFailed(false)
            setActive(-1)
            onChangeText(e.target.value)
          }}
          onKeyDown={(e) => {
            if (!open) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && active >= 0) {
              e.preventDefault()
              void choose(suggestions[active])
            } else if (e.key === 'Escape') {
              clear()
            }
          }}
          className={cn(
            'h-11 w-full rounded-lg border bg-surface-1 py-2.5 pr-10 pl-10 text-ink transition-all placeholder:text-ink-subtle focus:ring-2 focus:outline-none',
            error ? 'border-error focus:ring-error/20' : 'border-hairline focus:border-primary focus:ring-primary/20',
          )}
        />
        {isLoading || resolving ? (
          <Spinner className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-ink-subtle" aria-hidden="true" />
        ) : null}
      </div>
      {open && (
        <ul id={listId} role="listbox" className="card absolute z-40 mt-1 max-h-72 w-full overflow-y-auto p-1">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                void choose(s)
              }}
              className={cn('cursor-pointer rounded-sm px-3 py-2 text-sm', i === active ? 'bg-surface-2' : 'hover:bg-surface-2')}
            >
              <span className="block font-medium text-ink">{s.mainText}</span>
              {s.secondaryText ? <span className="block truncate text-xs text-ink-subtle">{s.secondaryText}</span> : null}
            </li>
          ))}
        </ul>
      )}
      {failed ? <p className="mt-1.5 text-xs text-error">{t('business.address.detailsError')}</p> : null}
      {typing && searchError ? <p className="mt-1.5 text-xs text-ink-subtle">{t('business.address.searchError')}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-error">{error}</p> : null}
    </div>
  )
}
