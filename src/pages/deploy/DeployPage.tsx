import { useEffect, useState } from 'react'
import { Container } from 'lucide-react'
import { listServicesByImage } from '@/client/coolify/requests'
import { ServicesByImageMap } from '@/client/coolify'
import { PageHeader, Search } from '@/components'
import { ImageCard, ImageCardSkeleton } from './components/ImageCard'

export const DeployPage: React.FC = () => {
  const [data, setData] = useState<ServicesByImageMap | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    listServicesByImage().then((res) => {
      if (res) setData(res)
    })
  }, [])

  const loading = data === null

  const entries = Object.entries(data ?? {}).filter(([imageName]) =>
    imageName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deploy"
        subtitle="Panoramica delle immagini in esecuzione e delle loro versioni."
      />

      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />
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
            <ImageCard key={imageName} imageName={imageName} versions={versions} />
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
  )
}
