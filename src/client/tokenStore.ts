import { invoke } from '@tauri-apps/api/core'

export const getToken = (): Promise<string | null> =>
  invoke<string | null>('get_token')

export const setToken = (token: string): Promise<void> =>
  invoke('set_token', { token })

export const clearToken = (): Promise<void> => invoke('clear_token')

export const getRefreshToken = (): Promise<string | null> =>
  invoke<string | null>('get_refresh_token')

export const setRefreshToken = (token: string): Promise<void> =>
  invoke('set_refresh_token', { token })

export const clearRefreshToken = (): Promise<void> =>
  invoke('clear_refresh_token')
