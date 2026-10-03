// Listener plumbing shared by the useSyncExternalStore-backed hooks
// (useTheme, useLocale, useViewport): sources call emit, hooks pass subscribe.
export function createSubscribable() {
  const listeners = new Set<() => void>()
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    emit: () => {
      listeners.forEach((listener) => listener())
    },
  }
}
