import coolifyClient from './client'
import { Server, ServerMetrics, ServerResouce } from './dtos'

export const getServers = async (): Promise<Server[]> => {
  const { data } = await coolifyClient.get<Server[]>('/servers')
  return data
}

export const getServerMetrics = async (
  uuid: string,
): Promise<ServerMetrics> => {
  const { data } = await coolifyClient.get<ServerMetrics>(
    `/servers/${uuid}/metrics`,
  )
  return data
}

export const getServerResouces = async (
  uuid: string,
): Promise<ServerResouce[]> => {
  const { data } = await coolifyClient.get<ServerResouce[]>(
    `/servers/${uuid}/resources`,
  )
  return data
}
