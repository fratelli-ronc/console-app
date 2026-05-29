import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Search, RefreshCw, Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServerResouce } from '@/client/coolify'
import { getServerResouces } from '@/client/coolify/requests'
import { PageHeader } from '@/components'
import { ResourceCard, ResourceCardSkeleton } from './components/ResourceCard'

export const ResoucesPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const { state } = useLocation()
  const serverName: string = state?.serverName ?? uuid ?? ''

  const [resources, setResources] = useState<ServerResouce[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchResources = async () => {
    if (!uuid) return
    setLoading(true)
    try {
      const data = await getServerResouces(uuid)
      setResources(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [uuid])

  const filtered = resources.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risorse"
        subtitle={`Applicazioni e servizi in esecuzione su ${serverName}.`}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />

          <input
            type="text"
            placeholder="Cerca risorsa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground transition"
          />
        </div>

        <button
          onClick={fetchResources}
          className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Aggiorna
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((resource) => (
            <ResourceCard key={resource.uuid} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Box size={22} className="text-primary" />
          </div>

          <p className="text-sm font-medium text-foreground">
            Nessuna risorsa trovata
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Prova a modificare la ricerca o controlla il server.
          </p>
        </div>
      )}
    </div>
  )
}
