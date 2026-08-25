import consoleClient from './client'
import {
  CreateGroupRequest,
  CreateStationRequest,
  Group,
  GroupTag,
  GroupTagDetailed,
  ServerTreeRelation,
  ServerTreeRelationRequest,
  Station,
  StationPhoto,
  StationTag,
  StationTagDetailed,
  UpdateGroupRequest,
  UpdateStationPhotoRequest,
  UpdateStationRequest,
} from './dtos'
import { withErrorHandling } from '../withErrorHandling'

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

export const listGroupTags = (): Promise<GroupTag[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<GroupTag[]>('/group-tags')
    return data
  })

export const listGroupTagsDetailed = (): Promise<
  GroupTagDetailed[] | null
> =>
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
