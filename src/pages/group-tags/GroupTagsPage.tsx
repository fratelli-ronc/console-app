import { useEffect, useState } from 'react'
import { RefreshCw, Tag, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader, Search } from '@/components'
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
  listGroupTagsDetailed,
  deleteGroupTag,
  GroupTagDetailed,
} from '@/client'
import { GroupTagFormDialog } from './components/GroupTagFormDialog'

export const GroupTagsPage: React.FC = () => {
  const [tags, setTags] = useState<GroupTagDetailed[] | null>(null)
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')

  const [formTag, setFormTag] = useState<GroupTagDetailed | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const [tagToDelete, setTagToDelete] = useState<GroupTagDetailed | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTags = async () => {
    const res = await listGroupTagsDetailed()
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
    const res = await deleteGroupTag(tagToDelete.id)
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

  const columns: DataTableColumn<GroupTagDetailed>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (tag) => (
        <div className="font-medium text-foreground">{tag.name}</div>
      ),
    },
    {
      key: 'groups',
      header: 'Gruppi',
      render: (tag) =>
        tag.groups.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <HoverCard openDelay={100}>
            <HoverCardTrigger asChild>
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-medium bg-muted text-muted-foreground cursor-default">
                {tag.groups.length}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-auto max-w-xs p-3">
              <p className="text-xs font-semibold text-foreground mb-1.5">
                Gruppi assegnati
              </p>
              <div className="flex flex-wrap gap-1">
                {tag.groups.map((group) => (
                  <span
                    key={group.id}
                    className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground"
                  >
                    {group.name || `ID ${group.id}`}
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
        title="Tag Gruppi"
        subtitle="Gestisci i tag utilizzati per organizzare i gruppi."
        newLabel="Nuovo tag"
        onNewClick={() => {
          setFormTag(null)
          setFormOpen(true)
        }}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <button
          onClick={handleReload}
          className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={cn(reloading && 'animate-spin')} />
          Aggiorna
        </button>
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

      <GroupTagFormDialog
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
              {tagToDelete && tagToDelete.groups.length > 0 && (
                <>
                  È utilizzato da {tagToDelete.groups.length}{' '}
                  {tagToDelete.groups.length === 1 ? 'gruppo' : 'gruppi'} (
                  {tagToDelete.groups
                    .map((g) => g.name || `ID ${g.id}`)
                    .join(', ')}
                  ) e verrà rimosso automaticamente da tutti.{' '}
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
