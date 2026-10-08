import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { useId, type ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Notice } from '../../../components/Notice'
import { useTranslation } from '../../../hooks/useTranslation'

// The pieces the Business pages share (the mobile app's BusinessShared.tsx).

/** A titled card; `testId` for tests. */
export function SectionCard({ title, testId, action, children }: { title: string; testId: string; action?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <Card as="section" className="space-y-4 p-5" aria-labelledby={id} data-testid={testId}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={id} className="text-base font-semibold text-ink">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </Card>
  )
}

/**
 * The bottom of every form page (the app's FormFooter): Save changes, then
 * Discard changes — back without saving. Not shown to those who cannot edit.
 */
export function FormFooter({ saving, onSave, onDiscard }: { saving: boolean; onSave: () => void; onDiscard: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-2 border-t border-hairline pt-4" data-testid="form-footer">
      <Button loading={saving} disabled={saving} onClick={onSave}>
        {t('business.footer.save')}
      </Button>
      <Button variant="danger" disabled={saving} onClick={onDiscard}>
        {t('business.footer.discard')}
      </Button>
    </div>
  )
}

/** A page's (or list's) error, above the form. */
export function CardError({ message }: { message: string | null }) {
  return message ? <Notice tone="error">{message}</Notice> : null
}

/** "▸ Customize rates" — a section folded until asked for. */
export function Disclosure({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const id = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-1 text-sm font-medium text-link hover:underline"
      >
        {open ? <CaretDown size={14} aria-hidden="true" /> : <CaretRight size={14} aria-hidden="true" />}
        {label}
      </button>
      {open ? (
        <div id={id} className="mt-3 space-y-4">
          {children}
        </div>
      ) : null}
    </div>
  )
}

/** A label over a value (read-only text); "Not set" when empty. */
export function Detail({ label, value }: { label: string; value: string | string[] | null | undefined }) {
  const { t } = useTranslation()
  const lines = (Array.isArray(value) ? value : [value ?? '']).filter((l) => l && l.trim().length)
  return (
    <div>
      <p className="text-xs font-medium text-ink-subtle">{label}</p>
      {lines.length ? (
        lines.map((l, i) => (
          <p key={i} className="text-sm text-ink">
            {l}
          </p>
        ))
      ) : (
        <p className="text-sm text-ink-subtle">{t('business.notSet')}</p>
      )}
    </div>
  )
}

/** A one-click prompt: "Add +1 514… to your phone numbers?" — Add. */
export function Prompt({ text, action, onClick, testId }: { text: string; action: string; onClick: () => void; testId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface-2/50 px-3 py-2" data-testid={testId}>
      <p className="min-w-0 flex-1 text-sm text-ink">{text}</p>
      <Button size="sm" variant="secondary" onClick={onClick}>
        {action}
      </Button>
    </div>
  )
}

/** A labelled native select with a "Not set" first option. */
export function LabeledSelect({
  label,
  value,
  options,
  onChange,
  error,
  allowNone = true,
}: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
  error?: string
  allowNone?: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select id={id} className="input h-11 w-full" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
        {allowNone ? <option value="">{t('business.notSet')}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-xs text-error">{error}</p> : null}
    </div>
  )
}
