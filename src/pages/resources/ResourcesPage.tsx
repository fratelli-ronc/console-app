import { useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { RefreshCw, Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/store'
import { PageHeader, Search } from '@/components'
import { ResourceCard, ResourceCardSkeleton } from './components/ResourceCard'

export const ResoucesPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const { state } = useLocation()

  const snapshot = useDashboardStore((s) => s.snapshot)
  const connected = useDashboardStore((s) => s.connected)
  const reconnect = useDashboardStore((s) => s.reconnect)

  const [search, setSearch] = useState('')

  const serverSnapshot = snapshot?.servers.find((ss) => ss.server.uuid === uuid)
  const serverName =
    serverSnapshot?.server.name ?? state?.serverName ?? uuid ?? ''
  const resources = serverSnapshot?.resources ?? []
  const loading = snapshot === null

  const filtered = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.image.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risorse"
        subtitle={`Applicazioni e servizi in esecuzione su ${serverName}.`}
      />

      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <button
          onClick={reconnect}
          className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} className={cn(!connected && 'animate-spin')} />
          {connected ? 'Aggiorna' : 'Riconnetti'}
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
