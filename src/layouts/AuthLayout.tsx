import { MagnetStraight } from '@phosphor-icons/react'
import { Link, Outlet } from 'react-router-dom'
import LocaleSwitcher from '../components/LocaleSwitcher'
import { useTranslation } from '../hooks/useTranslation'
import { MaintenanceBanner } from '../components/MaintenanceBanner'

export default function AuthLayout() {
  const { t } = useTranslation()
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="absolute inset-x-4 top-4 flex items-center justify-between md:inset-x-8 md:top-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MagnetStraight className="h-5 w-5 text-on-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-ink">{t('common.appName')}</span>
            <span className="text-xs text-ink-subtle">{t('auth.layout.tagline')}</span>
          </div>
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <MaintenanceBanner className="mb-4" />
        <Outlet />
      </div>
    </main>
  )
}
