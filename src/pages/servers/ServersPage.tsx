import { useEffect, useState } from 'react'
import { Search, RefreshCw, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Server as ServerModel, ServerStatus } from '@/client/coolify'
import { getServers } from '@/client/coolify/requests'
import { ServerCard, ServerCardSkeleton } from './components/ServerCard'
import { PageHeader } from '@/components'

export const ServersPage: React.FC = () => {
  const [servers, setServers] = useState<ServerModel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ServerStatus | 'all'>('all')

  const fetchServers = async () => {
    setLoading(true)
    try {
      const data = await getServers()
      setServers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  const filtered = servers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ip.includes(search)
    const matchesStatus =
      statusFilter === 'all' ||
      (s.isReachable ? 'online' : 'offline') === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Server"
        subtitle="Gestisci i tuoi Docker host e connettiti ai loro container."
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />

          <input
            type="text"
            placeholder="Cerca server…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground transition"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
          {(['all', 'online', 'offline'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                statusFilter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'all' ? 'Tutti' : f === 'online' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>

        <button
          onClick={fetchServers}
          className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Aggiorna
        </button>
      </div>

      {/* Server grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ServerCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((server) => (
            <ServerCard key={server.uuid} server={server} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Server size={22} className="text-primary" />
          </div>

          <p className="text-sm font-medium text-foreground">
            Nessun server trovato
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Prova a modificare la ricerca o i filtri.
          </p>
        </div>
      )}
    </div>
  )
}
