import { isAxiosError } from 'axios'
import consoleClient from './client'
import {
  CloneStationRequest,
  CreateGroupRequest,
  CreateStationRequest,
  CreateVariableRequest,
  DeployConfigIssue,
  DeployStationsResponse,
  DeploymentStatuses,
  Group,
  GroupDeploymentStatus,
  GroupTag,
  GroupTagDetailed,
  ListVariablesParams,
  NextStationId,
  PaginatedVariables,
  ServerTreeRelation,
  ServerTreeRelationRequest,
  Station,
  StationDeploymentStatus,
  StationPhoto,
  StationTag,
  StationTagDetailed,
  UpdateGroupRequest,
  UpdateStationPhotoRequest,
  UpdateStationRequest,
  UpdateVariableRequest,
  Variable,
  VariableBatchRequest,
  VariableBatchResult,
} from './dtos'
import { extractErrorMessage, withErrorHandling } from '../withErrorHandling'

export const getServerTree = (): Promise<ServerTreeRelation[] | null> =>
  withErrorHandling(async () => {
    const { data } =
      await consoleClient.get<ServerTreeRelation[]>('/server-tree')
    return data
  })

export const saveServerTree = (
  relations: ServerTreeRelationRequest[],
): Promise<ServerTreeRelation[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<ServerTreeRelation[]>(
      '/server-tree',
      relations,
    )
    return data
  })

export const listStations = (): Promise<Station[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<Station[]>('/stations')
    return data
  })

export const getStation = (id: number | string): Promise<Station | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<Station>(`/stations/${id}`)
    return data
  })

export const createStation = (
  payload: CreateStationRequest,
): Promise<Station | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Station>('/stations', payload)
    return data
  })

export const updateStation = (
  id: number | string,
  payload: UpdateStationRequest,
): Promise<Station | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<Station>(
      `/stations/${id}`,
      payload,
    )
    return data
  })

export const cloneStation = (
  id: number | string,
  payload: CloneStationRequest,
): Promise<Station | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Station>(
      `/stations/${id}/clone`,
      payload,
    )
    return data
  })

export const getNextStationId = (): Promise<NextStationId | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<NextStationId>('/station-next-id')
    return data
  })

export const deleteStation = (id: number | string): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete(`/stations/${id}`)
  })

export const listStationTags = (): Promise<StationTag[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<StationTag[]>('/station-tags')
    return data
  })

export const listStationTagsDetailed = (): Promise<
  StationTagDetailed[] | null
> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<StationTagDetailed[]>(
      '/station-tags/detailed',
    )
    return data
  })

export const createStationTag = (name: string): Promise<StationTag | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<StationTag>('/station-tags', {
      name,
    })
    return data
  })

export const updateStationTag = (
  id: number,
  name: string,
): Promise<StationTag | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<StationTag>(
      `/station-tags/${id}`,
      { name },
    )
    return data
  })

export const deleteStationTag = (id: number): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete(`/station-tags/${id}`)
  })

export const getStationPhoto = (
  stationId: number | string,
): Promise<StationPhoto | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<StationPhoto>(
      `/station-photos/${stationId}`,
    )
    return data
  })

export const updateStationPhoto = (
  stationId: number | string,
  payload: UpdateStationPhotoRequest,
): Promise<StationPhoto | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<StationPhoto>(
      `/station-photos/${stationId}`,
      payload,
    )
    return data
  })

// Bulk-fetches every station's and group's deployment status in one call.
export const getDeploymentStatuses = (): Promise<DeploymentStatuses | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<DeploymentStatuses>(
      '/deployment-status',
    )
    return data
  })

export const getStationDeploymentStatus = (
  id: number | string,
): Promise<StationDeploymentStatus | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<StationDeploymentStatus>(
      `/stations/${id}/deployment-status`,
    )
    return data
  })

// What a deploy attempt ended in. A failure carries `groups` when the API
// rejected the deploy over groups it couldn't place on a server; it's empty
// for any other error.
export type DeployOutcome =
  | ({ ok: true } & DeployStationsResponse)
  | { ok: false; message: string; groups: DeployConfigIssue[] }

// Deploying renders each station's config files and, when they all render,
// clears the pending flag for the station and its groups and records the
// authenticated user and time as the last deploy. The rendered files come
// back with the response — actually delivering them to the station servers
// is not implemented server-side yet.
//
// Skips withErrorHandling: the deploy dialog renders the failure itself,
// per-group detail included, instead of dropping it into a toast. null
// still means the auth interceptor took over (401).
export const deployStations = async (
  ids: number[],
): Promise<DeployOutcome | null> => {
  try {
    const { data } = await consoleClient.post<DeployStationsResponse>(
      '/stations/deploy',
      { ids },
    )
    return { ok: true, statuses: data.statuses, files: data.files ?? [] }
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return null
    const groups = isAxiosError(error) ? error.response?.data?.groups : null
    return {
      ok: false,
      message: extractErrorMessage(error),
      groups: Array.isArray(groups) ? (groups as DeployConfigIssue[]) : [],
    }
  }
}

export const listGroups = (): Promise<Group[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<Group[]>('/groups')
    return data
  })

export const getGroup = (id: number | string): Promise<Group | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<Group>(`/groups/${id}`)
    return data
  })

export const createGroup = (
  payload: CreateGroupRequest,
): Promise<Group | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Group>('/groups', payload)
    return data
  })

export const updateGroup = (
  id: number | string,
  payload: UpdateGroupRequest,
): Promise<Group | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<Group>(`/groups/${id}`, payload)
    return data
  })

export const deleteGroup = (id: number | string): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete(`/groups/${id}`)
  })

export const deleteGroups = (ids: number[]): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete('/groups', { data: { ids } })
  })

export const transferGroups = (
  ids: number[],
  stationId: number,
): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.patch('/groups/transfer', { ids, stationId })
  })

export const cloneGroups = (
  ids: number[],
  stationId: number,
): Promise<Group[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Group[]>('/groups/clone', {
      ids,
      stationId,
    })
    return data
  })

export const getGroupDeploymentStatus = (
  id: number | string,
): Promise<GroupDeploymentStatus | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<GroupDeploymentStatus>(
      `/groups/${id}/deployment-status`,
    )
    return data
  })

export const listGroupTags = (): Promise<GroupTag[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<GroupTag[]>('/group-tags')
    return data
  })

export const listGroupTagsDetailed = (): Promise<GroupTagDetailed[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<GroupTagDetailed[]>(
      '/group-tags/detailed',
    )
    return data
  })

export const createGroupTag = (name: string): Promise<GroupTag | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<GroupTag>('/group-tags', {
      name,
    })
    return data
  })

export const updateGroupTag = (
  id: number,
  name: string,
): Promise<GroupTag | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<GroupTag>(`/group-tags/${id}`, {
      name,
    })
    return data
  })

export const deleteGroupTag = (id: number): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete(`/group-tags/${id}`)
  })

export const listVariables = (
  params: ListVariablesParams,
): Promise<PaginatedVariables | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<PaginatedVariables>('/variables', {
      params,
    })
    return data
  })

export const getVariable = (id: number | string): Promise<Variable | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<Variable>(`/variables/${id}`)
    return data
  })

export const createVariable = (
  payload: CreateVariableRequest,
): Promise<Variable | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Variable>('/variables', payload)
    return data
  })

export const updateVariable = (
  id: number | string,
  payload: UpdateVariableRequest,
): Promise<Variable | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<Variable>(
      `/variables/${id}`,
      payload,
    )
    return data
  })

export const deleteVariable = (id: number | string): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete(`/variables/${id}`)
  })

export const deleteVariables = (ids: number[]): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.delete('/variables', { data: { ids } })
  })

export const transferVariables = (
  ids: number[],
  groupId: number,
): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.patch('/variables/transfer', { ids, groupId })
  })

export const cloneVariables = (
  ids: number[],
  groupId: number,
): Promise<Variable[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Variable[]>('/variables/clone', {
      ids,
      groupId,
    })
    return data
  })

export const saveVariablesBatch = (
  payload: VariableBatchRequest,
): Promise<VariableBatchResult | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<VariableBatchResult>(
      '/variables/batch',
      payload,
    )
    return data
  })
