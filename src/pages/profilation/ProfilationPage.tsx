import { useEffect, useState } from 'react'
import { RefreshCw, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterPills, PageHeader, Search } from '@/components'
import { DataTable, type DataTableColumn } from '@/components'
import { listProfilations, UserProfilation } from '@/client'

const ACCESS_FILTERS: {
  label: string
  value: 'all' | 'full' | 'limited'
}[] = [
  { label: 'Tutti', value: 'all' },
  { label: 'Completo', value: 'full' },
  { label: 'Limitato', value: 'limited' },
]

const ScopeBadge: React.FC<{ allowAll: boolean }> = ({ allowAll }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        allowAll ? 'bg-primary' : 'bg-muted-foreground',
      )}
    />
    {allowAll ? 'Completo' : 'Limitato'}
  </span>
)

export const ProfilationPage: React.FC = () => {
  const [profilations, setProfilations] = useState<UserProfilation[] | null>(
    null,
  )
  const [reloading, setReloading] = useState(false)
  const [search, setSearch] = useState('')
  const [accessFilter, setAccessFilter] = useState<'all' | 'full' | 'limited'>(
    'all',
  )

  const fetchProfilations = async () => {
    const res = await listProfilations()
    if (res) setProfilations(res)
  }

  const handleReload = async () => {
    setReloading(true)
    await fetchProfilations()
    setReloading(false)
  }

  useEffect(() => {
    fetchProfilations()
  }, [])

  const loading = profilations === null

  const filtered = (profilations ?? []).filter((p) => {
    const q = search.toLowerCase()

    const matchesSearch =
      p.user.username.toLowerCase().includes(q) ||
      p.user.name.toLowerCase().includes(q)
    const matchesAccess =
      accessFilter === 'all' ||
      (accessFilter === 'full' ? p.scope.allowAll : !p.scope.allowAll)

    return matchesSearch && matchesAccess
  })

  const columns: DataTableColumn<UserProfilation>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (p) => (
        <>
          <div className="font-medium text-foreground">{p.user.name}</div>
          <div className="text-xs text-muted-foreground">{p.user.username}</div>
        </>
      ),
    },
    {
      key: 'scope',
      header: 'Accesso',
      render: (p) => <ScopeBadge allowAll={p.scope.allowAll} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profilazione"
        subtitle="Gestisci la profilazione degli utenti."
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <FilterPills
          options={ACCESS_FILTERS}
          value={accessFilter}
          onChange={setAccessFilter}
        />

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
        getRowKey={(p) => p.user.id}
        emptyState={{
          icon: <UserCog size={22} className="text-primary" />,
          title: 'Nessuna profilazione trovata',
          description: 'Prova a modificare la ricerca.',
        }}
      />
    </div>
  )
}
