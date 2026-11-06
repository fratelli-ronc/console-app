import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  RotateCcw,
} from 'lucide-react'
import {
  getStationConfigVersionFile,
  listStationConfigVersions,
  type ConfigVersion,
  type RevertPreviewOutcome,
  type RevertRefusal,
  type RevertWarning,
} from '@/client'
import { OutlinedButton, StatusBadge, TextButton } from '@/components'
import {
  entityLabel,
  formatDateTime,
  userLabel,
  type ChangeNames,
} from '@/lib/changeLog'
import { saveConfigFile } from '@/lib/configFiles'
import {
  translateRevertMessage,
  translateRevertReason,
} from '@/lib/configVersions'
import { cn } from '@/lib/utils'
import { ChangeList, Loading, Notice } from './ChangeDiff'

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

// "04/11/2026 10:12 di Mario"
export const versionLabel = (
  version: ConfigVersion,
  currentUsername: string | undefined,
) =>
  `${formatDateTime(version.deployedAt)} di ${userLabel(version.deployedBy, version.deployedByUserId, currentUsername)}`

interface VersionsViewProps {
  stationId: number
  // The station's business id now, to flag versions deployed under another.
  businessId: number
  pending: boolean
  // A deploy of the station is running: nothing can be reverted meanwhile.
  busy: boolean
  currentUsername: string | undefined
  onReview: (version: ConfigVersion) => void
}

// The station's config versions, newest first: one per successful deploy,
// each downloadable and revertible to. The live one can only be gone back
// to while the station has changes pending — that discards them.
export const VersionsView: React.FC<VersionsViewProps> = ({
  stationId,
  businessId,
  pending,
  busy,
  currentUsername,
  onReview,
}) => {
  const [versions, setVersions] = useState<ConfigVersion[] | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setVersions(null)
    listStationConfigVersions(stationId).then((res) => {
      if (active && res) setVersions(res.versions)
    })
    return () => {
      active = false
    }
  }, [stationId])

  const handleDownload = async (version: ConfigVersion) => {
    setSaving(version.id)
    const content = await getStationConfigVersionFile(stationId, version.id)
    if (content != null) {
      try {
        if (await saveConfigFile({ fileName: version.fileName, content }))
          toast.success(`${version.fileName} salvato`)
      } catch (error) {
        toast.error(`Salvataggio non riuscito: ${error}`)
      }
    }
    setSaving(null)
  }

  if (!versions) return <Loading />
  if (versions.length === 0) {
    return (
      <Notice>
        Nessuna versione salvata. Una versione viene salvata a ogni
        distribuzione riuscita della stazione: le distribuzioni precedenti a
        questa funzione non ne hanno.
      </Notice>
    )
  }

  const live = versions.find((v) => v.live)
  const byId = new Map(versions.map((v) => [v.id, v]))

  return (
    <ol className="space-y-2 pb-1">
      {versions.map((version) => {
        const revertedFrom =
          version.revertedFromId == null
            ? null
            : byId.get(version.revertedFromId)
        const sameAsLive =
          !version.live && live != null && version.sha256 === live.sha256
        const canRevert = !version.live || pending

        return (
          <li
            key={version.id}
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3',
              version.live ? 'border-primary/30 bg-primary/5' : 'border-border',
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {versionLabel(version, currentUsername)}
                </span>
                {version.live && (
                  <StatusBadge
                    dot="bg-primary"
                    badge="border-primary/30 text-primary bg-primary/10"
                    label="Attuale"
                  />
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {plural(version.groupCount, 'gruppo', 'gruppi')} ·{' '}
                {plural(version.variableCount, 'variabile', 'variabili')}
                {version.deployedStationId !== businessId &&
                  ` · ID stazione ${version.deployedStationId}`}
                {version.revertedFromId != null &&
                  ` · ripristino della versione ${
                    revertedFrom
                      ? `del ${formatDateTime(revertedFrom.deployedAt)}`
                      : `#${version.revertedFromId}`
                  }`}
                {sameAsLive && ' · uguale a quella attuale'}
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <TextButton
                type="button"
                className="inline-flex items-center gap-1.5"
                disabled={saving === version.id}
                onClick={() => handleDownload(version)}
              >
                <Download size={14} />
                Scarica
              </TextButton>
              {canRevert && (
                <OutlinedButton
                  type="button"
                  className="inline-flex items-center gap-1.5"
                  disabled={busy}
                  onClick={() => onReview(version)}
                >
                  <RotateCcw size={14} />
                  {version.live ? 'Scarta modifiche…' : 'Ripristina…'}
                </OutlinedButton>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

interface RevertPreviewViewProps {
  version: ConfigVersion
  // null while loading.
  outcome: RevertPreviewOutcome | null
  names: ChangeNames
  currentUsername: string | undefined
  onBack: () => void
}

// What reverting to the version would do: the warnings to confirm, then
// every change, from the station as stored now to the version.
export const RevertPreviewView: React.FC<RevertPreviewViewProps> = ({
  version,
  outcome,
  names,
  currentUsername,
  onBack,
}) => {
  const changes = outcome?.kind === 'preview' ? outcome.preview.changes : []

  // Groups the revert would create exist only in the preview: their ids
  // resolve to the names the preview gives them.
  const previewNames = useMemo<ChangeNames>(() => {
    const created = new Map(
      changes
        .filter((c) => c.entityType === 'group' && c.op === 'create')
        .map((c) => [c.entityId, entityLabel(c)]),
    )
    return {
      ...names,
      groupName: (id) => created.get(id) ?? names.groupName(id),
    }
  }, [changes, names])

  return (
    <div className="space-y-4 pb-1">
      <div className="flex flex-wrap items-center gap-2">
        <TextButton
          type="button"
          className="inline-flex items-center gap-1.5"
          onClick={onBack}
        >
          <ArrowLeft size={14} />
          Versioni
        </TextButton>
        <span className="text-sm text-muted-foreground">
          {version.live
            ? 'Torna alla versione attuale'
            : 'Ripristino della versione'}{' '}
          del{' '}
          <span className="text-foreground">
            {versionLabel(version, currentUsername)}
          </span>
        </span>
      </div>

      {!outcome && <Loading />}

      {outcome?.kind === 'refused' && <Refusal refusal={outcome.refusal} />}

      {outcome?.kind === 'preview' && (
        <>
          <Notice>
            La stazione viene riscritta com'era in questa versione e subito
            distribuita. La foto e l'albero dei server restano quelli attuali.
          </Notice>

          {outcome.preview.warnings.map((warning, i) => (
            <WarningCard
              key={i}
              warning={warning}
              currentUsername={currentUsername}
            />
          ))}

          {changes.length === 0 ? (
            <Notice>
              La stazione corrisponde già a questa versione: verrà soltanto
              distribuita di nuovo.
            </Notice>
          ) : (
            <ChangeList
              changes={changes}
              names={previewNames}
              labels={{ before: 'Attuale', after: 'Versione' }}
            />
          )}
        </>
      )}
    </div>
  )
}

const WarningCard: React.FC<{
  warning: RevertWarning
  currentUsername: string | undefined
}> = ({ warning, currentUsername }) => {
  if (warning.code === 'pending_changes') {
    const authors = warning.userIds
      .map((id) =>
        userLabel(
          warning.users.find((u) => u.id === id) ?? null,
          id,
          currentUsername,
        ),
      )
      .join(', ')
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            Le modifiche non distribuite andranno perse
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {warning.changeSets > 0
              ? `${plural(warning.changeSets, 'modifica', 'modifiche')}${authors ? ` di ${authors}` : ''}${
                  warning.lastChangedAt
                    ? `, l'ultima il ${formatDateTime(warning.lastChangedAt)}`
                    : ''
                }, verranno sostituite da questa versione.`
              : 'La stazione ha modifiche non distribuite, che verranno sostituite da questa versione.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-secondary" />
      <div className="min-w-0 text-sm">
        <p className="font-medium text-foreground">
          Percorso diverso per{' '}
          {warning.groupName || `il gruppo ${warning.groupId}`}
        </p>
        <p className="mt-0.5 text-muted-foreground">
          Nella versione arrivava a {warning.serverIp} passando da{' '}
          <span className="font-mono">{warning.fileChain.join(' → ')}</span>,
          ora l'albero dei server indica{' '}
          <span className="font-mono">{warning.treeChain.join(' → ')}</span>.
          Verrà usato il percorso attuale.
        </p>
      </div>
    </div>
  )
}

export const Refusal: React.FC<{ refusal: RevertRefusal }> = ({ refusal }) => (
  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
    <div className="flex items-start gap-2">
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
      <div className="min-w-0">
        <p className="font-medium text-destructive">
          {translateRevertMessage(refusal.message)}
        </p>
        <p className="mt-0.5 text-muted-foreground">
          Non è possibile ripristinare questa versione.
        </p>
        {(refusal.reasons.length > 0 || refusal.groups.length > 0) && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-muted-foreground">
            {refusal.reasons.map((reason) => (
              <li key={reason}>{translateRevertReason(reason)}</li>
            ))}
            {refusal.groups.map((issue) => (
              <li key={issue.groupId}>
                Gruppo {issue.groupId}: {translateRevertMessage(issue.reason)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
)
