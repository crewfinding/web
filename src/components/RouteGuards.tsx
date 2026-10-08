import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { peekReturnTo } from '../lib/returnTo'
import { useAppSession } from '../lib/session'

// Route-level guards: wrap a layout route group, gate via Outlet.
// Public routes (terms, privacy, 404) simply sit outside both groups.
// The session resolves over the network, so both guards hold render
// until it settles instead of flashing a wrong redirect.

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAppSession()
  const location = useLocation()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  // Signed in after leaving an invitation page to do so (sign-up, Google,
  // Apple all land on home): back to it. That page clears the detour.
  const returnTo = peekReturnTo()
  if (returnTo && returnTo !== location.pathname) return <Navigate to={returnTo} replace />
  return <Outlet />
}

export function GuestOnly() {
  const { isAuthenticated, isLoading } = useAppSession()
  if (isLoading) return null
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}
