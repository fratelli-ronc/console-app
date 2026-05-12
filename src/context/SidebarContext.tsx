import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar(): SidebarContextType {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider')
  return ctx
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar: () => setIsExpanded(e => !e) }}>
      {children}
    </SidebarContext.Provider>
  )
}
