import { Route, Routes } from 'react-router-dom'
import { AppLayout, AppPrivateRoute } from '@/layout'
import {
  AuthPage,
  DeployPage,
  EditUserPage,
  HomePage,
  NewUserPage,
  ProfilationPage,
  ResoucesPage,
  ServersPage,
  ServerTreePage,
  SettingsPage,
  TestPage,
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
          <Route path="/test" element={<TestPage />} />

          <Route path="/servers" element={<ServersPage />} />
          <Route path="/servers/:uuid/resources" element={<ResoucesPage />} />

          <Route path="/deploy" element={<DeployPage />} />

          <Route path="/server-tree" element={<ServerTreePage />} />

          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<NewUserPage />} />
          <Route path="/users/:userId" element={<EditUserPage />} />

          <Route path="/profilation" element={<ProfilationPage />} />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
