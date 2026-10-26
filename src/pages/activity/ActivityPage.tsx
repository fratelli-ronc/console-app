import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { History, Radio } from 'lucide-react'
import {
  getChangeFilters,
  getChanges,
  getDeploymentStatuses,
  listGroups,
  type ChangeEntityType,
  type ChangeEntry,
  type ChangeFilters,
  type ChangeLogStation,
  type ChangeSet,
  type ChangesQuery,
  type Group,
  type StationDeploymentStatus,
} from '@/client'
import {
  ChangeSetCard,
  DatePicker,
  FilterPills,
  OutlinedButton,
  PageHeader,
  ReloadButton,
  SearchableSelect,
  StatusBadge,
  TextButton,
} from '@/components'
import { userLabel, type ChangeNames } from '@/lib/changeLog'
import { useUserStore } from '@/store'

const TYPE_OPTIONS: { label: string; value: ChangeEntityType | '' }[] = [
  { label: 'Tutto', value: '' },
  { label: 'Stazioni', value: 'station' },
  { label: 'Gruppi', value: 'group' },
  { label: 'Variabili', value: 'variable' },
]

// Change sets with more entries than this show the first ones only, until
// expanded.
const COLLAPSE_AFTER = 8

// The search params the filters live in, so a filtered view can be linked
// to and survives a reload.
const PARAMS = ['user', 'station', 'type', 'from', 'to'] as const
type Param = (typeof PARAMS)[number]

// The start of a "YYYY-MM-DD" day, plus days, in local time, as an ISO time.
const startOfDay = (date: string, days = 0) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day + days).toISOString()
}

// A local "YYYY-MM-DD" key for the day of an ISO time.
const dayKey = (iso: string | Date) => {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const dayLabel = (key: string) => {
  const today = new Date()
  if (key === dayKey(today)) return 'Oggi'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (key === dayKey(yesterday)) return 'Ieri'
  const label = new Date(startOfDay(key)).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const stationLabel = (station: ChangeLogStation) =>
  station.name || `ID ${station.stationId}`

// The stations a change set is on, in the order its entries name them.
const setStationIds = (set: ChangeSet) => {
  const ids: number[] = []
  for (const entry of set.entries) {
    for (const id of [entry.stationIdBefore, entry.stationIdAfter]) {
      if (id != null && !ids.includes(id)) ids.push(id)
    }
  }
  return ids
}

// Every change, across all stations, newest first, grouped by day.
export const ActivityPage: React.FC = () => {
  const currentUsername = useUserStore((state) => state.user?.username)
  const [params, setParams] = useSearchParams()
  const filter = Object.fromEntries(
    PARAMS.map((key) => [key, params.get(key) ?? '']),
  ) as Record<Param, string>

  const [filters, setFilters] = useState<ChangeFilters | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [statuses, setStatuses] = useState<
    Record<number, StationDeploymentStatus>
  >({})
  const [sets, setSets] = useState<ChangeSet[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [reloading, setReloading] = useState(false)
  // Bumped by every first-page load, so a stale response is dropped.
  const request = useRef(0)

  const query = useMemo<ChangesQuery>(
    () => ({
      userId: filter.user ? Number(filter.user) : undefined,
      stationId: filter.station ? Number(filter.station) : undefined,
      entityType: (filter.type as ChangeEntityType) || undefined,
      from: filter.from ? startOfDay(filter.from) : undefined,
      to: filter.to ? startOfDay(filter.to, 1) : undefined,
    }),
    // Recomputed only when a filter value changes.
    [filter.user, filter.station, filter.type, filter.from, filter.to],
  )

  const setFilter = (key: Param, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const filtered = PARAMS.some((key) => filter[key])

  const loadLookups = async () => {
    const [filtersRes, groupsRes, statusesRes] = await Promise.all([
      getChangeFilters(),
      listGroups(),
      getDeploymentStatuses(),
    ])
    if (filtersRes) setFilters(filtersRes)
    if (groupsRes) setGroups(groupsRes)
    if (statusesRes) {
      setStatuses(
        Object.fromEntries(statusesRes.stations.map((s) => [s.stationId, s])),
      )
    }
  }

  const loadFirstPage = async () => {
    const current = ++request.current
    const res = await getChanges(query)
    if (current !== request.current) return
    setSets(res?.changeSets ?? [])
    setHasMore(res?.hasMore ?? false)
  }

  const loadMore = async () => {
    if (!sets?.length) return
    const current = request.current
    setLoadingMore(true)
    const res = await getChanges({ ...query, before: sets[sets.length - 1].id })
    setLoadingMore(false)
    if (!res || current !== request.current) return
    setSets([...sets, ...res.changeSets])
    setHasMore(res.hasMore)
  }

  const handleReload = async () => {
    setReloading(true)
    await Promise.all([loadLookups(), loadFirstPage()])
    setReloading(false)
  }

  useEffect(() => {
    void loadLookups()
  }, [])

  useEffect(() => {
    setSets(null)
    setHasMore(false)
    void loadFirstPage()
  }, [query])

  const stationById = useMemo(
    () => new Map((filters?.stations ?? []).map((s) => [s.id, s])),
    [filters],
  )

  // Groups since deleted are named by their own entries, newest first.
  const names = useMemo<ChangeNames>(() => {
    const groupNames = new Map<number, string>()
    for (const set of sets ?? []) {
      for (const entry of set.entries) {
        if (
          entry.entityType === 'group' &&
          entry.name &&
          !groupNames.has(entry.entityId)
        )
          groupNames.set(entry.entityId, entry.name)
      }
    }
    for (const group of groups) {
      groupNames.set(group.id, group.name || `ID ${group.groupId}`)
    }
    return {
      groupName: (id) => groupNames.get(id) ?? `gruppo #${id}`,
      stationName: (id) => {
        const station = stationById.get(id)
        return station ? stationLabel(station) : `stazione #${id}`
      },
    }
  }, [groups, sets, stationById])

  const userOptions = useMemo(
    () => [
      { value: '', label: 'Tutti gli utenti' },
      ...(filters?.userIds ?? []).map((id) => ({
        value: String(id),
        label: userLabel(
          filters?.users.find((u) => u.id === id) ?? null,
          id,
          currentUsername,
        ),
      })),
    ],
    [filters, currentUsername],
  )

  const stationOptions = useMemo(
    () => [
      { value: '', label: 'Tutte le stazioni' },
      ...(filters?.stations ?? []).map((station) => ({
        value: String(station.id),
        label: `${station.name ? `${station.name} · ` : ''}ID ${station.stationId}${station.deleted ? ' (eliminata)' : ''}`,
      })),
    ],
    [filters],
  )

  const days = useMemo(() => {
    const out: { key: string; sets: ChangeSet[] }[] = []
    for (const set of sets ?? []) {
      const key = dayKey(set.createdAt)
      const last = out[out.length - 1]
      if (last?.key === key) last.sets.push(set)
      else out.push({ key, sets: [set] })
    }
    return out
  }, [sets])

  // The station an entry is on, or the two it moved between.
  const entryStations = (entry: ChangeEntry) => {
    const { stationIdBefore: before, stationIdAfter: after } = entry
    if (before != null && after != null && before !== after)
      return ` · ${names.stationName(before)} → ${names.stationName(after)}`
    const id = after ?? before
    return id == null ? null : ` · ${names.stationName(id)}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attività"
        subtitle="Tutte le modifiche a stazioni, gruppi e variabili, dalla più recente."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchableSelect
          className="w-56"
          value={filter.user}
          onValueChange={(value) => setFilter('user', value)}
          placeholder="Tutti gli utenti"
          searchPlaceholder="Cerca utente…"
          emptyMessage="Nessun utente trovato."
          options={userOptions}
        />

        <SearchableSelect
          className="w-64"
          value={filter.station}
          onValueChange={(value) => setFilter('station', value)}
          placeholder="Tutte le stazioni"
          searchPlaceholder="Cerca stazione…"
          emptyMessage="Nessuna stazione trovata."
          options={stationOptions}
        />

        <FilterPills
          options={TYPE_OPTIONS}
          value={filter.type as ChangeEntityType | ''}
          onChange={(value) => setFilter('type', value)}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Dal</span>
          <DatePicker
            value={filter.from}
            max={filter.to || undefined}
            onChange={(value) => setFilter('from', value)}
          />
          <span>al</span>
          <DatePicker
            value={filter.to}
            min={filter.from || undefined}
            onChange={(value) => setFilter('to', value)}
          />
        </div>

        {filtered && (
          <TextButton
            type="button"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Azzera filtri
          </TextButton>
        )}

        <ReloadButton isReloading={reloading} onReload={handleReload} />
      </div>

      {sets === null ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Caricamento…
        </p>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <History size={22} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Nessuna modifica trovata
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtered
              ? 'Prova a modificare i filtri.'
              : 'Il registro tiene traccia delle modifiche solo da quando è stato attivato.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day.key} className="space-y-3">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {dayLabel(day.key)}
              </h2>
              <ol className="space-y-3">
                {day.sets.map((set) => {
                  const stationIds = setStationIds(set)
                  return (
                    <ChangeSetCard
                      key={set.id}
                      set={set}
                      names={names}
                      currentUsername={currentUsername}
                      timeOnly
                      collapseAfter={COLLAPSE_AFTER}
                      entrySuffix={
                        stationIds.length > 1 ? entryStations : undefined
                      }
                    >
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        {stationIds.map((id) => (
                          <SetStation
                            key={id}
                            setId={set.id}
                            stationId={id}
                            station={stationById.get(id)}
                            status={statuses[id]}
                            names={names}
                          />
                        ))}
                      </div>
                    </ChangeSetCard>
                  )
                })}
              </ol>
            </section>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <OutlinedButton
                type="button"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? 'Caricamento…' : 'Carica modifiche precedenti'}
              </OutlinedButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const BADGES = {
  deployed: {
    label: 'Distribuita',
    dot: 'bg-primary',
    badge: 'border-primary/30 text-primary bg-primary/10',
  },
  pending: {
    label: 'In sospeso',
    dot: 'bg-secondary',
    badge: 'border-secondary/30 text-secondary-foreground bg-secondary/10',
  },
  notDeployed: {
    label: 'Mai distribuita',
    dot: 'bg-muted-foreground',
    badge: 'border-border text-muted-foreground bg-muted/50',
  },
  deleted: {
    label: 'Stazione eliminata',
    dot: 'bg-muted-foreground',
    badge: 'border-border text-muted-foreground bg-muted/50',
  },
}

interface SetStationProps {
  setId: number
  stationId: number
  station: ChangeLogStation | undefined
  status: StationDeploymentStatus | undefined
  names: ChangeNames
}

// A station a change set is on, and whether the set has been deployed to
// it: it has if the station's last deploy shipped it or a later set.
const SetStation: React.FC<SetStationProps> = ({
  setId,
  stationId,
  station,
  status,
  names,
}) => {
  const watermark = status?.deployedThroughChangeSetId ?? null
  const badge = station?.deleted
    ? BADGES.deleted
    : !status
      ? null
      : watermark != null && setId <= watermark
        ? BADGES.deployed
        : status.status === 'not_deployed'
          ? BADGES.notDeployed
          : BADGES.pending

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <Radio size={12} className="text-muted-foreground" />
      <span className="text-foreground">{names.stationName(stationId)}</span>
      {badge && (
        <StatusBadge dot={badge.dot} badge={badge.badge} label={badge.label} />
      )}
    </span>
  )
}
