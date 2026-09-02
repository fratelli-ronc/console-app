import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  FilterPills,
  PageHeader,
  ReloadButton,
  Search,
  SyncStatusIndicator,
} from '@/components'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextButton,
} from '@/components'
import { listUsers, deleteUser, AuthUser, UserAuthLevel } from '@/client'
import { ROLE_LABELS, ROLE_LEVELS } from '@/data'
import { useUserStore } from '@/store'

const STATUS_FILTERS: {
  label: string
  value: 'all' | 'enabled' | 'disabled'
}[] = [
  { label: 'Tutti', value: 'all' },
  { label: 'Attivo', value: 'enabled' },
  { label: 'Disattivo', value: 'disabled' },
]

const RoleBadge: React.FC<{ level: UserAuthLevel }> = ({ level }) => {
  const { label, className } = ROLE_LABELS[level]
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-md text-xs font-medium',
        className,
      )}
    >
      {label}
    </span>
  )
}

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

export const UsersPage: React.FC = () => {
  const navigate = useNavigate()

  const currentUser = useUserStore((s) => s.user)
  const canViewSyncStatus =
    !!currentUser && currentUser.authorization >= UserAuthLevel.Admin

  const [users, setUsers] = useState<AuthUser[] | null>(null)
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserAuthLevel | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'enabled' | 'disabled'
  >('all')
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    const res = await listUsers()
    if (res)
      setUsers(
        res.sort((a, b) =>
          a.authorization > b.authorization
            ? -1
            : a.authorization < b.authorization
              ? 1
              : 0,
        ),
      )
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchUsers()
    setReloading(false)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    const res = await deleteUser(userToDelete.id)
    setDeleting(false)
    if (res !== null) {
      setUserToDelete(null)
      await fetchUsers()
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const loading = users === null

  const filtered = (users ?? []).filter((u) => {
    const q = search.toLowerCase()

    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    const matchesRole = roleFilter === 'all' || u.authorization === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' ? u.enabled : !u.enabled)

    return matchesSearch && matchesRole && matchesStatus
  })

  const columns: DataTableColumn<AuthUser>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (user) => (
        <>
          <div className="font-medium text-foreground">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.username}</div>
        </>
      ),
    },
    {
      key: 'contacts',
      header: 'Contatti',
      cellClassName: 'text-muted-foreground',
      render: (user) => (
        <>
          <p>{user.email || '—'}</p>
          <p className="mt-1 text-sm">{user.phone || '-'}</p>
        </>
      ),
    },
    {
      key: 'role',
      header: 'Ruolo',
      render: (user) => <RoleBadge level={user.authorization} />,
    },
    {
      key: 'status',
      header: 'Stato',
      render: (user) => <StatusBadge enabled={user.enabled} />,
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (user) => (
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/users/${user.id}`, { state: { name: user.name } })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Modifica
          </button>
          <button
            onClick={() => setUserToDelete(user)}
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
        title="Utenti"
        subtitle="Gestisci gli utenti e i loro permessi di accesso."
        newLabel="Nuovo utente"
        onNewClick={() => navigate('/users/new')}
        trailing={canViewSyncStatus ? <SyncStatusIndicator /> : undefined}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <Select
          value={String(roleFilter)}
          onValueChange={(v) =>
            setRoleFilter(v === 'all' ? 'all' : (Number(v) as UserAuthLevel))
          }
        >
          <SelectTrigger className="w-72 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i ruoli</SelectItem>
            {ROLE_LEVELS.map((level) => (
              <SelectItem key={level} value={String(level)}>
                {ROLE_LABELS[level].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
        getRowKey={(user) => user.id}
        emptyState={{
          icon: <Users size={22} className="text-primary" />,
          title: 'Nessun utente trovato',
          description:
            'Prova a modificare la ricerca o aggiungi un nuovo utente.',
        }}
      />

      <Dialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && !deleting && setUserToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina utente</DialogTitle>
            <DialogDescription>
              Stai per eliminare{' '}
              <span className="font-medium text-foreground">
                {userToDelete?.name}
              </span>
              . Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <TextButton
              type="button"
              disabled={deleting}
              onClick={() => setUserToDelete(null)}
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
