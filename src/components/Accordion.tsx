import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className={className}>
      {items.map((item) => {
        const open = item.id === openId
        return (
          <div key={item.id} className="border-b border-hairline last:border-b-0">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`accordion-${item.id}`}
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-medium text-ink hover:underline"
            >
              {item.title}
              <CaretDown
                size={16}
                aria-hidden="true"
                className={cn('shrink-0 text-ink-subtle transition-transform', open && 'rotate-180')}
              />
            </button>
            {open && (
              <div id={`accordion-${item.id}`} className="pb-4 text-sm text-ink-subtle">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
