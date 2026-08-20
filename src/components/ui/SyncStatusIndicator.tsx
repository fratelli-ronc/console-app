import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getSyncStatus, SyncNodeStatus } from '@/client'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard'
import { StatusBadge } from './StatusBadge'

const POLL_INTERVAL_MS = 30_000

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

export const SyncStatusIndicator: React.FC = () => {
  const [nodes, setNodes] = useState<SyncNodeStatus[] | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchStatus = async () => {
      const res = await getSyncStatus()
      if (!cancelled && res) setNodes(res)
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (nodes === null) return null

  const failingNodes = nodes.filter((n) => n.failing.length > 0)
  const inProgressNodes = nodes.filter((n) => !n.bootstrapped || n.pending > 0)
  const problemNodes = nodes.filter(
    (n) => !n.bootstrapped || n.failing.length > 0,
  )
  const healthy = failingNodes.length === 0 && inProgressNodes.length === 0

  const dot =
    failingNodes.length > 0
      ? 'bg-destructive'
      : healthy
        ? 'bg-primary'
        : 'bg-secondary'
  const badge =
    failingNodes.length > 0
      ? 'border-destructive/30 text-destructive bg-destructive/10'
      : healthy
        ? 'border-primary/30 text-primary bg-primary/10'
        : 'border-secondary/30 text-secondary-foreground bg-secondary/10'
  const label =
    failingNodes.length > 0
      ? `Sync: ${failingNodes.length} ${failingNodes.length === 1 ? 'nodo' : 'nodi'} con errori`
      : healthy
        ? 'Sync: OK'
        : 'Sync: in corso'

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="cursor-pointer">
          <StatusBadge dot={dot} badge={badge} label={label} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-96">
        <p className="text-sm font-semibold text-foreground">
          Stato sincronizzazione nodi
        </p>

        {problemNodes.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Nessun problema rilevato: tutti i nodi sono allineati.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {problemNodes.map((node) => (
              <div
                key={node.name}
                className="border-t border-border pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {node.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      !node.bootstrapped
                        ? 'text-muted-foreground'
                        : node.failing.length > 0
                          ? 'text-destructive'
                          : 'text-primary',
                    )}
                  >
                    {!node.bootstrapped
                      ? 'Non inizializzato'
                      : node.failing.length > 0
                        ? `${node.failing.length} ${node.failing.length === 1 ? 'errore' : 'errori'}`
                        : 'OK'}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {node.pending} operazioni in coda
                </p>

                {node.failing.map((op) => (
                  <div
                    key={op.id}
                    className="mt-1.5 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1.5"
                  >
                    <p className="text-xs font-medium text-destructive">
                      Utente #{op.userId} · {op.eventType}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {op.lastError}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      {op.attempts} tentativi · {formatDate(op.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
