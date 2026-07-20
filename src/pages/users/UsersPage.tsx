import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Users, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader, Search } from '@/components'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FilledButton,
  TextButton,
} from '@/components'
import { listUsers, deleteUser, AuthUser, UserAuthLevel } from '@/client'
import { ROLE_LABELS } from '@/data'

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

const TableSkeleton: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-0">
        {Array.from({ length: 5 }).map((_, j) => (
          <td key={j} className="px-4 py-7">
            <div
              className="h-4 bg-muted rounded animate-pulse"
              style={{ width: j === 0 ? '60%' : j === 1 ? '80%' : '50%' }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
)

export const UsersPage: React.FC = () => {
  const navigate = useNavigate()

  const [users, setUsers] = useState<AuthUser[] | null>(null)
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
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

    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utenti"
        subtitle="Gestisci gli utenti e i loro permessi di accesso."
        newLabel="Nuovo utente"
        onNewClick={() => navigate('/users/new')}
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
      {!loading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Users size={22} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Nessun utente trovato
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Prova a modificare la ricerca o aggiungi un nuovo utente.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Contatti
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Ruolo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Stato
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <TableSkeleton />
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      <p>{user.email || '—'}</p>

                      <p className="mt-1 text-sm">{user.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge level={user.authorization} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge enabled={user.enabled} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
