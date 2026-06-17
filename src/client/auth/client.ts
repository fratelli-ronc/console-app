import axios from 'axios'
import { withAuthInterceptors } from '../withAuthInterceptors'

const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const authenticatedAuthClient = withAuthInterceptors(
  axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL,
    headers: { 'Content-Type': 'application/json' },
  }),
  async (rt) => {
    const { data } = await authClient.post<{
      token: string
      refresh_token: string
    }>('/auth/refresh', { refreshToken: rt })
    return data
  },
)

export default authClient
