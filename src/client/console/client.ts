import axios from 'axios'
import authClient from '../auth/client'
import { refreshTokens, withAuthInterceptors } from '../withAuthInterceptors'
import { LoginResponse } from '../auth'

const doRefresh = async (rt: string) => {
  const { data } = await authClient.post<LoginResponse>('/refresh', {
    refreshToken: rt,
  })
  return data
}

const consoleClient = withAuthInterceptors(
  axios.create({
    baseURL: import.meta.env.VITE_CONSOLE_API_URL,
    headers: { 'Content-Type': 'application/json' },
  }),
  doRefresh,
)

// For console-api calls made with fetch rather than consoleClient — a
// streamed response — which therefore miss the interceptor's refresh.
// Shares its in-flight refresh, so the two never race.
export const refreshConsoleTokens = () => refreshTokens(doRefresh)

export default consoleClient
