import coolifyClient from './client'
import { withErrorHandling } from '../withErrorHandling'

// --- Resource ---

export const requestStopResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(async () => {
    await coolifyClient.get(`/services/${uuid}/stop`)
  })

export const requestStartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(async () => {
    await coolifyClient.get(`/services/${uuid}/start`)
  })

export const requestRestartResource = (uuid: string): Promise<void | null> =>
  withErrorHandling(async () => {
    await coolifyClient.get(`/services/${uuid}/restart`)
  })
