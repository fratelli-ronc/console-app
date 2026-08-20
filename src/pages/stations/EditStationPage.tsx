import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStation, Station } from '@/client'
import { StationFormPage } from './components/StationFormPage'

export const EditStationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [station, setStation] = useState<Station | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getStation(Number(id)).then((res) => {
      setStation(res)
      setLoaded(true)
    })
  }, [id])

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>
  }

  return <StationFormPage mode="edit" initialValues={station ?? undefined} />
}
