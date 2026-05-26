import { ServerStatus } from '@/client/coolify'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  ServerStatus,
  { label: string; dot: string; badge: string }
> = {
  online: {
    label: 'Online',
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  },
}

interface StatusBadgeProps {
  status: ServerStatus
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.badge,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
