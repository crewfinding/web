import { useState } from 'react'
import { Button } from './Button'
import { OtpInput } from './OtpInput'
import { useTranslation } from '../hooks/useTranslation'
import { useJoinTeam } from '../lib/joinTeam'

// The code step of "Join a team": 6 digits (paste fills every box), sent on
// the 6th digit. Used by /join and the workspace menu's dialog.
export function JoinWithCode({ onCancel, returnPath = '/join' }: { onCancel?: () => void; returnPath?: string }) {
  const { t } = useTranslation()
  const { join, busy, refusal, clearRefusal, switchAccount } = useJoinTeam(onCancel)
  const [code, setCode] = useState('')

  const submit = (pin: string) => {
    if (pin.length !== 6 || busy) return
    void join({ pin }).then(() => setCode(''))
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit(code)
      }}
    >
      <p id="join-code-label" className="sr-only">
        {t('invite.codeLabel')}
      </p>
      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v)
          if (refusal) clearRefusal()
        }}
        onComplete={submit}
        length={6}
        disabled={busy}
        error={!!refusal}
        aria-labelledby="join-code-label"
      />
      <p className="mt-3 text-xs text-ink-subtle">{t('invite.helper')}</p>
      {busy && (
        <p role="status" className="mt-3 text-sm text-ink-subtle">
          {t('invite.joiningGeneric')}
        </p>
      )}
      {refusal && (
        <p role="alert" className="mt-3 text-sm text-error">
          {refusal.message}
        </p>
      )}
      <div className="mt-6 space-y-2">
        <Button type="submit" fullWidth loading={busy} disabled={code.length !== 6}>
          {t('invite.submit')}
        </Button>
        {refusal?.wrongAccount && (
          <Button type="button" variant="secondary" fullWidth onClick={() => void switchAccount(returnPath)}>
            {t('invite.switchAccount')}
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
            {t('invite.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
