import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  CellSelect,
  EditTablePanel,
  Search,
  type EditTableColumn,
  type FetchParams,
  type FetchResult,
} from '@/components'

type Row = { id: string; name: string; description: string; tag: string }

const TAGS = [
  { key: 'tag1', label: 'Tag 1' },
  { key: 'tag2', label: 'Tag 2' },
]

const ALL_DATA: Row[] = [...Array(100)].map((_, index) => ({
  id: (index + 1).toString(),
  name: `Variabile ${index + 1}`,
  description: `Description ${index + 1}`,
  tag: index % 2 === 0 ? 'tag1' : 'tag2',
}))

const TAG_OPTIONS = TAGS.map((t) => ({ value: t.key, label: t.label }))

const COLUMNS: EditTableColumn[] = [
  { key: 'id', label: 'ID', editable: false },
  { key: 'name', label: 'Nome' },
  { key: 'description', label: 'Descrizione' },
  {
    key: 'tag',
    label: 'Tag',
    renderFn: (value: string) =>
      TAGS.find((t) => t.key === value)?.label ?? '-',
    editRenderFn: (value, onCommit, onCancel) => (
      <CellSelect
        value={value}
        options={TAG_OPTIONS}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    ),
  },
]

export const TestPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState<null | string>(null)

  const fetchFn = useCallback(
    async ({ page, pageSize }: FetchParams): Promise<FetchResult<Row>> => {
      const filtered = ALL_DATA.filter((item) => {
        if (tag && item.tag !== tag) return false

        if (search) {
          const s = search.toLowerCase()
          if (
            !Object.values(item).some((v) =>
              String(v).toLowerCase().includes(s),
            )
          )
            return false
        }

        return true
      })

      return {
        data: filtered.slice(page * pageSize, (page + 1) * pageSize),
        total: filtered.length,
      }
    },
    [search, tag],
  )

  return (
    <EditTablePanel
      columns={COLUMNS}
      fetchFn={fetchFn}
      onSave={() => {}}
      filters={
        <>
          <Search value={search} onChange={setSearch} />

          <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
            {[
              { label: 'Tutti', value: null },
              ...TAGS.map((t) => ({ label: t.label, value: t.key })),
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setTag(value)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  tag === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      }
    />
  )
}
