import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, MoreVertical, Play, RotateCcw, Square } from 'lucide-react'
import {
  requestRestartResource,
  requestStartResource,
  requestStopResource,
  ServerResouce,
} from '@/client/coolify'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components'
import { resourceStatusConfig, fallbackResourceStatus } from '@/data'
import { optimisticallySetResourceStatus } from '@/store/infraStore'

export const RUNNING_STATUSES = new Set([
  'running:healthy',
  'running:unknown',
  'running:unhealthy',
])

export function getDisabledActions(status: string): Set<string> {
  if (RUNNING_STATUSES.has(status)) return new Set(['start'])
  if (status === 'exited') return new Set(['stop', 'restart'])
  // transient states: stopping, restarting, starting:*
  return new Set(['stop', 'start', 'restart'])
}

interface ResourceCardProps {
  resource: ServerResouce
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const cfg = resourceStatusConfig[resource.status] ?? fallbackResourceStatus
  const disabledActions = getDisabledActions(resource.status)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleResourceAction = useCallback(
    async (key: string) => {
      switch (key) {
        case 'stop':
          optimisticallySetResourceStatus(resource.uuid, 'stopping')
          await requestStopResource(resource.uuid)
          break
        case 'start':
          optimisticallySetResourceStatus(resource.uuid, 'starting:unhealthy')
          await requestStartResource(resource.uuid)
          break
        case 'restart':
          optimisticallySetResourceStatus(resource.uuid, 'restarting')
          await requestRestartResource(resource.uuid)
          break
      }
    },
    [resource],
  )

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <Box size={18} className="text-primary" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
              {resource.name}
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {resource.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            dot={cfg.dot}
            badge={cfg.badge}
            label={cfg.label}
            pending={cfg.pending}
            spinnerColor={cfg.spinnerColor}
          />

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-popover border border-border rounded-lg shadow-lg text-sm py-1 overflow-hidden">
                {[
                  { label: 'Stop', key: 'stop', icon: Square },
                  { label: 'Start', key: 'start', icon: Play },
                  { label: 'Riavvia', key: 'restart', icon: RotateCcw },
                ].map(({ label, key, icon: Icon }) => {
                  const disabled = disabledActions.has(key)
                  return (
                    <button
                      key={key}
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!disabled) handleResourceAction(key)
                        setMenuOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer',
                        key === 'stop' &&
                          'text-destructive hover:bg-destructive/10',
                        disabled &&
                          'opacity-40 cursor-not-allowed hover:bg-transparent',
                      )}
                    >
                      <Icon className="relative bottom-px" size={13} />
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border mx-5" />

      <div className="px-5 py-4 flex items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            Immagine
          </span>
          <span className="text-sm font-semibold text-foreground">
            {resource.image.split('/').at(-1)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 ml-auto text-right">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            Aggiornato
          </span>
          <span className="text-xs text-muted-foreground">
            {`${new Date(resource.updatedAt).toLocaleDateString('it-IT')} ${new Date(resource.updatedAt).toLocaleTimeString('it-IT')}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export const ResourceCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-xl animate-pulse">
    <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-accent" />
        <div className="min-w-0 space-y-2 pt-0.5">
          <div className="h-3.5 w-40 bg-accent rounded" />
          <div className="h-3 w-28 bg-accent rounded" />
        </div>
      </div>
      <div className="h-5 w-24 bg-accent rounded-full shrink-0" />
    </div>
    <div className="border-t border-border mx-5" />
    <div className="px-5 py-4.75 flex items-center gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="h-2.5 w-8 bg-accent rounded" />
        <div className="h-4 w-14 bg-accent rounded" />
      </div>
      <div className="flex flex-col gap-1.5 ml-auto items-end">
        <div className="h-2.5 w-16 bg-accent rounded" />
        <div className="h-3 w-20 bg-accent rounded" />
      </div>
    </div>
  </div>
)
