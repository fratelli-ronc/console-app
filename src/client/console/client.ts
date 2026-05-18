import axios from 'axios'
import type { LoginResponse } from '../auth/requests'
import authClient from '../auth/client'
import {
  getToken,
  setToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
} from '../tokenStore'

const consoleClient = axios.create({
  baseURL: import.meta.env.VITE_CONSOLE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

consoleClient.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

consoleClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const rt = await getRefreshToken()
        if (!rt) throw new Error('no refresh token')
        const { data } = await authClient.post<LoginResponse>('/auth/refresh', {
          refreshToken: rt,
        })
        await setToken(data.token)
        await setRefreshToken(data.refresh_token)
        original.headers.Authorization = `Bearer ${data.token}`
        return consoleClient(original)
      } catch {
        await clearToken()
        await clearRefreshToken()
      }
    }
    return Promise.reject(error)
  },
)

export default consoleClient
