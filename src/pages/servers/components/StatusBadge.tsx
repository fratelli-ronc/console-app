import { ServerStatus } from '@/client/coolify'
import { StatusBadge as StatusBadgeBase } from '@/components/ui/StatusBadge'

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
  return <StatusBadgeBase dot={cfg.dot} badge={cfg.badge} label={cfg.label} />
}
