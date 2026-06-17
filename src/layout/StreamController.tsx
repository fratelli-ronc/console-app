import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDashboardStore } from '@/store'

function isStreamRoute(pathname: string): boolean {
  return pathname === '/servers' || pathname.startsWith('/servers/')
}

export const StreamController: React.FC = () => {
  const location = useLocation()

  const connect = useDashboardStore((s) => s.connect)
  const disconnect = useDashboardStore((s) => s.disconnect)

  const active = isStreamRoute(location.pathname)

  useEffect(() => {
    if (!active) return
    connect()
    return () => disconnect()
  }, [active])

  return null
}
