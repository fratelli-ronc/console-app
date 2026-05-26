import { useEffect, useMemo, useState } from 'react'
import { Server as ServerIcon } from 'lucide-react'
import { Server, ServerMetrics } from '@/client/coolify'
import { getServerMetrics } from '@/client/coolify/requests'
import { StatusBadge } from './StatusBadge'

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1_024).toFixed(0)} KB`
}

interface ServerCardProps {
  server: Server
}

export const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const [metrics, setMetrics] = useState<ServerMetrics | undefined>(undefined)
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  useEffect(() => {
    getServerMetrics(server.uuid)
      .then(setMetrics)
      .finally(() => setLoadingMetrics(false))
  }, [server.uuid])

  const serverStorage = useMemo(() => {
    if (!metrics) return
    return metrics.filesystems.find((fs) => fs.mountpoint === '/')
  }, [metrics])

  if (loadingMetrics) return <ServerCardSkeleton />

  return (
    <div className="bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all duration-150 group">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <ServerIcon size={18} className="text-primary" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
              {server.name}
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {server.ip}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={server.isReachable ? 'online' : 'offline'} />

          {/* <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-popover border border-border rounded-lg shadow-lg text-sm py-1 overflow-hidden">
                {[
                  { label: 'Modifica', key: 'edit' },
                  { label: 'Riavvia', key: 'restart' },
                  { label: 'Rimuovi', key: 'remove' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 hover:bg-accent transition-colors',
                      item.key === 'remove' &&
                        'text-destructive hover:bg-destructive/10',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div> */}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mx-5" />

      {/* Stats row */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            CPU
          </span>

          <span className="text-sm font-semibold text-foreground">
            {metrics?.cpu.usedPercent.toFixed(1)} %
          </span>
          <span className="text-xs text-muted-foreground">
            {metrics
              ? `${metrics.cpu.count} core · ${metrics.cpu.architecture}`
              : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            Memoria
          </span>

          <span className="text-sm font-semibold text-foreground">
            {metrics?.memory.usedPercent.toFixed(1)} %
          </span>
          <span className="text-xs text-muted-foreground">
            {metrics
              ? `${formatBytes(metrics.memory.totalBytes - metrics.memory.availableBytes)} / ${formatBytes(metrics.memory.totalBytes)}`
              : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            Disco
          </span>

          <span className="text-sm font-semibold text-foreground">
            {serverStorage?.usedPercent?.toFixed(1)} %
          </span>
          <span className="text-xs text-muted-foreground">
            {serverStorage
              ? `${formatBytes(serverStorage.availBytes)} liberi`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

export const ServerCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-xl animate-pulse">
    <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-accent" />
        <div className="min-w-0 space-y-2 pt-0.5">
          <div className="h-3.5 w-32 bg-accent rounded" />
          <div className="h-3 w-24 bg-accent rounded" />
        </div>
      </div>
      <div className="h-5 w-14 bg-accent rounded-full shrink-0" />
    </div>
    <div className="border-t border-border mx-5" />
    <div className="px-5 py-4.5 grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-2.5 w-8 bg-accent rounded" />
          <div className="h-4 w-12 bg-accent rounded" />
          <div className="h-3 w-16 bg-accent rounded" />
        </div>
      ))}
    </div>
  </div>
)
