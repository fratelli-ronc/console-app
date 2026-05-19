import { useEffect, useState } from 'react'
import { Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { getToken } from '@/client/tokenStore'
import AppLayout from '@/layout/AppLayout'
import { AuthPage, HomePage } from './pages/intex'
import './App.css'

const PrivateRoute: React.FC = () => {
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getToken()
      .then((token) => {
        if (!token) navigate('/auth', { replace: true })
        else setAuthed(true)
        setReady(true)
      })
      .catch(() => {
        navigate('/auth', { replace: true })
      })
  }, [navigate])

  useEffect(() => {
    const handler = () => navigate('/auth', { replace: true })
    window.addEventListener('auth:unauthorized', handler)

    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [navigate])

  if (!ready) return null
  return authed ? <Outlet /> : null
}

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
