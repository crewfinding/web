import { CaretDown, Check, Plus, UserPlus } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'
import { DialogShell } from './DialogShell'
import { JoinWithCode } from './JoinWithCode'
import { OwnershipOfferBanner } from './OwnershipOfferBanner'
import { useCurrentWorkspace } from '../lib/workspace'
import { WORKSPACE_MENU_TRIGGER_ID } from '../lib/workspaceMenu'
import { useTranslation } from '../hooks/useTranslation'

// Which workspace the office is working in. Everything on screen — jobs,
// customers, team, plan — belongs to it; switching re-reads it all.
export default function WorkspaceMenu({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const { workspaces, current, select } = useCurrentWorkspace()
  const [open, setOpen] = useState(false)
  const [joining, setJoining] = useState(false)
  if (!current) return null
  const nameOf = (w: { name: string; type: string }) => (w.type === 'PERSONAL' ? t('nav.workspace.personal') : w.name)

  return (
    <div
      className={`relative ${className}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        id={WORKSPACE_MENU_TRIGGER_ID}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.workspace.label', { name: nameOf(current) })}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 max-w-[220px] cursor-pointer items-center gap-1.5 rounded-md border border-hairline px-3 text-sm text-ink hover:bg-surface-2"
      >
        <span className="truncate">{nameOf(current)}</span>
        <CaretDown size={14} aria-hidden="true" className="shrink-0 text-ink-subtle" />
      </button>
      {open && (
        <div role="menu" className="card absolute top-full right-0 z-40 mt-1 w-72 p-1">
          <OwnershipOfferBanner className="p-1" onReview={() => setOpen(false)} />
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              role="menuitemradio"
              aria-checked={w.id === current.id}
              onClick={() => {
                select(w.id)
                setOpen(false)
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <span className="w-4 shrink-0">{w.id === current.id && <Check size={14} aria-hidden="true" />}</span>
              <span className="truncate">{nameOf(w)}</span>
            </button>
          ))}
          <Link
            role="menuitem"
            to="/workspaces/new"
            onClick={() => setOpen(false)}
            className="mt-1 flex w-full items-center gap-2 rounded-sm border-t border-hairline px-2 pt-2 pb-1.5 text-left text-sm text-link hover:bg-surface-2"
          >
            <Plus size={14} aria-hidden="true" className="w-4 shrink-0" />
            {t('nav.workspace.create')}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setJoining(true)
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-link hover:bg-surface-2"
          >
            <UserPlus size={14} aria-hidden="true" className="w-4 shrink-0" />
            {t('invite.title')}
          </button>
        </div>
      )}
      <DialogShell open={joining} labelledBy="join-dialog-title" onClose={() => setJoining(false)}>
        <Card className="p-6">
          <h2 id="join-dialog-title" className="text-card-title text-ink">
            {t('invite.title')}
          </h2>
          <p className="mt-2 mb-4 text-sm text-ink-subtle">{t('invite.body')}</p>
          <JoinWithCode onCancel={() => setJoining(false)} />
        </Card>
      </DialogShell>
    </div>
  )
}
