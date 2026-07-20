import { useEffect, useState } from 'react'
import { Container, Copy, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listServicesByImage } from '@/client/coolify/requests'
import { ServicesByImageMap } from '@/client/coolify'
import { PageHeader, Search, FilledButton } from '@/components'
import { ImageCard, ImageCardSkeleton } from './components/ImageCard'
import { ImageDetailDialog } from './components/ImageDetailDialog'
import { UpdateImageDialog } from './components/UpdateImageDialog'
import { CloneDialog } from './components/CloneDialog'
import { useUpdateImageStore } from './store/updateImageStore'

export const DeployPage: React.FC = () => {
  const [data, setData] = useState<ServicesByImageMap | null>(null)
  const [search, setSearch] = useState('')
  const [cloneOpen, setCloneOpen] = useState(false)
  const [reloading, setReloading] = useState(false)
  const updateCompletedAt = useUpdateImageStore((s) => s.completedAt)

  const fetchData = async () => {
    const res = await listServicesByImage()
    if (res) setData(res)
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchData()
    setReloading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (updateCompletedAt !== null) fetchData()
  }, [updateCompletedAt])

  const loading = data === null

  const entries = Object.entries(data ?? {}).filter(([imageName]) =>
    imageName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <ImageDetailDialog />

      <UpdateImageDialog />

      <CloneDialog open={cloneOpen} onOpenChange={setCloneOpen} />

      <div className="space-y-6">
        <PageHeader
          title="Deploy"
          subtitle="Panoramica delle immagini in esecuzione e delle loro versioni."
        />

        <div className="flex items-center gap-3">
          <Search value={search} onChange={setSearch} />

          <FilledButton
            type="button"
            className="flex items-center gap-2"
            onClick={() => setCloneOpen(true)}
          >
            <Copy size={16} />
            Clona su nuovo server
          </FilledButton>

          <button
            onClick={handleReload}
            className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={cn(reloading && 'animate-spin')} />
            Aggiorna
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ImageCardSkeleton key={i} />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {entries.map(([imageName, versions]) => (
              <ImageCard
                key={imageName}
                imageName={imageName}
                versions={versions}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
              <Container size={22} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Nessuna immagine trovata
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Prova a modificare la ricerca.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
