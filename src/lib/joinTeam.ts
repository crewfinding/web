import { useWorkspaces, type IAcceptInvitationInput } from '@fonderie/react-workspaces'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from '../hooks/useTranslation'
import { describeInvitationError, type InvitationRefusal } from './invitationErrors'
import { setReturnTo } from './returnTo'
import { useAppSession } from './session'
import { switchToWorkspace } from './workspace'

// The one "join a team" action behind /join, the workspace menu and
// /invite/:token: accept (token or PIN) → re-read the workspace list → switch
// to the joined workspace → home, with "You've joined X." — or "You're
// already in X." when the account was a member already (the API accepts
// that as a success; it is a switch, not an error).
export function useJoinTeam(onDone?: () => void) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useAppSession()
  const { workspaces, acceptInvitation, refresh } = useWorkspaces()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<InvitationRefusal | null>(null)
  // Set once the accept succeeded; finished when the re-read list holds it
  const [joined, setJoined] = useState<{ id: string; already: boolean } | null>(null)
  const inFlight = useRef(false)
  const finished = useRef<string | null>(null)

  const join = useCallback(
    async (input: IAcceptInvitationInput) => {
      if (inFlight.current) return
      inFlight.current = true
      setBusy(true)
      setRefusal(null)
      const before = new Set(workspaces.map((w) => w.id))
      try {
        const id = await acceptInvitation(input)
        await refresh({ force: true })
        setJoined({ id, already: before.has(id) })
      } catch (err) {
        setRefusal(describeInvitationError(t, err))
        setBusy(false)
      } finally {
        inFlight.current = false
      }
    },
    [workspaces, acceptInvitation, refresh, t],
  )

  useEffect(() => {
    if (!joined || finished.current === joined.id) return
    const ws = workspaces.find((w) => w.id === joined.id)
    if (!ws) return
    const name = ws.type === 'PERSONAL' ? t('nav.workspace.personal') : ws.name
    // Once: this screen is left right after (home, or the dialog closes)
    finished.current = ws.id
    switchToWorkspace(ws.id)
    toast.success(t(joined.already ? 'invite.alreadyMember' : 'invite.joined', { workspace: name }))
    onDone?.()
    navigate('/', { replace: true })
  }, [joined, workspaces, t, navigate, onDone])

  // Wrong account: sign out, sign in as the invited address, come back here
  const switchAccount = useCallback(
    async (returnPath: string) => {
      setReturnTo(returnPath)
      await logout()
      navigate('/login', { replace: true, state: { from: { pathname: returnPath } } })
    },
    [logout, navigate],
  )

  return { join, busy, refusal, clearRefusal: () => setRefusal(null), switchAccount }
}
