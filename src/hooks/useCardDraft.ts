import { useState } from 'react'
import { useTranslation } from './useTranslation'
import { errorMessage } from '../lib/apiErrors'
import { serverRefusal } from '../lib/business'

/**
 * A Business card's draft (the mobile app's useCardDraft): its values, the
 * field errors, whether it differs from the stored values. The card is
 * remounted when its stored values change, so `initial` is always what the
 * server holds.
 */
export function useCardDraft<V>(initial: V) {
  const { t } = useTranslation()
  const [values, setValues] = useState<V>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  const set = (patch: Partial<V>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    const cleared = Object.keys(patch)
    if (cleared.some((k) => errors[k]))
      setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !cleared.includes(k))))
  }
  const reset = () => {
    setValues(initial)
    setErrors({})
    setFormError(null)
  }
  /**
   * Validates (`check` returns field → message), then writes. A 422 naming a
   * field lands under it (`fieldOf` maps the server path); anything else is
   * the card's banner.
   */
  const save = async (
    check: () => Record<string, string>,
    write: () => Promise<void>,
    fieldOf: (path: string | null) => string | null,
  ): Promise<boolean> => {
    setFormError(null)
    const e = check()
    setErrors(e)
    if (Object.keys(e).length) return false
    setSaving(true)
    try {
      await write()
      return true
    } catch (err) {
      const refusal = serverRefusal(err)
      const field = refusal ? fieldOf(refusal.path) : null
      if (refusal && field) setErrors({ [field]: refusal.message })
      else setFormError(refusal?.message ?? errorMessage(t, err))
      return false
    } finally {
      setSaving(false)
    }
  }
  return { values, set, setValues, errors, setErrors, formError, setFormError, saving, dirty, reset, save }
}
