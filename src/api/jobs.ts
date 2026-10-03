import { useScopedQuery } from '@fonderie/react'
import { fonderie } from '../lib/fonderie'

// CrewFinding's own job endpoints — the same calls as the mobile app's
// src/api/jobs.ts, through the same FonderieClient (auth, X-Workspace-ID,
// renewal). Phase 3 brings the rest of the module; billing needs the quota.

export interface IJobQuota {
  workspaceId: string
  limit: number | null
  used: number
  unlimited: boolean
}

/** Open jobs against the workspace's plan limit — read through the shared store, per workspace. */
export function useJobQuota() {
  return useScopedQuery<IJobQuota>(fonderie, '/jobs/quota', async (bust) => {
    // A plain JSON body (not the result envelope) — read either shape.
    const r = await fonderie.get<IJobQuota>('/jobs/quota', { bust })
    return (r as unknown as { result?: IJobQuota }).result ?? (r as unknown as IJobQuota)
  })
}
