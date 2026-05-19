import { Route, Routes } from 'react-router-dom'
import { AuthPage, HomePage } from './pages/intex'
import { AppLayout, AppPrivateRoute } from '@/layout'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<AppPrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
