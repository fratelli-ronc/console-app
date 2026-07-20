import { useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Box, Loader2, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInfraStore, optimisticallySetResourceStatus } from '@/store'
import {
  requestStartResource,
  requestStopResource,
  ServerResouce,
} from '@/client/coolify'
import { PageHeader, Search } from '@/components'
import {
  ResourceCard,
  ResourceCardSkeleton,
  getDisabledActions,
} from './components/ResourceCard'
import { OutlinedButton } from '@/components'

const BULK_ACTION_DELAY_MS = 500

async function runBulkAction(
  resources: ServerResouce[],
  action: (resource: ServerResouce) => Promise<void>,
  onProgress: (done: number, total: number) => void,
) {
  for (let i = 0; i < resources.length; i++) {
    await action(resources[i])
    onProgress(i + 1, resources.length)
    if (i < resources.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, BULK_ACTION_DELAY_MS))
    }
  }
}

export const ResoucesPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const { state } = useLocation()

  const snapshot = useInfraStore((s) => s.snapshot)
  const connected = useInfraStore((s) => s.connected)

  const [search, setSearch] = useState('')
  const [startAllProgress, setStartAllProgress] = useState<{
    done: number
    total: number
  } | null>(null)
  const [stopAllProgress, setStopAllProgress] = useState<{
    done: number
    total: number
  } | null>(null)

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

  const startableResources = resources.filter(
    (r) => !getDisabledActions(r.status).has('start'),
  )
  const stoppableResources = resources.filter(
    (r) => !getDisabledActions(r.status).has('stop'),
  )
  const startingAll = startAllProgress !== null
  const stoppingAll = stopAllProgress !== null
  const bulkActionInProgress = startingAll || stoppingAll

  const handleStartAll = async () => {
    if (bulkActionInProgress || startableResources.length === 0) return

    setStartAllProgress({ done: 0, total: startableResources.length })
    await runBulkAction(
      startableResources,
      async (resource) => {
        optimisticallySetResourceStatus(resource.uuid, 'starting:unhealthy')
        await requestStartResource(resource.uuid)
      },
      (done, total) => setStartAllProgress({ done, total }),
    )
    setStartAllProgress(null)
  }

  const handleStopAll = async () => {
    if (bulkActionInProgress || stoppableResources.length === 0) return

    setStopAllProgress({ done: 0, total: stoppableResources.length })
    await runBulkAction(
      stoppableResources,
      async (resource) => {
        optimisticallySetResourceStatus(resource.uuid, 'stopping')
        await requestStopResource(resource.uuid)
      },
      (done, total) => setStopAllProgress({ done, total }),
    )
    setStopAllProgress(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risorse"
        subtitle={`Applicazioni e servizi in esecuzione su ${serverName}.`}
      />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <Search value={search} onChange={setSearch} />

          <OutlinedButton
            type="button"
            className="flex items-center gap-2"
            disabled={bulkActionInProgress || startableResources.length === 0}
            onClick={handleStartAll}
          >
            {startingAll ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Avvio {startAllProgress.done}/{startAllProgress.total}
              </>
            ) : (
              <>
                <Play size={16} />
                Avvia tutti
              </>
            )}
          </OutlinedButton>

          <OutlinedButton
            type="button"
            className="flex items-center gap-2"
            disabled={bulkActionInProgress || stoppableResources.length === 0}
            onClick={handleStopAll}
          >
            {stoppingAll ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Arresto {stopAllProgress.done}/{stopAllProgress.total}
              </>
            ) : (
              <>
                <Square size={16} />
                Ferma tutti
              </>
            )}
          </OutlinedButton>
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
