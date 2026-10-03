import { cn } from '../lib/cn'

interface TabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

// Tablist only — the page renders the active panel itself
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'grid w-full gap-1 rounded-lg border border-hairline bg-surface-2 p-1 md:inline-flex md:w-auto',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => onChange(tab.id)}
          className={cn(
            'cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors',
            tab.id === activeTab ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-subtle hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
