import consoleClient from './client'
import { ServerTreeRelation } from './dtos'
import { withErrorHandling } from '../withErrorHandling'

export const getServerTree = (): Promise<ServerTreeRelation[] | null> =>
  withErrorHandling(async () => {
    const { data } =
      await consoleClient.get<ServerTreeRelation[]>('/server-tree')
    return data
  })

export const saveServerTree = (
  relations: ServerTreeRelation[],
): Promise<ServerTreeRelation[] | null> =>
  withErrorHandling(async () => {
    const { data } = await consoleClient.put<ServerTreeRelation[]>(
      '/server-tree',
      relations,
    )
    return data
  })
