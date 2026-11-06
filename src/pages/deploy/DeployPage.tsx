import { useEffect, useMemo, useState } from 'react'
import { History, ListChecks, Rocket, Trash2, UploadCloud } from 'lucide-react'
import {
  DataTable,
  type DataTableColumn,
  FilledButton,
  OutlinedButton,
  PageHeader,
  ReloadButton,
  Search,
  SearchableSelect,
  StatusBadge,
  TextButton,
} from '@/components'
import {
  deployStations,
  getDeploymentStatuses,
  listGroups,
  listStations,
  revertStation,
  ConfigVersion,
  DeletedStationDeployment,
  DeploymentStatusValue,
  Group,
  GroupDeploymentStatus,
  Station,
  StationDeploymentStatus,
} from '@/client'
import { listServers, type Server } from '@/client/coolify'
import { formatDateTime, userLabel, type ChangeNames } from '@/lib/changeLog'
import { revertedDeployError } from '@/lib/configVersions'
import { useUserStore } from '@/store'
import {
  DeployResultDialog,
  type DeployDialogState,
} from './components/DeployResultDialog'
import { StationChangesDialog } from './components/StationChangesDialog'
import { versionLabel } from './components/ConfigVersionsView'

const distinctServerIps = (groups: Group[]) =>
  Array.from(
    new Set(groups.flatMap((g) => (g.serverIp ? [g.serverIp] : []))),
  ).sort()

interface ServerLabelProps {
  ip: string
  server: Server | undefined
}

const ServerLabel: React.FC<ServerLabelProps> = ({ ip, server }) => (
  <div>
    <p className="text-foreground">{server ? server.name : ip}</p>
    <p className="text-xs text-muted-foreground">{ip}</p>
  </div>
)

export const DeployPage: React.FC = () => {
  const currentUser = useUserStore((state) => state.user)
  const [stations, setStations] = useState<Station[] | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [serversByIp, setServersByIp] = useState<Map<string, Server>>(new Map())
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
  const [serverIp, setServerIp] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeploymentStatusValue | ''>(
    '',
  )
  const [selectedKeys, setSelectedKeys] = useState<Set<React.Key>>(new Set())
  const [expandedKeys, setExpandedKeys] = useState<Set<React.Key>>(new Set())
  const [bulkDeploying, setBulkDeploying] = useState(false)
  const [deployingIds, setDeployingIds] = useState<Set<number>>(new Set())
  const [stationStatuses, setStationStatuses] = useState<
    Record<number, StationDeploymentStatus>
  >({})
  const [groupStatuses, setGroupStatuses] = useState<
    Record<number, GroupDeploymentStatus>
  >({})
  const [deletedStations, setDeletedStations] = useState<
    DeletedStationDeployment[]
  >([])
  const [deployDialog, setDeployDialog] = useState<DeployDialogState | null>(
    null,
  )
  const [reviewedId, setReviewedId] = useState<number | null>(null)

  const fetchData = async () => {
    const [stationsRes, groupsRes, serversRes, statusesRes] = await Promise.all(
      [listStations(), listGroups(), listServers(), getDeploymentStatuses()],
    )
    if (groupsRes) setGroups(groupsRes)
    if (serversRes) setServersByIp(new Map(serversRes.map((s) => [s.ip, s])))

    if (stationsRes) {
      const sorted = [...stationsRes].sort((a, b) => a.stationId - b.stationId)
      setStations(sorted)
    }

    if (statusesRes) {
      setStationStatuses(
        Object.fromEntries(statusesRes.stations.map((s) => [s.stationId, s])),
      )
      setGroupStatuses(
        Object.fromEntries(statusesRes.groups.map((g) => [g.groupId, g])),
      )
      setDeletedStations(statusesRes.deletedStations ?? [])
    }
    setSelectedKeys(new Set())
  }

  // A deleted station leaves the list once its files are cleared off every
  // server; only the API knows whether that happened.
  const refreshDeletedStations = async () => {
    const statusesRes = await getDeploymentStatuses()
    if (statusesRes) setDeletedStations(statusesRes.deletedStations ?? [])
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchData()
    setReloading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const loading = stations === null

  const groupsByStation = useMemo(() => {
    const map = new Map<number, Group[]>()
    for (const group of [...groups].sort((a, b) => a.groupId - b.groupId)) {
      if (group.stationId == null) continue
      const list = map.get(group.stationId)
      if (list) list.push(group)
      else map.set(group.stationId, [group])
    }
    return map
  }, [groups])

  // Names for the ids a change refers to; deleted groups and stations are
  // no longer listed, so they fall back to their internal id.
  const changeNames = useMemo<ChangeNames>(() => {
    const groupById = new Map(groups.map((g) => [g.id, g]))
    const stationById = new Map((stations ?? []).map((s) => [s.id, s]))
    return {
      groupName: (id) => {
        const group = groupById.get(id)
        if (!group) return `gruppo #${id}`
        return group.name || `ID ${group.groupId}`
      },
      stationName: (id) => {
        const station = stationById.get(id)
        if (!station) return `stazione #${id}`
        return station.name || `ID ${station.stationId}`
      },
    }
  }, [groups, stations])

  const reviewedStation =
    reviewedId == null
      ? null
      : ((stations ?? []).find((s) => s.id === reviewedId) ?? null)

  const stationGroups = (station: Station) =>
    groupsByStation.get(station.id) ?? []

  const stationStatusValue = (station: Station): DeploymentStatusValue =>
    stationStatuses[station.id]?.status ?? 'not_deployed'

  // Disabled stations and groups are still deployed, carrying enabled: false.
  // A station with no groups left can still be deployed while its last
  // deploy left files on some server: the deploy clears them off.
  const canDeploy = (station: Station) =>
    stationGroups(station).length > 0 ||
    (stationStatuses[station.id]?.deployedServerIps?.length ?? 0) > 0

  const serverOptions = useMemo(
    () => [
      { value: '', label: 'Tutti i server' },
      ...distinctServerIps(groups).map((ip) => {
        const server = serversByIp.get(ip)
        return { value: ip, label: server ? `${server.name} (${ip})` : ip }
      }),
    ],
    [groups, serversByIp],
  )

  const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    { value: 'deployed', label: 'Distribuito' },
    { value: 'pending', label: 'Modifiche in sospeso' },
    { value: 'not_deployed', label: 'Non distribuito' },
  ]

  // Deleted stations always have a removal to deploy, so only the
  // "pending" status filter keeps them.
  const filteredDeleted = deletedStations.filter((station) => {
    if (serverIp && !station.serverIps.includes(serverIp)) return false
    if (statusFilter && statusFilter !== 'pending') return false

    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      String(station.stationId).includes(q) ||
      (station.name ?? '').toLowerCase().includes(q)
    )
  })

  const filtered = (stations ?? []).filter((station) => {
    const ownGroups = stationGroups(station)

    if (serverIp && !ownGroups.some((g) => g.serverIp === serverIp))
      return false

    if (statusFilter && stationStatusValue(station) !== statusFilter)
      return false

    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      String(station.stationId).includes(q) ||
      (station.name ?? '').toLowerCase().includes(q) ||
      ownGroups.some((g) => (g.name ?? '').toLowerCase().includes(q))
    )
  })

  // Applies the response of a successful deploy: updates the deployed
  // stations' statuses (already carrying the resolved "deployed by" user),
  // and optimistically clears the pending flag on their groups too, since a
  // station deploy always clears both server-side.
  const applyDeployResult = (results: StationDeploymentStatus[]) => {
    setStationStatuses((prev) => {
      const next = { ...prev }
      for (const result of results) next[result.stationId] = result
      return next
    })

    const deployedStationIds = new Set(results.map((r) => r.stationId))
    setGroupStatuses((prev) => {
      const next = { ...prev }
      for (const group of groups) {
        if (group.stationId != null && deployedStationIds.has(group.stationId))
          next[group.id] = { groupId: group.id, pending: false }
      }
      return next
    })
  }

  // Reports the whole attempt through the dialog — each server live as it
  // is pinged and synced, then the outcome; the offending groups when the
  // API refuses the deploy. Returns whether every station went through,
  // for the callers that clean up after it.
  const runDeploy = async (ids: number[]) => {
    const stationCount = ids.length
    setDeployingIds((prev) => new Set([...prev, ...ids]))
    setDeployDialog({ phase: 'preparing', stationCount })
    const outcome = await deployStations(ids, {
      onServers: (servers) =>
        setDeployDialog({ phase: 'running', stationCount, servers }),
      onServer: (server) =>
        setDeployDialog((prev) =>
          prev?.phase === 'running'
            ? {
                ...prev,
                servers: prev.servers.map((s) =>
                  s.serverIp === server.serverIp ? server : s,
                ),
              }
            : prev,
        ),
    })
    setDeployingIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.delete(id)
      return next
    })

    // null means the auth interceptor took over — logging out, so there is
    // nothing worth keeping a dialog open for.
    if (!outcome) {
      setDeployDialog(null)
      return false
    }

    if (outcome.kind === 'rejected') {
      setDeployDialog({
        phase: 'rejected',
        message: outcome.message,
        groups: outcome.groups,
      })
      return false
    }

    // A partial deploy still reports the stations that went through.
    applyDeployResult(outcome.result.statuses)
    if (deletedStations.some((s) => ids.includes(s.id)))
      void refreshDeletedStations()
    setDeployDialog({ phase: 'done', stationCount, result: outcome.result })
    return !outcome.result.error
  }

  // Reverts the station to version and deploys it, followed in the same
  // dialog as a deploy. The station's groups and fields change with it, so
  // everything is reloaded once it has been written.
  const runRevert = async (
    stationId: number,
    version: ConfigVersion,
    force: boolean,
  ) => {
    const revert = {
      versionLabel: versionLabel(version, currentUser?.username),
    }
    setDeployingIds((prev) => new Set([...prev, stationId]))
    setDeployDialog({ phase: 'preparing', stationCount: 1, revert })
    const outcome = await revertStation(stationId, version.id, force, {
      onServers: (servers) =>
        setDeployDialog({ phase: 'running', stationCount: 1, servers, revert }),
      onServer: (server) =>
        setDeployDialog((prev) =>
          prev?.phase === 'running'
            ? {
                ...prev,
                servers: prev.servers.map((s) =>
                  s.serverIp === server.serverIp ? server : s,
                ),
              }
            : prev,
        ),
    })
    setDeployingIds((prev) => {
      const next = new Set(prev)
      next.delete(stationId)
      return next
    })

    if (!outcome) {
      setDeployDialog(null)
      return
    }
    switch (outcome.kind) {
      case 'warnings':
        setDeployDialog({
          phase: 'rejected',
          message:
            "La stazione è cambiata dopo l'anteprima. Riapri l'anteprima del ripristino e conferma di nuovo.",
          groups: [],
          revert,
        })
        return
      case 'refused':
        setDeployDialog({
          phase: 'rejected',
          message: outcome.refusal.message,
          groups: outcome.refusal.groups,
          reasons: outcome.refusal.reasons,
          revert,
        })
        return
      case 'reverted':
        setDeployDialog({
          phase: 'rejected',
          message: revertedDeployError(outcome.message),
          groups: [],
          revert: { ...revert, changes: outcome.changes, written: true },
        })
        break
      case 'ran':
        setDeployDialog({
          phase: 'done',
          stationCount: 1,
          result: outcome.result,
          revert: { ...revert, changes: outcome.changes },
        })
        break
    }
    await fetchData()
  }

  const handleBulkDeploy = async () => {
    const targets = filtered.filter(
      (s) => selectedKeys.has(s.id) && canDeploy(s),
    )
    if (targets.length === 0) return
    setBulkDeploying(true)
    const deployed = await runDeploy(targets.map((s) => s.id))
    setBulkDeploying(false)
    if (deployed) setSelectedKeys(new Set())
  }

  const columns: DataTableColumn<Station>[] = [
    {
      key: 'name',
      header: 'Stazione',
      render: (station) => (
        <>
          <div className="font-medium text-foreground">
            {station.name || '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            ID {station.stationId}
            {!station.enabled && ' · Disabilitata'}
          </div>
        </>
      ),
    },
    {
      key: 'groups',
      header: 'Gruppi',
      cellClassName: 'text-muted-foreground',
      render: (station) => {
        const ownGroups = stationGroups(station)
        const count = ownGroups.length
        if (count === 0) return <span>—</span>
        const disabled = ownGroups.filter((g) => !g.enabled).length
        return (
          <>
            <div>
              {count} {count === 1 ? 'gruppo' : 'gruppi'}
            </div>
            {disabled > 0 && (
              <div className="text-xs">
                {disabled} {disabled === 1 ? 'disabilitato' : 'disabilitati'}
              </div>
            )}
          </>
        )
      },
    },
    {
      key: 'server',
      header: 'Server',
      cellClassName: 'text-muted-foreground',
      render: (station) => {
        const ips = distinctServerIps(stationGroups(station))
        if (ips.length === 0) return <span>—</span>
        return (
          <span>
            {ips.map((ip) => serversByIp.get(ip)?.name ?? ip).join(', ')}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Stato',
      render: (station) => {
        if (deployingIds.has(station.id)) {
          return (
            <StatusBadge
              pending
              dot=""
              badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
              label="Distribuzione…"
            />
          )
        }
        const status = stationStatuses[station.id]
        if (status?.status === 'deployed') {
          const deployedBy = status.lastDeployedBy
          return (
            <div>
              <StatusBadge
                dot="bg-primary"
                badge="border-primary/30 text-primary bg-primary/10"
                label={`Distribuito il ${formatDateTime(status.lastDeployedAt!)}`}
              />
              {deployedBy && (
                <div className="mt-1 text-xs text-muted-foreground">
                  da{' '}
                  {deployedBy.username === currentUser?.username
                    ? 'Te'
                    : deployedBy.name || deployedBy.username}
                </div>
              )}
            </div>
          )
        }
        if (status?.status === 'pending') {
          const summary = status.pendingChanges
          return (
            <div>
              <StatusBadge
                dot="bg-secondary"
                badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
                label="Modifiche in sospeso"
              />
              {summary && summary.changeSets > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {summary.changeSets === 1
                    ? '1 modifica'
                    : `${summary.changeSets} modifiche`}
                  {summary.userIds.length > 0 &&
                    ` di ${summary.userIds
                      .map((id) =>
                        userLabel(
                          summary.users.find((u) => u.id === id) ?? null,
                          id,
                          currentUser?.username,
                        ),
                      )
                      .join(', ')}`}
                </div>
              )}
            </div>
          )
        }
        return (
          <StatusBadge
            dot="bg-muted-foreground"
            badge="border-border text-muted-foreground bg-muted/50"
            label="Non distribuito"
          />
        )
      },
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (station) => (
        <div className="inline-flex items-center gap-2">
          <TextButton
            type="button"
            className="inline-flex h-8 items-center gap-2"
            onClick={() => setReviewedId(station.id)}
          >
            {stationStatuses[station.id]?.status === 'pending' ? (
              <>
                <ListChecks size={14} />
                Rivedi
              </>
            ) : (
              <>
                <History size={14} />
                Cronologia
              </>
            )}
          </TextButton>
          <OutlinedButton
            type="button"
            className="inline-flex h-8 items-center gap-2 px-3"
            disabled={!canDeploy(station) || deployingIds.has(station.id)}
            onClick={() => runDeploy([station.id])}
          >
            <UploadCloud size={14} />
            Distribuisci
          </OutlinedButton>
        </div>
      ),
    },
  ]

  const deletedColumns: DataTableColumn<DeletedStationDeployment>[] = [
    {
      key: 'name',
      header: 'Stazione',
      render: (station) => (
        <>
          <div className="font-medium text-foreground">
            {station.name || '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            ID {station.stationId}
          </div>
        </>
      ),
    },
    {
      key: 'server',
      header: 'Server',
      cellClassName: 'text-muted-foreground',
      render: (station) => (
        <span>
          {station.serverIps
            .map((ip) => serversByIp.get(ip)?.name ?? ip)
            .join(', ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Stato',
      render: (station) =>
        deployingIds.has(station.id) ? (
          <StatusBadge
            pending
            dot=""
            badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
            label="Rimozione…"
          />
        ) : (
          <StatusBadge
            dot="bg-destructive"
            badge="border-destructive/30 text-destructive bg-destructive/10"
            label={`Eliminata il ${formatDateTime(station.deletedAt)}`}
          />
        ),
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (station) => (
        <OutlinedButton
          type="button"
          className="inline-flex h-8 items-center gap-2 px-3"
          disabled={deployingIds.has(station.id)}
          onClick={() => runDeploy([station.id])}
        >
          <Trash2 size={14} />
          Rimuovi dai server
        </OutlinedButton>
      ),
    },
  ]

  const renderGroups = (station: Station) => (
    <ul className="divide-y divide-border/60 py-1 pl-24 pr-4">
      {stationGroups(station).map((group) => (
        <li
          key={group.id}
          className="grid grid-cols-[minmax(0,16rem)_minmax(0,16rem)_minmax(0,1fr)] items-center gap-6 py-2.5"
        >
          <div>
            <div className="text-foreground">{group.name || '—'}</div>
            <div className="text-xs text-muted-foreground">
              ID {group.groupId}
            </div>
          </div>
          {group.serverIp ? (
            <ServerLabel
              ip={group.serverIp}
              server={serversByIp.get(group.serverIp)}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!group.enabled && (
              <StatusBadge
                dot="bg-muted-foreground"
                badge="border-border text-muted-foreground bg-muted/50"
                label="Disabilitato"
              />
            )}
            {groupStatuses[group.id]?.pending && (
              <StatusBadge
                dot="bg-secondary"
                badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
                label="Modifiche in sospeso"
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deploy"
        subtitle="Invia la configurazione delle variabili alle stazioni."
      />

      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <SearchableSelect
          className="w-64"
          value={serverIp}
          onValueChange={setServerIp}
          placeholder="Tutti i server"
          searchPlaceholder="Cerca server…"
          emptyMessage="Nessun server trovato."
          options={serverOptions}
        />

        <SearchableSelect
          className="w-56"
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as DeploymentStatusValue | '')
          }
          placeholder="Tutti gli stati"
          searchPlaceholder="Cerca stato…"
          emptyMessage="Nessuno stato trovato."
          options={statusOptions}
        />

        <div className="flex items-center gap-3 ml-auto">
          {selectedKeys.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedKeys.size}{' '}
                {selectedKeys.size === 1 ? 'selezionata' : 'selezionate'}
              </span>
              <FilledButton
                type="button"
                className="inline-flex items-center gap-2"
                disabled={bulkDeploying}
                onClick={handleBulkDeploy}
              >
                <UploadCloud size={16} />
                {bulkDeploying ? 'Distribuzione…' : 'Distribuisci selezionate'}
              </FilledButton>
            </>
          )}

          <ReloadButton isReloading={reloading} onReload={handleReload} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowKey={(station) => station.id}
        selection={{
          selectedKeys,
          onSelectionChange: setSelectedKeys,
          isSelectable: canDeploy,
        }}
        expansion={{
          expandedKeys,
          onExpandedChange: setExpandedKeys,
          renderExpanded: renderGroups,
          canExpand: (station) => stationGroups(station).length > 0,
        }}
        emptyState={{
          icon: <Rocket size={22} className="text-primary" />,
          title: 'Nessuna stazione trovata',
          description: 'Prova a modificare la ricerca o i filtri.',
        }}
      />

      {filteredDeleted.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Stazioni eliminate
              </h2>
              <p className="text-sm text-muted-foreground">
                La loro configurazione è ancora presente sui server. Rimuovila
                per completare l'eliminazione.
              </p>
            </div>
            {filteredDeleted.length > 1 && (
              <OutlinedButton
                type="button"
                className="inline-flex items-center gap-2"
                disabled={filteredDeleted.some((s) => deployingIds.has(s.id))}
                onClick={() => runDeploy(filteredDeleted.map((s) => s.id))}
              >
                <Trash2 size={14} />
                Rimuovi tutte
              </OutlinedButton>
            )}
          </div>
          <DataTable
            columns={deletedColumns}
            data={filteredDeleted}
            getRowKey={(station) => station.id}
          />
        </div>
      )}

      <StationChangesDialog
        station={reviewedStation}
        status={reviewedId == null ? undefined : stationStatuses[reviewedId]}
        names={changeNames}
        currentUsername={currentUser?.username}
        canDeploy={
          reviewedStation != null &&
          canDeploy(reviewedStation) &&
          !deployingIds.has(reviewedStation.id)
        }
        busy={reviewedId != null && deployingIds.has(reviewedId)}
        onDeploy={() => {
          if (reviewedId == null) return
          setReviewedId(null)
          void runDeploy([reviewedId])
        }}
        onRevert={(version, force) => {
          if (reviewedId == null) return
          setReviewedId(null)
          void runRevert(reviewedId, version, force)
        }}
        onClose={() => setReviewedId(null)}
      />

      <DeployResultDialog
        state={deployDialog}
        onClose={() => setDeployDialog(null)}
        serverName={(ip) => serversByIp.get(ip)?.name}
      />
    </div>
  )
}
