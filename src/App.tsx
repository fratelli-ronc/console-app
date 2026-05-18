import { Route, Routes } from 'react-router-dom'
import { AuthPage, HomePage } from './pages/intex'
import AppLayout from '@/layout/AppLayout'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default App
