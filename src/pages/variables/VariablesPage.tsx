import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  EditTablePanel,
  PageHeader,
  Search,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type EditTableChanges,
  type EditTableColumn,
} from '@/components'
import {
  Group,
  Station,
  UpdateVariableRequest,
  Variable,
  VariableBatchRequest,
  VARIABLE_CLASS_TYPE_OPTIONS,
  VARIABLE_DRIVER_OPTIONS,
  VARIABLE_FORMAT_OPTIONS,
  listGroups,
  listStations,
  listVariables,
  saveVariablesBatch,
} from '@/client'

// Flattened, grid-editable projection of a Variable. The remaining fields
// (graphGroup, k, exponent, note, history, memory map, image, presentations…)
// are reserved for a future per-variable detail view.
type VariableRow = {
  id: number | null
  variableId: number | null
  groupId: number | null
  name: string | null
  classType: string | null
  format: string | null
  driver: string | null
  measureUnit: string | null
  ordPrint: number | null
  minValue: number | null
  maxValue: number | null
  enableLogs: boolean
  cumul: boolean
  hidden: boolean
  preview: boolean
  tags: string
}

const toRow = (variable: Variable): VariableRow => ({
  id: variable.id,
  variableId: variable.variableId,
  groupId: variable.groupId,
  name: variable.name,
  classType: variable.classType,
  format: variable.format,
  driver: variable.driver,
  measureUnit: variable.measureUnit,
  ordPrint: variable.ordPrint,
  minValue: variable.minValue,
  maxValue: variable.maxValue,
  enableLogs: variable.enableLogs ?? false,
  cumul: variable.cumul ?? false,
  hidden: variable.hidden ?? false,
  preview: variable.preview ?? false,
  tags: variable.tags?.join(', ') ?? '',
})

const parseTags = (raw: string): string[] =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

const toFields = (row: VariableRow): UpdateVariableRequest => ({
  groupId: row.groupId,
  name: row.name,
  classType: row.classType,
  format: row.format,
  driver: row.driver,
  measureUnit: row.measureUnit,
  ordPrint: row.ordPrint,
  minValue: row.minValue,
  maxValue: row.maxValue,
  enableLogs: row.enableLogs,
  cumul: row.cumul,
  hidden: row.hidden,
  preview: row.preview,
  tags: parseTags(row.tags),
})

// Sentinel for the "no class filter" option — Radix Select can't use an
// empty-string value.
const ALL_CLASSES = 'all'

const COLUMNS: EditTableColumn<VariableRow>[] = [
  {
    key: 'variableId',
    label: 'ID Var',
    width: '5.5rem',
    editable: false,
    renderFn: (value) =>
      value == null ? (
        <span className="italic opacity-60">auto</span>
      ) : (
        String(value)
      ),
  },
  { key: 'name', label: 'Nome', width: '14rem' },
  {
    key: 'classType',
    label: 'Classe',
    width: '8.5rem',
    type: 'select',
    options: VARIABLE_CLASS_TYPE_OPTIONS,
  },
  {
    key: 'format',
    label: 'Formato',
    width: '8.5rem',
    type: 'select',
    options: VARIABLE_FORMAT_OPTIONS,
  },
  {
    key: 'driver',
    label: 'Driver',
    width: '10rem',
    type: 'select',
    options: VARIABLE_DRIVER_OPTIONS,
  },
  { key: 'measureUnit', label: 'U.M.', width: '5.5rem' },
  { key: 'ordPrint', label: 'Ord.', width: '5rem', type: 'number' },
  { key: 'minValue', label: 'Min', width: '6rem', type: 'number' },
  { key: 'maxValue', label: 'Max', width: '6rem', type: 'number' },
  { key: 'enableLogs', label: 'Log', width: '4.5rem', type: 'boolean' },
  { key: 'cumul', label: 'Cumul.', width: '5rem', type: 'boolean' },
  { key: 'hidden', label: 'Nascosta', width: '6rem', type: 'boolean' },
  { key: 'preview', label: 'Anteprima', width: '6.5rem', type: 'boolean' },
  { key: 'tags', label: 'Tag', width: '12rem' },
]

export const VariablesPage: React.FC = () => {
  const [stations, setStations] = useState<Station[] | null>(null)
  const [groups, setGroups] = useState<Group[] | null>(null)

  const [stationId, setStationId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [classType, setClassType] = useState<string | null>(null)
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')

  // Every tag present in the currently-loaded (station/group-scoped) rows,
  // sorted — the option list for the tag filter.
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    listStations().then((res) => {
      if (res) setStations(res.sort((a, b) => a.stationId - b.stationId))
    })
    listGroups().then((res) => {
      if (res) setGroups(res.sort((a, b) => a.groupId - b.groupId))
    })
  }, [])

  // Drop the tag filter when the new scope has no such tag.
  useEffect(() => {
    if (tag && !availableTags.includes(tag)) setTag('')
  }, [availableTags, tag])

  const stationOptions = useMemo(
    () =>
      (stations ?? []).map((station) => ({
        value: String(station.id),
        label: station.name || `ID ${station.stationId}`,
      })),
    [stations],
  )

  const groupOptions = useMemo(
    () => [
      { value: '', label: 'Tutti i gruppi' },
      ...(groups ?? [])
        .filter(
          (group) =>
            stationId === '' || String(group.stationId ?? '') === stationId,
        )
        .map((group) => ({
          value: String(group.id),
          label: group.name || `ID ${group.groupId}`,
        })),
    ],
    [groups, stationId],
  )

  const tagOptions = useMemo(
    () => [
      { value: '', label: 'Tutti i tag' },
      ...availableTags.map((t) => ({ value: t, label: t })),
    ],
    [availableTags],
  )

  const handleStationChange = (value: string) => {
    setStationId(value)
    if (value && groupId) {
      const group = (groups ?? []).find((g) => String(g.id) === groupId)
      if (group && String(group.stationId ?? '') !== value) setGroupId('')
    }
  }

  // Picking a group also selects its station, so the table always stays
  // scoped to one station.
  const handleGroupChange = (value: string) => {
    setGroupId(value)
    if (value) {
      const group = (groups ?? []).find((g) => String(g.id) === value)
      if (group?.stationId != null) setStationId(String(group.stationId))
    }
  }

  // The grid is scoped to a station (or group) — no pagination, so we
  // never fetch the unfiltered variable set.
  const hasScope = stationId !== '' || groupId !== ''

  // One fetch per scope. Class / search / tag filtering is all client-side
  // (see filterFn) so tweaking a filter never refetches or drops edits.
  const fetchFn = useCallback(async (): Promise<VariableRow[]> => {
    if (!hasScope) {
      setAvailableTags([])
      return []
    }
    const res = await listVariables({
      groupId: groupId ? Number(groupId) : undefined,
      stationId: stationId ? Number(stationId) : undefined,
    })
    if (!res) return []

    const tags = new Set<string>()
    res.data.forEach((v) => v.tags?.forEach((t) => tags.add(t)))
    setAvailableTags([...tags].sort((a, b) => a.localeCompare(b)))

    return res.data.map(toRow)
  }, [hasScope, groupId, stationId])

  const filterFn = useCallback(
    (row: VariableRow) => {
      if (classType && row.classType !== classType) return false
      if (tag && !parseTags(row.tags).includes(tag)) return false
      if (search) {
        const q = search.trim().toLowerCase()
        const name = row.name?.toLowerCase() ?? ''
        const id = row.variableId == null ? '' : String(row.variableId)
        if (!name.includes(q) && !id.includes(q)) return false
      }
      return true
    },
    [classType, tag, search],
  )

  const handleSave = useCallback(
    async (changes: EditTableChanges<VariableRow>) => {
      const payload: VariableBatchRequest = {
        create: changes.created.map(toFields),
        update: changes.updated.map((row) => ({
          id: row.id as number,
          ...toFields(row),
        })),
        delete: changes.deleted.map(Number),
      }

      const res = await saveVariablesBatch(payload)
      if (!res) return false // keep the grid dirty so nothing is lost

      toast.success('Variabili salvate')
    },
    [],
  )

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader
        title="Variabili"
        subtitle="Gestisci le variabili dei gruppi."
      />

      <EditTablePanel<VariableRow>
        className="flex-1 min-h-0"
        columns={COLUMNS}
        fetchFn={fetchFn}
        filterFn={filterFn}
        onSave={handleSave}
        deletable
        emptyMessage={
          hasScope
            ? 'Nessuna variabile trovata.'
            : 'Seleziona una stazione per visualizzare le variabili.'
        }
        addLabel="Aggiungi variabile"
        addDisabled={!groupId}
        newRow={() => ({
          id: null,
          variableId: null,
          groupId: groupId ? Number(groupId) : null,
          name: '',
          classType: 'analog',
          format: null,
          driver: null,
          measureUnit: null,
          ordPrint: null,
          minValue: null,
          maxValue: null,
          enableLogs: false,
          cumul: false,
          hidden: false,
          preview: false,
          tags: '',
        })}
        filters={
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <SearchableSelect
                className="w-48"
                value={stationId}
                onValueChange={handleStationChange}
                placeholder="Seleziona stazione"
                searchPlaceholder="Cerca stazione…"
                emptyMessage="Nessuna stazione trovata."
                options={stationOptions}
              />

              <SearchableSelect
                className="w-48"
                value={groupId}
                onValueChange={handleGroupChange}
                placeholder="Tutti i gruppi"
                searchPlaceholder="Cerca gruppo…"
                emptyMessage="Nessun gruppo trovato."
                options={groupOptions}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Search value={search} onChange={setSearch} />

              <Select
                value={classType ?? ALL_CLASSES}
                onValueChange={(v) =>
                  setClassType(v === ALL_CLASSES ? null : v)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLASSES}>Tutte le classi</SelectItem>
                  {VARIABLE_CLASS_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <SearchableSelect
                className="w-48"
                value={tag}
                onValueChange={setTag}
                placeholder="Tutti i tag"
                searchPlaceholder="Cerca tag…"
                emptyMessage="Nessun tag."
                options={tagOptions}
              />
            </div>
          </div>
        }
      />
    </div>
  )
}
