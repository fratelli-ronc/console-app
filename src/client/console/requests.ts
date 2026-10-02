import consoleClient, { refreshConsoleTokens } from './client'
import {
  CloneStationRequest,
  CreateGroupRequest,
  CreateStationRequest,
  CreateVariableRequest,
  DeployConfigIssue,
  DeployServer,
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
import { withErrorHandling } from '../withErrorHandling'
import { endSession } from '../withAuthInterceptors'
import { getToken } from '../tokenStore'
import { readSSE } from '@/lib/sse'

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

// What a deploy attempt ended in.
// - "ran": the files were shipped. `result.error` is set when it didn't
//   fully succeed, and `result.statuses` then holds the stations deployed
//   anyway. `result.servers` says what happened on each server.
// - "rejected": refused before any server was called — nothing changed.
//   `groups` lists the offending groups when that was the reason.
export type DeployOutcome =
  | { kind: 'ran'; result: DeployStationsResponse }
  | { kind: 'rejected'; message: string; groups: DeployConfigIssue[] }

// The progress a deploy streams before its result: the plan, every server
// still "waiting", then each server as its state changes.
export interface DeployProgress {
  onServers: (servers: DeployServer[]) => void
  onServer: (server: DeployServer) => void
}

const DEPLOY_STREAM_INTERRUPTED =
  "Connessione interrotta durante la distribuzione: l'esito non è noto. Ricarica la pagina per vedere lo stato aggiornato."

// Deploys the stations: console-api renders their configs, pings every
// server involved, ships the files through each one's config-helper, and
// records the deploy for every station whose servers all took them.
//
// Asks for the event stream so the dialog can follow each server live —
// hence fetch rather than consoleClient, and the 401 handling done here.
// Failures found before any server is called still come back as plain
// JSON. Never toasts: the deploy dialog renders every outcome itself. null
// means the session ended (refresh failed) and the app is logging out.
export const deployStations = async (
  ids: number[],
  progress: DeployProgress,
): Promise<DeployOutcome | null> => {
  const post = async (token: string | null) =>
    fetch(`${import.meta.env.VITE_CONSOLE_API_URL}/stations/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ids }),
    })

  let resp: Response
  try {
    resp = await post(await getToken())
    if (resp.status === 401) {
      let token: string
      try {
        token = (await refreshConsoleTokens()).token
      } catch {
        await endSession()
        return null
      }
      resp = await post(token)
    }
  } catch {
    return {
      kind: 'rejected',
      message: 'Errore di connessione. Controlla la rete.',
      groups: [],
    }
  }

  if (!resp.headers.get('Content-Type')?.includes('text/event-stream')) {
    const body = await resp.json().catch(() => null)
    const message =
      typeof body?.error === 'string' && body.error.length > 0
        ? body.error
        : `Errore del server (${resp.status}).`
    return {
      kind: 'rejected',
      message,
      groups: Array.isArray(body?.groups)
        ? (body.groups as DeployConfigIssue[])
        : [],
    }
  }

  let result: DeployStationsResponse | null = null
  try {
    await readSSE(resp.body!, (name, data) => {
      if (name === 'servers') progress.onServers(data as DeployServer[])
      else if (name === 'server') progress.onServer(data as DeployServer)
      else if (name === 'result') result = data as DeployStationsResponse
    })
  } catch {
    // Falls through to the missing result below.
  }

  if (!result) {
    return { kind: 'rejected', message: DEPLOY_STREAM_INTERRUPTED, groups: [] }
  }
  const { error, statuses, files, servers } = result as DeployStationsResponse
  return {
    kind: 'ran',
    result: {
      error,
      statuses: statuses ?? [],
      files: files ?? [],
      servers: servers ?? [],
    },
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

// names renames some of the transferred groups, keyed by group id.
export const transferGroups = (
  ids: number[],
  stationId: number,
  names?: Record<number, string>,
): Promise<void | null> =>
  withErrorHandling(async () => {
    await consoleClient.patch('/groups/transfer', { ids, stationId, names })
  })

// names renames some of the copies, keyed by source group id.
export const cloneGroups = (
  ids: number[],
  stationId: number,
  names?: Record<number, string>,
): Promise<Group[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.post<Group[]>('/groups/clone', {
      ids,
      stationId,
      names,
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
