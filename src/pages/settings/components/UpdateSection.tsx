import { useEffect } from 'react'
import {
  CircleAlert,
  CircleCheck,
  CircleArrowUp,
  Download,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilledButton, OutlinedButton } from '@/components'
import { useUpdater } from '@/hooks'

/** Best-effort format for the updater's `date` field (`2024-01-01 12:00:00.0 +00:00:00`). */
function formatReleaseDate(raw?: string): string | null {
  if (!raw) return null
  const normalized = raw
    .replace(' ', 'T')
    .replace(/\.\d+/, '')
    .replace(/\s*\+00:00:00$/, 'Z')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export const UpdateSection: React.FC = () => {
  const {
    currentVersion,
    update,
    phase,
    progress,
    error,
    checkForUpdate,
    installUpdate,
  } = useUpdater()

  useEffect(() => {
    checkForUpdate()
  }, [checkForUpdate])

  const checking = phase === 'checking'
  const installing = phase === 'downloading' || phase === 'installed'
  const releaseDate = formatReleaseDate(update?.date)

  return (
    <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Aggiornamenti</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controlla la versione installata e installa gli aggiornamenti
          disponibili.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg border border-border bg-muted/40">
        <div>
          <p className="text-sm font-medium text-foreground">Versione attuale</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentVersion ?? '—'}
          </p>
        </div>
        <OutlinedButton
          type="button"
          disabled={checking || installing}
          onClick={() => checkForUpdate()}
          className="inline-flex items-center gap-2 shrink-0"
        >
          <RefreshCw size={16} className={cn(checking && 'animate-spin')} />
          {checking ? 'Verifica in corso…' : 'Controlla aggiornamenti'}
        </OutlinedButton>
      </div>

      {phase === 'up-to-date' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck size={16} className="text-primary shrink-0" />
          Stai usando l'ultima versione disponibile.
        </div>
      )}

      {phase === 'error' && error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {update && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <CircleArrowUp size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Nuova versione disponibile:{' '}
                <span className="font-semibold">{update.version}</span>
              </p>
              {releaseDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pubblicata il {releaseDate}
                </p>
              )}
            </div>
          </div>

          {update.body && (
            <p className="text-xs text-muted-foreground whitespace-pre-line max-h-40 overflow-y-auto">
              {update.body}
            </p>
          )}

          {installing && (
            <div className="h-1.5 w-full rounded-full bg-primary/15 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <FilledButton
            type="button"
            disabled={installing}
            onClick={installUpdate}
            className="inline-flex items-center justify-center gap-2 w-full"
          >
            <Download size={16} />
            {installing
              ? `Download e installazione… ${progress}%`
              : `Installa la versione ${update.version} e riavvia`}
          </FilledButton>
        </div>
      )}
    </div>
  )
}
