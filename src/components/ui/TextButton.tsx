import * as React from 'react'
import { cn } from '@/lib/utils'

export const TextButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'h-10 px-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
})
TextButton.displayName = 'TextButton'
