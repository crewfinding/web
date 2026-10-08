import { useState } from 'react'
import { useTranslation } from '../../../hooks/useTranslation'
import { errorMessage } from '../../../lib/apiErrors'
import { reasonKey } from '../../../lib/business'

type Write = <R>(fn: () => Promise<R>) => Promise<R>

/**
 * Runs a list action (saved at once) and keeps its failure as the list's
 * message. `write` is the page's (a 409 WORKSPACE_ARCHIVED re-reads the workspace).
 */
export function useAction(write?: Write) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setError(null)
    setBusy(true)
    try {
      await (write ? write(fn) : fn())
      return true
    } catch (err) {
      // A known refusal in words, else the error table.
      const key = reasonKey(err)
      setError(key ? t(key) : errorMessage(t, err))
      return false
    } finally {
      setBusy(false)
    }
  }
  return { error, setError, busy, run }
}
