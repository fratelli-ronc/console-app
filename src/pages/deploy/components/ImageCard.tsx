import { Container } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServicesByVersionMap } from '@/client/coolify'
import {
  resourceStatusConfig,
  fallbackResourceStatus,
} from '@/data/statusConfig'

interface ImageCardProps {
  imageName: string
  versions: ServicesByVersionMap
}

export const ImageCard: React.FC<ImageCardProps> = ({
  imageName,
  versions,
}) => {
  const shortName = imageName.includes('/')
    ? imageName.split('/').pop()!
    : imageName
  const registry = imageName.includes('/') ? imageName.split('/')[0] : undefined
  const versionEntries = Object.entries(versions).sort(([a], [b]) =>
    b.localeCompare(a),
  )

  return (
    <div className="bg-card border border-border rounded-xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-3">
        <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
          <Container size={18} className="text-primary" />
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
            {shortName}
          </h3>
          {registry && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
              {registry}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border mx-5" />

      {/* Versions */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {versionEntries.map(([version, services]) => (
          <div key={version}>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-primary text-xs font-mono font-semibold">
                {version}
              </span>
              <span className="text-xs text-muted-foreground">
                {services.length}{' '}
                {services.length === 1 ? 'istanza' : 'istanze'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 pl-1">
              {services.map((svc) => {
                const config =
                  resourceStatusConfig[svc.status] ?? fallbackResourceStatus
                return (
                  <div
                    key={svc.uuid}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-foreground truncate">
                        {svc.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {svc.serverName}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          config.dot,
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {config.label}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ImageCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-xl animate-pulse">
    <div className="px-5 pt-5 pb-4 flex items-start gap-3">
      <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-accent" />
      <div className="min-w-0 space-y-2 pt-0.5">
        <div className="h-3.5 w-36 bg-accent rounded" />
        <div className="h-3 w-28 bg-accent rounded" />
      </div>
    </div>
    <div className="border-t border-border mx-5" />
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-14 bg-accent rounded-md" />
        <div className="h-3 w-16 bg-accent rounded" />
      </div>
      <div className="flex flex-col gap-1.5 pl-1">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-28 bg-accent rounded" />
            <div className="h-3 w-16 bg-accent rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
)
