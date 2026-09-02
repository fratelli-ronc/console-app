import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

interface ReloadButtonProps {
  isReloading: boolean
  onReload: () => void
}

export const ReloadButton: React.FC<ReloadButtonProps> = ({
  isReloading,
  onReload,
}) => {
  // Keep spinning until the current rotation finishes, so a reload that
  // resolves in a few ms still shows a full turn instead of a flicker.
  const [spinning, setSpinning] = useState(false)
  const stopRequested = useRef(false)

  useEffect(() => {
    if (isReloading) {
      stopRequested.current = false
      setSpinning(true)
    } else if (spinning) {
      stopRequested.current = true
    }
  }, [isReloading, spinning])

  return (
    <button
      onClick={onReload}
      className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
    >
      <RefreshCw
        size={14}
        className={cn(spinning && 'animate-spin')}
        onAnimationIteration={() => {
          if (stopRequested.current) {
            stopRequested.current = false
            setSpinning(false)
          }
        }}
      />
      Ricarica
    </button>
  )
}
