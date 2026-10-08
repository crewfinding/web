import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { Card } from './Card'
import { DialogShell } from './DialogShell'
import { useTranslation } from '../hooks/useTranslation'
import { planLimitOf, type IPlanLimit } from '../lib/apiErrors'

// Over the plan's seats (or open jobs): explain it and offer the way out —
// the mobile app's promptPlanLimit. The web may sell, so a manager gets
// "See plans"; anyone else is told who can.
export function usePlanLimitPrompt() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [shown, setShown] = useState<(IPlanLimit & { isManager: boolean }) | null>(null)

  /** True when `err` was a plan limit (now explained); false to handle it otherwise. */
  const prompt = (err: unknown, isManager: boolean): boolean => {
    const limit = planLimitOf(err)
    if (!limit) return false
    setShown({ ...limit, isManager })
    return true
  }

  const element = (
    <DialogShell open={shown !== null} labelledBy="plan-limit-title" onClose={() => setShown(null)}>
      {shown && (
        <Card className="p-6">
          <h2 id="plan-limit-title" className="text-card-title pr-6 text-ink">
            {t('team.planLimit.title')}
          </h2>
          <p className="mt-2 text-sm text-ink-subtle">
            {t(shown.kind === 'seats' ? 'team.planLimit.seats' : 'team.planLimit.jobs', { count: shown.count })}
          </p>
          <p className="mt-2 text-sm text-ink-subtle">
            {t(shown.isManager ? 'team.planLimit.manager' : 'team.planLimit.member')}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            {shown.isManager ? (
              <>
                <Button variant="secondary" onClick={() => setShown(null)}>
                  {t('team.planLimit.notNow')}
                </Button>
                <Button
                  onClick={() => {
                    setShown(null)
                    navigate('/billing')
                  }}
                >
                  {t('team.planLimit.seePlans')}
                </Button>
              </>
            ) : (
              <Button onClick={() => setShown(null)}>{t('team.planLimit.ok')}</Button>
            )}
          </div>
        </Card>
      )}
    </DialogShell>
  )
  return { prompt, element }
}
