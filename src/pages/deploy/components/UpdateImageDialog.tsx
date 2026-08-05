import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listImageTags,
  listServicesByImage,
  requestRestartResource,
  updateServiceImageTag,
} from '@/client/coolify'
import { cn } from '@/lib/utils'
import { useUpdateImageStore } from '../store/updateImageStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FilledButton,
  RunSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  StatusDot,
  TextButton,
} from '@/components'

const REGISTRY_HOST = '10.0.10.69'
const CALL_DELAY_MS = 2000
const POLL_INTERVAL_MS = 8000

type ServiceRunStatus = 'processing' | 'success' | 'failed'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const UpdateImageDialog: React.FC = () => {
  const { isOpen, imageName, versions, close, markCompleted } =
    useUpdateImageStore()

  const [tags, setTags] = useState<string[] | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | undefined>()
  const [customTag, setCustomTag] = useState('')
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<
    Record<string, ServiceRunStatus>
  >({})

  const isUpdatingRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const justResetRef = useRef(false)

  useEffect(() => {
    isUpdatingRef.current = isUpdating
  }, [isUpdating])

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const pollServiceStatuses = async (version: string) => {
    if (!imageName) return
    const res = await listServicesByImage()
    if (!res) return

    const services = Object.values(res[imageName] ?? {}).flat()
    const byUuid = new Map(services.map((s) => [s.uuid, s] as const))

    let stillProcessing = false
    setServiceStatus((prev) => {
      const next = { ...prev }
      for (const uuid of Object.keys(prev)) {
        if (next[uuid] !== 'processing') continue

        const service = byUuid.get(uuid)
        if (!service) {
          stillProcessing = true
          continue
        }

        const currentTag = service.image.split(':').at(-1)
        if (currentTag !== version) {
          stillProcessing = true
          continue
        }

        if (
          service.status === 'running:healthy' ||
          service.status === 'running:unknown'
        ) {
          next[uuid] = 'success'
        } else if (service.status === 'exited') {
          next[uuid] = 'failed'
        } else {
          stillProcessing = true
        }
      }
      return next
    })

    if (!stillProcessing && !isUpdatingRef.current) {
      stopPolling()
      markCompleted()
    }
  }

  const startPolling = (version: string) => {
    stopPolling()
    pollTimerRef.current = setInterval(
      () => pollServiceStatuses(version),
      POLL_INTERVAL_MS,
    )
  }

  useEffect(() => stopPolling, [])

  const isPrivateImage = useMemo(
    () => imageName?.split('/')[0]?.startsWith(REGISTRY_HOST) ?? false,
    [imageName],
  )

  const rows = useMemo(
    () =>
      Object.entries(versions).flatMap(([version, services]) =>
        services.map((service) => ({ ...service, version })),
      ),
    [versions],
  )

  useEffect(() => {
    if (!isOpen) {
      stopPolling()
      return
    }
    justResetRef.current = true
    setTags(null)
    setSelectedTag(undefined)
    setCustomTag('')
    setSelectedUuids(new Set(rows.map((r) => r.uuid)))
    setIsUpdating(false)
    setServiceStatus({})

    if (!imageName || !isPrivateImage) return

    const imageNameWithoutRegistry = imageName.split('/').at(-1)
    if (!imageNameWithoutRegistry) return

    listImageTags(imageNameWithoutRegistry).then((res) =>
      setTags(
        (res?.tags ?? [])
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
          .slice(0, 6),
      ),
    )
  }, [isOpen, imageName, isPrivateImage, rows])

  const selectedVersion = isPrivateImage ? selectedTag : customTag.trim()

  const disabledUuids = useMemo(() => {
    if (!selectedVersion) return new Set<string>()
    return new Set(
      rows.filter((r) => r.version === selectedVersion).map((r) => r.uuid),
    )
  }, [rows, selectedVersion])

  useEffect(() => {
    if (justResetRef.current) {
      justResetRef.current = false
      return
    }
    if (disabledUuids.size === 0) return
    setSelectedUuids((prev) => {
      let changed = false
      const next = new Set(prev)
      disabledUuids.forEach((uuid) => {
        if (next.delete(uuid)) changed = true
      })
      return changed ? next : prev
    })
  }, [disabledUuids])

  const toggleRow = (uuid: string) =>
    setSelectedUuids((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })

  const selectableRows = useMemo(
    () => rows.filter((r) => !disabledUuids.has(r.uuid)),
    [rows, disabledUuids],
  )

  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selectedUuids.has(r.uuid))
  const someSelected = selectedUuids.size > 0 && !allSelected

  const toggleAll = () =>
    setSelectedUuids(
      allSelected ? new Set() : new Set(selectableRows.map((r) => r.uuid)),
    )

  const handleUpdate = async () => {
    if (!selectedVersion || selectedUuids.size === 0) return

    const targetUuids = rows
      .filter((r) => selectedUuids.has(r.uuid))
      .map((r) => r.uuid)

    setIsUpdating(true)
    startPolling(selectedVersion)

    for (const uuid of targetUuids) {
      setServiceStatus((prev) => ({ ...prev, [uuid]: 'processing' }))

      await updateServiceImageTag(uuid, selectedVersion)
      await delay(CALL_DELAY_MS)
      await requestRestartResource(uuid)
      await delay(CALL_DELAY_MS)
    }

    setIsUpdating(false)
  }

  const trackedUuids = Object.keys(serviceStatus)
  const hasPendingConfirmation = trackedUuids.some(
    (uuid) => serviceStatus[uuid] === 'processing',
  )
  const isBusy = isUpdating || hasPendingConfirmation
  const updateCompleted =
    !isBusy &&
    trackedUuids.length > 0 &&
    trackedUuids.every((uuid) => serviceStatus[uuid] === 'success')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && close()}>
      <DialogContent className="max-w-lg" showCloseButton={!isBusy}>
        <DialogHeader>
          <DialogTitle>Aggiorna versione</DialogTitle>
          <DialogDescription className="font-mono">
            {imageName}
          </DialogDescription>
        </DialogHeader>

        {isPrivateImage ? (
          <Select
            value={selectedTag}
            onValueChange={setSelectedTag}
            disabled={
              tags === null || tags.length === 0 || isBusy || updateCompleted
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  tags === null
                    ? 'Caricamento versioni…'
                    : tags.length === 0
                      ? 'Nessuna versione disponibile'
                      : 'Seleziona una versione'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {tags?.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Es. latest, 1.2.3…"
            autoComplete="off"
            disabled={isBusy || updateCompleted}
            className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground transition disabled:opacity-50"
          />
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-muted/50 border-b border-border">
                  <th className="w-9 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected
                      }}
                      onChange={toggleAll}
                      disabled={
                        selectableRows.length === 0 || isBusy || updateCompleted
                      }
                      className={cn(
                        'h-4 w-4 rounded border-border accent-primary',
                        selectableRows.length === 0 || isBusy || updateCompleted
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer',
                      )}
                    />
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Server
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Versione
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-center text-xs text-muted-foreground"
                    >
                      Nessun servizio trovato.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const isDisabled = disabledUuids.has(row.uuid)
                    const status = serviceStatus[row.uuid]
                    return (
                      <tr
                        key={row.uuid}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedUuids.has(row.uuid)}
                            onChange={() => toggleRow(row.uuid)}
                            disabled={isDisabled || isBusy || updateCompleted}
                            className={cn(
                              'h-4 w-4 rounded border-border accent-primary',
                              isDisabled || isBusy || updateCompleted
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer',
                            )}
                          />
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2',
                            isDisabled
                              ? 'text-muted-foreground'
                              : 'text-foreground',
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {status === 'processing' && (
                              <RunSpinner className="h-3 w-3" />
                            )}
                            {status === 'success' && (
                              <StatusDot
                                variant="success"
                                className="h-3 w-3"
                              />
                            )}
                            {status === 'failed' && (
                              <StatusDot variant="failed" className="h-3 w-3" />
                            )}
                            {row.serverName}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {status === 'success' && selectedVersion ? (
                            <span className="inline-flex items-center gap-1">
                              {row.version}
                              <span className="text-muted-foreground/60">
                                →
                              </span>
                              <span className="text-green-600">
                                {selectedVersion}
                              </span>
                            </span>
                          ) : (
                            row.version
                          )}
                          {isDisabled && (
                            <span className="ml-1.5 font-sans text-[11px] text-muted-foreground/70">
                              (già aggiornato)
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          {updateCompleted ? (
            <FilledButton type="button" onClick={close}>
              Chiudi
            </FilledButton>
          ) : (
            <>
              <TextButton type="button" onClick={close} disabled={isBusy}>
                Annulla
              </TextButton>
              <FilledButton
                type="button"
                onClick={handleUpdate}
                disabled={
                  !selectedVersion || selectedUuids.size === 0 || isBusy
                }
                className="flex items-center gap-2"
              >
                {isBusy && <Spinner className="h-3.5 w-3.5" />}
                Aggiorna
              </FilledButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
