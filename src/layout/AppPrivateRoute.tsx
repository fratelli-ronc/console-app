import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { getToken, me } from '@/client'
import { useUserStore } from '@/store'

export const AppPrivateRoute: React.FC = () => {
  const navigate = useNavigate()

  const setUser = useUserStore((s) => s.setUser)
  const clearUser = useUserStore((s) => s.clearUser)

  const [ready, setReady] = useState(false)

  useEffect(() => {
    getToken()
      .then((token) => {
        if (!token) {
          navigate('/auth', { replace: true })
        } else {
          setReady(true)
          me()
            .then((profile) => {
              setUser(profile)
              setReady(true)
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        navigate('/auth', { replace: true })
      })
  }, [navigate])

  useEffect(() => {
    const handler = () => {
      clearUser()
      navigate('/auth', { replace: true })
    }

    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [navigate])

  return !ready ? null : <Outlet />
}
