import { cn } from '@/lib/utils'

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      'inline-block rounded-full border-2 border-current/25 border-t-current animate-spin',
      className,
    )}
  />
)

const RUN_SPINNER_COLORS = {
  secondary: { ring: 'border-secondary/25 border-t-secondary', fill: 'bg-secondary' },
  muted: {
    ring: 'border-muted-foreground/25 border-t-muted-foreground',
    fill: 'bg-muted-foreground',
  },
} as const

export type RunSpinnerColor = keyof typeof RUN_SPINNER_COLORS

export const RunSpinner: React.FC<{
  className?: string
  color?: RunSpinnerColor
}> = ({ className, color = 'secondary' }) => {
  const { ring, fill } = RUN_SPINNER_COLORS[color]
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span className={cn('absolute inset-0 rounded-full border-2 animate-spin', ring)} />
      <span className={cn('absolute inset-0.75 rounded-full', fill)} />
    </span>
  )
}

export const StatusDot: React.FC<{
  className?: string
  variant: 'success' | 'failed'
}> = ({ className, variant }) => (
  <span className={cn('relative inline-flex shrink-0', className)}>
    <span
      className={cn(
        'absolute inset-0 rounded-full border-2',
        variant === 'success' ? 'border-green-500/25' : 'border-destructive/25',
      )}
    />
    <span
      className={cn(
        'absolute inset-0.75 rounded-full',
        variant === 'success' ? 'bg-green-500' : 'bg-destructive',
      )}
    />
  </span>
)
