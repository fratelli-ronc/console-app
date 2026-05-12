import { Outlet } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'

function LayoutContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-70 flex flex-col flex-1 transition-all duration-300">
        <AppHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return <LayoutContent />
}
