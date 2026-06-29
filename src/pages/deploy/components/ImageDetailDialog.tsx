import { cn } from '@/lib/utils'
import { useImageDetailStore } from '../store/imageDetailStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import {
  resourceStatusConfig,
  fallbackResourceStatus,
} from '@/data/statusConfig'

export const ImageDetailDialog: React.FC = () => {
  const { isOpen, imageName, version, services, close } = useImageDetailStore()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">{version}</DialogTitle>
          <DialogDescription>{imageName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          {services.map((svc) => {
            const config =
              resourceStatusConfig[svc.status] ?? fallbackResourceStatus
            return (
              <div
                key={svc.uuid}
                className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-foreground truncate">
                    {svc.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {svc.serverName} · {svc.serverIP}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      config.dot,
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {config.label}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
