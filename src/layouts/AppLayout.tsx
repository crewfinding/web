import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useViewport } from '../hooks/useViewport'
import { MaintenanceBanner } from '../components/MaintenanceBanner'
import { useCurrentWorkspace } from '../lib/workspace'
import { useTranslation } from '../hooks/useTranslation'

export default function AppLayout() {
  const { isMobile, isDesktop } = useViewport()
  const [navOpen, setNavOpen] = useState(isDesktop)

  // Crossing a breakpoint resets to that tier's default: closed on mobile
  // (modal drawer) and tablet (collapsible rail), open on desktop (>=1024)
  useEffect(() => {
    setNavOpen(isDesktop)
  }, [isDesktop, isMobile])

  // On mobile the sidebar is a modal drawer: close it on Escape
  useEffect(() => {
    if (!navOpen || !isMobile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen, isMobile])

  const closeIfMobile = () => {
    if (isMobile) setNavOpen(false)
  }

  return (
    <div>
      <Navbar onToggleNav={() => setNavOpen((open) => !open)} />
      {navOpen && (
        <div
          className="fixed inset-0 z-10 bg-overlay/50 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar open={navOpen} onNavigate={closeIfMobile} />
      <main className={`pt-14 transition-[margin] duration-300 ${navOpen ? 'md:ml-[200px]' : ''}`}>
        <div className="p-4 md:p-6">
          <MaintenanceBanner className="mb-4" />
          <WorkspaceGate>
            <Outlet />
          </WorkspaceGate>
        </div>
      </main>
    </div>
  )
}

// Pages read the selected workspace's data: render them only once one is
// selected, so no read goes out without X-Workspace-ID (the API refuses it).
function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { current, isLoading, workspaces } = useCurrentWorkspace()
  if (current) return <>{children}</>
  if (!isLoading && workspaces.length === 0) {
    return <p className="text-sm text-ink-subtle">{t('nav.workspace.none')}</p>
  }
  return <p className="text-sm text-ink-subtle" role="status">{t('common.loading')}</p>
}
