import { usePermissions } from '@fonderie/react-workspaces'
import { useEffect, useState } from 'react'
import { useWorkspaceArchived } from '../../hooks/useWorkspaceArchived'
import { countryCode } from '../../lib/business'
import { customerPermissions, searchDelay, type ICustomerPermissions } from '../../lib/customers'
import { useCurrentWorkspace } from '../../lib/workspace'

// The hooks every Customers page shares (docs/parity/5-customers.md).

/**
 * What the signed-in member may do with customers here — the role's
 * 'customers' switches (false until known), the owner for the bin, nothing
 * while the workspace is archived. The server still refuses with 403 / 409.
 */
export function useCustomerPermissions(): ICustomerPermissions {
  const { can, isOwner } = usePermissions()
  const { isArchived } = useWorkspaceArchived()
  return customerPermissions({ can, isOwner, workspaceArchived: isArchived })
}

/** Key pages by this: a workspace switch remounts them — no search, draft or customer survives it. */
export function useWorkspaceKey(): string {
  const { current } = useCurrentWorkspace()
  return current?.id ?? 'none'
}

/** The country a phone or address typed without one is in: the business's, else CA. */
export function useDefaultCountry(): string {
  const { current } = useCurrentWorkspace()
  const code = countryCode(current?.address?.country)
  return code.length === 2 ? code : 'CA'
}

/** The search the server is asked for: typing waits for a pause, a cleared box applies at once. */
export function useSearchQuery(search: string): string {
  const q = search.trim()
  const [query, setQuery] = useState(q)
  useEffect(() => {
    const timer = setTimeout(() => setQuery(q), searchDelay(q))
    return () => clearTimeout(timer)
  }, [q])
  // A cleared box applies at once, without waiting for the timer.
  return q ? query : ''
}
