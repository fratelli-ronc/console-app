import { Box } from 'lucide-react'
import { ServerResouce } from '@/client/coolify'
import { cn } from '@/lib/utils'

const statusLabel: Record<string, string> = {
  'running:healthy': 'In esecuzione',
  'running:unknown': 'In esecuzione',
  'running:unhealthy': 'Degradato',
}

const statusStyles: Record<string, { dot: string; badge: string }> = {
  'running:healthy': {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  'running:unknown': {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  'running:unhealthy': {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
}

const fallbackStyle = {
  dot: 'bg-zinc-400',
  badge: 'bg-zinc-50 text-zinc-600 border-zinc-200',
}

interface ResourceCardProps {
  resource: ServerResouce
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const style = statusStyles[resource.status] ?? fallbackStyle
  const label = statusLabel[resource.status] ?? resource.status

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
              {resource.uuid}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0',
            style.badge,
          )}
        >
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)}
          />
          {label}
        </span>
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
