import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { useId, type ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Notice } from '../../../components/Notice'
import { useTranslation } from '../../../hooks/useTranslation'

// The pieces every Business card shares (the mobile app's BusinessCard.tsx).

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

/** Save / Cancel, shown while the card has unsaved changes. */
export function SaveBar({ visible, saving, onSave, onCancel }: { visible: boolean; saving: boolean; onSave: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  if (!visible) return null
  return (
    <div className="flex gap-2">
      <Button size="sm" loading={saving} disabled={saving} onClick={onSave}>
        {t('business.save')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        {t('business.cancel')}
      </Button>
    </div>
  )
}

/** A card's banner error. */
export function CardError({ message }: { message: string | null }) {
  return message ? <Notice tone="error">{message}</Notice> : null
}

/** "▸ Legal details" — a section folded until asked for. */
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

/** A label over a value (read-only cards); "Not set" when empty. */
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
