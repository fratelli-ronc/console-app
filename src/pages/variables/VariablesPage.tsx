import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  EditTablePanel,
  FilterPills,
  PageHeader,
  Search,
  SearchableSelect,
  type EditTableChanges,
  type EditTableColumn,
  type FetchParams,
  type FetchResult,
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

const CLASS_FILTERS: { label: string; value: string | null }[] = [
  { label: 'Tutte', value: null },
  ...VARIABLE_CLASS_TYPE_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as string | null,
  })),
]

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
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    listStations().then((res) => {
      if (res) setStations(res.sort((a, b) => a.stationId - b.stationId))
    })
    listGroups().then((res) => {
      if (res) setGroups(res.sort((a, b) => a.groupId - b.groupId))
    })
  }, [])

  // Debounce the search box so each keystroke doesn't hit the server.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const stationOptions = useMemo(
    () => [
      { value: '', label: 'Tutte le stazioni' },
      ...(stations ?? []).map((station) => ({
        value: String(station.id),
        label: station.name || `ID ${station.stationId}`,
      })),
    ],
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

  const handleStationChange = (value: string) => {
    setStationId(value)
    if (value && groupId) {
      const group = (groups ?? []).find((g) => String(g.id) === groupId)
      if (group && String(group.stationId ?? '') !== value) setGroupId('')
    }
  }

  const fetchFn = useCallback(
    async ({
      page,
      pageSize,
    }: FetchParams): Promise<FetchResult<VariableRow>> => {
      const res = await listVariables({
        groupId: groupId ? Number(groupId) : undefined,
        stationId: stationId ? Number(stationId) : undefined,
        classType: classType ?? undefined,
        search: search || undefined,
        page,
        pageSize,
      })
      if (!res) return { data: [], total: 0 }
      return { data: res.data.map(toRow), total: res.total }
    },
    [groupId, stationId, classType, search],
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
        onSave={handleSave}
        pageSize={50}
        deletable
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
                placeholder="Tutte le stazioni"
                searchPlaceholder="Cerca stazione…"
                emptyMessage="Nessuna stazione trovata."
                options={stationOptions}
              />

              <SearchableSelect
                className="w-48"
                value={groupId}
                onValueChange={setGroupId}
                placeholder="Tutti i gruppi"
                searchPlaceholder="Cerca gruppo…"
                emptyMessage="Nessun gruppo trovato."
                options={groupOptions}
              />

              <Search value={searchInput} onChange={setSearchInput} />
            </div>

            <div className="self-start">
              <FilterPills
                options={CLASS_FILTERS}
                value={classType}
                onChange={setClassType}
              />
            </div>
          </div>
        }
      />
    </div>
  )
}
