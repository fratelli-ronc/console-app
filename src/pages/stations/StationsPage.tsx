import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Pencil, Copy, Trash2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterPills, PageHeader, ReloadButton, Search } from '@/components'
import {
  DataTable,
  type DataTableColumn,
  TextInput,
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
import {
  listStations,
  deleteStation,
  cloneStation,
  getNextStationId,
  Station,
} from '@/client'

const STATUS_FILTERS: {
  label: string
  value: 'all' | 'enabled' | 'disabled'
}[] = [
  { label: 'Tutti', value: 'all' },
  { label: 'Attiva', value: 'enabled' },
  { label: 'Disattiva', value: 'disabled' },
]

const StatusBadge: React.FC<{ enabled: boolean }> = ({ enabled }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        enabled ? 'bg-primary' : 'bg-muted-foreground',
      )}
    />
    {enabled ? 'Attiva' : 'Disattiva'}
  </span>
)

export const StationsPage: React.FC = () => {
  const navigate = useNavigate()

  const [stations, setStations] = useState<Station[] | null>(null)
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'enabled' | 'disabled'
  >('all')
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stationToClone, setStationToClone] = useState<Station | null>(null)
  const [cloneStationId, setCloneStationId] = useState('')
  const [cloneName, setCloneName] = useState('')
  const [cloning, setCloning] = useState(false)

  const fetchStations = async () => {
    const res = await listStations()
    if (res) setStations(res.sort((a, b) => a.stationId - b.stationId))
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchStations()
    setReloading(false)
  }

  const handleDelete = async () => {
    if (!stationToDelete) return
    setDeleting(true)
    const res = await deleteStation(stationToDelete.id)
    setDeleting(false)
    if (res !== null) {
      setStationToDelete(null)
      await fetchStations()
    }
  }

  // The proposed ID comes from the server: it counts soft-deleted stations,
  // which the list here cannot see.
  const openCloneDialog = async (station: Station) => {
    setStationToClone(station)
    setCloneStationId('')
    setCloneName(station.name ?? '')

    const res = await getNextStationId()
    if (res) setCloneStationId(String(res.stationId))
  }

  const handleClone = async () => {
    if (!stationToClone) return
    setCloning(true)
    const res = await cloneStation(stationToClone.id, {
      stationId: Number(cloneStationId),
      name: cloneName,
    })
    setCloning(false)
    if (res !== null) {
      setStationToClone(null)
      await fetchStations()
    }
  }

  useEffect(() => {
    fetchStations()
  }, [])

  const loading = stations === null

  const cloneIdTaken = (stations ?? []).some(
    (s) => String(s.stationId) === cloneStationId.trim(),
  )
  const cloneDisabled =
    cloning ||
    cloneStationId.trim() === '' ||
    cloneName.trim() === '' ||
    cloneIdTaken

  const filtered = (stations ?? []).filter((s) => {
    const q = search.toLowerCase()

    const matchesSearch =
      String(s.stationId).includes(q) ||
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.city ?? '').toLowerCase().includes(q) ||
      (s.address ?? '').toLowerCase().includes(q) ||
      (s.tel ?? '').includes(q)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' ? !!s.enabled : !s.enabled)

    return matchesSearch && matchesStatus
  })

  const columns: DataTableColumn<Station>[] = [
    {
      key: 'name',
      header: 'Nome',
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
      key: 'location',
      header: 'Ubicazione',
      cellClassName: 'text-muted-foreground',
      render: (station) => (
        <>
          <p>{station.city || '—'}</p>
          <p className="mt-1 text-sm">{station.address || '-'}</p>
        </>
      ),
    },
    {
      key: 'contacts',
      header: 'Contatti',
      cellClassName: 'text-muted-foreground',
      render: (station) => <p>{station.tel || '—'}</p>,
    },
    {
      key: 'tags',
      header: 'Tag',
      render: (station) =>
        station.tags.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {station.tags.map((tag) => (
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
      key: 'sms',
      header: 'SMS',
      cellClassName: 'text-muted-foreground',
      render: (station) => <p>{station.smsServer || '—'}</p>,
    },
    {
      key: 'ordPrint',
      header: 'Ord. stampa',
      cellClassName: 'text-muted-foreground',
      render: (station) => <p>{station.ordPrint ?? '—'}</p>,
    },
    {
      key: 'maintenance',
      header: 'Manut.',
      cellClassName: 'text-muted-foreground',
      render: (station) => (
        <p>
          {station.maintenanceMode === 'station'
            ? 'Stazione'
            : station.maintenanceMode === 'group'
              ? 'Gruppo'
              : '—'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Stato',
      render: (station) => <StatusBadge enabled={!!station.enabled} />,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (station) => (
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/stations/${station.id}`, {
                state: { name: station.name },
              })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Modifica
          </button>
          <button
            onClick={() => openCloneDialog(station)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <Copy size={12} />
            Clona
          </button>
          <button
            onClick={() => setStationToDelete(station)}
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
        title="Stazioni"
        subtitle="Gestisci e configura le stazioni."
        newLabel="Nuova stazione"
        onNewClick={() => navigate('/stations/new')}
        trailing={
          <OutlinedButton
            type="button"
            className="inline-flex items-center gap-2"
            onClick={() => navigate('/stations/station-tags')}
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
        getRowKey={(station) => station.id}
        emptyState={{
          icon: <Radio size={22} className="text-primary" />,
          title: 'Nessuna stazione trovata',
          description:
            'Prova a modificare la ricerca o aggiungi una nuova stazione.',
        }}
      />

      <Dialog
        open={stationToClone !== null}
        onOpenChange={(open) => !open && !cloning && setStationToClone(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clona stazione</DialogTitle>
            <DialogDescription>
              Verrà creata una copia di{' '}
              <span className="font-medium text-foreground">
                {stationToClone?.name || `ID ${stationToClone?.stationId}`}
              </span>
              , con tutti i suoi gruppi e le loro variabili. I dati sono
              identici all&apos;originale, solo gli ID vengono riassegnati.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <TextInput
              required
              label="ID stazione"
              value={cloneStationId}
              type="number"
              placeholder="1"
              disabled={cloning}
              onChange={setCloneStationId}
            />
            {cloneIdTaken && (
              <p className="-mt-2 text-xs text-destructive">
                Questo ID è già assegnato a un&apos;altra stazione.
              </p>
            )}

            <TextInput
              required
              label="Nome"
              value={cloneName}
              placeholder="Stazione Centrale"
              disabled={cloning}
              onChange={setCloneName}
            />
          </div>

          <DialogFooter>
            <TextButton
              type="button"
              disabled={cloning}
              onClick={() => setStationToClone(null)}
            >
              Annulla
            </TextButton>
            <FilledButton
              type="button"
              disabled={cloneDisabled}
              onClick={handleClone}
            >
              {cloning ? 'Clonazione…' : 'Clona'}
            </FilledButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={stationToDelete !== null}
        onOpenChange={(open) => !open && !deleting && setStationToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina stazione</DialogTitle>
            <DialogDescription>
              Stai per eliminare{' '}
              <span className="font-medium text-foreground">
                {stationToDelete?.name || `ID ${stationToDelete?.stationId}`}
              </span>
              , con tutti i suoi gruppi e le loro variabili. Questa azione non
              può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <TextButton
              type="button"
              disabled={deleting}
              onClick={() => setStationToDelete(null)}
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
