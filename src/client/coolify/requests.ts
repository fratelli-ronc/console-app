import coolifyClient from './client'
import { withErrorHandling } from '../withErrorHandling'
import type {
  CloneProjectResponse,
  CoolifyProject,
  Server,
  ServicesByImageMap,
} from './dtos'

// --- Servers ---

export const listServers = (): Promise<Server[] | null> =>
  withErrorHandling(async () => {
    const res = await coolifyClient.get<Server[]>('/servers')
    return res.data
  })

// --- Projects ---

export const listProjects = (): Promise<CoolifyProject[] | null> =>
  withErrorHandling(async () => {
    const res = await coolifyClient.get<CoolifyProject[]>('/projects')
    return res.data
  })

export const cloneProject = (
  projectUuid: string,
  serverUuid: string,
  projectName: string,
): Promise<CloneProjectResponse | null> =>
  withErrorHandling(async () => {
    const res = await coolifyClient.post<CloneProjectResponse>(
      `/projects/${projectUuid}/clone`,
      { ServerUUID: serverUuid, projectName },
    )
    return res.data
  })

// --- Services ---

export const listServicesByImage = (): Promise<ServicesByImageMap | null> =>
  withErrorHandling(async () => {
    const res =
      await coolifyClient.get<ServicesByImageMap>('/services/by-image')
    return res.data
  })

export const requestStopResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(
    async () => await coolifyClient.post(`/services/${uuid}/stop`),
  )

export const requestStartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(
    async () => await coolifyClient.post(`/services/${uuid}/start`),
  )

export const requestRestartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(
    async () => await coolifyClient.post(`/services/${uuid}/restart`),
  )

export const updateServiceImageTag = (
  uuid: string,
  tag: string,
): Promise<void | null> =>
  withErrorHandling(
    async () =>
      await coolifyClient.patch(`/services/${uuid}`, {
        dockerRegistryImageTag: tag,
      }),
  )

// --- Registry ---

export const listImageTags = (
  image: string,
): Promise<{ tags: string[] } | null> =>
  withErrorHandling(async () => {
    const res = await coolifyClient.get<{ tags: string[] }>('/registry/tags', {
      params: { image },
    })
    return res.data
  })
