import { useState } from 'react'
import { Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServerStatus } from '@/client/coolify'
import { useInfraStore } from '@/store'
import { ServerCard, ServerCardSkeleton } from './components/ServerCard'
import { PageHeader, Search } from '@/components'

export const ServersPage: React.FC = () => {
  const snapshot = useInfraStore((s) => s.snapshot)
  const connected = useInfraStore((s) => s.connected)

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
                'px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize cursor-pointer',
                statusFilter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'all' ? 'Tutti' : f === 'online' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>

        <div
          className={cn(
            'ml-auto h-7 px-2.5 inline-flex items-center gap-1.5 text-xs rounded-lg border',
            connected
              ? 'border-green-500/30 bg-green-500/10 text-green-700'
              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse',
            )}
          />
          {connected ? 'Live' : 'Riconnessione...'}
        </div>
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
