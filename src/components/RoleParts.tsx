import type { IRoleDTO } from '@fonderie/client'
import { usePermissionCatalog } from '@fonderie/react-workspaces'
import { Button } from './Button'
import { Notice } from './Notice'
import { useTranslation } from '../hooks/useTranslation'
import { errorMessage } from '../lib/apiErrors'
import { MANAGER_ROLE, systemExplanationKey, systemRoleGrants, systemRoleLines } from '../lib/roles'

// The states and the built-in role rights the roles pages share (the mobile
// app's roles.shared.tsx).

export function LoadingState({ label }: { label: string }) {
  return (
    <p role="status" className="py-6 text-center text-sm text-ink-subtle">
      {label}
    </p>
  )
}

export function LoadErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <Notice tone="error">{errorMessage(t, error)}</Notice>
      <Button variant="secondary" onClick={onRetry}>
        {t('roles.retry')}
      </Button>
    </div>
  )
}

/** What a built-in role means, in words — ADMIN and GUEST are the two the app knows. */
export function SystemRoleRights({ role }: { role: IRoleDTO }) {
  const { t } = useTranslation()
  const { catalog, systemGrants, error: catalogError, refresh } = usePermissionCatalog()
  const name = role.name.toUpperCase()
  // The server's own grants for this role; null until known — then no list, never a guess.
  const grants = name === MANAGER_ROLE ? null : systemRoleGrants(systemGrants, name)
  const lines = grants ? systemRoleLines(catalog, grants, name, t) : []
  return (
    <>
      <p className="mt-1 text-sm text-ink-subtle">{t(systemExplanationKey(name))}</p>
      {name === MANAGER_ROLE ? null : catalogError && catalog.length === 0 ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-subtle">
          {t('roles.grants.unavailable')}
          <Button size="xs" variant="secondary" onClick={() => void refresh({ force: true })}>
            {t('roles.retry')}
          </Button>
        </div>
      ) : !grants ? null : lines.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{t('roles.grants.none')}</p>
      ) : (
        <ul className="mt-1 list-disc pl-5 text-sm text-ink-muted">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </>
  )
}
