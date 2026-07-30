import { invoke } from '@tauri-apps/api/core'

let tokenCache: string | null | undefined
let tokenLoad: Promise<string | null> | null = null

let refreshTokenCache: string | null | undefined
let refreshTokenLoad: Promise<string | null> | null = null

export const getToken = (): Promise<string | null> => {
  if (tokenCache !== undefined) return Promise.resolve(tokenCache)

  if (!tokenLoad) {
    tokenLoad = invoke<string | null>('get_token').then((token) => {
      tokenCache = token
      tokenLoad = null
      return token
    })
  }

  return tokenLoad
}

export const setToken = async (token: string): Promise<void> => {
  await invoke('set_token', { token })
  tokenCache = token
}

export const clearToken = async (): Promise<void> => {
  await invoke('clear_token')
  tokenCache = null
}

export const getRefreshToken = (): Promise<string | null> => {
  if (refreshTokenCache !== undefined) return Promise.resolve(refreshTokenCache)

  if (!refreshTokenLoad) {
    refreshTokenLoad = invoke<string | null>('get_refresh_token').then(
      (token) => {
        refreshTokenCache = token
        refreshTokenLoad = null
        return token
      },
    )
  }

  return refreshTokenLoad
}

export const setRefreshToken = async (token: string): Promise<void> => {
  await invoke('set_refresh_token', { token })
  refreshTokenCache = token
}

export const clearRefreshToken = async (): Promise<void> => {
  await invoke('clear_refresh_token')
  refreshTokenCache = null
}
