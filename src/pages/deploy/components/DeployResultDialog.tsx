import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  FileJson,
  Server,
} from 'lucide-react'
import type {
  DeployConfigFile,
  DeployConfigIssue,
  DeployServer,
  DeployServerState,
  DeployStationsResponse,
} from '@/client'
import { saveConfigFile, saveConfigFiles } from '@/lib/configFiles'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  OutlinedButton,
  RunSpinner,
  StatusBadge,
  TextButton,
} from '@/components'

// What the dialog is showing:
// - preparing: the request is out, console-api is rendering the configs.
// - running: the plan arrived, each server is followed as it is pinged and
//   synced.
// - done: the deploy ran to the end, fully or not (see result.error).
// - rejected: refused before any server was called — nothing changed.
export type DeployDialogState =
  | { phase: 'preparing'; stationCount: number }
  | { phase: 'running'; stationCount: number; servers: DeployServer[] }
  | { phase: 'done'; stationCount: number; result: DeployStationsResponse }
  | { phase: 'rejected'; message: string; groups: DeployConfigIssue[] }

// Messages console-api sends verbatim. Anything unrecognised is shown as
// it came. Unreachable / failed servers aren't here: their summary is
// worded from the servers themselves.
const API_MESSAGES: Record<string, string> = {
  'group is not assigned to a server': 'Nessun server assegnato',
  'another deploy is already running':
    "Un'altra distribuzione è già in corso. Riprova tra poco.",
  'config files were written, but the deploy could not be recorded':
    'I file sono stati scritti sui server, ma la distribuzione non è stata registrata. Riprova.',
}

const translate = (message: string) => API_MESSAGES[message] ?? message

const MUTED = 'border-border text-muted-foreground bg-muted/50'
const PROGRESS = 'border-secondary/30 text-secondary-foreground bg-secondary/10'
const SUCCESS = 'border-primary/30 text-primary bg-primary/10'
const FAILURE = 'border-destructive/30 text-destructive bg-destructive/10'

const SERVER_STATES: Record<
  DeployServerState,
  { label: string; badge: string; dot: string; pending?: boolean }
> = {
  waiting: { label: 'In attesa', badge: MUTED, dot: 'bg-muted-foreground' },
  pinging: { label: 'Verifica…', badge: PROGRESS, dot: '', pending: true },
  reachable: { label: 'Raggiungibile', badge: MUTED, dot: 'bg-primary' },
  unreachable: {
    label: 'Non raggiungibile',
    badge: FAILURE,
    dot: 'bg-destructive',
  },
  syncing: { label: 'Invio file…', badge: PROGRESS, dot: '', pending: true },
  synced: { label: 'Sincronizzato', badge: SUCCESS, dot: 'bg-primary' },
  sync_failed: {
    label: 'Invio non riuscito',
    badge: FAILURE,
    dot: 'bg-destructive',
  },
}

const formatSize = (content: string) => {
  const bytes = new TextEncoder().encode(content).length
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

const stationsLabel = (count: number) =>
  plural(count, 'stazione', 'stazioni')

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

  const isDeploying = state?.phase === 'preparing' || state?.phase === 'running'

  const handleSaveAll = async () => {
    if (state?.phase !== 'done') return
    const { files } = state.result
    setSavingAll(true)
    try {
      if (await saveConfigFiles(files))
        toast.success(plural(files.length, 'file salvato', 'file salvati'))
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
        className="max-w-2xl"
        showCloseButton={!isDeploying}
        // console-api carries the deploy through even if nobody is
        // listening — closing the dialog would only hide its outcome.
        onEscapeKeyDown={(e) => isDeploying && e.preventDefault()}
        onPointerDownOutside={(e) => isDeploying && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {state?.phase === 'rejected'
              ? 'Distribuzione non riuscita'
              : 'Distribuzione'}
          </DialogTitle>
        </DialogHeader>

        <div className="h-80">
          {state?.phase === 'preparing' && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <RunSpinner className="h-5 w-5" />
              <p className="text-sm text-muted-foreground">
                Generazione della configurazione per{' '}
                <span className="text-foreground font-medium">
                  {stationsLabel(state.stationCount)}
                </span>
                …
              </p>
            </div>
          )}

          {state?.phase === 'running' && (
            <ServerList
              summary={<RunningSummary servers={state.servers} />}
              servers={state.servers}
              files={[]}
              serverName={serverName}
              savingFile={savingFile}
              onSave={handleSaveOne}
            />
          )}

          {state?.phase === 'done' && (
            <ServerList
              summary={
                <DoneSummary
                  stationCount={state.stationCount}
                  result={state.result}
                />
              }
              servers={state.result.servers}
              files={state.result.files}
              serverName={serverName}
              savingFile={savingFile}
              onSave={handleSaveOne}
            />
          )}

          {state?.phase === 'rejected' && (
            <IssueList message={state.message} groups={state.groups} />
          )}
        </div>

        <DialogFooter>
          {state?.phase === 'done' && state.result.files.length > 0 && (
            <OutlinedButton
              type="button"
              className="inline-flex items-center gap-2 mr-auto"
              disabled={savingAll}
              onClick={handleSaveAll}
            >
              <Download size={16} />
              {savingAll ? 'Salvataggio…' : 'Scarica copia dei file'}
            </OutlinedButton>
          )}
          <TextButton type="button" disabled={isDeploying} onClick={onClose}>
            Chiudi
          </TextButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Tone = 'progress' | 'success' | 'warning' | 'failure'

const TONES: Record<Tone, string> = {
  progress: 'bg-muted/40 border-border',
  success: 'bg-primary/10 border-primary/30',
  warning: 'bg-secondary/10 border-secondary/40',
  failure: 'bg-destructive/5 border-destructive/30',
}

interface SummaryProps {
  tone: Tone
  icon: React.ReactNode
  title: string
  detail?: React.ReactNode
}

const Summary: React.FC<SummaryProps> = ({ tone, icon, title, detail }) => (
  <div
    className={cn(
      'flex items-start gap-3 px-3 py-2.5 mb-3 rounded-lg border',
      TONES[tone],
    )}
  >
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
    </div>
  </div>
)

const RunningSummary: React.FC<{ servers: DeployServer[] }> = ({
  servers,
}) => {
  const pinging = servers.some(
    (s) => s.state === 'waiting' || s.state === 'pinging',
  )
  const synced = servers.filter((s) => s.state === 'synced').length
  return (
    <Summary
      tone="progress"
      icon={<RunSpinner className="h-4 w-4" />}
      title={
        pinging
          ? 'Verifica della connessione ai server…'
          : 'Invio della configurazione…'
      }
      detail={
        pinging
          ? 'Nessun file viene scritto finché tutti i server non rispondono.'
          : `${synced} di ${plural(servers.length, 'server', 'server')} sincronizzati.`
      }
    />
  )
}

interface DoneSummaryProps {
  stationCount: number
  result: DeployStationsResponse
}

const DoneSummary: React.FC<DoneSummaryProps> = ({ stationCount, result }) => {
  const unreachable = result.servers.filter(
    (s) => s.state === 'unreachable',
  ).length
  const failed = result.servers.filter((s) => s.state === 'sync_failed').length
  const deployed = result.statuses.length

  if (unreachable > 0) {
    return (
      <Summary
        tone="failure"
        icon={<AlertCircle size={16} className="text-destructive" />}
        title="Nessuna modifica applicata"
        detail={`${plural(unreachable, 'server non raggiungibile', 'server non raggiungibili')}: nessun file è stato scritto e le stazioni restano nello stato precedente.`}
      />
    )
  }

  if (failed > 0) {
    return (
      <Summary
        tone="warning"
        icon={<AlertTriangle size={16} className="text-secondary" />}
        title="Distribuzione parziale"
        detail={`${deployed} di ${stationsLabel(stationCount)} distribuite. Le stazioni sui server non sincronizzati restano in sospeso: riprova dopo aver risolto il problema.`}
      />
    )
  }

  if (result.error) {
    return (
      <Summary
        tone="failure"
        icon={<AlertCircle size={16} className="text-destructive" />}
        title="Distribuzione non riuscita"
        detail={translate(result.error)}
      />
    )
  }

  return (
    <Summary
      tone="success"
      icon={
        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
          <Check size={10} className="text-primary" />
        </div>
      }
      title="Distribuzione completata"
      detail={`${stationsLabel(stationCount)} ${stationCount === 1 ? 'distribuita' : 'distribuite'} su ${plural(result.servers.length, 'server', 'server')}.`}
    />
  )
}

interface ServerListProps {
  summary: React.ReactNode
  servers: DeployServer[]
  // The rendered files, by name — only known once the deploy is done, and
  // what makes a server's files downloadable.
  files: DeployConfigFile[]
  serverName: (ip: string) => string | undefined
  savingFile: string | null
  onSave: (file: DeployConfigFile) => void
}

const ServerList: React.FC<ServerListProps> = ({
  summary,
  servers,
  files,
  serverName,
  savingFile,
  onSave,
}) => {
  const filesByName = new Map(files.map((f) => [f.fileName, f]))
  return (
    <div className="flex flex-col h-full">
      {summary}
      <div className="overflow-y-auto flex-1">
        <div className="flex flex-col gap-1.5 pr-1">
          {servers.map((server) => (
            <ServerRow
              key={server.serverIp}
              server={server}
              name={serverName(server.serverIp)}
              files={server.fileNames.flatMap((n) => {
                const file = filesByName.get(n)
                return file ? [file] : []
              })}
              savingFile={savingFile}
              onSave={onSave}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ServerRowProps {
  server: DeployServer
  name: string | undefined
  files: DeployConfigFile[]
  savingFile: string | null
  onSave: (file: DeployConfigFile) => void
}

const ServerRow: React.FC<ServerRowProps> = ({
  server,
  name,
  files,
  savingFile,
  onSave,
}) => {
  const [expanded, setExpanded] = useState(false)
  const state = SERVER_STATES[server.state]
  const failed = server.state === 'unreachable' || server.state === 'sync_failed'
  const canExpand = files.length > 0

  return (
    <div
      className={cn(
        'rounded-lg border',
        failed
          ? 'bg-destructive/5 border-destructive/30'
          : 'bg-accent/40 border-border',
      )}
    >
      <button
        type="button"
        disabled={!canExpand}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left disabled:cursor-default"
      >
        <ChevronRight
          size={14}
          className={cn(
            'text-muted-foreground shrink-0 transition-transform',
            expanded && 'rotate-90',
            !canExpand && 'invisible',
          )}
        />
        <Server size={14} className="text-muted-foreground shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-foreground truncate">
            {name ?? server.serverIp}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {name && `${server.serverIp} · `}
            {server.stationIds.length > 0 &&
              `${server.stationIds.length === 1 ? 'Stazione' : 'Stazioni'} ${server.stationIds.join(', ')} · `}
            {server.fileNames.length > 0
              ? plural(server.fileNames.length, 'file', 'file')
              : 'rimozione configurazioni precedenti'}
          </span>
        </div>
        <div className="ml-auto">
          <StatusBadge
            dot={state.dot}
            badge={state.badge}
            label={state.label}
            pending={state.pending}
          />
        </div>
      </button>

      {server.error && (
        <p
          className="px-3 pb-2.5 pl-15 text-xs text-destructive font-mono break-all line-clamp-2"
          title={server.error}
        >
          {server.error}
        </p>
      )}

      {expanded && (
        <ul className="border-t border-border/60 py-1 pl-15 pr-3">
          {files.map((file) => (
            <li key={file.fileName} className="flex items-center gap-3 py-1.5">
              <FileJson size={14} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground font-mono truncate">
                {file.fileName}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatSize(file.content)}
              </span>
              <OutlinedButton
                type="button"
                className="ml-auto h-7 px-2.5 shrink-0 inline-flex items-center gap-1.5"
                disabled={savingFile === file.fileName}
                onClick={() => onSave(file)}
              >
                <Download size={13} />
                Scarica
              </OutlinedButton>
            </li>
          ))}
        </ul>
      )}
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
      <p className="text-sm text-destructive">{translate(message)}</p>
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
                  {translate(issue.reason)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
)
