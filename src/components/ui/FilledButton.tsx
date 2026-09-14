import * as React from 'react'
import { cn } from '@/lib/utils'

export const FilledButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
})
FilledButton.displayName = 'FilledButton'
