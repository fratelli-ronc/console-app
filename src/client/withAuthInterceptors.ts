import type { AxiosInstance } from 'axios'
import {
  clearRefreshToken,
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from './tokenStore'

type RefreshResult = { token: string; refresh_token: string }

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
          const rt = await getRefreshToken()
          if (!rt) throw new Error('no refresh token')

          const result = await doRefresh(rt)

          await setToken(result.token)
          await setRefreshToken(result.refresh_token)

          original.headers.Authorization = `Bearer ${result.token}`

          return instance(original)
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
