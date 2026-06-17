import coolifyClient from './client'
import { Server, ServerMetrics, ServerResouce } from './dtos'
import { withErrorHandling } from '../withErrorHandling'

// --- Server ---

export const getServers = (): Promise<Server[] | null> =>
  withErrorHandling(async () => {
    const { data } = await coolifyClient.get<Server[]>('/servers')
    return data
  })

export const getServerMetrics = (uuid: string): Promise<ServerMetrics | null> =>
  withErrorHandling(async () => {
    const { data } = await coolifyClient.get<ServerMetrics>(
      `/servers/${uuid}/metrics`,
    )
    return data
  })

export const getServerResouces = (
  uuid: string,
): Promise<ServerResouce[] | null> =>
  withErrorHandling(async () => {
    const { data } = await coolifyClient.get<ServerResouce[]>(
      `/servers/${uuid}/resources`,
    )
    return data
  })

// --- Resource ---

export const requestStopResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(async () => {
    await coolifyClient.get(`/resources/${uuid}/stop`)
  })

export const requestStartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(async () => {
    await coolifyClient.get(`/resources/${uuid}/start`)
  })

export const requestRestartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(async () => {
    await coolifyClient.get(`/resources/${uuid}/restart`)
  })
