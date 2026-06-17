import authClient, { authenticatedAuthClient } from './client'
import { LoginResponse, UserProfile } from './dtos'

export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('', {
    username,
    password,
    target: "console",
  })
  return data
}

export const logout = async (): Promise<void> => {
  await authClient.post('/logout')
}

export const refreshToken = async (token: string): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('/refresh', {
    refreshToken: token,
  })
  return data
}

export const me = async (): Promise<UserProfile> => {
  const { data } = await authenticatedAuthClient.get<UserProfile>('/me')
  return data
}
