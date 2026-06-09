import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Users, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader, Search } from '@/components'
import { MOCK_USERS, User } from './mockUsers'

const RoleBadge: React.FC<{ ruolo: User['ruolo'] }> = ({ ruolo }) => {
  const colors: Record<User['ruolo'], string> = {
    Admin: 'bg-primary/10 text-primary',
    Operatore: 'bg-secondary/20 text-amber-700',
    Lettore: 'bg-muted text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-md text-xs font-medium',
        colors[ruolo],
      )}
    >
      {ruolo}
    </span>
  )
}

const StatusBadge: React.FC<{ attivo: boolean }> = ({ attivo }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        attivo ? 'bg-primary' : 'bg-muted-foreground',
      )}
    />
    {attivo ? 'Attivo' : 'Disattivo'}
  </span>
)

const TableSkeleton: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-0">
        {Array.from({ length: 5 }).map((_, j) => (
          <td key={j} className="px-4 py-[20.5px]">
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

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)

    await new Promise((r) => setTimeout(r, 600))

    setUsers(MOCK_USERS)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()

    return (
      u.nome.toLowerCase().includes(q) ||
      u.cognome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
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
          onClick={fetchUsers}
          className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
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
                  Email
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
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {user.nome} {user.cognome}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge ruolo={user.ruolo} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge attivo={user.attivo} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/users/${user.id}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground border border-border transition-colors"
                      >
                        <Pencil size={12} />
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
