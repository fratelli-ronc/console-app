import { useEffect, useState } from 'react'
import { Tag, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, ReloadButton, Search } from '@/components'
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
  TextButton,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components'
import {
  listStationTagsDetailed,
  deleteStationTag,
  StationTagDetailed,
} from '@/client'
import { TagFormDialog } from './components/TagFormDialog'

export const StationTagsPage: React.FC = () => {
  const [tags, setTags] = useState<StationTagDetailed[] | null>(null)
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')

  const [formTag, setFormTag] = useState<StationTagDetailed | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const [tagToDelete, setTagToDelete] = useState<StationTagDetailed | null>(
    null,
  )
  const [deleting, setDeleting] = useState(false)

  const fetchTags = async () => {
    const res = await listStationTagsDetailed()
    if (res) setTags(res.sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchTags()
    setReloading(false)
  }

  const handleDelete = async () => {
    if (!tagToDelete) return
    setDeleting(true)
    const res = await deleteStationTag(tagToDelete.id)
    setDeleting(false)
    if (res !== null) {
      setTagToDelete(null)
      await fetchTags()
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const loading = tags === null

  const filtered = (tags ?? []).filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<StationTagDetailed>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (tag) => (
        <div className="font-medium text-foreground">{tag.name}</div>
      ),
    },
    {
      key: 'stations',
      header: 'Stazioni',
      render: (tag) =>
        tag.stations.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <HoverCard openDelay={100}>
            <HoverCardTrigger asChild>
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-medium bg-muted text-muted-foreground cursor-default">
                {tag.stations.length}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-auto max-w-xs p-3">
              <p className="text-xs font-semibold text-foreground mb-1.5">
                Stazioni assegnate
              </p>
              <div className="flex flex-wrap gap-1">
                {tag.stations.map((station) => (
                  <span
                    key={station.id}
                    className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground"
                  >
                    {station.name || `ID ${station.id}`}
                  </span>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        ),
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (tag) => (
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => {
              setFormTag(tag)
              setFormOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Rinomina
          </button>
          <button
            onClick={() => setTagToDelete(tag)}
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
        title="Tag Stazioni"
        subtitle="Gestisci i tag utilizzati per organizzare le stazioni."
        newLabel="Nuovo tag"
        onNewClick={() => {
          setFormTag(null)
          setFormOpen(true)
        }}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <ReloadButton isReloading={reloading} onReload={handleReload} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowKey={(tag) => tag.id}
        emptyState={{
          icon: <Tag size={22} className="text-primary" />,
          title: 'Nessun tag trovato',
          description: 'Prova a modificare la ricerca o crea un nuovo tag.',
        }}
      />

      <TagFormDialog
        open={formOpen}
        tag={formTag}
        onOpenChange={setFormOpen}
        onSaved={fetchTags}
      />

      <Dialog
        open={tagToDelete !== null}
        onOpenChange={(open) => !open && !deleting && setTagToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina tag</DialogTitle>
            <DialogDescription>
              Stai per eliminare il tag{' '}
              <span className="font-medium text-foreground">
                {tagToDelete?.name}
              </span>
              .{' '}
              {tagToDelete && tagToDelete.stations.length > 0 && (
                <>
                  È utilizzato da {tagToDelete.stations.length}{' '}
                  {tagToDelete.stations.length === 1 ? 'stazione' : 'stazioni'}{' '}
                  (
                  {tagToDelete.stations
                    .map((s) => s.name || `ID ${s.id}`)
                    .join(', ')}
                  ) e verrà rimosso automaticamente da tutte.{' '}
                </>
              )}
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <TextButton
              type="button"
              disabled={deleting}
              onClick={() => setTagToDelete(null)}
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
