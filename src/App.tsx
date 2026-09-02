import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
} from 'react-router-dom'
import { AppLayout, AppPrivateRoute, SplashScreen } from '@/layout'
import './App.css'

// --- Auth ---
const AuthPage = lazy(() =>
  import('@/pages/auth/AuthPage').then((m) => ({ default: m.AuthPage })),
)

// --- Menu ---
const HomePage = lazy(() =>
  import('@/pages/home/HomePage').then((m) => ({ default: m.HomePage })),
)
const StationsPage = lazy(() =>
  import('@/pages/stations/StationsPage').then((m) => ({
    default: m.StationsPage,
  })),
)
const NewStationPage = lazy(() =>
  import('@/pages/stations/NewStationPage').then((m) => ({
    default: m.NewStationPage,
  })),
)
const EditStationPage = lazy(() =>
  import('@/pages/stations/EditStationPage').then((m) => ({
    default: m.EditStationPage,
  })),
)
const StationTagsPage = lazy(() =>
  import('@/pages/station-tags/StationTagsPage').then((m) => ({
    default: m.StationTagsPage,
  })),
)
const GroupsPage = lazy(() =>
  import('@/pages/groups/GroupsPage').then((m) => ({
    default: m.GroupsPage,
  })),
)
const NewGroupPage = lazy(() =>
  import('@/pages/groups/NewGroupPage').then((m) => ({
    default: m.NewGroupPage,
  })),
)
const EditGroupPage = lazy(() =>
  import('@/pages/groups/EditGroupPage').then((m) => ({
    default: m.EditGroupPage,
  })),
)
const GroupTagsPage = lazy(() =>
  import('@/pages/group-tags/GroupTagsPage').then((m) => ({
    default: m.GroupTagsPage,
  })),
)
const VariablesPage = lazy(() =>
  import('@/pages/variables/VariablesPage').then((m) => ({
    default: m.VariablesPage,
  })),
)

// --- Infrastruttura ---
const ServersPage = lazy(() =>
  import('@/pages/servers/ServersPage').then((m) => ({
    default: m.ServersPage,
  })),
)
const ResoucesPage = lazy(() =>
  import('@/pages/resources/ResourcesPage').then((m) => ({
    default: m.ResoucesPage,
  })),
)
const DeployPage = lazy(() =>
  import('@/pages/deploy/DeployPage').then((m) => ({ default: m.DeployPage })),
)
const ServerTreePage = lazy(() =>
  import('@/pages/server-tree/ServerTreePage').then((m) => ({
    default: m.ServerTreePage,
  })),
)

// --- Amministrazione ---
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const NewUserPage = lazy(() =>
  import('@/pages/users/NewUserPage').then((m) => ({ default: m.NewUserPage })),
)
const EditUserPage = lazy(() =>
  import('@/pages/users/EditUserPage').then((m) => ({
    default: m.EditUserPage,
  })),
)
const ProfilationPage = lazy(() =>
  import('@/pages/profilation/ProfilationPage').then((m) => ({
    default: m.ProfilationPage,
  })),
)

// --- Altro ---
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
)

// Single Suspense boundary for the lazily-loaded page chunks, matching the
// previous <Routes>-wrapped-in-<Suspense> behaviour.
const SuspenseBoundary: React.FC = () => (
  <Suspense fallback={<SplashScreen />}>
    <Outlet />
  </Suspense>
)

// Data router (createBrowserRouter) rather than <BrowserRouter> so pages can
// use useBlocker to guard unsaved changes on navigation.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<SuspenseBoundary />}>
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<AppPrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/stations/new" element={<NewStationPage />} />
          <Route path="/stations/:id" element={<EditStationPage />} />
          <Route path="/stations/station-tags" element={<StationTagsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/new" element={<NewGroupPage />} />
          <Route path="/groups/:id" element={<EditGroupPage />} />
          <Route path="/groups/group-tags" element={<GroupTagsPage />} />
          <Route path="/variables" element={<VariablesPage />} />

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
    </Route>,
  ),
)

function App() {
  return <RouterProvider router={router} />
}

export default App
