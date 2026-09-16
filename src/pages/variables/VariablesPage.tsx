import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRightLeft, ChevronDown, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EditTablePanel,
  FilledButton,
  OutlinedButton,
  PageHeader,
  Search,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextButton,
  useConfirm,
  type EditTableChanges,
  type EditTableColumn,
  type EditTablePanelHandle,
  type EditTableSelectOption,
  type RowKey,
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
  VARIABLE_HISTORY_AGGREGATION_POLICY_OPTIONS,
  VARIABLE_HISTORY_TRIGGER_TYPE_OPTIONS,
  VARIABLE_IMAGE_AUTH_TYPE_OPTIONS,
  VARIABLE_MEMORY_MAP_FUNC_TYPE_OPTIONS,
  VARIABLE_MEMORY_MAP_FUNC_TYPE_WRITE_OPTIONS,
  deleteVariables,
  listGroups,
  listStations,
  listVariables,
  saveVariablesBatch,
  transferVariables,
} from '@/client'

// Flattened, grid-editable projection of a Variable — including the 1:1
// history / memory-map / image sub-records (hist*/mm*/img* fields). The
// remaining variable fields (graphGroup, k, exponent, note, presentations…)
// are reserved for a future per-variable detail view.
type VariableRow = {
  id: number | null
  variableId: number | null
  groupId: string
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
  // history
  histEnabled: boolean
  histTriggerType: string | null
  histAggregationPolicy: string | null
  histIntervalNumber: number | null
  histIntervalText: string | null
  histNLogsMax: number | null
  // memory map
  mmFuncType: string | null
  mmFuncTypeWrite: string | null
  mmMemAddress: number | null
  mmMemQuantity: number | null
  mmBitId: number | null
  mmPage: number | null
  mmTariff: number | null
  mmVarType: string | null
  mmChannelMx3: string | null
  mmChunkGrouping: number | null
  // image
  imgSnapshotPath: string | null
  imgGoToPresetPath: string | null
  imgSnapshotDelay: number | null
  imgAuthType: string | null
  imgAuthUser: string | null
  imgAuthPassword: string | null
}

const toRow = (variable: Variable): VariableRow => ({
  id: variable.id,
  variableId: variable.variableId,
  groupId: variable.groupId == null ? '' : String(variable.groupId),
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
  histEnabled: variable.history?.enabled ?? false,
  histTriggerType: variable.history?.triggerType ?? null,
  histAggregationPolicy: variable.history?.aggregationPolicy ?? null,
  histIntervalNumber: variable.history?.intervalNumber ?? null,
  histIntervalText: variable.history?.intervalText ?? null,
  histNLogsMax: variable.history?.nLogsMax ?? null,
  mmFuncType: variable.memoryMap?.funcType ?? null,
  mmFuncTypeWrite: variable.memoryMap?.funcTypeWrite ?? null,
  mmMemAddress: variable.memoryMap?.memAddress ?? null,
  mmMemQuantity: variable.memoryMap?.memQuantity ?? null,
  mmBitId: variable.memoryMap?.bitId ?? null,
  mmPage: variable.memoryMap?.page ?? null,
  mmTariff: variable.memoryMap?.tariff ?? null,
  mmVarType: variable.memoryMap?.varType ?? null,
  mmChannelMx3: variable.memoryMap?.channelMx3 ?? null,
  mmChunkGrouping: variable.memoryMap?.chunkGrouping ?? null,
  imgSnapshotPath: variable.image?.snapshotPath ?? null,
  imgGoToPresetPath: variable.image?.goToPresetPath ?? null,
  imgSnapshotDelay: variable.image?.snapshotDelay ?? null,
  imgAuthType: variable.image?.auth?.type ?? null,
  imgAuthUser: variable.image?.auth?.user ?? null,
  imgAuthPassword: variable.image?.auth?.password ?? null,
})

const parseTags = (raw: string): string[] =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

// A blank grid cell means "no value" — send it as null so the API clears
// the column (an omitted field is left unchanged, an explicit null clears).
const blankToNull = (value: string | null): string | null => value || null

const toFields = (row: VariableRow): UpdateVariableRequest => ({
  groupId: row.groupId ? Number(row.groupId) : null,
  name: blankToNull(row.name),
  classType: blankToNull(row.classType),
  format: blankToNull(row.format),
  driver: blankToNull(row.driver),
  measureUnit: blankToNull(row.measureUnit),
  ordPrint: row.ordPrint,
  minValue: row.minValue,
  maxValue: row.maxValue,
  enableLogs: row.enableLogs,
  cumul: row.cumul,
  hidden: row.hidden,
  preview: row.preview,
  tags: parseTags(row.tags),
  history: {
    enabled: row.histEnabled,
    triggerType: blankToNull(row.histTriggerType),
    aggregationPolicy: blankToNull(row.histAggregationPolicy),
    intervalNumber: row.histIntervalNumber,
    intervalText: blankToNull(row.histIntervalText),
    nLogsMax: row.histNLogsMax,
  },
  memoryMap: {
    funcType: blankToNull(row.mmFuncType),
    funcTypeWrite: blankToNull(row.mmFuncTypeWrite),
    memAddress: row.mmMemAddress,
    memQuantity: row.mmMemQuantity,
    bitId: row.mmBitId,
    page: row.mmPage,
    tariff: row.mmTariff,
    varType: blankToNull(row.mmVarType),
    channelMx3: blankToNull(row.mmChannelMx3),
    chunkGrouping: row.mmChunkGrouping,
  },
  image: {
    snapshotPath: blankToNull(row.imgSnapshotPath),
    goToPresetPath: blankToNull(row.imgGoToPresetPath),
    snapshotDelay: row.imgSnapshotDelay,
    auth: {
      type: blankToNull(row.imgAuthType),
      user: blankToNull(row.imgAuthUser),
      password: blankToNull(row.imgAuthPassword),
    },
  },
})

// Sentinel for the "no class filter" option — Radix Select can't use an
// empty-string value.
const ALL_CLASSES = 'all'

// groupOptions is station-scoped and only known at runtime, so the column
// set is built per render (see the `columns` memo below).
const buildColumns = (
  groupOptions: EditTableSelectOption[],
): EditTableColumn<VariableRow>[] => [
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
  {
    key: 'groupId',
    label: 'Gruppo',
    width: '12rem',
    type: 'select',
    searchable: true,
    options: groupOptions,
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

  // ── History sub-record ────────────────────────────────────────────────
  { key: 'histEnabled', label: 'History', width: '5rem', type: 'boolean' },
  {
    key: 'histTriggerType',
    label: 'History Trigger',
    width: '10rem',
    type: 'select',
    options: VARIABLE_HISTORY_TRIGGER_TYPE_OPTIONS,
  },
  {
    key: 'histAggregationPolicy',
    label: 'Aggregazione',
    width: '13rem',
    type: 'select',
    options: VARIABLE_HISTORY_AGGREGATION_POLICY_OPTIONS,
  },
  {
    key: 'histIntervalNumber',
    label: 'Intervallo (num)',
    width: '7rem',
    type: 'number',
  },
  { key: 'histIntervalText', label: 'Intervallo (text)', width: '8rem' },
  { key: 'histNLogsMax', label: 'Max log', width: '6rem', type: 'number' },

  // ── Memory-map sub-record ─────────────────────────────────────────────
  {
    key: 'mmFuncType',
    label: 'Func. lettura',
    width: '13rem',
    type: 'select',
    options: VARIABLE_MEMORY_MAP_FUNC_TYPE_OPTIONS,
  },
  {
    key: 'mmFuncTypeWrite',
    label: 'Func. scrittura',
    width: '13rem',
    type: 'select',
    options: VARIABLE_MEMORY_MAP_FUNC_TYPE_WRITE_OPTIONS,
  },
  { key: 'mmMemAddress', label: 'Indirizzo', width: '7rem', type: 'number' },
  { key: 'mmMemQuantity', label: 'Quantità', width: '7rem', type: 'number' },
  { key: 'mmBitId', label: 'Bit', width: '5rem', type: 'number' },
  { key: 'mmPage', label: 'Pagina', width: '6rem', type: 'number' },
  { key: 'mmTariff', label: 'Tariffa', width: '6rem', type: 'number' },
  { key: 'mmVarType', label: 'Tipo var.', width: '7rem' },
  { key: 'mmChannelMx3', label: 'Canale MX3', width: '8rem' },
  {
    key: 'mmChunkGrouping',
    label: 'Raggr. chunk',
    width: '7rem',
    type: 'number',
  },

  // ── Image sub-record ──────────────────────────────────────────────────
  { key: 'imgSnapshotPath', label: 'Path snapshot', width: '12rem' },
  { key: 'imgGoToPresetPath', label: 'Path preset', width: '12rem' },
  {
    key: 'imgSnapshotDelay',
    label: 'Ritardo snap.',
    width: '7rem',
    type: 'number',
  },
  {
    key: 'imgAuthType',
    label: 'Auth img.',
    width: '9rem',
    type: 'select',
    options: VARIABLE_IMAGE_AUTH_TYPE_OPTIONS,
  },
  { key: 'imgAuthUser', label: 'Auth utente', width: '9rem' },
  { key: 'imgAuthPassword', label: 'Auth password', width: '9rem' },
]

// Blank history / memory-map / image fields for a freshly-added row.
const EMPTY_SUBRECORD_FIELDS = {
  histEnabled: false,
  histTriggerType: null,
  histAggregationPolicy: null,
  histIntervalNumber: null,
  histIntervalText: null,
  histNLogsMax: null,
  mmFuncType: null,
  mmFuncTypeWrite: null,
  mmMemAddress: null,
  mmMemQuantity: null,
  mmBitId: null,
  mmPage: null,
  mmTariff: null,
  mmVarType: null,
  mmChannelMx3: null,
  mmChunkGrouping: null,
  imgSnapshotPath: null,
  imgGoToPresetPath: null,
  imgSnapshotDelay: null,
  imgAuthType: null,
  imgAuthUser: null,
  imgAuthPassword: null,
} satisfies Partial<VariableRow>

export const VariablesPage: React.FC = () => {
  const panelRef = useRef<EditTablePanelHandle<VariableRow>>(null)

  const [stations, setStations] = useState<Station[] | null>(null)
  const [groups, setGroups] = useState<Group[] | null>(null)

  const [stationId, setStationId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [classType, setClassType] = useState<string | null>(null)
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')

  // Mirrors the grid's dirty state (fed by EditTablePanel.onDirtyChange) so
  // the station/group pickers can prompt before a scope change wipes edits.
  const [isDirty, setIsDirty] = useState(false)
  const { confirm, confirmDialog } = useConfirm()

  const [selectedKeys, setSelectedKeys] = useState<Set<RowKey>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [transferGroupId, setTransferGroupId] = useState('')

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

  // A scope change refetches the grid, so any prior selection no longer maps
  // to the rows shown.
  useEffect(() => {
    setSelectedKeys(new Set())
  }, [stationId, groupId])

  const stationOptions = useMemo(
    () =>
      (stations ?? []).map((station) => ({
        value: String(station.id),
        label: station.name || `ID ${station.stationId}`,
      })),
    [stations],
  )

  // Groups of the currently-scoped station — shared by the group filter and
  // the in-grid "Gruppo" column.
  const scopedGroupOptions = useMemo(
    () =>
      (groups ?? [])
        .filter(
          (group) =>
            stationId === '' || String(group.stationId ?? '') === stationId,
        )
        .map((group) => ({
          value: String(group.id),
          label: group.name || `ID ${group.groupId}`,
        })),
    [groups, stationId],
  )

  const groupOptions = useMemo(
    () => [{ value: '', label: 'Tutti i gruppi' }, ...scopedGroupOptions],
    [scopedGroupOptions],
  )

  // Every group across every station, labeled with its station — the target
  // list for bulk-transferring variables, unrestricted by the current scope.
  const allGroupOptions = useMemo(() => {
    const stationsById = new Map((stations ?? []).map((s) => [s.id, s]))
    return (groups ?? []).map((group) => {
      const station =
        group.stationId != null ? stationsById.get(group.stationId) : null
      const groupLabel = group.name || `ID ${group.groupId}`
      return {
        value: String(group.id),
        label: station
          ? `${groupLabel} — ${station.name || `ID ${station.stationId}`}`
          : groupLabel,
      }
    })
  }, [groups, stations])

  const columns = useMemo(
    () => buildColumns(scopedGroupOptions),
    [scopedGroupOptions],
  )

  const tagOptions = useMemo(
    () => [
      { value: '', label: 'Tutti i tag' },
      ...availableTags.map((t) => ({ value: t, label: t })),
    ],
    [availableTags],
  )

  // Changing the scope refetches the grid and wipes any pending edits, so
  // confirm the discard first — and bail before touching state if the user
  // declines, otherwise the select would show a value the grid never loaded.
  const guardDiscard = () =>
    !isDirty ||
    confirm({
      title: 'Modifiche non salvate',
      description: 'Le modifiche non salvate andranno perse. Vuoi continuare?',
      confirmLabel: 'Continua',
    })

  const handleStationChange = async (value: string) => {
    if (!(await guardDiscard())) return
    setStationId(value)
    if (value && groupId) {
      const group = (groups ?? []).find((g) => String(g.id) === groupId)
      if (group && String(group.stationId ?? '') !== value) setGroupId('')
    }
  }

  // Picking a group also selects its station, so the table always stays
  // scoped to one station.
  const handleGroupChange = async (value: string) => {
    if (!(await guardDiscard())) return
    setGroupId(value)
    if (value) {
      const group = (groups ?? []).find((g) => String(g.id) === value)
      if (group?.stationId != null) setStationId(String(group.stationId))
    }
  }

  // Bulk actions hit the API immediately (unlike the grid's own edits, which
  // only apply on "Salva modifiche"), so opening either dialog first confirms
  // discarding any pending edits — the reload afterwards would drop them
  // silently otherwise.
  const openBulkDelete = async () => {
    if (!(await guardDiscard())) return
    setBulkDeleteOpen(true)
  }

  const openTransfer = async () => {
    if (!(await guardDiscard())) return
    setTransferGroupId('')
    setTransferOpen(true)
  }

  const handleBulkDelete = async () => {
    if (selectedKeys.size === 0) return
    setBulkDeleting(true)
    const res = await deleteVariables(Array.from(selectedKeys) as number[])
    setBulkDeleting(false)
    if (res !== null) {
      setBulkDeleteOpen(false)
      setSelectedKeys(new Set())
      panelRef.current?.reload()
    }
  }

  const handleBulkTransfer = async () => {
    if (selectedKeys.size === 0 || transferGroupId === '') return
    setTransferring(true)
    const res = await transferVariables(
      Array.from(selectedKeys) as number[],
      Number(transferGroupId),
    )
    setTransferring(false)
    if (res !== null) {
      setTransferOpen(false)
      setTransferGroupId('')
      setSelectedKeys(new Set())
      panelRef.current?.reload()
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

      setSelectedKeys(new Set())
      toast.success('Variabili salvate')
    },
    [],
  )

  const addVariableRow = useCallback(() => {
    panelRef.current?.addRow({
      id: null,
      variableId: null,
      groupId,
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
      ...EMPTY_SUBRECORD_FIELDS,
    })
  }, [groupId])

  return (
    <div className="h-full flex flex-col gap-6">
      <PageHeader
        title="Variabili"
        subtitle="Gestisci le variabili dei gruppi."
        newLabel="Aggiungi variabile"
        newDisabled={!groupId}
        newDisabledReason="Seleziona un gruppo per aggiungere una variabile."
        onNewClick={addVariableRow}
      />

      <EditTablePanel<VariableRow>
        ref={panelRef}
        className="flex-1 min-h-0"
        columns={columns}
        fetchFn={fetchFn}
        filterFn={filterFn}
        onSave={handleSave}
        onDirtyChange={setIsDirty}
        deletable
        selection={{ selectedKeys, onSelectionChange: setSelectedKeys }}
        emptyMessage={
          hasScope
            ? 'Nessuna variabile trovata.'
            : 'Seleziona una stazione per visualizzare le variabili.'
        }
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

              {selectedKeys.size > 0 && (
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-sm text-muted-foreground">
                    {selectedKeys.size}{' '}
                    {selectedKeys.size === 1 ? 'selezionata' : 'selezionate'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <OutlinedButton
                        type="button"
                        className="inline-flex items-center gap-2"
                      >
                        Azioni
                        <ChevronDown size={14} />
                      </OutlinedButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={openTransfer}>
                        <ArrowRightLeft size={14} />
                        Sposta in gruppo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={openBulkDelete}
                      >
                        <Trash2 size={14} />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        }
      />

      <Dialog
        open={bulkDeleteOpen}
        onOpenChange={(open) =>
          !open && !bulkDeleting && setBulkDeleteOpen(false)
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina variabili</DialogTitle>
            <DialogDescription>
              Stai per eliminare{' '}
              <span className="font-medium text-foreground">
                {selectedKeys.size}{' '}
                {selectedKeys.size === 1 ? 'variabile' : 'variabili'}
              </span>
              . Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <TextButton
              type="button"
              disabled={bulkDeleting}
              onClick={() => setBulkDeleteOpen(false)}
            >
              Annulla
            </TextButton>
            <FilledButton
              type="button"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {bulkDeleting ? 'Eliminazione…' : 'Elimina'}
            </FilledButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={transferOpen}
        onOpenChange={(open) =>
          !open && !transferring && setTransferOpen(false)
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sposta variabili</DialogTitle>
            <DialogDescription>
              Sposta{' '}
              <span className="font-medium text-foreground">
                {selectedKeys.size}{' '}
                {selectedKeys.size === 1 ? 'variabile' : 'variabili'}
              </span>{' '}
              nel gruppo selezionato.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SearchableSelect
              value={transferGroupId}
              onValueChange={setTransferGroupId}
              placeholder="Seleziona gruppo…"
              searchPlaceholder="Cerca gruppo…"
              emptyMessage="Nessun gruppo trovato."
              options={allGroupOptions}
            />
          </div>
          <DialogFooter>
            <TextButton
              type="button"
              disabled={transferring}
              onClick={() => setTransferOpen(false)}
            >
              Annulla
            </TextButton>
            <FilledButton
              type="button"
              disabled={transferring || transferGroupId === ''}
              onClick={handleBulkTransfer}
            >
              {transferring ? 'Spostamento…' : 'Sposta'}
            </FilledButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
