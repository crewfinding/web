import type { ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: string
  children: ReactNode
}

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 shadow-card">
      {(title || subtitle) && (
        <div className="flex flex-col space-y-1.5 p-6 pb-0">
          {title && <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>}
          {subtitle && <p className="text-sm text-ink-subtle">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
