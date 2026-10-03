import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSession } from '../lib/session'

// Route-level guards: wrap a layout route group, gate via Outlet.
// Public routes (terms, privacy, 404) simply sit outside both groups.
// The session resolves over the network, so both guards hold render
// until it settles instead of flashing a wrong redirect.

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAppSession()
  const location = useLocation()
  if (isLoading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function GuestOnly() {
  const { isAuthenticated, isLoading } = useAppSession()
  if (isLoading) return null
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}
