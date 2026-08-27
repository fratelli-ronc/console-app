import { useEffect, useState } from 'react'
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
import { useUpdater } from '@/hooks'

export const UpdateController: React.FC = () => {
  const { update, phase, progress, error, checkForUpdate, installUpdate } =
    useUpdater()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkForUpdate()
  }, [checkForUpdate])

  useEffect(() => {
    if (phase === 'error' && error) toast.error(error)
  }, [phase, error])

  const installing = phase === 'downloading' || phase === 'installed'
  const open = !!update && !dismissed

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !installing && setDismissed(true)}
    >
      <DialogContent showCloseButton={!installing}>
        <DialogHeader>
          <DialogTitle>Aggiornamento disponibile</DialogTitle>
          <DialogDescription>
            {update
              ? `La versione ${update.version} è pronta per l'installazione.${
                  update.body ? ` ${update.body}` : ''
                }`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {!installing && (
            <OutlinedButton type="button" onClick={() => setDismissed(true)}>
              Più tardi
            </OutlinedButton>
          )}
          <FilledButton
            type="button"
            disabled={installing}
            onClick={installUpdate}
          >
            {installing ? `Installazione… ${progress}%` : 'Installa e riavvia'}
          </FilledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
