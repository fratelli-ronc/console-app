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
