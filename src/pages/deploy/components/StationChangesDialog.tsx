import { Fragment, useEffect, useRef, useState } from 'react'
import { RotateCcw, Undo2, UploadCloud } from 'lucide-react'
import {
  getRevertPreview,
  getStationChanges,
  getStationPendingDiff,
  type ChangeSet,
  type ConfigVersion,
  type PendingEntityChange,
  type RevertPreviewOutcome,
  type Station,
  type StationDeploymentStatus,
  type StationPendingDiff,
} from '@/client'
import {
  ChangeSetCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FilledButton,
  FilterPills,
  OutlinedButton,
  TextButton,
} from '@/components'
import { formatDateTime, userLabel, type ChangeNames } from '@/lib/changeLog'
import { ChangeList, Loading, Notice } from './ChangeDiff'
import { RevertPreviewView, VersionsView } from './ConfigVersionsView'

type View = 'diff' | 'history' | 'versions'

const VIEW_TITLES: Record<View, string> = {
  diff: 'Modifiche da distribuire',
  history: 'Cronologia modifiche',
  versions: 'Versioni distribuite',
}

interface StationChangesDialogProps {
  // The station shown; null keeps the dialog closed.
  station: Station | null
  status: StationDeploymentStatus | undefined
  names: ChangeNames
  currentUsername: string | undefined
  canDeploy: boolean
  // The station's pending changes can be discarded: it has some, and its
  // last deploy is known.
  canDiscard: boolean
  // A deploy or a discard of the station is running.
  busy: boolean
  onDeploy: () => void
  // Brings the station back to its last deploy, once confirmed.
  onDiscard: () => void
  // Reverts the station to version and deploys it; force confirms the
  // warnings the preview showed.
  onRevert: (version: ConfigVersion, force: boolean) => void
  onClose: () => void
}

// A station's changes. For one with changes pending, it reviews what
// deploying it would ship - the net difference from its last deploy,
// entity by entity - next to its history; otherwise it opens on the
// history: every change set, newest first, the last deploy marked among
// them. The versions tab lists the configs its deploys shipped, to
// download or to revert to, after previewing what the revert would do.
export const StationChangesDialog: React.FC<StationChangesDialogProps> = ({
  station,
  status,
  names,
  currentUsername,
  canDeploy,
  canDiscard,
  busy,
  onDeploy,
  onDiscard,
  onRevert,
  onClose,
}) => {
  const [view, setView] = useState<View>('diff')
  const [diff, setDiff] = useState<StationPendingDiff | null>(null)
  const [sets, setSets] = useState<ChangeSet[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  // The version being previewed for a revert, and the preview once loaded.
  const [reviewed, setReviewed] = useState<ConfigVersion | null>(null)
  const [preview, setPreview] = useState<RevertPreviewOutcome | null>(null)

  // Keeps showing the last station while the dialog animates closed.
  const last = useRef({ station, status })
  if (station) last.current = { station, status }
  const shown = last.current.station
  const shownStatus = last.current.status

  const stationId = station?.id
  const pending = status?.status === 'pending'
  const reviewing = shownStatus?.status === 'pending'

  useEffect(() => {
    if (stationId == null) return
    setView(pending ? 'diff' : 'history')
    setDiff(null)
    setSets(null)
    setHasMore(false)
    setReviewed(null)
    if (!pending) return

    let active = true
    getStationPendingDiff(stationId).then((res) => {
      if (!active || !res) return
      setDiff(res)
      // Without a known deploy there is no difference to show, only the
      // changes logged so far.
      if (!res.complete) setView('history')
    })
    return () => {
      active = false
    }
  }, [stationId, pending])

  // The chronology loads the first time it is shown.
  useEffect(() => {
    if (view !== 'history' || stationId == null || sets !== null) return
    let active = true
    getStationChanges(stationId).then((res) => {
      if (!active || !res) return
      setSets(res.changeSets)
      setHasMore(res.hasMore)
    })
    return () => {
      active = false
    }
  }, [view, stationId, sets])

  const reviewedId = reviewed?.id
  useEffect(() => {
    setPreview(null)
    if (stationId == null || reviewedId == null) return
    let active = true
    getRevertPreview(stationId, reviewedId).then((res) => {
      if (!active) return
      if (res) setPreview(res)
      // Any other failure was toasted: back to the list.
      else setReviewed(null)
    })
    return () => {
      active = false
    }
  }, [stationId, reviewedId])

  const loadMore = async () => {
    if (stationId == null || !sets?.length) return
    setLoadingMore(true)
    const res = await getStationChanges(stationId, {
      before: sets[sets.length - 1].id,
    })
    setLoadingMore(false)
    if (!res) return
    setSets([...sets, ...res.changeSets])
    setHasMore(res.hasMore)
  }

  const viewOptions: { label: string; value: View }[] = [
    ...(reviewing ? [{ label: 'Differenze', value: 'diff' as const }] : []),
    { label: 'Cronologia', value: 'history' },
    { label: 'Versioni', value: 'versions' },
  ]

  const changeView = (next: View) => {
    setView(next)
    setReviewed(null)
  }

  const lastDeploy =
    shownStatus?.lastDeployedAt &&
    `${reviewing ? 'Rispetto alla' : 'Ultima'} distribuzione del ${formatDateTime(shownStatus.lastDeployedAt)}${
      shownStatus.lastDeployedBy
        ? ` di ${userLabel(shownStatus.lastDeployedBy, shownStatus.lastDeployedByUserId!, currentUsername)}`
        : ''
    }.`

  const previewing = view === 'versions' && reviewed !== null

  return (
    <Dialog open={station !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {VIEW_TITLES[view]} — {shown?.name || `ID ${shown?.stationId}`}
          </DialogTitle>
          <DialogDescription>
            {lastDeploy || 'La stazione non è mai stata distribuita.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex">
          <FilterPills
            options={viewOptions}
            value={view}
            onChange={changeView}
          />
        </div>

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {view === 'diff' && (
            <DiffView
              diff={diff}
              names={names}
              currentUsername={currentUsername}
            />
          )}
          {view === 'history' && (
            <HistoryView
              sets={sets}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
              deployedThrough={shownStatus?.deployedThroughChangeSetId ?? null}
              lastDeployedAt={shownStatus?.lastDeployedAt ?? null}
              names={names}
              currentUsername={currentUsername}
            />
          )}
          {view === 'versions' &&
            shown &&
            (reviewed ? (
              <RevertPreviewView
                version={reviewed}
                outcome={preview}
                names={names}
                currentUsername={currentUsername}
                onBack={() => setReviewed(null)}
              />
            ) : (
              <VersionsView
                stationId={shown.id}
                businessId={shown.stationId}
                pending={reviewing}
                busy={busy}
                currentUsername={currentUsername}
                onReview={setReviewed}
              />
            ))}
        </div>

        <DialogFooter>
          {previewing ? (
            <>
              <TextButton type="button" onClick={() => setReviewed(null)}>
                Indietro
              </TextButton>
              <FilledButton
                type="button"
                className="inline-flex items-center gap-2"
                disabled={preview?.kind !== 'preview' || busy}
                onClick={() => {
                  if (preview?.kind !== 'preview') return
                  onRevert(reviewed, preview.preview.warnings.length > 0)
                }}
              >
                <RotateCcw size={16} />
                Ripristina e distribuisci
              </FilledButton>
            </>
          ) : (
            <>
              <TextButton type="button" onClick={onClose}>
                Chiudi
              </TextButton>
              {reviewing && (
                <OutlinedButton
                  type="button"
                  className="inline-flex items-center gap-2"
                  disabled={!canDiscard || busy}
                  onClick={onDiscard}
                >
                  <Undo2 size={16} />
                  Scarta modifiche
                </OutlinedButton>
              )}
              <FilledButton
                type="button"
                className="inline-flex items-center gap-2"
                disabled={!canDeploy}
                onClick={onDeploy}
              >
                <UploadCloud size={16} />
                Distribuisci
              </FilledButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DiffViewProps {
  diff: StationPendingDiff | null
  names: ChangeNames
  currentUsername: string | undefined
}

const DiffView: React.FC<DiffViewProps> = ({
  diff,
  names,
  currentUsername,
}) => {
  if (!diff) return <Loading />
  if (!diff.complete) {
    return (
      <Notice>
        La stazione non è stata distribuita da quando è attivo il registro delle
        modifiche, quindi non si può sapere cosa contiene l'ultima
        distribuzione. Nella cronologia trovi le modifiche registrate finora.
      </Notice>
    )
  }
  if (diff.changes.length === 0) {
    return (
      <Notice>
        Nessuna differenza rispetto all'ultima distribuzione: le modifiche fatte
        nel frattempo si annullano a vicenda.
      </Notice>
    )
  }

  const authors = (change: PendingEntityChange) =>
    `${change.userIds
      .map((id) =>
        userLabel(
          change.users.find((u) => u.id === id) ?? null,
          id,
          currentUsername,
        ),
      )
      .join(', ')} · ${formatDateTime(change.lastChangedAt)}`

  return (
    <ChangeList
      changes={diff.changes}
      names={names}
      labels={{ before: 'Distribuito', after: 'Attuale' }}
      meta={authors}
    />
  )
}

interface HistoryViewProps {
  sets: ChangeSet[] | null
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  // The newest change set the last deploy shipped, and when it ran.
  deployedThrough: number | null
  lastDeployedAt: string | null
  names: ChangeNames
  currentUsername: string | undefined
}

const HistoryView: React.FC<HistoryViewProps> = ({
  sets,
  hasMore,
  loadingMore,
  onLoadMore,
  deployedThrough,
  lastDeployedAt,
  names,
  currentUsername,
}) => {
  if (!sets) return <Loading />
  if (sets.length === 0) {
    return (
      <Notice>
        Nessuna modifica registrata per questa stazione. Il registro tiene
        traccia delle modifiche solo da quando è stato attivato.
      </Notice>
    )
  }

  // The last deploy goes above the newest change set it shipped.
  const deployedFrom =
    deployedThrough == null
      ? -1
      : sets.findIndex((set) => set.id <= deployedThrough)

  return (
    <div className="space-y-3 pb-1">
      <ol className="space-y-3">
        {sets.map((set, index) => (
          <Fragment key={set.id}>
            {index === deployedFrom && (
              <DeployMarker lastDeployedAt={lastDeployedAt} />
            )}
            <ChangeSetCard
              set={set}
              names={names}
              currentUsername={currentUsername}
            />
          </Fragment>
        ))}
      </ol>
      {hasMore && (
        <div className="flex justify-center">
          <OutlinedButton
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? 'Caricamento…' : 'Carica modifiche precedenti'}
          </OutlinedButton>
        </div>
      )}
    </div>
  )
}

// Where the last deploy falls in the history: what is above it is pending.
const DeployMarker: React.FC<{ lastDeployedAt: string | null }> = ({
  lastDeployedAt,
}) => (
  <li className="flex items-center gap-3 text-xs text-muted-foreground">
    <span className="h-px flex-1 bg-border" />
    <span className="inline-flex items-center gap-1.5 font-medium">
      <UploadCloud size={12} />
      Ultima distribuzione
      {lastDeployedAt && ` · ${formatDateTime(lastDeployedAt)}`}
    </span>
    <span className="h-px flex-1 bg-border" />
  </li>
)
