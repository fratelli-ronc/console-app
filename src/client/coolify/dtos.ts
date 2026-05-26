export type ServerStatus = 'online' | 'offline'

export interface Server {
  uuid: string
  name: string
  ip: string
  isReachable: boolean
}

export interface ServerMetrics {
  cpu: {
    usedPercent: number
    count: number
    architecture: string
  }
  memory: {
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
}
