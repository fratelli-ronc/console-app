import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROUTE_LABELS: Record<string, string> = {
  servers: 'Server',
  resources: 'Risorse',
  users: 'Utenti',
  settings: 'Impostazioni',
}

function isStaticSegment(seg: string): boolean {
  return seg in ROUTE_LABELS
}

type RouteState = Record<string, string> | null

interface Crumb {
  label: string
  href: string
  navigable: boolean
}

function resolveDynamicLabel(
  parentSegment: string,
  state: RouteState,
  fallback: string,
): string {
  switch (parentSegment) {
    case 'servers':
      return state?.serverName ?? fallback
    default:
      return fallback
  }
}

function buildCrumbs(segments: string[], state: RouteState): Crumb[] {
  return segments.map((seg, i) => ({
    label: isStaticSegment(seg)
      ? ROUTE_LABELS[seg]
      : resolveDynamicLabel(segments[i - 1] ?? '', state, seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    navigable: isStaticSegment(seg),
  }))
}

function resolveParentHref(crumbs: Crumb[]): string | null {
  if (crumbs.length === 0) return null
  const navigable = crumbs.filter((c) => c.navigable)
  return navigable.length <= 1 ? '/' : navigable[navigable.length - 2].href
}

interface AppHeaderProps {
  scrollContainer?: RefObject<HTMLElement | null>
}

export const AppHeader: React.FC<AppHeaderProps> = ({ scrollContainer }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = scrollContainer?.current ?? window
    const onScroll = () => {
      const top =
        el instanceof Window ? el.scrollY : (el as HTMLElement).scrollTop
      setScrolled(top > 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollContainer])

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = buildCrumbs(segments, location.state as RouteState)
  const isRoot = crumbs.length === 0
  const parentHref = resolveParentHref(crumbs)

  return (
    <header
      data-tauri-drag-region
      className={cn(
        'sticky top-0 z-40 flex h-14 shrink-0 items-center bg-background px-3 border-b transition-colors gap-2',
        scrolled ? 'border-border shadow-md' : 'border-transparent',
      )}
    >
      {parentHref !== null && (
        <button
          onClick={() => navigate(parentHref)}
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <nav className="flex items-center gap-1 text-sm relative top-px">
        {isRoot ? (
          <span className="font-semibold text-foreground">Dashboard</span>
        ) : (
          <>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors leading-3.5"
            >
              Dashboard
            </Link>

            {crumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight size={14} className="text-muted-foreground/40" />
                {i === crumbs.length - 1 ? (
                  <span className="font-semibold text-foreground leading-3.5">
                    {crumb.label}
                  </span>
                ) : crumb.navigable ? (
                  <Link
                    to={crumb.href}
                    className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors leading-3.5"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground/50 leading-3.5">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </>
        )}
      </nav>
    </header>
  )
}
