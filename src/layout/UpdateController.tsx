import { useEffect, useState } from 'react'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FilledButton,
  OutlinedButton,
} from '@/components'

export const UpdateController: React.FC = () => {
  const [update, setUpdate] = useState<Update | null>(null)
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    check()
      .then((result) => {
        if (result) setUpdate(result)
      })
      .catch((err) => console.error('Update check failed', err))
  }, [])

  const install = async () => {
    if (!update) return
    setInstalling(true)

    let total = 0
    let downloaded = 0

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            setProgress(total ? Math.round((downloaded / total) * 100) : 0)
            break
          case 'Finished':
            setProgress(100)
            break
        }
      })
      await relaunch()
    } catch (err) {
      console.error('Update install failed', err)
      toast.error('Failed to install the update')
      setInstalling(false)
    }
  }

  return (
    <Dialog
      open={!!update}
      onOpenChange={(open) => !open && !installing && setUpdate(null)}
    >
      <DialogContent showCloseButton={!installing}>
        <DialogHeader>
          <DialogTitle>Update available</DialogTitle>
          <DialogDescription>
            {update
              ? `Version ${update.version} is ready to install.${update.body ? ` ${update.body}` : ''}`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {!installing && (
            <OutlinedButton type="button" onClick={() => setUpdate(null)}>
              Later
            </OutlinedButton>
          )}
          <FilledButton type="button" disabled={installing} onClick={install}>
            {installing ? `Installing… ${progress}%` : 'Install & Restart'}
          </FilledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
