import { useState } from 'react'
import { RefreshCw, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServerStatus } from '@/client/coolify'
import { useDashboardStore } from '@/store'
import { ServerCard, ServerCardSkeleton } from './components/ServerCard'
import { PageHeader, Search } from '@/components'

export const ServersPage: React.FC = () => {
  const snapshot = useDashboardStore((s) => s.snapshot)
  const connected = useDashboardStore((s) => s.connected)

  const reconnect = useDashboardStore((s) => s.reconnect)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ServerStatus | 'all'>('all')

  const loading = snapshot === null

  const filtered = (snapshot?.servers ?? [])
    .filter((ss) => {
      const { server } = ss
      const matchesSearch =
        server.name.toLowerCase().includes(search.toLowerCase()) ||
        server.ip.includes(search)
      const matchesStatus =
        statusFilter === 'all' ||
        (server.isReachable ? 'online' : 'offline') === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => (a.server.ip > b.server.ip ? 1 : -1))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Server"
        subtitle="Gestisci i tuoi Docker host e connettiti ai loro container."
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

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
          onClick={reconnect}
          className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} className={cn(!connected && 'animate-spin')} />
          {connected ? 'Aggiorna' : 'Riconnetti'}
        </button>
      </div>

      {/* Server grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServerCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ss) => (
            <ServerCard key={ss.server.uuid} snapshot={ss} />
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
