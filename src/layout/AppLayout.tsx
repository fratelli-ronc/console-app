import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export const AppLayout: React.FC = () => {
  const scrollRef = useRef<HTMLElement>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <div className="ml-70 flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <AppHeader scrollContainer={scrollRef} />

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
