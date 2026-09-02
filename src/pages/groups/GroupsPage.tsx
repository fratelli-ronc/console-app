import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Pencil, Trash2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterPills, PageHeader, ReloadButton, Search } from '@/components'
import {
  DataTable,
  type DataTableColumn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FilledButton,
  OutlinedButton,
  TextButton,
} from '@/components'
import { listGroups, deleteGroup, listStations, Group, Station } from '@/client'
import { PROTOCOL_OPTIONS, NETWORK_TYPE_OPTIONS } from './components/GroupFormPage'

const STATUS_FILTERS: {
  label: string
  value: 'all' | 'enabled' | 'disabled'
}[] = [
  { label: 'Tutti', value: 'all' },
  { label: 'Attivo', value: 'enabled' },
  { label: 'Disattivo', value: 'disabled' },
]

const StatusBadge: React.FC<{ enabled: boolean }> = ({ enabled }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        enabled ? 'bg-primary' : 'bg-muted-foreground',
      )}
    />
    {enabled ? 'Attivo' : 'Disattivo'}
  </span>
)

const protocolLabel = (value: string) =>
  PROTOCOL_OPTIONS.find((opt) => opt.value === value)?.label ?? value

const networkTypeLabel = (value: string) =>
  NETWORK_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? value

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate()

  const [groups, setGroups] = useState<Group[] | null>(null)
  const [stationsById, setStationsById] = useState<Map<number, Station>>(
    new Map(),
  )
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'enabled' | 'disabled'
  >('all')
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchGroups = async () => {
    const [groupsRes, stationsRes] = await Promise.all([
      listGroups(),
      listStations(),
    ])
    if (groupsRes) setGroups(groupsRes.sort((a, b) => a.groupId - b.groupId))
    if (stationsRes)
      setStationsById(new Map(stationsRes.map((s) => [s.id, s])))
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchGroups()
    setReloading(false)
  }

  const handleDelete = async () => {
    if (!groupToDelete) return
    setDeleting(true)
    const res = await deleteGroup(groupToDelete.id)
    setDeleting(false)
    if (res !== null) {
      setGroupToDelete(null)
      await fetchGroups()
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const loading = groups === null

  const filtered = (groups ?? []).filter((g) => {
    const q = search.toLowerCase()
    const station = g.stationId != null ? stationsById.get(g.stationId) : null

    const matchesSearch =
      String(g.groupId).includes(q) ||
      (g.name ?? '').toLowerCase().includes(q) ||
      (g.ipAddress ?? '').includes(q) ||
      (station?.name ?? '').toLowerCase().includes(q)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' ? !!g.enabled : !g.enabled)

    return matchesSearch && matchesStatus
  })

  const columns: DataTableColumn<Group>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (group) => (
        <>
          <div className="font-medium text-foreground">
            {group.name || '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            ID {group.groupId}
          </div>
        </>
      ),
    },
    {
      key: 'station',
      header: 'Stazione',
      cellClassName: 'text-muted-foreground',
      render: (group) => {
        const station =
          group.stationId != null ? stationsById.get(group.stationId) : null
        return station ? (
          <span>{station.name || `ID ${station.stationId}`}</span>
        ) : (
          <span>—</span>
        )
      },
    },
    {
      key: 'connection',
      header: 'Connessione',
      cellClassName: 'text-muted-foreground',
      render: (group) => (
        <>
          <p>{protocolLabel(group.protocol)}</p>
          <p className="mt-1 text-sm">
            {group.ipAddress
              ? `${group.ipAddress}${group.portNumber ? `:${group.portNumber}` : ''}`
              : '—'}
          </p>
        </>
      ),
    },
    {
      key: 'network',
      header: 'Rete',
      cellClassName: 'text-muted-foreground',
      render: (group) => <p>{networkTypeLabel(group.networkType)}</p>,
    },
    {
      key: 'tags',
      header: 'Tag',
      render: (group) =>
        group.tags.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {group.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ),
    },
    {
      key: 'ordPrint',
      header: 'Ord. stampa',
      cellClassName: 'text-muted-foreground',
      render: (group) => <p>{group.ordPrint ?? '—'}</p>,
    },
    {
      key: 'status',
      header: 'Stato',
      render: (group) => <StatusBadge enabled={!!group.enabled} />,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (group) => (
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/groups/${group.id}`, {
                state: { name: group.name },
              })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Modifica
          </button>
          <button
            onClick={() => setGroupToDelete(group)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            Elimina
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gruppi"
        subtitle="Gestisci e configura i gruppi delle stazioni."
        newLabel="Nuovo gruppo"
        onNewClick={() => navigate('/groups/new')}
        trailing={
          <OutlinedButton
            type="button"
            className="inline-flex items-center gap-2"
            onClick={() => navigate('/groups/group-tags')}
          >
            <Tag size={16} />
            Gestisci tag
          </OutlinedButton>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <FilterPills
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <ReloadButton isReloading={reloading} onReload={handleReload} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowKey={(group) => group.id}
        emptyState={{
          icon: <Boxes size={22} className="text-primary" />,
          title: 'Nessun gruppo trovato',
          description:
            'Prova a modificare la ricerca o aggiungi un nuovo gruppo.',
        }}
      />

      <Dialog
        open={groupToDelete !== null}
        onOpenChange={(open) => !open && !deleting && setGroupToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina gruppo</DialogTitle>
            <DialogDescription>
              Stai per eliminare{' '}
              <span className="font-medium text-foreground">
                {groupToDelete?.name || `ID ${groupToDelete?.groupId}`}
              </span>
              . Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <TextButton
              type="button"
              disabled={deleting}
              onClick={() => setGroupToDelete(null)}
            >
              Annulla
            </TextButton>
            <FilledButton
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting ? 'Eliminazione…' : 'Elimina'}
            </FilledButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
