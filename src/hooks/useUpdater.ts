import { useCallback, useEffect, useRef, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export type UpdaterPhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'installed'
  | 'error'

export interface UseUpdater {
  currentVersion: string | null
  update: Update | null
  phase: UpdaterPhase
  progress: number
  error: string | null
  checkForUpdate: () => Promise<Update | null>
  installUpdate: () => Promise<void>
}

/**
 * Wraps the Tauri updater plugin: exposes the current version, a manual
 * check, and the download/install/relaunch flow with progress. Shared by the
 * startup {@link file://./../layout/UpdateController.tsx} prompt and the
 * settings page so the updater logic lives in one place.
 */
export function useUpdater(): UseUpdater {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [update, setUpdate] = useState<Update | null>(null)
  const [phase, setPhase] = useState<UpdaterPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    getVersion()
      .then(setCurrentVersion)
      .catch(() => setCurrentVersion(null))
  }, [])

  const checkForUpdate = useCallback(async () => {
    if (busy.current) return null
    busy.current = true
    setPhase('checking')
    setError(null)
    try {
      const result = await check()
      setUpdate(result)
      setPhase(result ? 'available' : 'up-to-date')
      return result
    } catch (err) {
      console.error('Update check failed', err)
      setError('Impossibile verificare la presenza di aggiornamenti.')
      setPhase('error')
      return null
    } finally {
      busy.current = false
    }
  }, [])

  const installUpdate = useCallback(async () => {
    if (!update || busy.current) return
    busy.current = true
    setPhase('downloading')
    setProgress(0)
    setError(null)

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
      setPhase('installed')
      await relaunch()
    } catch (err) {
      console.error('Update install failed', err)
      setError("Impossibile installare l'aggiornamento.")
      setPhase('error')
    } finally {
      busy.current = false
    }
  }, [update])

  return {
    currentVersion,
    update,
    phase,
    progress,
    error,
    checkForUpdate,
    installUpdate,
  }
}
