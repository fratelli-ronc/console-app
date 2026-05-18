import { Container } from 'react-dom/client'
import consoleClient from './client'

export const getContainers = async (): Promise<Container[]> => {
  const { data } = await consoleClient.get<Container[]>('/containers')
  return data
}
