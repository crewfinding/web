import type { IInvitationDTO, IMemberDTO, IRoleDTO } from '@fonderie/client'
import {
  useInvitations,
  useMemberRoles,
  useMembers,
  useOwnershipOffer,
  usePermissions,
  useRoles,
  useWorkspaceSeats,
  useWorkspaces,
} from '@fonderie/react-workspaces'
import {
  ArrowsClockwise,
  EnvelopeSimple,
  LockOpen,
  Plus,
  ShieldCheck,
  SignOut,
  UserCircleGear,
  UserMinus,
  X,
} from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ActionMenu, type IActionMenuItem } from '../../components/ActionMenu'
import { ArchivedWorkspaceBanner } from '../../components/ArchivedWorkspaceBanner'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { DialogShell } from '../../components/DialogShell'
import { IconButton } from '../../components/IconButton'
import { Notice } from '../../components/Notice'
import { useStepUpPrompt } from '../../components/StepUp'
import { useConfirm } from '../../hooks/useConfirm'
import { useDatePreference } from '../../hooks/useDatePreference'
import { useTranslation } from '../../hooks/useTranslation'
import { useWorkspaceArchived } from '../../hooks/useWorkspaceArchived'
import { errorMessage } from '../../lib/apiErrors'
import { cn } from '../../lib/cn'
import {
  MEMBERS_PAGE_SIZE,
  canUnassignRole,
  chipRoles,
  customRolesOf,
  hasAnyAction,
  lostAccess as isLostAccess,
  memberActions,
  memberInitials,
  memberName,
  nextPage,
  roleLabel,
} from '../../lib/members'
import { useAppSession } from '../../lib/session'
import { switchToWorkspace, useCurrentWorkspace } from '../../lib/workspace'
import { openWorkspaceMenu } from '../../lib/workspaceMenu'

// Team Members — the mobile app's MembersScreen (docs/parity/1-members.md).

function Spinner({ label }: { label: string }) {
  return (
    <p role="status" className="py-6 text-center text-sm text-ink-subtle">
      {label}
    </p>
  )
}

function MemberAvatar({ member }: { member: IMemberDTO }) {
  if (member.profileImageUrl) {
    return <img src={member.profileImageUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
  }
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-sm font-semibold text-ink-subtle">
      {memberInitials(member)}
    </span>
  )
}

function Badge({ tone, children }: { tone: 'primary' | 'info' | 'warning'; children: string }) {
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 text-xs font-medium',
        tone === 'primary' && 'bg-primary text-on-primary',
        tone === 'info' && 'bg-primary/10 text-link',
        tone === 'warning' && 'border border-warning/40 bg-warning/10 text-warning',
      )}
    >
      {children}
    </span>
  )
}

/**
 * A member's custom roles, to add or take off. Mounted only while open, so
 * its per-member read never runs for people nobody touched.
 */
function MemberRolesDialog({
  member,
  name,
  customRoles,
  onClose,
  onDone,
  onError,
}: {
  member: IMemberDTO
  name: string
  customRoles: IRoleDTO[]
  onClose: () => void
  onDone: (message: string) => void
  onError: (err: unknown) => void
}) {
  const { t } = useTranslation()
  const { addRole, removeRole } = useMemberRoles(member.userId)
  const [busy, setBusy] = useState(false)
  const held = member.roles ?? []
  const heldIds = new Set(held.map((r) => r.id))

  const run = (action: () => Promise<void>, message: string) => {
    setBusy(true)
    action()
      .then(() => onDone(message))
      .catch(onError)
      .finally(() => setBusy(false))
  }

  return (
    <DialogShell open labelledBy="member-roles-title" onClose={onClose}>
      <Card className="p-6">
        <h2 id="member-roles-title" className="text-card-title pr-6 text-ink">
          {t('team.roles.title', { name })}
        </h2>
        <ul className="mt-4 space-y-1">
          {customRoles.map((role) => {
            const has = heldIds.has(role.id)
            const heldRole = held.find((r) => r.id === role.id)
            const removable = !!heldRole && canUnassignRole(heldRole, held)
            const label = !has
              ? t('team.roles.add', { role: role.name })
              : removable
                ? t('team.roles.remove', { role: role.name })
                : t('team.roles.only', { role: role.name })
            return (
              <li key={role.id}>
                <button
                  type="button"
                  disabled={busy || (has && !removable)}
                  onClick={() =>
                    has
                      ? run(() => removeRole(role.id), t('team.roles.removed', { role: role.name, name }))
                      : run(() => addRole(role.id), t('team.roles.added', { role: role.name, name }))
                  }
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {has ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
    </DialogShell>
  )
}

function MembersView() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const formatDate = useDatePreference()
  const { user } = useAppSession()
  const { current: workspace, isLoading: workspaceLoading } = useCurrentWorkspace()

  const perms = usePermissions()
  const membersQ = useMembers(undefined, { pageSize: MEMBERS_PAGE_SIZE })
  // Handing the team over waits for the member to accept, and asks the owner
  // to prove it's them first.
  const offerQ = useOwnershipOffer()
  const { withStepUp, element: stepUpPrompt } = useStepUpPrompt()
  const invitesQ = useInvitations(undefined, { pageSize: MEMBERS_PAGE_SIZE })
  const rolesQ = useRoles()
  const { workspaces, leaveWorkspace, refresh: refreshWorkspaces } = useWorkspaces()
  // Seats as the server counts them against the plan (the number an invite is
  // refused on): the team without the owner, plus pending invitations.
  const seatsQ = useWorkspaceSeats()
  // Archived: read-only — no inviting (409 WORKSPACE_ARCHIVED). Leaving and
  // handing the team over still work, as on the server.
  const { isArchived } = useWorkspaceArchived()
  const { confirm, element: confirmDialog } = useConfirm()

  const [busy, setBusy] = useState<string | null>(null)
  const [rolesForId, setRolesForId] = useState<string | null>(null)

  const viewer = { userId: String(user?.id ?? ''), isOwner: perms.isOwner, isManager: perms.isManager }
  const isPersonal = !!workspace?.isPersonal
  const workspaceName = workspace?.name ?? ''
  const customRoles = customRolesOf(rolesQ.roles)
  const nameOf = (m: IMemberDTO) => memberName(m, locale)
  const members = membersQ.members
  const rolesFor = members.find((m) => m.userId === rolesForId) ?? null
  const seats = seatsQ.seats

  const { refresh: refreshMembers } = membersQ
  const { refresh: refreshInvites } = invitesQ
  const { refresh: refreshPerms } = perms
  const { refresh: refreshRoles } = rolesQ
  const { refresh: refreshSeats } = seatsQ
  const refreshAll = useCallback(
    () =>
      Promise.all([
        refreshMembers({ force: true }),
        refreshInvites({ force: true }),
        refreshPerms({ force: true }),
        refreshRoles({ force: true }),
        refreshSeats({ force: true }),
      ]),
    [refreshMembers, refreshInvites, refreshPerms, refreshRoles, refreshSeats],
  )
  const refreshTeam = () =>
    Promise.all([refreshMembers({ force: true }), refreshPerms({ force: true }), refreshSeats({ force: true })])

  // The lists are paged: the members first, then the invitations.
  const next = nextPage({
    membersHasMore: membersQ.hasMore,
    invitationsHasMore: invitesQ.hasMore,
    isManager: perms.isManager,
  })
  const loadingMore = membersQ.isLoadingMore || invitesQ.isLoadingMore
  const loadMore = () => {
    if (loadingMore) return
    if (next === 'members') void membersQ.loadMore()
    else if (next === 'invitations') void invitesQ.loadMore()
  }

  const run = async (key: string, action: () => Promise<unknown>, success?: string) => {
    setBusy(key)
    try {
      await action()
      if (success) toast.success(success)
    } catch (err) {
      toast.error(errorMessage(t, err))
    } finally {
      setBusy(null)
    }
  }

  // ── Member actions ────────────────────────────────────────────────
  const onMakeManager = (m: IMemberDTO) =>
    confirm({
      title: t('team.confirm.makeManager.title'),
      description: t('team.confirm.makeManager.text', { name: nameOf(m) }),
      confirmLabel: t('team.action.makeManager'),
      cancelLabel: t('team.confirm.cancel'),
      onConfirm: () =>
        void run(
          'manager',
          async () => {
            await membersQ.setManager(m.userId)
            await refreshTeam()
          },
          t('team.done.makeManager', { name: nameOf(m) }),
        ),
    })

  const onUnsetManager = (m: IMemberDTO) =>
    confirm({
      title: t('team.confirm.unsetManager.title'),
      description: t('team.confirm.unsetManager.text', { name: nameOf(m) }),
      confirmLabel: t('team.action.unsetManager'),
      cancelLabel: t('team.confirm.cancel'),
      onConfirm: () =>
        void run(
          'manager',
          async () => {
            await membersQ.unsetManager(m.userId)
            await refreshTeam()
          },
          t('team.done.unsetManager', { name: nameOf(m) }),
        ),
    })

  const onTransfer = (m: IMemberDTO) =>
    confirm({
      title: t('team.confirm.transfer.title'),
      description: t('team.confirm.transfer.text', { name: nameOf(m), workspace: workspaceName }),
      confirmLabel: t('team.action.transfer'),
      cancelLabel: t('team.confirm.cancel'),
      danger: true,
      onConfirm: () =>
        void run(
          'transfer',
          async () => {
            await withStepUp(() => membersQ.transferOwnership(m.userId))
            await offerQ.refresh({ force: true })
          },
          t('team.done.transferOffered', { name: nameOf(m) }),
        ),
    })

  const onRemove = (m: IMemberDTO) =>
    confirm({
      title: t('team.confirm.remove.title'),
      description: t('team.confirm.remove.text', { name: nameOf(m), workspace: workspaceName }),
      confirmLabel: t('team.action.remove'),
      cancelLabel: t('team.confirm.cancel'),
      danger: true,
      onConfirm: () =>
        // The hook refreshes the list itself.
        void run(
          'remove',
          async () => {
            await membersQ.removeMember(m.userId)
            await refreshSeats({ force: true })
          },
          t('team.done.remove', { name: nameOf(m) }),
        ),
    })

  const onLeave = () =>
    confirm({
      title: t('team.confirm.leave.title'),
      description: t('team.confirm.leave.text', { workspace: workspaceName }),
      confirmLabel: t('team.action.leave'),
      cancelLabel: t('team.confirm.cancel'),
      danger: true,
      onConfirm: () =>
        void run('leave', async () => {
          await leaveWorkspace()
          // Out of this workspace: back to their own, on the home page.
          const personal = workspaces.find((w) => w.isPersonal)
          if (personal) switchToWorkspace(personal.id)
          navigate('/', { replace: true })
        }),
    })

  const actionsFor = (m: IMemberDTO) =>
    memberActions(viewer, m, { isPersonal, hasCustomRoles: customRoles.length > 0, isArchived })

  const menuItems = (m: IMemberDTO): IActionMenuItem[] => {
    const can = actionsFor(m)
    const items: IActionMenuItem[] = []
    if (can.assignRoles) items.push({ label: t('team.action.roles'), icon: ShieldCheck, onSelect: () => setRolesForId(m.userId) })
    if (can.makeManager) items.push({ label: t('team.action.makeManager'), icon: UserCircleGear, onSelect: () => onMakeManager(m) })
    if (can.unsetManager) items.push({ label: t('team.action.unsetManager'), icon: UserCircleGear, onSelect: () => onUnsetManager(m) })
    if (can.transferOwnership) items.push({ label: t('team.action.transfer'), icon: ArrowsClockwise, onSelect: () => onTransfer(m) })
    if (can.releaseBrake)
      items.push({
        label: t('team.action.releaseBrake'),
        icon: LockOpen,
        onSelect: () =>
          void run('release', () => membersQ.releaseBrake(m.userId), t('team.done.releaseBrake', { name: nameOf(m) })),
      })
    if (can.remove) items.push({ label: t('team.action.remove'), icon: UserMinus, danger: true, onSelect: () => onRemove(m) })
    if (can.leave) items.push({ label: t('team.action.leave'), icon: SignOut, danger: true, onSelect: onLeave })
    return items
  }

  // ── Invitations ───────────────────────────────────────────────────
  const invitationRole = (inv: IInvitationDTO): string | undefined => {
    const role = rolesQ.roles.find((r) => r.id === inv.roleId)
    return role ? roleLabel(t, role) : undefined
  }

  const onResend = (inv: IInvitationDTO) =>
    void run(`resend:${inv.id}`, () => invitesQ.resendInvitation(inv.id), t('team.done.resend', { email: inv.email }))

  const onRevoke = (inv: IInvitationDTO) =>
    confirm({
      title: t('team.confirm.revoke.title'),
      description: t('team.confirm.revoke.text', { email: inv.email }),
      confirmLabel: t('team.action.revoke'),
      cancelLabel: t('team.confirm.cancel'),
      danger: true,
      onConfirm: () =>
        void run(
          `revoke:${inv.id}`,
          async () => {
            await invitesQ.cancelInvitation(inv.id)
            await refreshSeats({ force: true })
          },
          t('team.done.revoke', { email: inv.email }),
        ),
    })

  // ── The open ownership offer ──────────────────────────────────────
  const offer = offerQ.offer
  const offeredTo = offer ? (members.find((m) => m.userId === offer.toUserId) ?? null) : null
  const offeredBy = offer ? (members.find((m) => m.userId === offer.fromUserId) ?? null) : null
  const offerCard = !offer ? null : offer.toUserId === viewer.userId ? (
    <Card className="p-5" data-testid="offer-for-you">
      <h2 className="text-base font-semibold text-ink">{t('team.offer.forYou.title')}</h2>
      <p className="mt-1 text-sm text-ink-subtle">
        {t('team.offer.forYou.text', {
          name: offeredBy ? nameOf(offeredBy) : '',
          workspace: workspaceName,
          date: formatDate(offer.expiresAt),
        })}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={busy !== null}
          onClick={() =>
            void run(
              'offer',
              async () => {
                await offerQ.accept()
                await Promise.all([refreshTeam(), refreshWorkspaces({ force: true })])
              },
              t('team.offer.accepted', { workspace: workspaceName }),
            )
          }
        >
          {t('team.offer.accept')}
        </Button>
        <Button
          variant="secondary"
          disabled={busy !== null}
          onClick={() => void run('offer', () => offerQ.decline(), t('team.offer.declined'))}
        >
          {t('team.offer.decline')}
        </Button>
      </div>
    </Card>
  ) : viewer.isOwner ? (
    <Card className="p-5" data-testid="offer-pending">
      <h2 className="text-base font-semibold text-ink">{t('team.offer.pending.title')}</h2>
      <p className="mt-1 text-sm text-ink-subtle">
        {t('team.offer.pending.text', { name: offeredTo ? nameOf(offeredTo) : '', date: formatDate(offer.expiresAt) })}
      </p>
      <div className="mt-4">
        <Button
          variant="secondary"
          disabled={busy !== null}
          onClick={() => void run('offer', () => offerQ.withdraw(), t('team.offer.withdrawn'))}
        >
          {t('team.offer.withdraw')}
        </Button>
      </div>
    </Card>
  ) : null

  // ── Render ────────────────────────────────────────────────────────
  const header = (
    <div className="mb-4">
      <h2 className="text-card-title text-ink">{t('team.title')}</h2>
      <p className="mt-1 text-sm text-ink-subtle">{t('team.intro')}</p>
    </div>
  )

  // The workspace itself first: a personal one has no team at all.
  if (!workspace) {
    return (
      <div>
        {header}
        {workspaceLoading ? (
          <Spinner label={t('team.loading')} />
        ) : (
          <Card className="p-5">
            <Notice tone="error">{t('errors.unknown')}</Notice>
            <Button className="mt-3" variant="secondary" onClick={() => void refreshWorkspaces({ force: true })}>
              {t('team.retry')}
            </Button>
          </Card>
        )}
      </div>
    )
  }

  if (isPersonal) {
    return (
      <div>
        {header}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-ink">{t('team.personal.title')}</h3>
          <p className="mt-1 text-sm text-ink-subtle">{t('team.personal.text')}</p>
          <Button asChild className="mt-4">
            <Link to="/workspaces/new">{t('team.personal.create')}</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const membersError = membersQ.error
  const lostAccess = isLostAccess(membersError, members.length)

  return (
    <div className="space-y-4">
      {stepUpPrompt}
      {confirmDialog}
      {header}
      {offerCard}
      <ArchivedWorkspaceBanner />

      {perms.isManager && !isArchived ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          {seats && seats.limit !== null ? (
            <p className="text-sm text-ink" data-testid="seats">
              {t('team.seats', { used: seats.used, limit: seats.limit })}
            </p>
          ) : (
            <span />
          )}
          <Button asChild>
            <Link to="/organization/members/invite">{t('team.inviteButton')}</Link>
          </Button>
        </Card>
      ) : null}

      {/* ── Current members ──────────────────────────── */}
      <Card as="section" className="p-5" aria-labelledby="members-title">
        <h3 id="members-title" className="mb-2 text-base font-semibold text-ink">
          {t('team.members.title')}
        </h3>
        {lostAccess ? (
          <div>
            <Notice tone="warning">{t('team.noAccess.text')}</Notice>
            {/* The workspace switcher is the navbar's workspace menu: open it. */}
            <Button className="mt-3" variant="secondary" onClick={openWorkspaceMenu}>
              {t('team.noAccess.switch')}
            </Button>
          </div>
        ) : membersQ.isLoading && members.length === 0 ? (
          <Spinner label={t('team.loading')} />
        ) : membersError && members.length === 0 ? (
          <div>
            <Notice tone="error">{errorMessage(t, membersError)}</Notice>
            <Button className="mt-3" variant="secondary" onClick={() => void refreshAll()}>
              {t('team.retry')}
            </Button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-hairline">
              {members.map((m) => {
                const name = nameOf(m)
                const isSelf = m.userId === viewer.userId
                const items = hasAnyAction(actionsFor(m)) ? menuItems(m) : []
                return (
                  <li key={m.userId} className="flex items-center gap-3 py-3" data-testid={`member-${m.userId}`}>
                    <MemberAvatar member={m} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {isSelf ? t('team.row.self', { name }) : name}
                      </p>
                      {m.email && m.email !== name ? <p className="truncate text-xs text-ink-subtle">{m.email}</p> : null}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {m.isOwner ? (
                          <Badge tone="primary">{t('team.badge.owner')}</Badge>
                        ) : m.isManager ? (
                          <Badge tone="info">{t('team.badge.manager')}</Badge>
                        ) : null}
                        {/* Paused from deleting by the velocity brake, until the owner releases them. */}
                        {m.paused ? <Badge tone="warning">{t('team.badge.paused')}</Badge> : null}
                        {chipRoles(m).map((r) => (
                          <span key={r.id} className="rounded-sm border border-hairline px-1.5 py-0.5 text-xs text-ink-muted">
                            {roleLabel(t, r)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ActionMenu
                      label={t('team.row.actions', { name })}
                      title={name}
                      items={items}
                      disabled={busy !== null}
                    />
                  </li>
                )
              })}
            </ul>
            {members.length <= 1 ? (
              <p className="mt-2 text-sm text-ink-subtle">
                {perms.isManager ? t('team.members.empty') : t('team.members.emptyMember')}
              </p>
            ) : null}
          </>
        )}
      </Card>

      {/* ── Pending invitations (managers act on them) ─── */}
      {perms.isManager && invitesQ.invitations.length > 0 ? (
        <Card as="section" className="p-5" aria-labelledby="pending-title">
          <h3 id="pending-title" className="mb-2 text-base font-semibold text-ink">
            {t('team.pending.title')}
          </h3>
          <ul className="divide-y divide-hairline">
            {invitesQ.invitations.map((inv) => {
              const expires = inv.isExpired
                ? t('team.invitation.expired')
                : t('team.invitation.expires', { date: formatDate(inv.expiresAt) })
              return (
                <li key={inv.id} className="flex items-center gap-3 py-3" data-testid={`invitation-${inv.id}`}>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-ink-subtle">
                    <EnvelopeSimple size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{inv.email}</p>
                    <p className={cn('truncate text-xs', inv.isExpired ? 'text-warning' : 'text-ink-subtle')}>
                      {[invitationRole(inv), expires].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <IconButton
                    icon={EnvelopeSimple}
                    variant="ghost"
                    size="sm"
                    aria-label={t('team.invitation.resend', { email: inv.email })}
                    disabled={busy !== null || isArchived}
                    onClick={() => onResend(inv)}
                  />
                  <IconButton
                    icon={X}
                    variant="ghost"
                    size="sm"
                    className="text-error"
                    aria-label={t('team.invitation.revoke', { email: inv.email })}
                    disabled={busy !== null || isArchived}
                    onClick={() => onRevoke(inv)}
                  />
                </li>
              )
            })}
          </ul>
        </Card>
      ) : null}
      {perms.isManager && invitesQ.error ? <Notice tone="error">{errorMessage(t, invitesQ.error)}</Notice> : null}

      {loadingMore ? (
        <Spinner label={t('team.loadingMore')} />
      ) : next && !lostAccess ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={loadMore}>
            {t('team.showMore')}
          </Button>
        </div>
      ) : null}

      {rolesFor ? (
        <MemberRolesDialog
          member={rolesFor}
          name={nameOf(rolesFor)}
          customRoles={customRoles}
          onClose={() => setRolesForId(null)}
          onDone={(message) => {
            setRolesForId(null)
            toast.success(message)
            void refreshTeam()
          }}
          onError={(err) => {
            setRolesForId(null)
            toast.error(errorMessage(t, err))
          }}
        />
      ) : null}
    </div>
  )
}

// Keyed by workspace: switching remounts the view, so no open menu, dialog or
// selection from the previous workspace survives.
export default function Members() {
  const { current } = useCurrentWorkspace()
  return <MembersView key={current?.id ?? 'none'} />
}
