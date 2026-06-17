import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { StreamController } from './StreamController'

export const AppLayout: React.FC = () => {
  const scrollRef = useRef<HTMLElement>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <StreamController />

      <AppSidebar />

      <div className="ml-70 flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <AppHeader scrollContainer={scrollRef} />

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 pt-3">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontFamily: 'inherit',
            padding: '12px 14px',
            maxWidth: '360px',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          },
          error: {
            style: {
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              border: 'none',
            },
            iconTheme: {
              primary: 'var(--destructive-foreground)',
              secondary: 'var(--destructive)',
            },
          },
        }}
      />
    </div>
  )
}
