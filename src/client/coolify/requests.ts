import coolifyClient from './client'
import { withErrorHandling } from '../withErrorHandling'
import type { CoolifyProject, ServicesByImageMap } from './dtos'

// --- Projects ---

export const listProjects = (): Promise<CoolifyProject[] | null> =>
  withErrorHandling(async () => {
    const res = await coolifyClient.get<CoolifyProject[]>('/projects')
    return res.data
  })

// --- Services by image ---

export const listServicesByImage = (): Promise<ServicesByImageMap | null> =>
  withErrorHandling(async () => {
    const res = await coolifyClient.get<ServicesByImageMap>('/services/by-image')
    return res.data
  })

// --- Resource ---

export const requestStopResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(
    async () => await coolifyClient.get(`/services/${uuid}/stop`),
  )

export const requestStartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(
    async () => await coolifyClient.get(`/services/${uuid}/start`),
  )

export const requestRestartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(
    async () => await coolifyClient.get(`/services/${uuid}/restart`),
  )
