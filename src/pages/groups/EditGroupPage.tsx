import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getGroup, Group } from '@/client'
import { GroupFormPage } from './components/GroupFormPage'

export const EditGroupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getGroup(Number(id)).then((res) => {
      setGroup(res)
      setLoaded(true)
    })
  }, [id])

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>
  }

  return <GroupFormPage mode="edit" initialValues={group ?? undefined} />
}
