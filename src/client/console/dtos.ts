export interface ServerTreeRelation {
  id: number
  serverId: string
  childrenServerIds: string[]
}

export interface ServerTreeRelationRequest {
  serverId: string
  childrenServerIds: string[]
}

export interface StationTag {
  id: number
  name: string
}

export interface StationTagStationRef {
  id: number
  name: string | null
}

export interface StationTagDetailed {
  id: number
  name: string
  stations: StationTagStationRef[]
}

export interface StationPhotoRef {
  id: number
  contentType: string | null
}

export interface StationPhoto {
  id: number
  stationId: number
  contentType: string | null
  data: string
  updatedAt: string
}

export interface Station {
  id: number
  stationId: number
  enabled: boolean | null
  name: string | null
  address: string | null
  city: string | null
  tel: string | null
  maintenanceMode: string | null
  ordPrint: number | null
  smsServer: string | null
  photo: StationPhotoRef | null
  tags: StationTag[]
  createdAt: string
  updatedAt: string
}

export interface CreateStationRequest {
  stationId: number
  enabled?: boolean
  name?: string
  address?: string
  city?: string
  tel?: string
  maintenanceMode?: string
  ordPrint?: number
  smsServer?: string
  tagIds?: number[]
}

export interface UpdateStationRequest {
  enabled?: boolean
  name?: string
  address?: string
  city?: string
  tel?: string
  maintenanceMode?: string
  ordPrint?: number
  smsServer?: string
  tagIds?: number[]
}

export interface UpdateStationPhotoRequest {
  contentType: string
  data: string
}

export interface GroupTag {
  id: number
  name: string
}

export interface GroupTagGroupRef {
  id: number
  name: string | null
}

export interface GroupTagDetailed {
  id: number
  name: string
  groups: GroupTagGroupRef[]
}

export interface Group {
  id: number
  groupId: number
  stationId: number | null
  name: string | null
  enabled: boolean | null
  unitId: number | null
  ordPrint: number | null
  lat: number | null
  long: number | null
  webcamUrl: string | null
  driveDocUrl: string | null
  drivePhotoUrl: string | null
  tel: string | null
  ipAddress: string | null
  portNumber: number | null
  connectionTimeout: number | null
  transactionTimeout: number | null
  protocol: string
  networkType: string
  unitIdModBusSlave: number | null
  tags: GroupTag[]
  createdAt: string
  updatedAt: string
}

export interface CreateGroupRequest {
  groupId: number
  stationId?: number | null
  name?: string
  enabled?: boolean
  unitId?: number
  ordPrint?: number
  lat?: number
  long?: number
  webcamUrl?: string
  driveDocUrl?: string
  drivePhotoUrl?: string
  tel?: string
  ipAddress?: string
  portNumber?: number
  connectionTimeout?: number
  transactionTimeout?: number
  protocol: string
  networkType: string
  unitIdModBusSlave?: number
  tagIds?: number[]
}

export interface VariableHistory {
  variableId: number
  enabled: boolean | null
  triggerType: string | null
  aggregationPolicy: string | null
  intervalNumber: number | null
  intervalText: string | null
  nLogsMax: number | null
}

export interface VariableMemoryMap {
  variableId: number
  funcType: string | null
  funcTypeWrite: string | null
  memAddress: number | null
  memQuantity: number | null
  bitId: number | null
  page: number | null
  tariff: number | null
  varType: string | null
  channelMx3: string | null
  chunkGrouping: number | null
}

export interface VariableImageAuth {
  type: string | null
  user: string | null
  password: string | null
}

export interface VariableImage {
  variableId: number
  snapshotPath: string | null
  goToPresetPath: string | null
  snapshotDelay: number | null
  auth: VariableImageAuth | null
}

export interface VariablePresentation {
  type: string | null
  minPresetValue: number | null
  maxPresetValue: number | null
  step: number | null
  text: string | null
  condition: string | null
  color: string | null
}

export interface Variable {
  id: number
  variableId: number
  groupId: number | null
  name: string | null
  classType: string | null
  tags: string[]
  ordPrint: number | null
  graphGroup: string | null
  measureUnit: string | null
  format: string | null
  minValue: number | null
  maxValue: number | null
  exponent: number | null
  k: number | null
  cumul: boolean | null
  enableLogs: boolean | null
  preview: boolean | null
  hidden: boolean | null
  driver: string | null
  isFastUpdate: boolean | null
  history: VariableHistory | null
  memoryMap: VariableMemoryMap | null
  image: VariableImage | null
  presentations: VariablePresentation[]
  note: string | null
  writeAuthorizationLevel: number | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedVariables {
  data: Variable[]
  total: number
}

export interface ListVariablesParams {
  groupId?: number
  stationId?: number
  classType?: string
  search?: string
  page?: number
  pageSize?: number
}

// variableId is optional: when omitted the server auto-assigns the next one.
export interface CreateVariableRequest {
  variableId?: number
  groupId?: number | null
  name?: string | null
  classType?: string | null
  tags?: string[]
  ordPrint?: number | null
  graphGroup?: string | null
  measureUnit?: string | null
  format?: string | null
  minValue?: number | null
  maxValue?: number | null
  exponent?: number | null
  k?: number | null
  cumul?: boolean | null
  enableLogs?: boolean | null
  preview?: boolean | null
  hidden?: boolean | null
  driver?: string | null
  isFastUpdate?: boolean | null
  presentations?: VariablePresentation[]
  note?: string | null
  writeAuthorizationLevel?: number | null
}

// All fields optional: omitted/null fields are left unchanged server-side.
export type UpdateVariableRequest = Omit<CreateVariableRequest, 'variableId'>

export interface VariableBatchRequest {
  create: CreateVariableRequest[]
  update: (UpdateVariableRequest & { id: number })[]
  delete: number[]
}

export interface VariableBatchResult {
  created: Variable[]
  updated: Variable[]
  deleted: number[]
}

export interface UpdateGroupRequest {
  stationId?: number | null
  name?: string
  enabled?: boolean
  unitId?: number
  ordPrint?: number
  lat?: number
  long?: number
  webcamUrl?: string
  driveDocUrl?: string
  drivePhotoUrl?: string
  tel?: string
  ipAddress?: string
  portNumber?: number
  connectionTimeout?: number
  transactionTimeout?: number
  protocol?: string
  networkType?: string
  unitIdModBusSlave?: number
  tagIds?: number[]
}
