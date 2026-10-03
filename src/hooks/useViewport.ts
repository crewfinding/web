import { useSyncExternalStore } from 'react'
import { createSubscribable } from './subscribable'

// Single source of truth for breakpoint logic (Tailwind md 768px, lg 1024px).
// matchMedia change events fire only on threshold crossings, so consumers
// re-render when a tier changes — not on every resize pixel.
const mdQuery = window.matchMedia('(min-width: 768px)')
const lgQuery = window.matchMedia('(min-width: 1024px)')

const store = createSubscribable()
mdQuery.addEventListener('change', store.emit)
lgQuery.addEventListener('change', store.emit)

export function useViewport() {
  const isMd = useSyncExternalStore(store.subscribe, () => mdQuery.matches)
  const isLg = useSyncExternalStore(store.subscribe, () => lgQuery.matches)
  return {
    isMobile: !isMd,
    isTablet: isMd && !isLg,
    isDesktop: isLg,
  }
}
