import type { AxiosInstance } from 'axios'
import {
  clearRefreshToken,
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from './tokenStore'

type RefreshResult = { token: string; refreshToken: string }

// Shared across every instance wrapped by this factory (consoleClient,
// coolifyClient, ...) so concurrent 401s from any of them — the common
// case when a page fires multiple requests at once — piggyback on a
// single refresh instead of each racing their own, which previously let
// a later, now-stale refresh token wipe out the tokens a prior refresh
// had just set.
let refreshPromise: Promise<RefreshResult> | null = null

function refreshTokens(
  doRefresh: (refreshToken: string) => Promise<RefreshResult>,
): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = await getRefreshToken()

      if (!rt) throw new Error('no refresh token')

      const result = await doRefresh(rt)

      await setToken(result.token)
      await setRefreshToken(result.refreshToken)

      return result
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export function withAuthInterceptors(
  instance: AxiosInstance,
  doRefresh: (refreshToken: string) => Promise<RefreshResult>,
): AxiosInstance {
  instance.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`

    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true

        try {
          const result = await refreshTokens(doRefresh)

          original.headers.Authorization = `Bearer ${result.token}`

          return await instance(original)
        } catch {
          await clearToken()
          await clearRefreshToken()

          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        }
      }

      return Promise.reject(error)
    },
  )

  return instance
}
