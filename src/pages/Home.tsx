import { useSubscription } from '@fonderie/react-billing'
import { CreditCard, GearSix } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { useTranslation } from '../hooks/useTranslation'
import { planLabel } from '../lib/billing'
import { useAppSession, userDisplayName } from '../lib/session'
import { useCurrentWorkspace } from '../lib/workspace'

// Home until the operations dashboard lands (docs/PLAN.md, Phase 3): which
// workspace this is, its plan, and the way to billing and settings.
export default function Home() {
  const { t } = useTranslation()
  const { user } = useAppSession()
  const { current } = useCurrentWorkspace()
  const { subscription, isLoading } = useSubscription()
  const workspaceName = current?.type === 'PERSONAL' ? t('nav.workspace.personal') : current?.name

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-headline text-ink">{t('home.title', { name: userDisplayName(user) })}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm text-ink-subtle">{t('home.workspace')}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{workspaceName}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-ink-subtle">{t('home.plan')}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{isLoading ? '…' : planLabel(t, subscription)}</p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/billing" className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2 text-sm text-ink hover:bg-surface-2">
          <CreditCard size={16} aria-hidden="true" /> {t('home.manageBilling')}
        </Link>
        <Link to="/settings" className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2 text-sm text-ink hover:bg-surface-2">
          <GearSix size={16} aria-hidden="true" /> {t('home.settings')}
        </Link>
      </div>
    </div>
  )
}
