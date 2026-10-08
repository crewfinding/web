import { useNavigate } from 'react-router-dom'
import { Notice } from './Notice'
import { useTranslation } from '../hooks/useTranslation'
import { usePendingOwnershipOffers } from '../lib/ownershipOffers'
import { useCurrentWorkspace } from '../lib/workspace'

/**
 * "You've been offered ownership of X." — one line per open offer to the
 * signed-in person, in any of their workspaces. Review opens that team's
 * Members page (switching to it first), where they accept or decline.
 */
export function OwnershipOfferBanner({ className, onReview }: { className?: string; onReview?: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { current, select } = useCurrentWorkspace()
  const { offers } = usePendingOwnershipOffers()
  if (offers.length === 0) return null
  return (
    <div className={className}>
      {offers.map(({ workspace }) => (
        <Notice
          key={workspace.id}
          className="mb-2 last:mb-0"
          action={
            <button
              type="button"
              data-testid={`ownership-offer-${workspace.id}`}
              className="cursor-pointer text-sm font-semibold text-link hover:underline"
              onClick={() => {
                if (workspace.id !== current?.id) select(workspace.id)
                onReview?.()
                navigate('/organization/members')
              }}
            >
              {t('team.offer.banner.action')}
            </button>
          }
        >
          {t('team.offer.banner.text', { workspace: workspace.name })}
        </Notice>
      ))}
    </div>
  )
}
