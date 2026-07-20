import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getUser, AuthUser } from '@/client'
import { UserFormPage } from './components/UserFormPage'

export const EditUserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getUser(Number(userId)).then((res) => {
      setUser(res)
      setLoaded(true)
    })
  }, [userId])

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>
  }

  return <UserFormPage mode="edit" initialValues={user ?? undefined} />
}
