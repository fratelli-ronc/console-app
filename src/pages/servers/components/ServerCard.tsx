import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server as ServerIcon } from 'lucide-react'
import { ServerSnapshot } from '@/client/coolify'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { RunSpinner } from '@/components/ui'
import {
  resourceStatusConfig,
  fallbackResourceStatus,
} from '@/data/statusConfig'

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1_024).toFixed(0)} KB`
}

interface ServerCardProps {
  snapshot: ServerSnapshot
}

export const ServerCard: React.FC<ServerCardProps> = ({ snapshot }) => {
  const { server, metrics, resources } = snapshot
  const navigate = useNavigate()

  const serverStorage = useMemo(
    () => metrics.filesystems?.find((fs) => fs.mountpoint === '/'),
    [metrics.filesystems],
  )

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl transition-all duration-150 group',
        server.isReachable
          ? 'hover:border-primary/40 hover:shadow-sm cursor-pointer'
          : 'cursor-default opacity-70',
      )}
      onClick={() => {
        if (!server.isReachable) return
        navigate(`/servers/${server.uuid}/resources`, {
          state: { serverName: server.name },
        })
      }}
    >
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
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mx-5" />

      {/* Stats row */}
      <div className="px-5 pt-4 pb-3 grid grid-cols-3 gap-3">
        {metrics.error ? (
          <div className="col-span-3 text-xs text-muted-foreground py-1">
            Metriche non disponibili
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                CPU
              </span>

              <span className="text-sm font-semibold text-foreground">
                {metrics.cpu ? `${metrics.cpu.usedPercent.toFixed(1)} %` : '—'}
              </span>
              <span className="text-xs text-muted-foreground">
                {metrics.cpu
                  ? `${metrics.cpu.count} core · ${metrics.cpu.architecture ?? ''}`
                  : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                Memoria
              </span>

              <span className="text-sm font-semibold text-foreground">
                {metrics.memory
                  ? `${metrics.memory.usedPercent.toFixed(1)} %`
                  : '—'}
              </span>
              <span className="text-xs text-muted-foreground">
                {metrics.memory
                  ? `${formatBytes(metrics.memory.totalBytes - metrics.memory.availableBytes)} / ${formatBytes(metrics.memory.totalBytes)}`
                  : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                Disco
              </span>

              <span className="text-sm font-semibold text-foreground">
                {serverStorage
                  ? `${serverStorage.usedPercent.toFixed(1)} %`
                  : '—'}
              </span>
              <span className="text-xs text-muted-foreground">
                {serverStorage
                  ? `${formatBytes(serverStorage.availBytes)} liberi`
                  : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Resources section */}
      {server.isReachable && <div className="border-t border-border mx-5" />}
      {server.isReachable && (
        <div className="px-5 py-3">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            Risorse
          </span>

          <div className="mt-2 flex flex-col gap-1.5">
            {!resources || resources.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nessuna risorsa</p>
            ) : (
              resources.map((resource) => {
                const config =
                  resourceStatusConfig[resource.status] ??
                  fallbackResourceStatus
                return (
                  <div
                    key={resource.uuid}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-xs text-foreground truncate">
                      {resource.name}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {config.pending ? (
                        <RunSpinner
                          className="h-2 w-2"
                          color={config.spinnerColor}
                        />
                      ) : (
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            config.dot,
                          )}
                        />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {config.label}
                      </span>
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
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
    <div className="px-5 pt-4.5 pb-3 grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-2.5 w-8 bg-accent rounded" />
          <div className="h-4 w-12 bg-accent rounded" />
          <div className="h-3 w-16 bg-accent rounded" />
        </div>
      ))}
    </div>
    <div className="border-t border-border mx-5" />
    <div className="px-5 py-3 space-y-2">
      <div className="h-2.5 w-12 bg-accent rounded" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="h-3 w-32 bg-accent rounded" />
          <div className="h-3 w-16 bg-accent rounded" />
        </div>
      ))}
    </div>
  </div>
)
