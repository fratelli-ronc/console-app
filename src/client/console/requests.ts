import consoleClient from './client'
import { Container } from './dtos'
import { withErrorHandling } from '../withErrorHandling'

export const getContainers = (): Promise<Container[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.get<Container[]>('/containers')
    return data
  })
