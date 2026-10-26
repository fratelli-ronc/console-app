import type {
  UpdateVariableRequest,
  Variable,
  VariableHistoryInput,
  VariableImageInput,
  VariableMemoryMapInput,
  VariablePresentation,
} from '@/client'
import { parseNumber } from './FormFields'

// ── Kind ────────────────────────────────────────────────────────────────────
//
// What reads the variable decides which of its fields matter, so the edit
// dialog lays itself out per kind (the old console's per-"sourceType"
// forms):
// - a group with an image protocol is a camera, polled by gocam-warden
//   through its one variable, whatever that variable's driver says;
// - otherwise the driver says: none is plain Modbus (gobus-opc), mx3-* is
//   Modbus with the MX3 extras, and the rest are handled elsewhere.

export type VariableKind =
  | 'modbus'
  | 'mx3'
  | 'internal'
  | 'mirroring'
  | 'python'
  | 'camera-http'
  | 'camera-tcp'

export const variableKind = (
  driver: string,
  groupProtocol: string | null | undefined,
): VariableKind => {
  if (groupProtocol === 'HTTP/img') return 'camera-http'
  if (groupProtocol === 'TCP/img') return 'camera-tcp'
  if (driver === '') return 'modbus'
  if (driver.startsWith('mx3-')) return 'mx3'
  if (driver === 'internalVar') return 'internal'
  if (driver === 'varMirroring') return 'mirroring'
  if (driver === 'python') return 'python'
  // An unknown driver still gets every field rather than too few.
  return 'modbus'
}

export const isCamera = (kind: VariableKind) =>
  kind === 'camera-http' || kind === 'camera-tcp'

export const isModbus = (kind: VariableKind) =>
  kind === 'modbus' || kind === 'mx3'

// ── Form ────────────────────────────────────────────────────────────────────
//
// The dialog's state: one flat key per editable field, text inputs as the
// strings typed, so saveFormResolvingConflicts can diff and name them one
// by one. hist*/mm*/img* are the history / memory-map / image sub-records.

export const toForm = (v: Variable) => ({
  groupId: v.groupId == null ? '' : String(v.groupId),
  name: v.name ?? '',
  classType: v.classType ?? '',
  driver: v.driver ?? '',
  format: v.format ?? '',
  tags: v.tags.join(', '),
  ordPrint: str(v.ordPrint),
  graphGroup: v.graphGroup ?? '',
  note: v.note ?? '',
  hidden: v.hidden ?? false,
  preview: v.preview ?? false,
  enableLogs: v.enableLogs ?? false,
  isFastUpdate: v.isFastUpdate ?? false,
  writeAuthorizationLevel: str(v.writeAuthorizationLevel),

  cumul: v.cumul ?? false,
  measureUnit: v.measureUnit ?? '',
  minValue: str(v.minValue),
  maxValue: str(v.maxValue),
  exponent: str(v.exponent),
  k: str(v.k),

  histEnabled: v.history?.enabled ?? false,
  histTriggerType: v.history?.triggerType ?? '',
  histAggregationPolicy: v.history?.aggregationPolicy ?? '',
  // One input for both: a cron expression wins over seconds on deploy, so
  // that is what shows when both are set.
  histInterval: v.history?.intervalText ?? str(v.history?.intervalNumber),
  histNLogsMax: str(v.history?.nLogsMax),

  mmFuncType: v.memoryMap?.funcType ?? '',
  mmFuncTypeWrite: v.memoryMap?.funcTypeWrite ?? '',
  mmMemAddress: str(v.memoryMap?.memAddress),
  mmMemQuantity: str(v.memoryMap?.memQuantity),
  mmBitId: str(v.memoryMap?.bitId),
  mmChunkGrouping: str(v.memoryMap?.chunkGrouping),
  mmPage: str(v.memoryMap?.page),
  mmChannelMx3: v.memoryMap?.channelMx3 ?? '',
  mmTariff: str(v.memoryMap?.tariff),
  mmVarType: v.memoryMap?.varType ?? '',

  imgSnapshotPath: v.image?.snapshotPath ?? '',
  imgGoToPresetPath: v.image?.goToPresetPath ?? '',
  imgSnapshotDelay: str(v.image?.snapshotDelay),
  imgAuthType: v.image?.auth?.type ?? '',
  imgAuthUser: v.image?.auth?.user ?? '',
  imgAuthPassword: v.image?.auth?.password ?? '',

  presentations: v.presentations ?? [],
})

export type VariableForm = ReturnType<typeof toForm>

function str(value: number | null | undefined) {
  return value == null ? '' : String(value)
}

export const FIELD_LABELS: Record<keyof VariableForm, string> = {
  groupId: 'Gruppo',
  name: 'Nome',
  classType: 'Classe',
  driver: 'Driver',
  format: 'Formato',
  tags: 'Tag',
  ordPrint: 'Ordine',
  graphGroup: 'Gruppo grafico',
  note: 'Note',
  hidden: 'Nascosta',
  preview: 'Anteprima',
  enableLogs: 'Log',
  isFastUpdate: 'Aggiornamento rapido',
  writeAuthorizationLevel: 'Livello autorizzazione scrittura',
  cumul: 'Cumulativa',
  measureUnit: 'Unità di misura',
  minValue: 'Minimo',
  maxValue: 'Massimo',
  exponent: 'Esponente',
  k: 'K',
  histEnabled: 'Storico abilitato',
  histTriggerType: 'Trigger',
  histAggregationPolicy: 'Aggregazione',
  histInterval: 'Intervallo',
  histNLogsMax: 'Max log',
  mmFuncType: 'Funzione lettura',
  mmFuncTypeWrite: 'Funzione scrittura',
  mmMemAddress: 'Indirizzo',
  mmMemQuantity: 'Quantità',
  mmBitId: 'Bit',
  mmChunkGrouping: 'Raggruppamento chunk',
  mmPage: 'Pagina',
  mmChannelMx3: 'Canale MX3',
  mmTariff: 'Tariffa',
  mmVarType: 'Tipo variabile',
  imgSnapshotPath: 'Path snapshot',
  imgGoToPresetPath: 'Path preset',
  imgSnapshotDelay: 'Ritardo snapshot',
  imgAuthType: 'Autenticazione',
  imgAuthUser: 'Utente',
  imgAuthPassword: 'Password',
  presentations: 'Presentazioni',
}

// Fields typed as numbers, and whether they must be whole.
const NUMBER_FIELDS: Partial<Record<keyof VariableForm, 'int' | 'float'>> = {
  ordPrint: 'int',
  writeAuthorizationLevel: 'int',
  minValue: 'float',
  maxValue: 'float',
  exponent: 'int',
  k: 'int',
  histNLogsMax: 'int',
  mmMemAddress: 'int',
  mmMemQuantity: 'int',
  mmBitId: 'int',
  mmChunkGrouping: 'int',
  mmPage: 'int',
  mmTariff: 'int',
  imgSnapshotDelay: 'int',
}

// Field key -> what is wrong with it, for every number field that doesn't
// hold a valid one.
export const validateForm = (
  form: VariableForm,
): Partial<Record<keyof VariableForm, string>> => {
  const errors: Partial<Record<keyof VariableForm, string>> = {}
  for (const [key, kind] of Object.entries(NUMBER_FIELDS) as [
    keyof VariableForm,
    'int' | 'float',
  ][]) {
    const n = parseNumber(form[key] as string)
    if (n === null) continue
    if (Number.isNaN(n)) errors[key] = 'Numero non valido'
    else if (kind === 'int' && !Number.isInteger(n))
      errors[key] = 'Deve essere un numero intero'
  }
  return errors
}

// ── Request ─────────────────────────────────────────────────────────────────

// Blank means "no value": sent as null so the API clears the field.
const text = (value: string) => value.trim() || null
const number = (value: string) => parseNumber(value)

const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

// The update for the fields in `changes` alone: anything left out is left
// as it is on the server, including the other fields of a sub-record.
export const toRequest = (
  changes: Partial<VariableForm>,
): UpdateVariableRequest => {
  const req: UpdateVariableRequest = {}
  const history: VariableHistoryInput = {}
  const memoryMap: VariableMemoryMapInput = {}
  const image: VariableImageInput = {}
  const has = (key: keyof VariableForm) => key in changes
  const c = changes as VariableForm

  if (has('groupId')) req.groupId = c.groupId ? Number(c.groupId) : null
  if (has('name')) req.name = text(c.name)
  if (has('classType')) req.classType = text(c.classType)
  if (has('driver')) req.driver = text(c.driver)
  if (has('format')) req.format = text(c.format)
  if (has('tags')) req.tags = parseTags(c.tags)
  if (has('ordPrint')) req.ordPrint = number(c.ordPrint)
  if (has('graphGroup')) req.graphGroup = text(c.graphGroup)
  if (has('note')) req.note = text(c.note)
  if (has('hidden')) req.hidden = c.hidden
  if (has('preview')) req.preview = c.preview
  if (has('enableLogs')) req.enableLogs = c.enableLogs
  if (has('isFastUpdate')) req.isFastUpdate = c.isFastUpdate
  if (has('writeAuthorizationLevel'))
    req.writeAuthorizationLevel = number(c.writeAuthorizationLevel)
  if (has('cumul')) req.cumul = c.cumul
  if (has('measureUnit')) req.measureUnit = text(c.measureUnit)
  if (has('minValue')) req.minValue = number(c.minValue)
  if (has('maxValue')) req.maxValue = number(c.maxValue)
  if (has('exponent')) req.exponent = number(c.exponent)
  if (has('k')) req.k = number(c.k)
  if (has('presentations'))
    req.presentations = c.presentations as VariablePresentation[]

  if (has('histEnabled')) history.enabled = c.histEnabled
  if (has('histTriggerType')) history.triggerType = text(c.histTriggerType)
  if (has('histAggregationPolicy'))
    history.aggregationPolicy = text(c.histAggregationPolicy)
  if (has('histInterval')) {
    // Seconds or a cron expression: whichever it is, the other is cleared
    // so the deploy doesn't pick a stale one.
    const n = parseNumber(c.histInterval)
    const isSeconds = n !== null && !Number.isNaN(n)
    history.intervalNumber = isSeconds ? n : null
    history.intervalText = isSeconds ? null : text(c.histInterval)
  }
  if (has('histNLogsMax')) history.nLogsMax = number(c.histNLogsMax)

  if (has('mmFuncType')) memoryMap.funcType = text(c.mmFuncType)
  if (has('mmFuncTypeWrite')) memoryMap.funcTypeWrite = text(c.mmFuncTypeWrite)
  if (has('mmMemAddress')) memoryMap.memAddress = number(c.mmMemAddress)
  if (has('mmMemQuantity')) memoryMap.memQuantity = number(c.mmMemQuantity)
  if (has('mmBitId')) memoryMap.bitId = number(c.mmBitId)
  if (has('mmChunkGrouping'))
    memoryMap.chunkGrouping = number(c.mmChunkGrouping)
  if (has('mmPage')) memoryMap.page = number(c.mmPage)
  if (has('mmChannelMx3')) memoryMap.channelMx3 = text(c.mmChannelMx3)
  if (has('mmTariff')) memoryMap.tariff = number(c.mmTariff)
  if (has('mmVarType')) memoryMap.varType = text(c.mmVarType)

  if (has('imgSnapshotPath')) image.snapshotPath = text(c.imgSnapshotPath)
  if (has('imgGoToPresetPath')) image.goToPresetPath = text(c.imgGoToPresetPath)
  if (has('imgSnapshotDelay')) image.snapshotDelay = number(c.imgSnapshotDelay)

  if (Object.keys(history).length > 0) req.history = history
  if (Object.keys(memoryMap).length > 0) req.memoryMap = memoryMap
  if (Object.keys(image).length > 0) req.image = image
  return req
}

// The image auth is replaced wholesale by the API, so any change to one of
// its fields sends all three, from the full form. A null auth would be
// ignored rather than clear it, hence an object of nulls.
export const withImageAuth = (
  req: UpdateVariableRequest,
  changes: Partial<VariableForm>,
  form: VariableForm,
): UpdateVariableRequest => {
  if (
    !('imgAuthType' in changes) &&
    !('imgAuthUser' in changes) &&
    !('imgAuthPassword' in changes)
  )
    return req
  const auth = {
    type: text(form.imgAuthType),
    user: text(form.imgAuthUser),
    password: text(form.imgAuthPassword),
  }
  return { ...req, image: { ...req.image, auth } }
}
