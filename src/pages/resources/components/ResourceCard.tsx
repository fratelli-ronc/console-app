import { useEffect, useRef, useState } from 'react'
import { Box, MoreVertical, Play, RotateCcw, Square } from 'lucide-react'
import { ServerResouce } from '@/client/coolify'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'

const resourceStatusConfig: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  'running:healthy': {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Running',
  },
  'running:unknown': {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    label: 'Running',
  },
  'running:unhealthy': {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Degradato',
  },
}

const fallbackResourceStatus = {
  dot: 'bg-zinc-400',
  badge: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  label: 'Sconosciuto',
}

interface ResourceCardProps {
  resource: ServerResouce
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const cfg = resourceStatusConfig[resource.status] ?? fallbackResourceStatus

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
          <StatusBadge dot={cfg.dot} badge={cfg.badge} label={cfg.label} />

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-popover border border-border rounded-lg shadow-lg text-sm py-1 overflow-hidden">
                {[
                  { label: 'Stop', key: 'edit', icon: Square },
                  { label: 'Run', key: 'restart', icon: Play },
                  { label: 'Riavvia', key: 'remove', icon: RotateCcw },
                ].map(({ label, key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-2',
                      key === 'remove' &&
                        'text-destructive hover:bg-destructive/10',
                    )}
                  >
                    <Icon className="relative bottom-px" size={13} />
                    {label}
                  </button>
                ))}
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
