// Servers are named by IP here, not by their Coolify uuid: a group carries
// the IP of the server it runs on, and a deploy has to join the two to know
// which servers relay it.
export interface ServerTreeRelation {
  id: number
  serverIp: string
  childrenServerIps: string[]
}

export interface ServerTreeRelationRequest {
  serverIp: string
  childrenServerIps: string[]
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

// Both fields are optional: an omitted stationId auto-assigns the next
// available business ID, an omitted name keeps the source station's name.
// Groups, variables and their sub-records are always copied verbatim.
export interface CloneStationRequest {
  stationId?: number
  name?: string
}

export interface NextStationId {
  stationId: number
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
  serverIp: string | null
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
  serverIp?: string
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

// Nested partial merges onto a Variable's 1:1 sub-records. Omitted/null
// fields are left unchanged server-side; omit the whole object to leave the
// sub-record untouched. Used by CreateVariableRequest / UpdateVariableRequest.
export type VariableHistoryInput = Partial<Omit<VariableHistory, 'variableId'>>
export type VariableMemoryMapInput = Partial<
  Omit<VariableMemoryMap, 'variableId'>
>
export interface VariableImageInput {
  snapshotPath?: string | null
  goToPresetPath?: string | null
  snapshotDelay?: number | null
  // Replaced wholesale when present; type (when set) must be V2_DIGEST_AUTH.
  auth?: VariableImageAuth | null
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

// classType / search / tag filtering happens client-side (see VariablesPage);
// the server call only scopes by station or group.
export interface ListVariablesParams {
  groupId?: number
  stationId?: number
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
  history?: VariableHistoryInput | null
  memoryMap?: VariableMemoryMapInput | null
  image?: VariableImageInput | null
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

// "not_deployed" - never deployed ("Non distribuito"); "pending" - deployed
// at least once but changed since; "deployed" - deployed and unchanged.
export type DeploymentStatusValue = 'not_deployed' | 'pending' | 'deployed'

// lastDeployedByUserId resolved to a display name/avatar by console-api
// (which looks it up against goauth-gate). Absent (null) whenever
// lastDeployedByUserId is null, and also, best-effort, if that lookup
// failed - it's a display nicety, not guaranteed to be present.
export interface DeployedByUser {
  id: number
  username: string
  name: string
  avatar: string
}

export interface StationDeploymentStatus {
  // The station's internal id (matches Station.id, not Station.stationId).
  stationId: number
  status: DeploymentStatusValue
  pending: boolean
  lastDeployedAt: string | null
  lastDeployedByUserId: number | null
  lastDeployedBy: DeployedByUser | null
}

export interface GroupDeploymentStatus {
  // The group's internal id (matches Group.id, not Group.groupId).
  groupId: number
  pending: boolean
}

// Every station and group is included, even ones with no deployment status
// row yet (reported as "not_deployed" / pending: false).
export interface DeploymentStatuses {
  stations: StationDeploymentStatus[]
  groups: GroupDeploymentStatus[]
}

// One config file rendered by a deploy: `content` is the exact body to
// write as `fileName` in `serverIp`'s config folder. stationId is the
// station's business id — the one the file name carries — unlike the
// internal ids the deployment-status DTOs use.
export interface DeployConfigFile {
  fileName: string
  serverIp: string
  stationId: number
  content: string
}

// A group the deploy could not place on a server. One issue fails the whole
// deploy: no file is rendered and no status changes. `id` and `stationId`
// are internal ids, `groupId` is the business one.
export interface DeployConfigIssue {
  id: number
  groupId: number
  stationId: number
  serverIp: string | null
  reason: string
}

export interface DeployStationsResponse {
  statuses: StationDeploymentStatus[]
  files: DeployConfigFile[]
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
  serverIp?: string
  ipAddress?: string
  portNumber?: number
  connectionTimeout?: number
  transactionTimeout?: number
  protocol?: string
  networkType?: string
  unitIdModBusSlave?: number
  tagIds?: number[]
}
