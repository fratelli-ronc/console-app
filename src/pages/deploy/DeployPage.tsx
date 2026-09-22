import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
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
import { listGroups, listStations, Group, Station } from '@/client'
import { listServers, type Server } from '@/client/coolify'
import { cn } from '@/lib/utils'

type DeployStatus =
  | { state: 'idle' }
  | { state: 'deploying' }
  | { state: 'deployed'; at: string }

const IDLE_STATUS: DeployStatus = { state: 'idle' }

// There is no backend endpoint yet to push variable configs to a station —
// this simulates the round trip locally so the UI/UX can be reviewed ahead
// of that work.
const SIMULATED_DEPLOY_MS = 900
const simulateDeploy = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_DEPLOY_MS))

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

const stationLabel = (station: Station) =>
  station.name || `ID ${station.stationId}`

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
  const [stations, setStations] = useState<Station[] | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [serversByIp, setServersByIp] = useState<Map<string, Server>>(
    new Map(),
  )
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
  const [serverIp, setServerIp] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Set<React.Key>>(new Set())
  const [expandedKeys, setExpandedKeys] = useState<Set<React.Key>>(new Set())
  const [bulkDeploying, setBulkDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<
    Record<number, DeployStatus>
  >({})

  const fetchData = async () => {
    const [stationsRes, groupsRes, serversRes] = await Promise.all([
      listStations(),
      listGroups(),
      listServers(),
    ])
    if (stationsRes)
      setStations(stationsRes.sort((a, b) => a.stationId - b.stationId))
    if (groupsRes) setGroups(groupsRes)
    if (serversRes) setServersByIp(new Map(serversRes.map((s) => [s.ip, s])))
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

  const filtered = (stations ?? []).filter((station) => {
    const ownGroups = stationGroups(station)

    if (serverIp && !ownGroups.some((g) => g.serverIp === serverIp))
      return false

    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      String(station.stationId).includes(q) ||
      (station.name ?? '').toLowerCase().includes(q) ||
      ownGroups.some((g) => (g.name ?? '').toLowerCase().includes(q))
    )
  })

  const deployStation = async (station: Station) => {
    setDeployStatus((prev) => ({
      ...prev,
      [station.id]: { state: 'deploying' },
    }))
    await simulateDeploy()
    setDeployStatus((prev) => ({
      ...prev,
      [station.id]: { state: 'deployed', at: new Date().toISOString() },
    }))
  }

  const handleDeploy = async (station: Station) => {
    await deployStation(station)
    toast.success(`Configurazione inviata a ${stationLabel(station)}`)
  }

  const handleBulkDeploy = async () => {
    const targets = filtered.filter(
      (s) => selectedKeys.has(s.id) && canDeploy(s),
    )
    if (targets.length === 0) return
    setBulkDeploying(true)
    await Promise.all(targets.map(deployStation))
    setBulkDeploying(false)
    setSelectedKeys(new Set())
    toast.success(
      `Configurazione inviata a ${targets.length} ${targets.length === 1 ? 'stazione' : 'stazioni'}`,
    )
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
        const status = deployStatus[station.id] ?? IDLE_STATUS
        if (status.state === 'deploying') {
          return (
            <StatusBadge
              pending
              dot=""
              badge="border-secondary/30 text-secondary-foreground bg-secondary/10"
              label="Distribuzione…"
            />
          )
        }
        if (status.state === 'deployed') {
          return (
            <StatusBadge
              dot="bg-primary"
              badge="border-primary/30 text-primary bg-primary/10"
              label={`Distribuito alle ${formatTime(status.at)}`}
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
      render: (station) => {
        const status = deployStatus[station.id] ?? IDLE_STATUS
        return (
          <OutlinedButton
            type="button"
            className="inline-flex items-center gap-2"
            disabled={!canDeploy(station) || status.state === 'deploying'}
            onClick={() => handleDeploy(station)}
          >
            <UploadCloud size={14} />
            Distribuisci
          </OutlinedButton>
        )
      },
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
            {!group.enabled && (
              <StatusBadge
                dot="bg-muted-foreground"
                badge="border-border text-muted-foreground bg-muted/50"
                label="Disabilitato"
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
    </div>
  )
}
