import type { IOwnershipOfferDTO, IWorkspaceDTO } from '@fonderie/client'
import { useOwnershipOffer } from '@fonderie/react-workspaces'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fonderie } from './fonderie'
import { offerCandidates } from './members'
import { useAppSession } from './session'
import { useCurrentWorkspace } from './workspace'

export interface IPendingOwnershipOffer {
  workspace: IWorkspaceDTO
  offer: IOwnershipOfferDTO
}

const OFFER_PATH = '/workspaces/transfer-ownership'

/**
 * Every open ownership offer made TO the signed-in person, in any of their
 * workspaces — so an offer is seen without opening that team's Members page
 * (the mobile app's usePendingOwnershipOffers). The server answers per
 * workspace (it reads the X-Workspace-ID one): the selected workspace through
 * useOwnershipOffer, each other team through the shared client scoped to it.
 * A team that cannot be read just shows nothing.
 */
export function usePendingOwnershipOffers(): { offers: IPendingOwnershipOffer[]; reload: () => void } {
  const { user } = useAppSession()
  const { workspaces, current } = useCurrentWorkspace()
  const here = useOwnershipOffer()
  const meId = user?.id

  const others = useMemo(() => offerCandidates(workspaces, meId, current?.id), [workspaces, meId, current?.id])

  const [elsewhere, setElsewhere] = useState<IPendingOwnershipOffer[]>([])
  const [tick, setTick] = useState(0)
  const { refresh } = here
  const reload = useCallback(() => {
    setTick((n) => n + 1)
    void refresh({ force: true })
  }, [refresh])

  useEffect(() => {
    if (!meId || others.length === 0) return
    let live = true
    void Promise.all(
      others.map(async (workspace) => {
        try {
          const res = await fonderie.get<{ offer: IOwnershipOfferDTO | null }>(OFFER_PATH, {
            workspaceId: workspace.id,
            cache: false,
          })
          const offer = res.result.offer
          return offer && offer.toUserId === meId ? { workspace, offer } : null
        } catch {
          return null
        }
      }),
    ).then((found) => {
      if (live) setElsewhere(found.filter((x): x is IPendingOwnershipOffer => x !== null))
    })
    return () => {
      live = false
    }
  }, [others, meId, tick])

  const offers = useMemo(() => {
    const mine =
      here.offer && current && here.offer.toUserId === meId && here.offer.workspaceId === current.id
    // Only teams still asked about (one left, or now owned, drops out at once).
    const asked = new Set(others.map((w) => w.id))
    const stillThere = elsewhere.filter((o) => asked.has(o.workspace.id))
    return mine ? [{ workspace: current, offer: here.offer! }, ...stillThere] : stillThere
  }, [here.offer, current, meId, elsewhere, others])

  return { offers, reload }
}
