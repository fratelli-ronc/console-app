import {
  CircleFadingArrowUp,
  Container,
  Info,
  TriangleAlert,
  CircleCheck,
} from 'lucide-react'
import { ServicesByVersionMap } from '@/client/coolify'
import { useImageDetailStore } from '../store/imageDetailStore'
import { useUpdateImageStore } from '../store/updateImageStore'

interface ImageCardProps {
  imageName: string
  versions: ServicesByVersionMap
}

function isHealthy(status: string): boolean {
  return status === 'running:healthy' || status === 'running:unknown'
}

export const ImageCard: React.FC<ImageCardProps> = ({
  imageName,
  versions,
}) => {
  const openDialog = useImageDetailStore((s) => s.open)
  const openUpdateDialog = useUpdateImageStore((s) => s.open)

  const shortName = imageName.includes('/')
    ? imageName.split('/').pop()!
    : imageName
  const registry = imageName.includes('/')
    ? imageName.split('/')[0]
    : 'official'
  const versionEntries = Object.entries(versions).sort(([a], [b]) =>
    b.localeCompare(a),
  )

  return (
    <div className="bg-card border border-border rounded-xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex justify-between items-center">
        <div className="flex items-start gap-3">
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

        <button
          onClick={() => openUpdateDialog(imageName, versions)}
          className="ml-1 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <CircleFadingArrowUp size={20} />
        </button>
      </div>

      <div className="border-t border-border mx-5" />

      {/* Versions */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {versionEntries.map(([version, services]) => {
          const healthy = services.every((s) => isHealthy(s.status))
          return (
            <div key={version} className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent text-primary text-xs font-mono font-semibold">
                {version}
              </span>
              <span className="text-xs text-muted-foreground">
                {services.length}{' '}
                {services.length === 1 ? 'istanza' : 'istanze'}
              </span>
              <span className="flex items-center gap-1 ml-auto shrink-0">
                {healthy ? (
                  <CircleCheck size={13} className="text-green-500" />
                ) : (
                  <TriangleAlert
                    size={13}
                    className="text-yellow-500 relative bottom-px"
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {healthy ? 'In esecuzione' : 'Attenzione'}
                </span>
              </span>
              <button
                onClick={() => openDialog(imageName, version, services)}
                className="ml-1 p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Info size={13} />
              </button>
            </div>
          )
        })}
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
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-5 w-14 bg-accent rounded-md" />
          <div className="h-3 w-16 bg-accent rounded" />
          <div className="h-3 w-20 bg-accent rounded ml-auto" />
          <div className="h-5 w-5 bg-accent rounded-md" />
        </div>
      ))}
    </div>
  </div>
)
