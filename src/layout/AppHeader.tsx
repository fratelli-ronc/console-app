import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  scrollContainer?: RefObject<HTMLElement | null>
}

export default function AppHeader({ scrollContainer }: AppHeaderProps) {
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

  return (
    <header
      data-tauri-drag-region
      className={cn(
        'sticky top-0 z-40 flex h-16 shrink-0 items-center bg-background px-4 border-b transition-colors',
        scrolled ? 'border-border shadow-md' : 'border-transparent',
      )}
    >
      Header
    </header>
  )
}
