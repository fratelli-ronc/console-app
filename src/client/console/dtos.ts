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
