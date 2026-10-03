import { FonderieClient } from '@fonderie/client'

// The CrewFinding API, /v1 included — the same API the mobile app uses.
// Local by default; deployments set VITE_API_URL. Exported so any non-SDK
// call resolves the same host the FonderieClient uses.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/v1'

// localStorage, read lazily and never trusted to exist: private browsing and
// blocked storage throw on access — then nothing is kept, nothing breaks.
const deviceStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // full or blocked: the next visit simply loads fresh
    }
  },
}

// Single client for the whole app; hooks reach it via <FonderieProvider>.
export const fonderie = new FonderieClient({
  baseUrl: API_BASE_URL,
  // What the office screens fetched, kept in this browser: a reload or a new
  // visit opens on the last data, refreshed behind what is shown. Tied to the
  // signed-in user and wiped on sign-out by the client. The same choice as the
  // mobile app: billing, team and webhooks — customers (CRM personal data)
  // and the audit log are always read fresh.
  queries: {
    persist: {
      storage: deviceStorage,
      filter: (key) => /^GET \/(billing|plans|workspaces|webhooks)\b/.test(key),
    },
  },
})
