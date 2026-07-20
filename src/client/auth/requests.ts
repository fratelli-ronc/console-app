import authClient, { authenticatedAuthClient } from './client'
import {
  AuthUser,
  ListUsersResponse,
  LoginResponse,
  UpsertUserRequest,
  UserProfile,
} from './dtos'
import { withErrorHandling } from '../withErrorHandling'

export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('', {
    username,
    password,
    target: 'console',
  })
  return data
}

export const refreshToken = async (token: string): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('/refresh', {
    refreshToken: token,
  })
  return data
}

export const logout = async (): Promise<void> => {
  await authenticatedAuthClient.get('/logout')
}

export const me = async (): Promise<UserProfile> => {
  const { data } = await authenticatedAuthClient.get<UserProfile>('/me')
  return data
}

export const listUsers = (): Promise<AuthUser[] | null> =>
  withErrorHandling(async () => {
    const { data } =
      await authenticatedAuthClient.get<ListUsersResponse>('/list')
    return data.users
  })

export const getUser = (id: number): Promise<AuthUser | null> =>
  withErrorHandling(async () => {
    const { data } = await authenticatedAuthClient.get<AuthUser>(`/${id}`)
    return data
  })

export const createUser = (payload: UpsertUserRequest): Promise<void | null> =>
  withErrorHandling(async () => {
    await authenticatedAuthClient.post('/new', payload)
  })

export const updateUser = (
  id: number,
  payload: UpsertUserRequest,
): Promise<void | null> =>
  withErrorHandling(async () => {
    await authenticatedAuthClient.put(`/${id}`, payload)
  })

export const deleteUser = (id: number): Promise<void | null> =>
  withErrorHandling(async () => {
    await authenticatedAuthClient.delete(`/${id}`)
  })
