import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { getToken, me } from '@/client'
import { useUserStore } from '@/store'
import { SplashScreen } from './SplashScreen'

const MIN_SPLASH_MS = 500

export const AppPrivateRoute: React.FC = () => {
  const navigate = useNavigate()

  const setUser = useUserStore((s) => s.setUser)
  const clearUser = useUserStore((s) => s.clearUser)

  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout>
    const start = Date.now()

    getToken()
      .then((token) => {
        if (!token) {
          navigate('/auth', { replace: true })
          return
        }

        // Keep the outlet unmounted until /me settles, so authenticated
        // pages never flash before we know the profile actually loaded.
        me()
          .then((profile) => {
            if (cancelled) return

            setUser(profile)

            const remaining = MIN_SPLASH_MS - (Date.now() - start)
            if (remaining > 0) {
              timeout = setTimeout(() => {
                if (!cancelled) setReady(true)
              }, remaining)
            } else {
              setReady(true)
            }
          })
          .catch(() => {
            navigate('/auth', { replace: true })
          })
      })
      .catch(() => {
        navigate('/auth', { replace: true })
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = () => {
      clearUser()
      navigate('/auth', { replace: true })
    }

    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [navigate])

  return ready ? <Outlet /> : <SplashScreen />
}
