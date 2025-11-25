import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', containerClassName)}>
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'
