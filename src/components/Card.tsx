import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  as?: ElementType
}

export function Card({ as: Tag = 'div', children, className, ...props }: CardProps) {
  return (
    <Tag className={cn('rounded-xl border border-hairline bg-surface-1 shadow-card', className)} {...props}>
      {children}
    </Tag>
  )
}
