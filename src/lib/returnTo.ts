// Where a signed-out visitor was headed when they left to sign in or sign up
// (an invitation link, /join). Kept for this tab only: sign-in may leave the
// app entirely (Google / Apple redirect through the API) or go through
// registration first, so router state alone would lose it. RequireAuth sends
// the newly signed-in user back here once, then it is cleared.

const KEY = 'crewfinding.returnTo'

export function setReturnTo(path: string): void {
  try {
    window.sessionStorage.setItem(KEY, path)
  } catch {
    // blocked storage: the user lands on home and opens the link again
  }
}

export function peekReturnTo(): string | null {
  try {
    const path = window.sessionStorage.getItem(KEY)
    // Same-app paths only: never an absolute or protocol-relative URL
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null
  } catch {
    return null
  }
}

export function clearReturnTo(): void {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // nothing kept, nothing to clear
  }
}
