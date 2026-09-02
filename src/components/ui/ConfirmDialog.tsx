import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './Dialog'
import { FilledButton } from './FilledButton'
import { TextButton } from './TextButton'

export interface ConfirmOptions {
  title?: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  // Styles the confirm button as a destructive action.
  destructive?: boolean
}

/**
 * Promise-based confirmation modal, styled like the app's other dialogs.
 * `window.confirm()` is a no-op in the Tauri (WKWebView) runtime — its
 * WKUIDelegate doesn't implement the JS confirm panel — so any blocking
 * yes/no prompt has to go through this instead.
 *
 *   const { confirm, confirmDialog } = useConfirm()
 *   // ...
 *   if (await confirm({ title: 'Elimina?', destructive: true })) doThing()
 *   // ...
 *   return <>{children}{confirmDialog}</>
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((ok: boolean) => void) | null>(null)

  const settle = useCallback((ok: boolean) => {
    resolveRef.current?.(ok)
    resolveRef.current = null
    setOptions(null)
  }, [])

  const confirm = useCallback((opts: ConfirmOptions = {}) => {
    // Abandon any still-open prompt so its awaiter isn't left hanging.
    resolveRef.current?.(false)
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const confirmDialog = (
    <Dialog
      open={options !== null}
      onOpenChange={(open) => !open && settle(false)}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{options?.title ?? 'Confermi?'}</DialogTitle>
          <DialogDescription>
            {options?.description ?? 'Questa azione non può essere annullata.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <TextButton type="button" onClick={() => settle(false)}>
            {options?.cancelLabel ?? 'Annulla'}
          </TextButton>
          <FilledButton
            type="button"
            onClick={() => settle(true)}
            className={cn(
              options?.destructive &&
                'bg-destructive hover:bg-destructive/90 text-white',
            )}
          >
            {options?.confirmLabel ?? 'Conferma'}
          </FilledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { confirm, confirmDialog }
}

const UNSAVED_CHANGES_MESSAGE =
  'Le modifiche non salvate andranno perse. Vuoi continuare?'

/**
 * Pops the confirm modal when the user navigates to another route while
 * `when` is true (e.g. a table/form has unsaved edits). Accepting lets the
 * navigation through; cancelling stays put.
 *
 * Relies on `useBlocker`, so the app must use a data router
 * (`createBrowserRouter`). Render the returned element somewhere always
 * mounted while the guard is active.
 */
export function useUnsavedChangesPrompt(
  when: boolean,
  message: React.ReactNode = UNSAVED_CHANGES_MESSAGE,
) {
  const { confirm, confirmDialog } = useConfirm()

  // Kept in a ref so an inline `message` can't retrigger the prompt effect.
  const messageRef = useRef(message)
  messageRef.current = message

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    let active = true
    void confirm({
      title: 'Modifiche non salvate',
      description: messageRef.current,
      confirmLabel: 'Esci senza salvare',
      cancelLabel: 'Rimani',
      destructive: true,
    }).then((ok) => {
      if (!active) return
      if (ok) blocker.proceed()
      else blocker.reset()
    })

    return () => {
      active = false
    }
  }, [blocker, confirm])

  // Drop a pending block if the guard clears out from under it (e.g. the
  // edits were saved just as navigation fired).
  useEffect(() => {
    if (blocker.state === 'blocked' && !when) blocker.reset()
  }, [blocker, when])

  return { unsavedChangesDialog: confirmDialog }
}
