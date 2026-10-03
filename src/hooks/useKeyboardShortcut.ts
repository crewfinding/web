import { useEffect } from 'react'

type Options = {
  meta?: boolean
  ctrl?: boolean
  preventDefault?: boolean
}

// Modifier matching is exact: a shortcut declared without meta/ctrl only fires
// when those modifiers are NOT held, so plain-key bindings (e.g. Escape) never
// collide with browser chords, and chord bindings never fire from plain typing.
export function useKeyboardShortcut(key: string, callback: () => void, options?: Options) {
  const { meta = false, ctrl = false, preventDefault = true } = options ?? {}

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (meta !== e.metaKey || ctrl !== e.ctrlKey) return
      if (preventDefault) e.preventDefault()
      callback()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [key, callback, meta, ctrl, preventDefault])
}
