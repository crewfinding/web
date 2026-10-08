import { isStepUpRequired } from '@fonderie/client'
import type { StepUpMethod } from '@fonderie/client'
import { useStepUp } from '@fonderie/react-auth'
import { useCallback, useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { DialogShell } from './DialogShell'
import { Input } from './Input'
import { useTranslation } from '../hooks/useTranslation'
import { errorMessage } from '../lib/apiErrors'
import { stepUpCodeChannel, stepUpMode } from '../lib/stepUp'

// Step-up (fonderie insider-threat design, Phase 4): a big move — handing the
// team over — answers STEP_UP_REQUIRED until the person proves it's still
// them. `withStepUp(action)` runs the action; on that answer it asks
// (authenticator, password or a code sent to them), then runs it once more.
// The mobile app's StepUp component, as a dialog.

interface IPending {
  resolve: (ok: boolean) => void
}

export function useStepUpPrompt() {
  const { t } = useTranslation()
  const { loadMethods, requestCode, confirm, isLoading } = useStepUp()
  const [pending, setPending] = useState<IPending | null>(null)
  const [methods, setMethods] = useState<StepUpMethod[]>([])
  const [value, setValue] = useState('')
  const [codeSentTo, setCodeSentTo] = useState<'email' | 'sms' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ask = useCallback(async (): Promise<boolean> => {
    setValue('')
    setError(null)
    setCodeSentTo(null)
    try {
      setMethods(await loadMethods())
    } catch (err) {
      setError(errorMessage(t, err))
    }
    return new Promise<boolean>((resolve) => setPending({ resolve }))
  }, [loadMethods, t])

  /** Run a big move; if it asks for proof, ask the person and run it once more. */
  const withStepUp = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      try {
        return await action()
      } catch (err) {
        if (!isStepUpRequired(err)) throw err
        if (!(await ask())) throw err
        return action()
      }
    },
    [ask],
  )

  const close = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
  }

  const mode = stepUpMode(methods, codeSentTo !== null)
  const codeChannel = stepUpCodeChannel(methods)

  const submit = async () => {
    if (!value) return
    setError(null)
    try {
      if (mode === 'mfa') await confirm({ mfaCode: value.trim() })
      else if (mode === 'password') await confirm({ password: value })
      else await confirm({ code: value.trim() })
      close(true)
    } catch {
      setError(t('team.stepUp.failed'))
    }
  }

  const sendCode = async () => {
    if (!codeChannel) return
    setError(null)
    try {
      await requestCode(codeChannel)
      setCodeSentTo(codeChannel)
      setValue('')
    } catch (err) {
      setError(errorMessage(t, err))
    }
  }

  const body =
    mode === 'mfa'
      ? t('team.stepUp.mfa')
      : mode === 'password'
        ? t('team.stepUp.password')
        : codeSentTo
          ? t('team.stepUp.codeSent', { channel: t(`team.stepUp.channel.${codeSentTo}`) })
          : t('team.stepUp.code')
  const asksValue = mode !== 'code' || codeSentTo !== null

  const element = (
    <DialogShell open={pending !== null} labelledBy="step-up-title" onClose={() => close(false)}>
      <Card className="p-6">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (asksValue) void submit()
            else void sendCode()
          }}
        >
          <h2 id="step-up-title" className="text-card-title pr-6 text-ink">
            {t('team.stepUp.title')}
          </h2>
          <p className="mt-2 text-sm text-ink-subtle">{body}</p>
          {asksValue && (
            <Input
              containerClassName="mt-4"
              type={mode === 'password' ? 'password' : 'text'}
              inputMode={mode === 'password' ? undefined : 'numeric'}
              autoComplete={mode === 'password' ? 'current-password' : 'one-time-code'}
              aria-label={t('team.stepUp.title')}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-error">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {mode === 'password' && codeChannel && (
              <Button type="button" variant="ghost" onClick={() => void sendCode()} disabled={isLoading}>
                {t('team.stepUp.useCode')}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => close(false)}>
              {t('team.stepUp.cancel')}
            </Button>
            {asksValue ? (
              <Button type="submit" loading={isLoading} disabled={!value || isLoading}>
                {t('team.stepUp.confirm')}
              </Button>
            ) : (
              <Button type="submit" loading={isLoading} disabled={!codeChannel || isLoading}>
                {t('team.stepUp.sendCode')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </DialogShell>
  )

  return { withStepUp, element }
}
