import consoleClient from './client'

export interface Container {
  id: string
  name: string
}

export const getContainers = async (): Promise<Container[]> => {
  const { data } = await consoleClient.get<Container[]>('/containers')
  return data
}
