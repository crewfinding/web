import type { IUserDTO } from '@fonderie/react-auth'
import { useSession, type IUseSessionReturn } from '@fonderie/react-auth'
import { createContext, useContext, type ReactNode } from 'react'

// One useSession instance for the whole app: guards, navbar, and settings all
// observe the same state, so a logout anywhere flips everything at once.
const SessionContext = createContext<IUseSessionReturn | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

export function useAppSession(): IUseSessionReturn {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error('useAppSession: wrap the app in <SessionProvider>.')
  }
  return session
}

// Fresh accounts have empty name fields; fall back to the email's local part
export function userDisplayName(user: IUserDTO | null): string {
  if (!user) return ''
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email.split('@')[0]
}
