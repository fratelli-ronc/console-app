import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout, AppPrivateRoute, SplashScreen } from '@/layout'
import './App.css'

const AuthPage = lazy(() => import('@/pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })))
const DeployPage = lazy(() =>
  import('@/pages/deploy/DeployPage').then((m) => ({ default: m.DeployPage }))
)
const HomePage = lazy(() => import('@/pages/home/HomePage').then((m) => ({ default: m.HomePage })))
const ProfilationPage = lazy(() =>
  import('@/pages/profilation/ProfilationPage').then((m) => ({ default: m.ProfilationPage }))
)
const ResoucesPage = lazy(() =>
  import('@/pages/resources/ResourcesPage').then((m) => ({ default: m.ResoucesPage }))
)
const ServerTreePage = lazy(() =>
  import('@/pages/server-tree/ServerTreePage').then((m) => ({ default: m.ServerTreePage }))
)
const ServersPage = lazy(() =>
  import('@/pages/servers/ServersPage').then((m) => ({ default: m.ServersPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const TestPage = lazy(() => import('@/pages/test/TestPage').then((m) => ({ default: m.TestPage })))
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage }))
)
const NewUserPage = lazy(() =>
  import('@/pages/users/NewUserPage').then((m) => ({ default: m.NewUserPage }))
)
const EditUserPage = lazy(() =>
  import('@/pages/users/EditUserPage').then((m) => ({ default: m.EditUserPage }))
)

function App() {
  return (
    <Suspense fallback={<SplashScreen />}>
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
    </Suspense>
  )
}

export default App
