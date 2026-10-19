import type { ChangeEntityType, ConsoleUser, EntityChange } from '@/client'

// Labels of the change log's snapshot keys, per entity type. Keys match the
// form / grid labels the user edits them under.
const FIELD_LABELS: Record<ChangeEntityType, Record<string, string>> = {
  station: {
    stationId: 'ID stazione',
    enabled: 'Stazione attiva',
    name: 'Nome',
    address: 'Indirizzo',
    city: 'Città',
    tel: 'Telefono',
    maintenanceMode: 'Modalità manutenzione',
    ordPrint: 'Ordine di stampa',
    smsServer: 'Server SMS',
    'photo.contentType': 'Formato foto',
    'photo.sha256': 'Foto',
    tags: 'Tag',
  },
  group: {
    groupId: 'ID gruppo',
    stationId: 'Stazione',
    name: 'Nome',
    enabled: 'Gruppo attivo',
    unitId: 'Unit ID',
    ordPrint: 'Ordine di stampa',
    lat: 'Latitudine',
    long: 'Longitudine',
    webcamUrl: 'URL webcam',
    driveDocUrl: 'URL documenti Drive',
    drivePhotoUrl: 'URL foto Drive',
    tel: 'Telefono',
    serverIp: 'Server',
    ipAddress: 'Indirizzo IP',
    portNumber: 'Porta',
    connectionTimeout: 'Timeout connessione',
    transactionTimeout: 'Timeout transazione',
    protocol: 'Protocollo',
    networkType: 'Rete',
    unitIdModBusSlave: 'Unit ID (Modbus slave)',
    tags: 'Tag',
  },
  variable: {
    variableId: 'ID Var',
    groupId: 'Gruppo',
    name: 'Nome',
    classType: 'Classe',
    tags: 'Tag',
    ordPrint: 'Ord.',
    graphGroup: 'Gruppo grafico',
    measureUnit: 'U.M.',
    format: 'Formato',
    minValue: 'Min',
    maxValue: 'Max',
    exponent: 'Esponente',
    k: 'K',
    cumul: 'Cumul.',
    enableLogs: 'Log',
    preview: 'Anteprima',
    hidden: 'Nascosta',
    driver: 'Driver',
    isFastUpdate: 'Aggiornamento rapido',
    presentations: 'Presentazioni',
    note: 'Note',
    writeAuthorizationLevel: 'Livello scrittura',
    'history.enabled': 'History',
    'history.triggerType': 'History Trigger',
    'history.aggregationPolicy': 'Aggregazione',
    'history.intervalNumber': 'Intervallo (num)',
    'history.intervalText': 'Intervallo (text)',
    'history.nLogsMax': 'Max log',
    'memoryMap.funcType': 'Func. lettura',
    'memoryMap.funcTypeWrite': 'Func. scrittura',
    'memoryMap.memAddress': 'Indirizzo',
    'memoryMap.memQuantity': 'Quantità',
    'memoryMap.bitId': 'Bit',
    'memoryMap.page': 'Pagina',
    'memoryMap.tariff': 'Tariffa',
    'memoryMap.varType': 'Tipo var.',
    'memoryMap.channelMx3': 'Canale MX3',
    'memoryMap.chunkGrouping': 'Raggr. chunk',
    'image.snapshotPath': 'Path snapshot',
    'image.goToPresetPath': 'Path preset',
    'image.snapshotDelay': 'Ritardo snap.',
    'image.auth.type': 'Auth img.',
    'image.auth.user': 'Auth utente',
    'image.auth.password': 'Auth password',
  },
}

export const fieldLabel = (entityType: ChangeEntityType, field: string) =>
  FIELD_LABELS[entityType][field] ?? field

export const ENTITY_NOUNS: Record<ChangeEntityType, string> = {
  station: 'Stazione',
  group: 'Gruppo',
  variable: 'Variabile',
}

// Resolves the internal ids a change refers to, for display.
export interface ChangeNames {
  groupName: (id: number) => string
  stationName: (id: number) => string
}

// A snapshot value as the user would read it.
export const formatChangeValue = (
  entityType: ChangeEntityType,
  field: string,
  value: unknown,
  names: ChangeNames,
): string => {
  if (value == null) return '—'
  if (typeof value === 'boolean') return value ? 'Sì' : 'No'
  if (entityType === 'variable' && field === 'groupId')
    return names.groupName(value as number)
  if (entityType === 'group' && field === 'stationId')
    return names.stationName(value as number)
  if (field === 'photo.sha256')
    return `impostata (${String(value).slice(0, 8)})`
  if (Array.isArray(value)) {
    if (field === 'presentations')
      return value.length === 1
        ? '1 presentazione'
        : `${value.length} presentazioni`
    if (value.length === 0) return '—'
    return value
      .map((item) =>
        typeof item === 'object' && item && 'name' in item
          ? String(item.name)
          : String(item),
      )
      .join(', ')
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// A change's entity by name, or by business id when it has none.
export const entityLabel = (change: EntityChange) =>
  change.name || `ID ${change.businessId}`

// What each change set kind did, as a heading.
const KIND_LABELS: Record<string, string> = {
  create: 'Creazione variabile',
  update: 'Modifica variabile',
  batch: 'Modifica tabella variabili',
  delete: 'Eliminazione variabili',
  transfer: 'Spostamento variabili',
  clone: 'Copia variabili',
  group_create: 'Creazione gruppo',
  group_update: 'Modifica gruppo',
  group_delete: 'Eliminazione gruppi',
  group_transfer: 'Spostamento gruppi',
  group_clone: 'Copia gruppi',
  group_tag_update: 'Modifica tag gruppo',
  group_tag_delete: 'Eliminazione tag gruppo',
  station_create: 'Creazione stazione',
  station_update: 'Modifica stazione',
  station_photo_update: 'Modifica foto stazione',
  station_delete: 'Eliminazione stazione',
  station_clone: 'Copia stazione',
  station_tag_update: 'Modifica tag stazione',
  station_tag_delete: 'Eliminazione tag stazione',
}

export const changeKindLabel = (kind: string) => KIND_LABELS[kind] ?? kind

// Who made a change: "Te" for the signed-in user, else their name.
export const userLabel = (
  user: ConsoleUser | null,
  userId: number,
  currentUsername: string | undefined,
) => {
  if (!user) return `Utente #${userId}`
  if (user.username === currentUsername) return 'Te'
  return user.name || user.username
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
