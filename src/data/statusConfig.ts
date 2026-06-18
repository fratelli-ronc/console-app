import { ServerStatus } from '@/client/coolify'

export const serverStatusConfig: Record<
  ServerStatus,
  { dot: string; badge: string; label: string }
> = {
  online: {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Online',
  },
  offline: {
    dot: 'bg-red-400',
    badge: 'bg-red-50 text-red-600 border-red-200',
    label: 'Offline',
  },
}

export const resourceStatusConfig: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  'running:healthy': {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Esecuzione',
  },
  'running:unknown': {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Esecuzione',
  },
  'running:unhealthy': {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Degradato',
  },
  'starting:unhealthy': {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Avvio',
  },
  'starting:healthy': {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Avvio',
  },
  exited: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Fermo',
  },
  stopping: {
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    label: 'Fermando',
  },
  restarting: {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Riavvio',
  },
}

export const fallbackResourceStatus = {
  dot: 'bg-zinc-400',
  badge: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  label: 'Sconosciuto',
}
