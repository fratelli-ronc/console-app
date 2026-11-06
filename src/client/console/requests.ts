import consoleClient, { refreshConsoleTokens } from './client'
import {
  ChangeFilters,
  ChangesPage,
  ChangesQuery,
  CloneStationRequest,
  ConfigVersions,
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
  NextGroupId,
  NextStationId,
  PaginatedVariables,
  RevertChanges,
  RevertPreview,
  RevertWarning,
  ServerTreeRelation,
  ServerTreeRelationRequest,
  Station,
  StationChanges,
  StationDeploymentStatus,
  StationPendingDiff,
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
  VersionConflicts,
} from './dtos'
import { isAxiosError } from 'axios'
import { withErrorHandling } from '../withErrorHandling'
import { endSession } from '../withAuthInterceptors'
import { getToken } from '../tokenStore'
import { readSSE } from '@/lib/sse'

// What an update sending `version` ended in: saved, or refused because
// someone saved the entity since it was loaded - nothing was written then.
// null (from withErrorHandling) means it failed otherwise, already toasted.
export type SaveOutcome<T> =
  { kind: 'saved'; data: T } | { kind: 'conflict'; conflicts: VersionConflicts }

// withErrorHandling, except that a version conflict comes back as an
// outcome for the caller to resolve rather than as a toast.
const withVersionConflicts = <T>(
  fn: () => Promise<T>,
): Promise<SaveOutcome<T> | null> =>
  withErrorHandling(async () => {
    try {
      return { kind: 'saved', data: await fn() }
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.status === 409 &&
        Array.isArray(error.response.data?.conflicts)
      ) {
        return {
          kind: 'conflict',
          conflicts: error.response.data as VersionConflicts,
        }
      }
      throw error
    }
  })

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
): Promise<SaveOutcome<Station> | null> =>
  withVersionConflicts(async () => {
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
    const { data } =
      await consoleClient.get<DeploymentStatuses>('/deployment-status')
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

// What deploying the station would change, one net change per entity.
export const getStationPendingDiff = (
  id: number | string,
): Promise<StationPendingDiff | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<StationPendingDiff>(
      `/stations/${id}/pending-diff`,
    )
    return data
  })

// One page of the station's whole change history, newest first; before is
// the change set id the page ends before.
export const getStationChanges = (
  id: number | string,
  params: { before?: number; limit?: number } = {},
): Promise<StationChanges | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<StationChanges>(
      `/stations/${id}/changes`,
      { params },
    )
    return data
  })

// One page of the whole change log, newest first, filtered by query.
export const getChanges = (
  query: ChangesQuery = {},
): Promise<ChangesPage | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<ChangesPage>('/changes', {
      params: query,
    })
    return data
  })

// What the change log can be filtered by: its users and stations.
export const getChangeFilters = (): Promise<ChangeFilters | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<ChangeFilters>('/changes/filters')
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

const CONNECTION_ERROR = 'Errore di connessione. Controlla la rete.'

// What a streamed deploy request came back with: a plain JSON answer -
// every failure found before any server was called, and whatever else the
// endpoint answers without deploying - or the stream's result event.
type DeployStreamResponse =
  | { kind: 'json'; status: number; body: any }
  | { kind: 'result'; result: unknown }
  | { kind: 'failed'; message: string }

// POSTs to a console-api endpoint that deploys, asking for the event
// stream so the dialog can follow each server live — hence fetch rather
// than consoleClient, and the 401 handling done here. null means the
// session ended (refresh failed) and the app is logging out.
const postDeployStream = async (
  path: string,
  body: unknown,
  progress: DeployProgress,
): Promise<DeployStreamResponse | null> => {
  const post = async (token: string | null) =>
    fetch(`${import.meta.env.VITE_CONSOLE_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
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
    return { kind: 'failed', message: CONNECTION_ERROR }
  }

  if (!resp.headers.get('Content-Type')?.includes('text/event-stream')) {
    return {
      kind: 'json',
      status: resp.status,
      body: await resp.json().catch(() => null),
    }
  }

  let result: unknown = null
  try {
    await readSSE(resp.body!, (name, data) => {
      if (name === 'servers') progress.onServers(data as DeployServer[])
      else if (name === 'server') progress.onServer(data as DeployServer)
      else if (name === 'result') result = data
    })
  } catch {
    // Falls through to the missing result below.
  }
  if (!result) return { kind: 'failed', message: DEPLOY_STREAM_INTERRUPTED }
  return { kind: 'result', result }
}

const errorMessage = (body: any, status: number) =>
  typeof body?.error === 'string' && body.error.length > 0
    ? body.error
    : `Errore del server (${status}).`

const issueGroups = (body: any): DeployConfigIssue[] =>
  Array.isArray(body?.groups) ? (body.groups as DeployConfigIssue[]) : []

const normalizeDeployResult = (
  result: DeployStationsResponse,
): DeployStationsResponse => ({
  error: result.error,
  statuses: result.statuses ?? [],
  files: result.files ?? [],
  servers: result.servers ?? [],
})

// Deploys the stations: console-api renders their configs, pings every
// server involved, ships the files through each one's config-helper, and
// records the deploy for every station whose servers all took them.
// Streams its progress through `progress`. Never toasts: the deploy dialog
// renders every outcome itself. null means the session ended.
export const deployStations = async (
  ids: number[],
  progress: DeployProgress,
): Promise<DeployOutcome | null> => {
  const resp = await postDeployStream('/stations/deploy', { ids }, progress)
  if (!resp) return null
  if (resp.kind === 'failed')
    return { kind: 'rejected', message: resp.message, groups: [] }
  if (resp.kind === 'json') {
    return {
      kind: 'rejected',
      message: errorMessage(resp.body, resp.status),
      groups: issueGroups(resp.body),
    }
  }
  return {
    kind: 'ran',
    result: normalizeDeployResult(resp.result as DeployStationsResponse),
  }
}

// A station's config versions, newest first.
export const listStationConfigVersions = (
  stationId: number,
): Promise<ConfigVersions | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<ConfigVersions>(
      `/stations/${stationId}/config-versions`,
    )
    return data
  })

// A config version's file, byte for byte as it was written to the central
// server.
export const getStationConfigVersionFile = (
  stationId: number,
  versionId: number,
): Promise<string | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<string>(
      `/stations/${stationId}/config-versions/${versionId}`,
      { responseType: 'text', transformResponse: (raw) => raw },
    )
    return data
  })

// Why console-api refused to revert to a version, whatever is confirmed:
// reasons lists ids held elsewhere now, groups the ones that could not be
// deployed any more.
export interface RevertRefusal {
  message: string
  reasons: string[]
  groups: DeployConfigIssue[]
}

const revertRefusal = (body: any, status: number): RevertRefusal => ({
  message: errorMessage(body, status),
  reasons: Array.isArray(body?.reasons) ? (body.reasons as string[]) : [],
  groups: issueGroups(body),
})

export type RevertPreviewOutcome =
  | { kind: 'preview'; preview: RevertPreview }
  | { kind: 'refused'; refusal: RevertRefusal }

// What reverting the station to the version would do, without doing it.
// A refusal comes back as an outcome for the dialog to show; any other
// failure is toasted (null).
export const getRevertPreview = (
  stationId: number,
  versionId: number,
): Promise<RevertPreviewOutcome | null> =>
  withErrorHandling(async () => {
    try {
      const { data } = await consoleClient.get<RevertPreview>(
        `/stations/${stationId}/config-versions/${versionId}/revert-preview`,
      )
      return { kind: 'preview', preview: data }
    } catch (error) {
      if (!isAxiosError(error) || !error.response) throw error
      const { status, data } = error.response
      if (status !== 400 && status !== 409) throw error
      return { kind: 'refused', refusal: revertRefusal(data, status) }
    }
  })

// What a revert attempt ended in.
// - "warnings": nothing was done — the station changed since the preview,
//   and these need confirming again.
// - "refused": nothing was done, and the revert cannot go ahead.
// - "reverted": the station was written back to the version, but the
//   deploy did not start (message says why). It is left pending.
// - "ran": reverted, then deployed — `result.error` is set when the deploy
//   did not fully succeed, as for deployStations.
export type RevertOutcome =
  | { kind: 'warnings'; warnings: RevertWarning[] }
  | { kind: 'refused'; refusal: RevertRefusal }
  | { kind: 'reverted'; message: string; changes: RevertChanges | null }
  | { kind: 'ran'; result: DeployStationsResponse; changes: RevertChanges }

// Reverts the station to the version and deploys it, in one step, streaming
// the deploy through `progress`. force confirms the warnings the preview
// showed. Never toasts. null means the session ended.
export const revertStation = async (
  stationId: number,
  versionId: number,
  force: boolean,
  progress: DeployProgress,
): Promise<RevertOutcome | null> => {
  const resp = await postDeployStream(
    `/stations/${stationId}/config-versions/${versionId}/revert?force=${force}`,
    undefined,
    progress,
  )
  if (!resp) return null
  if (resp.kind === 'failed') {
    return {
      kind: 'refused',
      refusal: { message: resp.message, reasons: [], groups: [] },
    }
  }
  if (resp.kind === 'json') {
    const body = resp.body
    if (body?.reverted === true) {
      return {
        kind: 'reverted',
        message: errorMessage(body, resp.status),
        changes: (body.changes as RevertChanges) ?? null,
      }
    }
    if (resp.status === 200 && Array.isArray(body?.warnings)) {
      return { kind: 'warnings', warnings: body.warnings as RevertWarning[] }
    }
    return { kind: 'refused', refusal: revertRefusal(body, resp.status) }
  }

  const result = resp.result as {
    changes: RevertChanges
    deploy?: DeployStationsResponse
    error?: string
  }
  return {
    kind: 'ran',
    changes: result.changes,
    result: normalizeDeployResult({
      ...(result.deploy ?? { statuses: [], files: [], servers: [] }),
      error: result.deploy?.error ?? result.error,
    }),
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
): Promise<SaveOutcome<Group> | null> =>
  withVersionConflicts(async () => {
    const { data } = await consoleClient.put<Group>(`/groups/${id}`, payload)
    return data
  })

export const getNextGroupId = (): Promise<NextGroupId | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<NextGroupId>('/group-next-id')
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

// Saves one variable (the edit dialog); the grid saves through
// saveVariablesBatch instead.
export const updateVariable = (
  id: number,
  payload: UpdateVariableRequest,
): Promise<SaveOutcome<Variable> | null> =>
  withVersionConflicts(async () => {
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

// A conflict on any updated row refuses the whole batch.
export const saveVariablesBatch = (
  payload: VariableBatchRequest,
): Promise<SaveOutcome<VariableBatchResult> | null> =>
  withVersionConflicts(async () => {
    const { data } = await consoleClient.post<VariableBatchResult>(
      '/variables/batch',
      payload,
    )
    return data
  })
