import { WarningCircle } from '@phosphor-icons/react'
import { useFonderieClient, useRemoteConfig } from '@fonderie/react'
import { useEffect } from 'react'

// An operator-set notice shown to everyone — signed in or not — without a
// deploy: set MAINTENANCE_MESSAGE in /_admin → Config & secrets and every open
// tab shows it within five minutes, or as soon as the tab is looked at again
// (a fresh page load shows it at once); clear it and the banner goes away.
// Rendered as plain text, never HTML.
//
// useRemoteConfig is live over @fonderie/sse where the API serves the stream;
// this API does not, so the banner re-reads the config itself.
//
// '' is the safe fallback: before the config loads, or if it cannot be
// reached, there is simply no banner.
const REFRESH_MS = 5 * 60_000

export function MaintenanceBanner({ className = '' }: { className?: string }) {
  const client = useFonderieClient()
  const raw = useRemoteConfig<unknown>('MAINTENANCE_MESSAGE', '')
  useEffect(() => {
    const reload = () => void client.config.load()
    const timer = setInterval(reload, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [client])
  const message = typeof raw === 'string' ? raw.trim() : ''
  if (!message) return null
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink ${className}`}
    >
      <WarningCircle size={18} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
      <span>{message}</span>
    </div>
  )
}
