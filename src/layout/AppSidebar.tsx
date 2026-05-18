import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Container,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavChild {
  label: string
  href: string
}

interface NavItem {
  label: string
  href?: string
  icon: ReactNode
  children?: NavChild[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Menu',
    items: [
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
      {
        label: 'Container',
        href: '/containers',
        icon: <Container size={20} />,
      },
    ],
  },
  {
    title: 'Others',
    items: [
      { label: 'Users', href: '/users', icon: <Users size={20} /> },
      { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
    ],
  },
]

export default function AppSidebar() {
  const location = useLocation()
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())

  function toggleSubmenu(label: string) {
    setOpenSubmenus((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const isActive = (href: string) => location.pathname === href

  return (
    <aside className="w-70 fixed left-0 top-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300">
      {/* Logo */}
      <div
        data-tauri-drag-region
        className="h-16 flex shrink-0 items-center px-4"
      >
        <div className="relative h-9 w-9 mr-3">
          <img
            src="/logo-verde-castoro-ronc.png"
            alt="logo"
            className="w-full h-full"
          />
        </div>

        <span className="font-bold text-base text-sidebar-foreground">
          Ronc
        </span>
        <span className="ml-1 text-base text-sidebar-foreground">Console</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.title}
            </p>

            <ul className="space-y-1">
              {section.items.map((item) => {
                const hasChildren = !!item.children?.length
                const isOpen = openSubmenus.has(item.label)
                const active = item.href ? isActive(item.href) : false

                return (
                  <li key={item.label}>
                    {hasChildren ? (
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className={cn(
                          'w-full flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors',
                          'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <span className="shrink-0">{item.icon}</span>

                        <span className="ml-3 flex-1 text-left">
                          {item.label}
                        </span>

                        {isOpen ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    ) : (
                      <Link
                        to={item.href ?? '#'}
                        className={cn(
                          'flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <span className="shrink-0">{item.icon}</span>

                        <span className="ml-3">{item.label}</span>
                      </Link>
                    )}

                    {hasChildren && isOpen && (
                      <ul className="mt-1 ml-9 space-y-1 border-l border-sidebar-border pl-3">
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              className={cn(
                                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                                isActive(child.href)
                                  ? 'text-sidebar-primary font-medium'
                                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
