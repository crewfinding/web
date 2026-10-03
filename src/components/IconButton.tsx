import type { Icon } from '@phosphor-icons/react'
import { forwardRef } from 'react'
import { Button, type ButtonProps } from './Button'

export interface IconButtonProps
  extends Omit<ButtonProps, 'iconLeft' | 'iconRight' | 'children' | 'asChild' | 'fullWidth' | 'aria-label'> {
  icon: Icon
  'aria-label': string
}

// Square, icon-only Button; the required aria-label keeps it nameable.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ icon, ...props }, ref) => (
  <Button ref={ref} iconLeft={icon} {...props} />
))

IconButton.displayName = 'IconButton'
