import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  dot: string
  badge: string
  label: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ dot, badge, label }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0',
      badge,
    )}
  >
    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
    {label}
  </span>
)
