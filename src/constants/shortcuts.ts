import type { OS } from '../hooks/useOS'

export const SHORTCUTS = {
  search: {
    key: 'k',
    meta: true, // ⌘ on Mac
    ctrl: true, // Ctrl on Windows/Linux
    label: (os: OS) => (os === 'mac' ? '⌘K' : 'Ctrl K'),
  },
  close: {
    key: 'Escape',
    meta: false,
    ctrl: false,
    preventDefault: false,
  },
} as const
