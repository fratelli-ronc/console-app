import { useState } from 'react'
import toast from 'react-hot-toast'
import { AlertCircle, Check, Download, FileJson, Loader2 } from 'lucide-react'
import type { DeployConfigFile, DeployConfigIssue } from '@/client'
import { saveConfigFile, saveConfigFiles } from '@/lib/configFiles'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FilledButton,
  OutlinedButton,
  TextButton,
} from '@/components'

// What the dialog is showing. `stationCount` is only used for the wording,
// so it survives from the loading phase into the result.
export type DeployDialogState =
  | { phase: 'loading'; stationCount: number }
  | { phase: 'success'; stationCount: number; files: DeployConfigFile[] }
  | { phase: 'error'; message: string; groups: DeployConfigIssue[] }

// The reasons deployconfig.Build can report, which console-api forwards
// verbatim. Anything unrecognised is shown as it came.
const ISSUE_REASONS: Record<string, string> = {
  'group is not assigned to a server': 'Nessun server assegnato',
}

const formatSize = (content: string) => {
  const bytes = new TextEncoder().encode(content).length
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`
}

const stationsLabel = (count: number) =>
  count === 1 ? '1 stazione' : `${count} stazioni`

interface Props {
  state: DeployDialogState | null
  onClose: () => void
  // Resolves a server IP to its display name, when it is a known server.
  serverName: (ip: string) => string | undefined
}

export const DeployResultDialog: React.FC<Props> = ({
  state,
  onClose,
  serverName,
}) => {
  const [savingAll, setSavingAll] = useState(false)
  const [savingFile, setSavingFile] = useState<string | null>(null)

  const isDeploying = state?.phase === 'loading'

  const handleSaveAll = async () => {
    if (state?.phase !== 'success') return
    setSavingAll(true)
    try {
      if (await saveConfigFiles(state.files))
        toast.success(
          `${state.files.length} ${state.files.length === 1 ? 'file salvato' : 'file salvati'}`,
        )
    } catch (error) {
      toast.error(`Salvataggio non riuscito: ${error}`)
    }
    setSavingAll(false)
  }

  const handleSaveOne = async (file: DeployConfigFile) => {
    setSavingFile(file.fileName)
    try {
      if (await saveConfigFile(file)) toast.success(`${file.fileName} salvato`)
    } catch (error) {
      toast.error(`Salvataggio non riuscito: ${error}`)
    }
    setSavingFile(null)
  }

  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => !open && !isDeploying && onClose()}
    >
      <DialogContent
        className="max-w-xl"
        showCloseButton={!isDeploying}
        // The deploy is already in flight — closing the dialog wouldn't
        // stop it, it would just hide its outcome.
        onEscapeKeyDown={(e) => isDeploying && e.preventDefault()}
        onPointerDownOutside={(e) => isDeploying && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {state?.phase === 'error'
              ? 'Distribuzione non riuscita'
              : 'Distribuzione'}
          </DialogTitle>
        </DialogHeader>

        <div className="h-72">
          {state?.phase === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 size={24} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Generazione della configurazione per{' '}
                <span className="text-foreground font-medium">
                  {stationsLabel(state.stationCount)}
                </span>
                …
              </p>
            </div>
          )}

          {state?.phase === 'success' && (
            <FileList
              state={state}
              serverName={serverName}
              savingFile={savingFile}
              onSave={handleSaveOne}
            />
          )}

          {state?.phase === 'error' && (
            <IssueList message={state.message} groups={state.groups} />
          )}
        </div>

        <DialogFooter>
          <TextButton type="button" disabled={isDeploying} onClick={onClose}>
            Chiudi
          </TextButton>
          {state?.phase === 'success' && state.files.length > 0 && (
            <FilledButton
              type="button"
              className="inline-flex items-center gap-2"
              disabled={savingAll}
              onClick={handleSaveAll}
            >
              <Download size={16} />
              {savingAll ? 'Salvataggio…' : 'Scarica tutti'}
            </FilledButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FileListProps {
  state: Extract<DeployDialogState, { phase: 'success' }>
  serverName: (ip: string) => string | undefined
  savingFile: string | null
  onSave: (file: DeployConfigFile) => void
}

const FileList: React.FC<FileListProps> = ({
  state,
  serverName,
  savingFile,
  onSave,
}) => {
  if (state.files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Nessun file di configurazione generato.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Check size={11} className="text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">
            {state.files.length}{' '}
            {state.files.length === 1 ? 'file generato' : 'file generati'}
          </span>{' '}
          per {stationsLabel(state.stationCount)}.
        </p>
      </div>

      <div className="overflow-y-auto flex-1">
        <div className="flex flex-col gap-1.5 pr-1">
          {state.files.map((file) => {
            const name = serverName(file.serverIp)
            return (
              <div
                key={file.fileName}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/40 border border-border"
              >
                <FileJson
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-foreground font-mono truncate">
                    {file.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {name ? `${name} · ${file.serverIp}` : file.serverIp} ·
                    Stazione {file.stationId} · {formatSize(file.content)}
                  </span>
                </div>
                <OutlinedButton
                  type="button"
                  className="ml-auto h-8 px-3 shrink-0 inline-flex items-center gap-1.5"
                  disabled={savingFile === file.fileName}
                  onClick={() => onSave(file)}
                >
                  <Download size={14} />
                  Scarica
                </OutlinedButton>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface IssueListProps {
  message: string
  groups: DeployConfigIssue[]
}

const IssueList: React.FC<IssueListProps> = ({ message, groups }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-start gap-2 mb-3">
      <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
      <p className="text-sm text-destructive">{message}</p>
    </div>

    {groups.length > 0 && (
      <>
        <p className="text-xs text-muted-foreground mb-2">
          Nessuna stazione è stata distribuita. Correggi i gruppi seguenti e
          riprova.
        </p>
        <div className="overflow-y-auto flex-1">
          <div className="flex flex-col gap-1.5 pr-1">
            {groups.map((issue) => (
              <div
                key={issue.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'bg-destructive/5 border border-destructive/30',
                )}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-foreground truncate">
                    Gruppo {issue.groupId}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {issue.serverIp ?? 'Nessun IP server'}
                  </span>
                </div>
                <span className="ml-auto text-xs text-destructive text-right shrink-0">
                  {ISSUE_REASONS[issue.reason] ?? issue.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
)
