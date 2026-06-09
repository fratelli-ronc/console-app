import { useCallback, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EditTable,
  FilledButton,
  TextButton,
  type EditTableHandle,
} from '@/components'
import type {
  FetchParams,
  FetchResult,
} from '@/components/ui/EditTable/EditTable'

type Row = { id: string; name: string; tag: string }

const TAGS = [
  { key: 'tag1', label: 'Tag 1' },
  { key: 'tag2', label: 'Tag 2' },
]

const ALL_DATA: Row[] = [...Array(100)].map((_, index) => ({
  id: (index + 1).toString(),
  name: `Variabile ${index + 1}`,
  tag: index % 2 === 0 ? 'tag1' : 'tag2',
}))

export const TestPage: React.FC = () => {
  const tableRef = useRef<EditTableHandle>(null)

  const [search, setSearch] = useState('')
  const [tag, setTag] = useState<null | string>(null)
  const [isDirty, setIsDirty] = useState(false)

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
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center gap-3 ">
        <div className="relative flex-1 max-w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />

          <input
            type="text"
            placeholder="Cerca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
          {[
            { label: 'Tutti', value: null },
            ...TAGS.map((t) => ({ label: t.label, value: t.key })),
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setTag(value)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                tag === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <TextButton
          type="button"
          disabled={!isDirty}
          onClick={() => tableRef.current?.discard()}
          className="ml-auto"
        >
          Annulla
        </TextButton>

        <FilledButton
          type="button"
          disabled={!isDirty}
          onClick={() => tableRef.current?.save()}
        >
          Salva
        </FilledButton>
      </div>

      <EditTable
        ref={tableRef}
        className="flex-1 min-h-0"
        columns={[
          { key: 'id', label: 'ID', editable: false },
          { key: 'name', label: 'Nome' },
          { key: 'tag', label: 'Tag' },
        ]}
        fetchFn={fetchFn}
        onSave={() => {}}
        onDirtyChange={setIsDirty}
      />
    </div>
  )
}
