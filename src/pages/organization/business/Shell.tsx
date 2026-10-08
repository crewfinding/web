import type { IWorkspaceDTO, IWorkspaceLocationDTO } from '@fonderie/client'
import {
  useCurrentWorkspace as useWorkspaceRead,
  usePermissions,
  useWorkspaceLocations,
  useWorkspaces,
  type IUseWorkspaceLocationsReturn,
} from '@fonderie/react-workspaces'
import { ArrowLeft } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Notice } from '../../../components/Notice'
import { BUSINESS_HUB } from '../../../constants/businessMenu'
import { useTranslation } from '../../../hooks/useTranslation'
import { errorMessage } from '../../../lib/apiErrors'
import { homeCountry } from '../../../lib/business'
import { isArchivedRefusal, pageAccess } from '../../../lib/businessPages'
import { useSelectedWorkspace } from './useSelectedWorkspace'

// Every Business sub-page (docs/ux/BUSINESS-SCREEN.md §2): a way back to the
// hub, the heading (focused on arrival) and its one-line paragraph, the
// banner when read-only or archived, then one form or one list. The loading /
// failed / not-found states are the hub's, and a workspace switch never shows
// the previous workspace's values.

export interface IBusinessContext {
  workspace: IWorkspaceDTO
  /** Owner or manager, permissions read, workspace not archived. */
  canEdit: boolean
  /** The country the business works in (head office, else the workspace address, else Canada). */
  country: 'CA' | 'US'
  locations: IWorkspaceLocationDTO[]
  locationsHook: IUseWorkspaceLocationsReturn
  /** Runs a write; a 409 WORKSPACE_ARCHIVED re-reads the workspace (the page turns read-only), then the error surfaces. */
  write: <R>(fn: () => Promise<R>) => Promise<R>
  /** Back where the page was opened from (after a save, or Discard). */
  back: () => void
}

/** Re-reads the workspace (and the list the switcher and banners use). */
function useWorkspaceRefresh() {
  const { refresh } = useWorkspaceRead()
  const { refresh: refreshList } = useWorkspaces()
  return useCallback(
    () => void Promise.all([refresh({ force: true }), refreshList({ force: true })]).catch(() => undefined),
    [refresh, refreshList],
  )
}

/** The hub's and every sub-page's banner. */
export function AccessBanner({ banner }: { banner: 'archived' | 'readonly' | null }) {
  const { t } = useTranslation()
  if (banner === 'archived') return <Notice tone="warning">{t('business.archived')}</Notice>
  if (banner === 'readonly') return <Notice>{t('business.readonly')}</Notice>
  return null
}

/** Heading + paragraph; the heading takes focus when the page opens. */
export function PageHeading({ title, paragraph, focus = true }: { title: string; paragraph?: string; focus?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focus) ref.current?.focus()
  }, [focus])
  return (
    <div>
      <h2 ref={ref} tabIndex={-1} className="text-card-title text-ink outline-none">
        {title}
      </h2>
      {paragraph ? <p className="mt-1 text-sm text-ink-subtle">{paragraph}</p> : null}
    </div>
  )
}

function Body({ workspace, children, back }: { workspace: IWorkspaceDTO; children: (ctx: IBusinessContext) => ReactNode; back: () => void }) {
  const { isManager, isLoading: permsLoading } = usePermissions()
  const locationsHook = useWorkspaceLocations()
  const locations = locationsHook.locations ?? []
  const refresh = useWorkspaceRefresh()
  const access = pageAccess({ isManager, permsLoading, isArchived: !!workspace.isArchived })
  const write = useCallback(
    async <R,>(fn: () => Promise<R>): Promise<R> => {
      try {
        return await fn()
      } catch (err) {
        if (isArchivedRefusal(err)) refresh()
        throw err
      }
    },
    [refresh],
  )
  return (
    <div className="space-y-4" data-testid={access.canEdit ? 'business-form' : 'business-details'}>
      <AccessBanner banner={access.banner} />
      {children({
        workspace,
        canEdit: access.canEdit,
        country: homeCountry(workspace, locations),
        locations,
        locationsHook,
        write,
        back,
      })}
    </div>
  )
}

export function WorkspaceStates({ error, pending, retry }: { error: unknown; pending: boolean; retry: () => void }) {
  const { t } = useTranslation()
  if (error) {
    return (
      <div className="space-y-3" data-testid="business-error">
        <Notice tone="error">{`${t('business.errorLoad')} ${errorMessage(t, error)}`}</Notice>
        <Button onClick={retry}>{t('business.retry')}</Button>
      </div>
    )
  }
  if (pending) {
    return (
      <p role="status" className="py-6 text-center text-sm text-ink-subtle" data-testid="business-loading">
        {t('business.loading')}
      </p>
    )
  }
  return (
    <div className="space-y-3" data-testid="business-not-found">
      <p className="text-sm text-ink">{t('business.notFound')}</p>
      <Button onClick={retry}>{t('business.retry')}</Button>
    </div>
  )
}

export function BusinessPage({
  title,
  paragraph,
  testId,
  backTo = BUSINESS_HUB,
  backLabel,
  children,
}: {
  title: string
  paragraph?: string
  testId: string
  backTo?: string
  backLabel?: string
  children: (ctx: IBusinessContext) => ReactNode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { current, pending, error, retry } = useSelectedWorkspace()
  const back = useCallback(() => navigate(backTo), [navigate, backTo])

  return (
    <div className="space-y-4" data-testid={testId}>
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-link hover:underline">
        <ArrowLeft size={14} aria-hidden="true" />
        {backLabel ?? t('business.title')}
      </Link>
      <PageHeading title={title} paragraph={paragraph} />
      {current ? (
        // Keyed by workspace: a switch drops any draft.
        <Body key={current.id} workspace={current} back={back}>
          {children}
        </Body>
      ) : (
        <WorkspaceStates error={error} pending={pending} retry={retry} />
      )}
    </div>
  )
}
