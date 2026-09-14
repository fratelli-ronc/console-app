import * as React from 'react'
import { cn } from '@/lib/utils'

export const OutlinedButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'h-10 px-4 text-sm font-medium bg-transparent text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
})
OutlinedButton.displayName = 'OutlinedButton'
