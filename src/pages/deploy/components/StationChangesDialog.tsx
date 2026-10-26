import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Info, UploadCloud } from 'lucide-react'
import {
  getStationChanges,
  getStationPendingDiff,
  type ChangeSet,
  type EntityChange,
  type PendingEntityChange,
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
  StatusBadge,
  TextButton,
} from '@/components'
import {
  ENTITY_NOUNS,
  agree,
  entityLabel,
  fieldLabel,
  formatChangeValue,
  formatDateTime,
  userLabel,
  type ChangeNames,
} from '@/lib/changeLog'
import { cn } from '@/lib/utils'

type View = 'diff' | 'history'

const VIEW_OPTIONS: { label: string; value: View }[] = [
  { label: 'Differenze', value: 'diff' },
  { label: 'Cronologia', value: 'history' },
]

const OP_STYLES = {
  create: {
    badge: 'border-primary/30 text-primary bg-primary/10',
    dot: 'bg-primary',
  },
  update: {
    badge: 'border-secondary/30 text-secondary-foreground bg-secondary/10',
    dot: 'bg-secondary',
  },
  delete: {
    badge: 'border-destructive/30 text-destructive bg-destructive/10',
    dot: 'bg-destructive',
  },
}

interface StationChangesDialogProps {
  // The station shown; null keeps the dialog closed.
  station: Station | null
  status: StationDeploymentStatus | undefined
  names: ChangeNames
  currentUsername: string | undefined
  canDeploy: boolean
  onDeploy: () => void
  onClose: () => void
}

// A station's changes. For one with changes pending, it reviews what
// deploying it would ship - the net difference from its last deploy,
// entity by entity - next to its history; otherwise it shows just the
// history: every change set, newest first, the last deploy marked among
// them.
export const StationChangesDialog: React.FC<StationChangesDialogProps> = ({
  station,
  status,
  names,
  currentUsername,
  canDeploy,
  onDeploy,
  onClose,
}) => {
  const [view, setView] = useState<View>('diff')
  const [diff, setDiff] = useState<StationPendingDiff | null>(null)
  const [sets, setSets] = useState<ChangeSet[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

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

  const lastDeploy =
    shownStatus?.lastDeployedAt &&
    `${reviewing ? 'Rispetto alla' : 'Ultima'} distribuzione del ${formatDateTime(shownStatus.lastDeployedAt)}${
      shownStatus.lastDeployedBy
        ? ` di ${userLabel(shownStatus.lastDeployedBy, shownStatus.lastDeployedByUserId!, currentUsername)}`
        : ''
    }.`

  return (
    <Dialog open={station !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {reviewing ? 'Modifiche da distribuire' : 'Cronologia modifiche'} —{' '}
            {shown?.name || `ID ${shown?.stationId}`}
          </DialogTitle>
          <DialogDescription>
            {lastDeploy || 'La stazione non è mai stata distribuita.'}
          </DialogDescription>
        </DialogHeader>

        {reviewing && (
          <div className="flex">
            <FilterPills
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
            />
          </div>
        )}

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {view === 'diff' ? (
            <DiffView
              diff={diff}
              names={names}
              currentUsername={currentUsername}
            />
          ) : (
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
        </div>

        <DialogFooter>
          <TextButton type="button" onClick={onClose}>
            Chiudi
          </TextButton>
          <FilledButton
            type="button"
            className="inline-flex items-center gap-2"
            disabled={!canDeploy}
            onClick={onDeploy}
          >
            <UploadCloud size={16} />
            Distribuisci
          </FilledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
    <Info size={16} className="mt-0.5 shrink-0" />
    <p>{children}</p>
  </div>
)

const Loading = () => (
  <p className="py-6 text-center text-sm text-muted-foreground">Caricamento…</p>
)

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
  // Variables are shown under their group: where they are now, or where
  // they were for the ones leaving.
  const sections = useMemo(() => {
    const changes = diff?.changes ?? []
    const variablesByGroup = new Map<number | null, PendingEntityChange[]>()
    for (const change of changes) {
      if (change.entityType !== 'variable') continue
      const groupId = change.groupIdAfter ?? change.groupIdBefore
      const list = variablesByGroup.get(groupId)
      if (list) list.push(change)
      else variablesByGroup.set(groupId, [change])
    }
    return {
      station: changes.filter((c) => c.entityType === 'station'),
      groups: changes.filter((c) => c.entityType === 'group'),
      variablesByGroup: [...variablesByGroup.entries()],
    }
  }, [diff])

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

  const renderChange = (change: PendingEntityChange) => (
    <DiffCard
      key={`${change.entityType}-${change.entityId}`}
      change={change}
      names={names}
      currentUsername={currentUsername}
    />
  )

  return (
    <div className="space-y-5 pb-1">
      {sections.station.length > 0 && (
        <Section title="Stazione">{sections.station.map(renderChange)}</Section>
      )}
      {sections.groups.length > 0 && (
        <Section title="Gruppi">{sections.groups.map(renderChange)}</Section>
      )}
      {sections.variablesByGroup.map(([groupId, changes]) => (
        <Section
          key={`variables-${groupId}`}
          title={`Variabili — ${groupId == null ? 'nessun gruppo' : names.groupName(groupId)}`}
        >
          {changes.map(renderChange)}
        </Section>
      ))}
    </div>
  )
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </h3>
    {children}
  </section>
)

// How a change reads from the station's point of view.
const describeOp = (
  change: EntityChange,
  names: ChangeNames,
): { label: string; detail?: string } => {
  switch (change.op) {
    case 'create':
      return change.stationIdBefore != null
        ? {
            label: `${agree(change, 'Spostat')} qui`,
            detail: `da ${names.stationName(change.stationIdBefore)}`,
          }
        : { label: agree(change, 'Nuov') }
    case 'delete':
      return change.stationIdAfter != null
        ? {
            label: `${agree(change, 'Spostat')} via`,
            detail: `su ${names.stationName(change.stationIdAfter)}`,
          }
        : { label: agree(change, 'Eliminat') }
    default:
      return { label: agree(change, 'Modificat') }
  }
}

interface DiffCardProps {
  change: PendingEntityChange
  names: ChangeNames
  currentUsername: string | undefined
}

const DiffCard: React.FC<DiffCardProps> = ({
  change,
  names,
  currentUsername,
}) => {
  const op = describeOp(change, names)
  const authors = change.userIds
    .map((id) =>
      userLabel(
        change.users.find((u) => u.id === id) ?? null,
        id,
        currentUsername,
      ),
    )
    .join(', ')

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <StatusBadge {...OP_STYLES[change.op]} label={op.label} />
        <div className="min-w-0">
          <span className="font-medium text-foreground">
            {entityLabel(change)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {ENTITY_NOUNS[change.entityType]} · ID {change.businessId}
            {op.detail && ` · ${op.detail}`}
          </span>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {authors} · {formatDateTime(change.lastChangedAt)}
        </span>
      </div>

      {change.op === 'update' ? (
        <FieldTable change={change} names={names} />
      ) : (
        <details className="border-t border-border px-4 py-2 text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Mostra campi
          </summary>
          <FieldTable change={change} names={names} bare />
        </details>
      )}
    </div>
  )
}

interface FieldTableProps {
  change: EntityChange
  names: ChangeNames
  // Inside a details element: no own border, and only the side that exists.
  bare?: boolean
}

// Each changed field as deployed and as it is now (or just the one side,
// for an entity that comes or goes).
const FieldTable: React.FC<FieldTableProps> = ({ change, names, bare }) => {
  const both = change.before !== null && change.after !== null
  const format = (field: string, value: unknown) =>
    formatChangeValue(change.entityType, field, value, names)

  return (
    <table
      className={cn(
        'w-full table-fixed text-sm',
        !bare && 'border-t border-border',
      )}
    >
      {both && (
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="w-1/4 px-4 py-2 font-medium">Campo</th>
            <th className="px-4 py-2 font-medium">Distribuito</th>
            <th className="px-4 py-2 font-medium">Attuale</th>
          </tr>
        </thead>
      )}
      <tbody>
        {change.changedFields.map((field) => (
          <tr
            key={field}
            className="border-t border-border/60 first:border-t-0"
          >
            <td className="w-1/4 px-4 py-1.5 text-muted-foreground">
              {fieldLabel(change.entityType, field)}
            </td>
            {both ? (
              <>
                <td className="px-4 py-1.5 break-all text-muted-foreground line-through decoration-muted-foreground/50">
                  {format(field, change.before?.[field])}
                </td>
                <td className="px-4 py-1.5 break-all text-foreground">
                  {format(field, change.after?.[field])}
                </td>
              </>
            ) : (
              <td className="px-4 py-1.5 break-all text-foreground">
                {format(field, (change.after ?? change.before)?.[field])}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
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
