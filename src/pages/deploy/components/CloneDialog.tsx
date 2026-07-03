import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  FolderOpen,
  Loader2,
  Package,
  Search,
  Server as ServerIcon,
} from 'lucide-react'
import {
  listServers,
  listProjects,
  cloneProject,
  type Server,
  type CoolifyProject,
  type CloneProjectResponse,
} from '@/client/coolify'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  FilledButton,
  TextButton,
} from '@/components/ui'

const STEPS = ['Server', 'Progetto', 'Risultato'] as const

const STEP_INSTRUCTIONS = [
  'Scegli il server di destinazione su cui verranno distribuite le risorse clonate.',
  'Scegli il progetto di origine da cui prelevare le risorse da clonare.',
  'Riepilogo delle risorse create sul server di destinazione.',
] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CloneDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [servers, setServers] = useState<Server[] | null>(null)
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [projects, setProjects] = useState<CoolifyProject[] | null>(null)
  const [selectedProject, setSelectedProject] = useState<CoolifyProject | null>(
    null,
  )
  const [cloneResult, setCloneResult] = useState<CloneProjectResponse | null>(
    null,
  )
  const [cloneError, setCloneError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setSelectedServer(null)
    setServers(null)
    setSelectedProject(null)
    setProjects(null)
    setCloneResult(null)
    setCloneError(null)
    listServers().then((res) => setServers(res ?? []))
  }, [open])

  useEffect(() => {
    if (step !== 1) return
    setProjects(null)
    listProjects().then((res) => setProjects(res ?? []))
  }, [step])

  useEffect(() => {
    if (step !== 2 || !selectedServer || !selectedProject) return
    setCloneResult(null)
    setCloneError(null)
    cloneProject(
      selectedProject.uuid,
      selectedServer.uuid,
      `Resources ${selectedServer.name}`,
    ).then((res) => {
      if (res) setCloneResult(res)
      else setCloneError('Si è verificato un errore durante la clonazione.')
    })
  }, [step])

  const isCloning = step === 2 && cloneResult === null && cloneError === null

  const canAdvance =
    (step === 0 && selectedServer !== null) ||
    (step === 1 && selectedProject !== null)

  return (
    <Dialog open={open} onOpenChange={isCloning ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Clona su nuovo server</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors',
                    i < step
                      ? 'bg-primary border-primary text-primary-foreground'
                      : i === step
                        ? 'border-primary text-primary bg-background'
                        : 'border-border text-muted-foreground bg-background',
                  )}
                >
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    i === step ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-2 mb-4',
                    i < step ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {STEP_INSTRUCTIONS[step]}
        </p>

        {/* Step content */}
        <div className="h-72">
          {step === 0 && (
            <StepPickServer
              servers={servers}
              selected={selectedServer}
              onSelect={setSelectedServer}
            />
          )}
          {step === 1 && (
            <StepPickProject
              projects={projects}
              selected={selectedProject}
              onSelect={setSelectedProject}
            />
          )}
          {step === 2 && selectedServer && selectedProject && (
            <StepCloneResult
              server={selectedServer}
              project={selectedProject}
              result={cloneResult}
              error={cloneError}
            />
          )}
        </div>

        <DialogFooter>
          {step > 0 && step < 2 && (
            <TextButton type="button" onClick={() => setStep((s) => s - 1)}>
              Indietro
            </TextButton>
          )}
          {step < STEPS.length - 1 ? (
            <FilledButton
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Avanti
            </FilledButton>
          ) : (
            <>
              <TextButton
                type="button"
                disabled={isCloning}
                onClick={() => onOpenChange(false)}
              >
                Chiudi
              </TextButton>
              {cloneResult && selectedServer && (
                <FilledButton
                  type="button"
                  onClick={() => {
                    onOpenChange(false)
                    navigate(`/servers/${selectedServer.uuid}/resources`, {
                      state: { serverName: selectedServer.name },
                    })
                  }}
                >
                  Vai alle risorse
                </FilledButton>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Shared ---

interface StepSearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

const StepSearchInput: React.FC<StepSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Cerca…',
}) => (
  <div className="relative mb-3">
    <Search
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground transition"
    />
  </div>
)

// --- Step 1: pick server ---

interface StepPickServerProps {
  servers: Server[] | null
  selected: Server | null
  onSelect: (server: Server) => void
}

const StepPickServer: React.FC<StepPickServerProps> = ({
  servers,
  selected,
  onSelect,
}) => {
  const [search, setSearch] = useState('')

  if (servers === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-accent/40 animate-pulse" />
        ))}
      </div>
    )
  }

  const filtered = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      <StepSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cerca server…"
      />
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {servers.length === 0
              ? 'Nessun server disponibile.'
              : 'Nessun risultato.'}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pr-1">
            {filtered.map((server) => {
              const isSelected = selected?.uuid === server.uuid
              return (
                <button
                  key={server.uuid}
                  type="button"
                  onClick={() => onSelect(server)}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg border px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-accent/60'
                      : 'border-border hover:border-primary/50 hover:bg-accent/30',
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                      isSelected ? 'bg-primary/20' : 'bg-accent',
                    )}
                  >
                    <ServerIcon
                      size={16}
                      className={
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {server.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {server.ip}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        server.isReachable ? 'bg-primary' : 'bg-destructive',
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {server.isReachable ? 'online' : 'offline'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Step 2: pick project ---

interface StepPickProjectProps {
  projects: CoolifyProject[] | null
  selected: CoolifyProject | null
  onSelect: (project: CoolifyProject) => void
}

const StepPickProject: React.FC<StepPickProjectProps> = ({
  projects,
  selected,
  onSelect,
}) => {
  const [search, setSearch] = useState('')

  if (projects === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-accent/40 animate-pulse" />
        ))}
      </div>
    )
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      <StepSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cerca progetto…"
      />
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {projects.length === 0
              ? 'Nessun progetto disponibile.'
              : 'Nessun risultato.'}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pr-1">
            {filtered.map((project) => {
              const isSelected = selected?.uuid === project.uuid
              return (
                <button
                  key={project.uuid}
                  type="button"
                  onClick={() => onSelect(project)}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg border px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-accent/60'
                      : 'border-border hover:border-primary/50 hover:bg-accent/30',
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                      isSelected ? 'bg-primary/20' : 'bg-accent',
                    )}
                  >
                    <FolderOpen
                      size={16}
                      className={
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {project.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Step 3: clone result ---

interface StepCloneResultProps {
  server: Server
  project: CoolifyProject
  result: CloneProjectResponse | null
  error: string | null
}

const StepCloneResult: React.FC<StepCloneResultProps> = ({
  server,
  project,
  result,
  error,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle size={20} className="text-destructive" />
        </div>
        <p className="text-sm text-destructive text-center">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={24} className="text-primary animate-spin" />
        <p className="text-sm text-muted-foreground text-center">
          Clonando{' '}
          <span className="text-foreground font-medium">{project.name}</span> su{' '}
          <span className="text-foreground font-medium">{server.name}</span>…
        </p>
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
            {result.resources.length} risorse
          </span>{' '}
          create su{' '}
          <span className="text-foreground font-medium">{server.name}</span>.
        </p>
      </div>
      <div className="overflow-y-auto flex-1">
        <div className="flex flex-col gap-1.5 pr-1">
          {result.resources.map((resource) => (
            <div
              key={resource.uuid}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/40 border border-border"
            >
              <Package size={14} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">{resource.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
