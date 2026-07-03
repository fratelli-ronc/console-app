import { create } from 'zustand'
import {
  clearRefreshToken,
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from '@/client/tokenStore'
import type {
  DashboardSnapshot,
  MetricsEvent,
  ResourceAddedEvent,
  ResourceRemovedEvent,
  ResourceStatusEvent,
  ServerReachabilityEvent,
} from '@/client/coolify/dtos'
import authClient from '@/client/auth/client'
import type { LoginResponse } from '@/client/auth/dtos'

// --- pure snapshot patchers ---

function applyMetrics(
  prev: DashboardSnapshot,
  events: MetricsEvent[],
): DashboardSnapshot {
  const map = new Map(events.map((e) => [e.serverUUID, e.metrics]))
  return {
    servers: prev.servers.map((ss) => {
      const m = map.get(ss.server.uuid)
      return m ? { ...ss, metrics: m } : ss
    }),
  }
}

function applyReachability(
  prev: DashboardSnapshot,
  event: ServerReachabilityEvent,
): DashboardSnapshot {
  return {
    servers: prev.servers.map((ss) =>
      ss.server.uuid === event.serverUUID
        ? { ...ss, server: { ...ss.server, isReachable: event.isReachable } }
        : ss,
    ),
  }
}

function applyResourceStatus(
  prev: DashboardSnapshot,
  event: ResourceStatusEvent,
): DashboardSnapshot {
  return {
    servers: prev.servers.map((ss) =>
      ss.server.uuid === event.serverUUID
        ? {
            ...ss,
            resources: ss.resources.map((r) =>
              r.uuid === event.resourceUUID
                ? { ...r, status: event.status }
                : r,
            ),
          }
        : ss,
    ),
  }
}

function applyResourceAdded(
  prev: DashboardSnapshot,
  event: ResourceAddedEvent,
): DashboardSnapshot {
  return {
    servers: prev.servers.map((ss) =>
      ss.server.uuid === event.serverUUID
        ? { ...ss, resources: [...ss.resources, event.resource] }
        : ss,
    ),
  }
}

function applyResourceRemoved(
  prev: DashboardSnapshot,
  event: ResourceRemovedEvent,
): DashboardSnapshot {
  return {
    servers: prev.servers.map((ss) =>
      ss.server.uuid === event.serverUUID
        ? {
            ...ss,
            resources: ss.resources.filter(
              (r) => r.uuid !== event.resourceUUID,
            ),
          }
        : ss,
    ),
  }
}

// --- module-level connection state (imperative, not Zustand state) ---

let abortCtrl: AbortController | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 1000

// --- store ---

interface InfraState {
  snapshot: DashboardSnapshot | null
  connected: boolean
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

export const useInfraStore = create<InfraState>((set) => ({
  snapshot: null,
  connected: false,

  connect: () => {
    retryDelay = 1000
    startStream()
  },

  disconnect: () => {
    abortCtrl?.abort()
    abortCtrl = null
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    retryDelay = 1000
    set({ snapshot: null, connected: false })
  },

  reconnect: () => {
    retryDelay = 1000
    startStream()
  },
}))

// --- optimistic updates ---

export function optimisticallySetResourceStatus(
  resourceUUID: string,
  status: string,
) {
  useInfraStore.setState((prev) => {
    if (!prev.snapshot) return {}
    return {
      snapshot: {
        servers: prev.snapshot.servers.map((ss) => ({
          ...ss,
          resources: ss.resources.map((r) =>
            r.uuid === resourceUUID ? { ...r, status } : r,
          ),
        })),
      },
    }
  })
}

// --- SSE connection logic ---

async function startStream() {
  abortCtrl?.abort()

  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }

  const token = await getToken()
  if (!token) return

  const ctrl = new AbortController()
  abortCtrl = ctrl

  let resp: Response
  try {
    resp = await fetch(
      `${import.meta.env.VITE_COOLIFY_BRIDGE_API_URL}/stream`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      },
    )
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    scheduleReconnect(ctrl.signal)
    return
  }

  if (resp.status === 401) {
    try {
      const rt = await getRefreshToken()
      if (!rt) throw new Error('no refresh token')

      const { data } = await authClient.post<LoginResponse>('/refresh', {
        refreshToken: rt,
      })

      await setToken(data.token)
      await setRefreshToken(data.refresh_token)
      if (!ctrl.signal.aborted) startStream()
    } catch {
      await clearToken()
      await clearRefreshToken()

      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return
  }

  if (!resp.ok || !resp.body) {
    scheduleReconnect(ctrl.signal)
    return
  }

  useInfraStore.setState({ connected: true })
  retryDelay = 1000

  const reader = resp.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let eventName = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventName = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const payload = JSON.parse(line.slice(6))
          applyEvent(eventName, payload)
          eventName = ''
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return
  }

  useInfraStore.setState({ connected: false })
  if (!ctrl.signal.aborted) scheduleReconnect(ctrl.signal)
}

function scheduleReconnect(signal: AbortSignal) {
  useInfraStore.setState({ connected: false })

  const delay = retryDelay
  retryDelay = Math.min(delay * 2, 30_000)
  retryTimer = setTimeout(() => {
    if (!signal.aborted) startStream()
  }, delay)
}

function applyEvent(name: string, data: unknown) {
  if (name != 'metrics') {
    console.log('name:', name, 'data:', data)
  }

  switch (name) {
    case 'snapshot':
      useInfraStore.setState({ snapshot: data as DashboardSnapshot })
      break
    case 'metrics':
      useInfraStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyMetrics(prev.snapshot, data as MetricsEvent[])
          : prev.snapshot,
      }))
      break
    case 'server_reachability':
      useInfraStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyReachability(prev.snapshot, data as ServerReachabilityEvent)
          : prev.snapshot,
      }))
      break
    case 'resource_status':
      useInfraStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyResourceStatus(prev.snapshot, data as ResourceStatusEvent)
          : prev.snapshot,
      }))
      break
    case 'resource_added':
      useInfraStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyResourceAdded(prev.snapshot, data as ResourceAddedEvent)
          : prev.snapshot,
      }))
      break
    case 'resource_removed':
      useInfraStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyResourceRemoved(prev.snapshot, data as ResourceRemovedEvent)
          : prev.snapshot,
      }))
      break
  }
}
