import { cn } from '@/lib/utils'
import { RunSpinner, RunSpinnerColor } from './StatusIndicator'

interface StatusBadgeProps {
  dot: string
  badge: string
  label: string
  pending?: boolean
  spinnerColor?: RunSpinnerColor
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  dot,
  badge,
  label,
  pending,
  spinnerColor,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0',
      badge,
    )}
  >
    {pending ? (
      <RunSpinner className="h-2.5 w-2.5" color={spinnerColor} />
    ) : (
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
    )}
    {label}
  </span>
)
