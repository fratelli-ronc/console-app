import axios from 'axios'
import authClient from '../auth/client'
import { withAuthInterceptors } from '../withAuthInterceptors'
import { LoginResponse } from '../auth'

const coolifyClient = withAuthInterceptors(
  axios.create({
    baseURL: import.meta.env.VITE_COOLIFY_BRIDGE_API_URL,
    headers: { 'Content-Type': 'application/json' },
  }),
  async (rt) => {
    const { data } = await authClient.post<LoginResponse>('/auth/refresh', {
      refreshToken: rt,
    })
    return data
  },
)

export default coolifyClient
