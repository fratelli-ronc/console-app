import { Route, Routes } from 'react-router-dom'
import { AppLayout, AppPrivateRoute } from '@/layout'
import {
  AuthPage,
  HomePage,
  ServersPage,
  SettingsPage,
  UsersPage,
} from '@/pages'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<AppPrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
