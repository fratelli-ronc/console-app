import { useState } from 'react'
import { PanelLeft, Sun, Moon } from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'

export default function AppHeader() {
  const { toggleSidebar } = useSidebar()
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setIsDark(d => !d)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-2 text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>
      <button
        onClick={toggleDark}
        className="rounded-md p-2 text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  )
}
