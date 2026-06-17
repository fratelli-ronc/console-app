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

// --- module-level connection state (imperative, not Zustand state) ---

let abortCtrl: AbortController | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 1000

// --- store ---

interface DashboardState {
  snapshot: DashboardSnapshot | null
  connected: boolean
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
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

  useDashboardStore.setState({ connected: true })
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

  useDashboardStore.setState({ connected: false })
  if (!ctrl.signal.aborted) scheduleReconnect(ctrl.signal)
}

function scheduleReconnect(signal: AbortSignal) {
  useDashboardStore.setState({ connected: false })

  const delay = retryDelay
  retryDelay = Math.min(delay * 2, 30_000)
  retryTimer = setTimeout(() => {
    if (!signal.aborted) startStream()
  }, delay)
}

function applyEvent(name: string, data: unknown) {
  switch (name) {
    case 'snapshot':
      useDashboardStore.setState({ snapshot: data as DashboardSnapshot })
      break
    case 'metrics':
      useDashboardStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyMetrics(prev.snapshot, data as MetricsEvent[])
          : prev.snapshot,
      }))
      break
    case 'server_reachability':
      useDashboardStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyReachability(prev.snapshot, data as ServerReachabilityEvent)
          : prev.snapshot,
      }))
      break
    case 'resource_status':
      useDashboardStore.setState((prev) => ({
        snapshot: prev.snapshot
          ? applyResourceStatus(prev.snapshot, data as ResourceStatusEvent)
          : prev.snapshot,
      }))
      break
  }
}
