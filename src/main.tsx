import { FonderieProvider } from '@fonderie/react'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { fonderie } from './lib/fonderie'
import { LocalePreferenceSync } from './lib/localeSync'
import { SessionProvider } from './lib/session'
import { WorkspaceProvider } from './lib/workspace'
import { GuestOnly, RequireAuth } from './components/RouteGuards'
import { useTheme } from './hooks/useTheme'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import Billing from './pages/Billing'
import ForgotPassword from './pages/ForgotPassword'
import Join from './pages/Join'
import AuthCallback from './pages/AuthCallback'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

// Lazy so react-select loads only with the settings page
const Settings = lazy(() => import('./pages/Settings'))

const Home = lazy(() => import('./pages/Home'))
const CreateWorkspace = lazy(() => import('./pages/CreateWorkspace'))

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster position="top-right" theme={theme} richColors />
}

// Stripe returns here after checkout (the API's success/cancel URLs); the
// result renders as a notice over /billing.
function CheckoutRedirect({ status }: { status: 'success' | 'cancelled' }) {
  return <Navigate to={`/billing?checkout=${status}`} replace />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FonderieProvider client={fonderie}>
      <SessionProvider>
        <LocalePreferenceSync />
        <BrowserRouter>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route
                element={
                  <WorkspaceProvider>
                    <AppLayout />
                  </WorkspaceProvider>
                }
              >
                <Route index element={<Suspense fallback={null}><Home /></Suspense>} />
                <Route path="/settings" element={<Suspense fallback={null}><Settings /></Suspense>} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/billing/success" element={<CheckoutRedirect status="success" />} />
                <Route path="/billing/cancelled" element={<CheckoutRedirect status="cancelled" />} />
                <Route path="/workspaces/new" element={<Suspense fallback={null}><CreateWorkspace /></Suspense>} />
              </Route>
            </Route>
            <Route element={<GuestOnly />}>
              <Route element={<AuthLayout />}>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>
            </Route>
            {/* Reachable both logged-in (post-register) and out — the API itself
                requires a session to verify, and the screen surfaces that */}
            <Route element={<AuthLayout />}>
              <Route path="/verify" element={<VerifyEmail />} />
              {/* Joining a team: signed out it asks to sign in or sign up
                  and comes back; signed in it redeems the email's code */}
              <Route path="/join" element={<Join />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AppToaster />
        </BrowserRouter>
      </SessionProvider>
    </FonderieProvider>
  </StrictMode>,
)
