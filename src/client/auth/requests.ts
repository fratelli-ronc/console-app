import authClient, { authenticatedAuthClient } from './client'
import { LoginResponse, UserProfile } from './dtos'

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('/auth', {
    email,
    password,
  })
  return data
}

export const logout = async (): Promise<void> => {
  await authClient.post('/auth/logout')
}

export const refreshToken = async (token: string): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('/auth/refresh', {
    refreshToken: token,
  })
  return data
}

export const me = async (): Promise<UserProfile> => {
  const { data } = await authenticatedAuthClient.get<UserProfile>('/auth/me')
  return data
}
