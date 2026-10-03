import { useSyncExternalStore } from 'react'
import { createSubscribable } from './subscribable'

export type Theme = 'light' | 'dark'
export type ThemeMode = Theme | 'system'

export const themeModes: ThemeMode[] = ['system', 'light', 'dark']

const prefersLight = window.matchMedia('(prefers-color-scheme: light)')

// Mode is the user's choice; theme is the resolved appearance. An absent
// storage key means "system", mirroring the pre-paint script in index.html,
// which resolves stored-else-OS the same way before first render.
function readStoredMode(): ThemeMode {
  try {
    const stored = (window.localStorage.getItem('theme') ?? '').replace(/"/g, '')
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

let mode: ThemeMode = readStoredMode()
const store = createSubscribable()

function resolve(m: ThemeMode): Theme {
  if (m === 'system') return prefersLight.matches ? 'light' : 'dark'
  return m
}

function applyClasses(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

function setThemeMode(next: ThemeMode) {
  mode = next
  applyClasses(resolve(next))
  try {
    if (next === 'system') window.localStorage.removeItem('theme')
    else window.localStorage.setItem('theme', JSON.stringify(next))
  } catch {
    // storage unavailable: keep the in-memory value for this session
  }
  store.emit()
}

// In system mode the appearance tracks live OS preference changes
prefersLight.addEventListener('change', () => {
  if (mode === 'system') applyClasses(resolve(mode))
  store.emit()
})

export function useTheme() {
  const currentMode = useSyncExternalStore(store.subscribe, () => mode)
  const osLight = useSyncExternalStore(store.subscribe, () => prefersLight.matches)
  const theme: Theme = currentMode === 'system' ? (osLight ? 'light' : 'dark') : currentMode
  return {
    theme,
    mode: currentMode,
    setThemeMode,
  }
}
