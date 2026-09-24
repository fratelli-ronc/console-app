import { useEffect, useMemo, useState } from 'react'
import { Rocket, UploadCloud } from 'lucide-react'
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
} from '@/components'
import {
  deployStations,
  getDeploymentStatuses,
  listGroups,
  listStations,
  DeploymentStatusValue,
  Group,
  GroupDeploymentStatus,
  Station,
  StationDeploymentStatus,
} from '@/client'
import { listServers, type Server } from '@/client/coolify'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store'
import {
  DeployResultDialog,
  type DeployDialogState,
} from './components/DeployResultDialog'

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

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
  const [serversByIp, setServersByIp] = useState<Map<string, Server>>(
    new Map(),
  )
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
  const [deployDialog, setDeployDialog] = useState<DeployDialogState | null>(
    null,
  )

  const fetchData = async () => {
    const [stationsRes, groupsRes, serversRes, statusesRes] =
      await Promise.all([
        listStations(),
        listGroups(),
        listServers(),
        getDeploymentStatuses(),
      ])
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
    }
    setSelectedKeys(new Set())
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

  const stationGroups = (station: Station) =>
    groupsByStation.get(station.id) ?? []

  const stationStatusValue = (station: Station): DeploymentStatusValue =>
    stationStatuses[station.id]?.status ?? 'not_deployed'

  // Disabled groups are skipped on deploy, so a station needs at least one
  // enabled group to have anything to distribute.
  const canDeploy = (station: Station) =>
    !!station.enabled && stationGroups(station).some((g) => g.enabled)

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

  // Reports the whole attempt through the dialog — the rendered config
  // files on success, the offending groups when the API refuses the deploy.
  // Returns whether it went through, for the callers that clean up after it.
  const runDeploy = async (ids: number[]) => {
    setDeployingIds((prev) => new Set([...prev, ...ids]))
    setDeployDialog({ phase: 'loading', stationCount: ids.length })
    const outcome = await deployStations(ids)
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

    if (!outcome.ok) {
      setDeployDialog({
        phase: 'error',
        message: outcome.message,
        groups: outcome.groups,
      })
      return false
    }

    applyDeployResult(outcome.statuses)
    setDeployDialog({
      phase: 'success',
      stationCount: ids.length,
      files: outcome.files,
    })
    return true
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
        if (!station.enabled) {
          return (
            <StatusBadge
              dot="bg-muted-foreground"
              badge="border-border text-muted-foreground bg-muted/50"
              label="Disabilitata"
            />
          )
        }
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
          return (
            <StatusBadge
              dot="bg-secondary"
              badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
              label="Modifiche in sospeso"
            />
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
        <OutlinedButton
          type="button"
          className="inline-flex items-center gap-2"
          disabled={!canDeploy(station) || deployingIds.has(station.id)}
          onClick={() => runDeploy([station.id])}
        >
          <UploadCloud size={14} />
          Distribuisci
        </OutlinedButton>
      ),
    },
  ]

  const renderGroups = (station: Station) => (
    <ul className="divide-y divide-border/60 py-1 pl-24 pr-4">
      {stationGroups(station).map((group) => (
        <li
          key={group.id}
          className={cn(
            'grid grid-cols-[minmax(0,16rem)_minmax(0,16rem)_minmax(0,1fr)] items-center gap-6 py-2.5',
            !group.enabled && 'opacity-60',
          )}
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
          <div>
            {!group.enabled ? (
              <StatusBadge
                dot="bg-muted-foreground"
                badge="border-border text-muted-foreground bg-muted/50"
                label="Disabilitato"
              />
            ) : (
              groupStatuses[group.id]?.pending && (
                <StatusBadge
                  dot="bg-secondary"
                  badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
                  label="Modifiche in sospeso"
                />
              )
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
        rowClassName={(station) => (station.enabled ? '' : 'opacity-60')}
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

      <DeployResultDialog
        state={deployDialog}
        onClose={() => setDeployDialog(null)}
        serverName={(ip) => serversByIp.get(ip)?.name}
      />
    </div>
  )
}
