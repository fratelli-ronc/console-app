import { PanelLeft } from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'

export default function AppHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header data-tauri-drag-region className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-border bg-background px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-2 text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>
    </header>
  )
}
