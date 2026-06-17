export type ServerStatus = 'online' | 'offline'

export interface Server {
  uuid: string
  name: string
  ip: string
  isReachable: boolean
}

export interface NodeMetrics {
  cpu?: {
    usedPercent: number
    count: number
    architecture?: string
  }
  memory?: {
    totalBytes: number
    availableBytes: number
    usedPercent: number
  }
  filesystems: {
    mountpoint: string
    sizeBytes: number
    availBytes: number
    usedPercent: number
  }[]
  error?: string
}

export interface ServerResouce {
  uuid: string
  name: string
  status: string
  type: string
  image: string
  createdAt: string
  updatedAt: string
  error?: string
}

export interface ServerSnapshot {
  server: Server
  metrics: NodeMetrics
  resources: ServerResouce[]
}

export interface DashboardSnapshot {
  servers: ServerSnapshot[]
}

export interface MetricsEvent {
  serverUUID: string
  metrics: NodeMetrics
}

export interface ResourceStatusEvent {
  serverUUID: string
  resourceUUID: string
  status: string
}

export interface ServerReachabilityEvent {
  serverUUID: string
  isReachable: boolean
}
