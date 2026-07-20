import { ServerStatus } from '@/client/coolify'
import { StatusBadge as StatusBadgeBase } from '@/components/ui/StatusBadge'
import { serverStatusConfig } from '@/data'

interface StatusBadgeProps {
  status: ServerStatus
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = serverStatusConfig[status]
  return <StatusBadgeBase dot={cfg.dot} badge={cfg.badge} label={cfg.label} />
}
