import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Server,
  TestTube,
  HardDriveDownload,
  UserCog,
  Network,
  Radio,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { clearToken, clearRefreshToken } from '@/client/tokenStore'
import { useUserStore } from '@/store'
import { logout } from '@/client'

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
      { label: 'Test', href: '/test', icon: <TestTube size={20} /> },
      { label: 'Stazioni', href: '/stations', icon: <Radio size={20} /> },
      { label: 'Gruppi', href: '/groups', icon: <Boxes size={20} /> },
    ],
  },
  {
    title: 'Infrastruttura',
    items: [
      {
        label: 'Server',
        href: '/servers',
        icon: <Server size={20} />,
      },
      {
        label: 'Deploy',
        href: '/deploy',
        icon: <HardDriveDownload size={20} />,
      },
      {
        label: 'Alberatura',
        href: '/server-tree',
        icon: <Network size={20} />,
      },
    ],
  },
  {
    title: 'Amministrazione',
    items: [
      { label: 'Utenti', href: '/users', icon: <Users size={20} /> },
      {
        label: 'Profilazione',
        href: '/profilation',
        icon: <UserCog size={20} />,
      },
    ],
  },
  {
    title: 'Altro',
    items: [
      {
        label: 'Impostazioni',
        href: '/settings',
        icon: <Settings size={20} />,
      },
    ],
  },
]

export const AppSidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)

  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set())

  async function handleLogout() {
    await logout()
    await Promise.all([clearToken(), clearRefreshToken()])
    navigate('/auth', { replace: true })
  }

  function toggleSubmenu(label: string) {
    setOpenSubmenus((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const isActive = (href: string) =>
    href === '/' ? location.pathname === href : location.pathname.includes(href)

  return (
    <aside className="w-70 fixed left-0 top-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300">
      {/* Logo */}
      <div
        data-tauri-drag-region
        className="h-14 flex shrink-0 items-center px-4"
      >
        <div className="relative h-9 w-9 mr-3">
          <img
            draggable={false}
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
                          'w-full flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors cursor-pointer',
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
                        draggable={false}
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
                              draggable={false}
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

      {/* User + Logout */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        {user ? (
          <div className="flex items-center gap-3">
            <img
              draggable={false}
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 rounded-md object-cover shrink-0"
            />
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {user.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors cursor-pointer',
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </button>
        )}
      </div>
    </aside>
  )
}
