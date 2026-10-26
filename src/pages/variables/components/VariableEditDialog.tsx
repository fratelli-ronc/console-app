import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FilledButton,
  TextButton,
  useConfirm,
} from '@/components'
import {
  Group,
  Variable,
  VARIABLE_CLASS_TYPE_OPTIONS,
  VARIABLE_DRIVER_OPTIONS,
  VARIABLE_FORMAT_OPTIONS,
  VARIABLE_HISTORY_AGGREGATION_POLICY_OPTIONS,
  VARIABLE_HISTORY_TRIGGER_TYPE_OPTIONS,
  VARIABLE_IMAGE_AUTH_TYPE_OPTIONS,
  VARIABLE_MEMORY_MAP_FUNC_TYPE_OPTIONS,
  VARIABLE_MEMORY_MAP_FUNC_TYPE_WRITE_OPTIONS,
  getVariable,
  updateVariable,
} from '@/client'
import {
  changedFields,
  saveFormResolvingConflicts,
} from '@/lib/versionConflicts'
import {
  CheckField,
  FieldGrid,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from './FormFields'
import { PresentationsEditor } from './PresentationsEditor'
import {
  FIELD_LABELS,
  isCamera,
  isModbus,
  toForm,
  toRequest,
  validateForm,
  variableKind,
  withImageAuth,
  type VariableForm,
  type VariableKind,
} from './variableForm'

const KIND_LABELS: Record<VariableKind, string> = {
  modbus: 'Modbus',
  mx3: 'Modbus MX3',
  internal: 'Variabile interna',
  mirroring: 'Mirroring',
  python: 'Script Python',
  'camera-http': 'Telecamera HTTP',
  'camera-tcp': 'Telecamera TCP',
}

interface VariableEditDialogProps {
  // Internal id of the variable to edit; null keeps the dialog closed.
  variableId: number | null
  // Every group: the variable's station's ones are offered to move it, and
  // a group's protocol tells a camera variable apart.
  groups: Group[]
  onClose: () => void
  // After a save (or finding the variable deleted): the grid reloads.
  onSaved: () => void
}

export const VariableEditDialog: React.FC<VariableEditDialogProps> = ({
  variableId,
  groups,
  onClose,
  onSaved,
}) => {
  const { confirm, confirmDialog } = useConfirm()

  const [initial, setInitial] = useState<Variable | null>(null)
  const [form, setForm] = useState<VariableForm | null>(null)
  const [errors, setErrors] = useState<
    Partial<Record<keyof VariableForm, string>>
  >({})
  const [saving, setSaving] = useState(false)

  // Read by the load effect, which must rerun only for a new variable.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    setInitial(null)
    setForm(null)
    setErrors({})
    if (variableId == null) return

    let cancelled = false
    getVariable(variableId).then((res) => {
      if (cancelled) return
      if (!res) return onCloseRef.current()
      setInitial(res)
      setForm(toForm(res))
    })
    return () => {
      cancelled = true
    }
  }, [variableId])

  const dirty = useMemo(
    () =>
      !!form &&
      !!initial &&
      Object.keys(changedFields(form, toForm(initial))).length > 0,
    [form, initial],
  )

  const groupsById = useMemo(
    () => new Map(groups.map((g) => [String(g.id), g])),
    [groups],
  )

  // The variable can move between its own station's groups; transferring
  // it to another station is the grid's bulk "Sposta in gruppo".
  const groupOptions = useMemo(() => {
    const stationId =
      initial?.groupId != null
        ? groupsById.get(String(initial.groupId))?.stationId
        : undefined
    return groups
      .filter((g) => stationId === undefined || g.stationId === stationId)
      .map((g) => ({
        value: String(g.id),
        label: g.name ? `${g.name} (${g.groupId})` : `ID ${g.groupId}`,
      }))
  }, [groups, groupsById, initial])

  const requestClose = async () => {
    if (saving) return
    if (
      dirty &&
      !(await confirm({
        title: 'Modifiche non salvate',
        description: 'Le modifiche non salvate andranno perse. Vuoi chiudere?',
        confirmLabel: 'Chiudi',
        destructive: true,
      }))
    )
      return
    onClose()
  }

  const handleSave = async () => {
    if (!form || !initial) return
    const found = validateForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast.error('Correggi i campi evidenziati.')
      return
    }

    setSaving(true)
    const done = await saveFormResolvingConflicts({
      initial,
      fields: form,
      toFields: toForm,
      update: ({ version, ...changes }) =>
        updateVariable(initial.id, {
          ...withImageAuth(toRequest(changes), changes, form),
          version,
        }),
      refetch: () => getVariable(initial.id),
      labels: FIELD_LABELS,
      subject: {
        changed: 'La variabile è stata modificata',
        deleted: 'La variabile è stata eliminata',
      },
      confirm,
    })
    setSaving(false)

    if (done) {
      toast.success('Variabile salvata')
      onSaved()
      onClose()
    }
  }

  return (
    <Dialog
      open={variableId != null}
      onOpenChange={(open) => !open && void requestClose()}
    >
      {/* Pinned to the top rather than centered: the content grows once the
          variable loads (and as sections or presentations come and go), and
          a centered dialog would jump each time. */}
      <DialogContent className="top-[5vh] translate-y-0 sm:max-w-4xl max-h-[90vh] p-0 gap-0 grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Modifica variabile</DialogTitle>
          <DialogDescription>
            {initial
              ? `${initial.name || 'Senza nome'} · ID ${initial.variableId}`
              : 'Caricamento…'}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 bg-muted/30">
          {form && initial ? (
            <VariableFormBody
              form={form}
              setForm={setForm}
              errors={errors}
              variableId={initial.variableId}
              groupOptions={groupOptions}
              groupProtocol={groupsById.get(form.groupId)?.protocol}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Caricamento…
            </p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <TextButton
            type="button"
            disabled={saving}
            onClick={() => void requestClose()}
          >
            Annulla
          </TextButton>
          <FilledButton
            type="button"
            disabled={!dirty || saving}
            onClick={handleSave}
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </FilledButton>
        </DialogFooter>

        {confirmDialog}
      </DialogContent>
    </Dialog>
  )
}

interface VariableFormBodyProps {
  form: VariableForm
  setForm: React.Dispatch<React.SetStateAction<VariableForm | null>>
  errors: Partial<Record<keyof VariableForm, string>>
  variableId: number
  groupOptions: { value: string; label: string }[]
  groupProtocol: string | undefined
}

const VariableFormBody: React.FC<VariableFormBodyProps> = ({
  form,
  setForm,
  errors,
  variableId,
  groupOptions,
  groupProtocol,
}) => {
  const set = <K extends keyof VariableForm>(key: K, value: VariableForm[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  // Props for a text input bound to a string field.
  const bind = (key: keyof VariableForm) => ({
    label: FIELD_LABELS[key],
    value: form[key] as string,
    onChange: (value: string) => set(key, value as never),
    error: errors[key],
  })
  const check = (key: keyof VariableForm) => ({
    label: FIELD_LABELS[key],
    checked: form[key] as boolean,
    onChange: (value: boolean) => set(key, value as never),
  })

  const kind = variableKind(form.driver, groupProtocol)
  const camera = isCamera(kind)
  const modbus = isModbus(kind)
  const isCommand = form.classType === 'command'
  const writes = isCommand || form.classType === 'preset'
  const hasRawValue = !camera && !(modbus && isCommand)
  const hasHistory = !camera && !(modbus && isCommand)

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Generale"
        action={
          <span className="text-xs font-medium px-2 py-1 rounded-md bg-accent text-accent-foreground whitespace-nowrap">
            {KIND_LABELS[kind]}
          </span>
        }
      >
        <FieldGrid>
          <TextField
            label="ID variabile"
            value={String(variableId)}
            disabled
            onChange={() => {}}
          />
          <SelectField
            label={FIELD_LABELS.groupId}
            value={form.groupId}
            options={groupOptions}
            hint={
              camera
                ? 'Gruppo telecamera: la variabile è letta da gocam-warden.'
                : undefined
            }
            onChange={(v) => set('groupId', v)}
          />
          <SelectField
            label={FIELD_LABELS.driver}
            value={form.driver}
            options={VARIABLE_DRIVER_OPTIONS}
            noneLabel="Modbus (predefinito)"
            hint={camera ? 'Ignorato per le telecamere.' : undefined}
            onChange={(v) => set('driver', v)}
          />
          <SelectField
            label={FIELD_LABELS.classType}
            value={form.classType}
            options={VARIABLE_CLASS_TYPE_OPTIONS}
            noneLabel="—"
            onChange={(v) => set('classType', v)}
          />
          {kind !== 'mirroring' && (
            <SelectField
              label={FIELD_LABELS.format}
              value={form.format}
              options={VARIABLE_FORMAT_OPTIONS}
              noneLabel="—"
              hint={
                camera && form.format !== 'JPEG'
                  ? 'Le telecamere salvano le immagini in JPEG.'
                  : undefined
              }
              onChange={(v) => set('format', v)}
            />
          )}
        </FieldGrid>
      </Section>

      {kind === 'python' && (
        <Note>
          Lo script è gestito dalla console degli script Python: qui si
          modificano solo i dati di visualizzazione.
        </Note>
      )}

      {modbus && (
        <Section title="Mappa memoria">
          <FieldGrid>
            <SelectField
              label={FIELD_LABELS.mmFuncType}
              value={form.mmFuncType}
              options={VARIABLE_MEMORY_MAP_FUNC_TYPE_OPTIONS}
              noneLabel="—"
              onChange={(v) => set('mmFuncType', v)}
            />
            {writes && (
              <SelectField
                label={FIELD_LABELS.mmFuncTypeWrite}
                value={form.mmFuncTypeWrite}
                options={VARIABLE_MEMORY_MAP_FUNC_TYPE_WRITE_OPTIONS}
                noneLabel="—"
                onChange={(v) => set('mmFuncTypeWrite', v)}
              />
            )}
            <TextField {...bind('mmMemAddress')} inputMode="numeric" />
            <TextField {...bind('mmMemQuantity')} inputMode="numeric" />
            {(isCommand || form.classType === 'digital') && (
              <TextField {...bind('mmBitId')} inputMode="numeric" />
            )}
            <TextField {...bind('mmChunkGrouping')} inputMode="numeric" />
            {kind === 'mx3' && (
              <>
                <TextField {...bind('mmPage')} inputMode="numeric" />
                <TextField {...bind('mmChannelMx3')} />
                <TextField {...bind('mmTariff')} inputMode="numeric" />
                <TextField {...bind('mmVarType')} />
              </>
            )}
            <CheckField {...check('isFastUpdate')} />
          </FieldGrid>
        </Section>
      )}

      {hasRawValue && (
        <Section title="Trattamento dato grezzo">
          <FieldGrid>
            <TextField {...bind('measureUnit')} />
            {kind !== 'mirroring' && (
              <>
                <TextField {...bind('minValue')} inputMode="decimal" />
                <TextField {...bind('maxValue')} inputMode="decimal" />
                <TextField {...bind('exponent')} inputMode="numeric" />
                <TextField {...bind('k')} inputMode="numeric" />
                <CheckField {...check('cumul')} />
              </>
            )}
          </FieldGrid>
        </Section>
      )}

      {hasHistory && (
        <Section title="Storico">
          <FieldGrid>
            <CheckField {...check('histEnabled')} />
            <SelectField
              label={FIELD_LABELS.histTriggerType}
              value={form.histTriggerType}
              options={VARIABLE_HISTORY_TRIGGER_TYPE_OPTIONS}
              noneLabel="—"
              onChange={(v) => set('histTriggerType', v)}
            />
            <SelectField
              label={FIELD_LABELS.histAggregationPolicy}
              value={form.histAggregationPolicy}
              options={VARIABLE_HISTORY_AGGREGATION_POLICY_OPTIONS}
              noneLabel="—"
              onChange={(v) => set('histAggregationPolicy', v)}
            />
            <TextField
              {...bind('histInterval')}
              hint="Secondi (60) o espressione cron (0 3 * * *)."
            />
            <TextField {...bind('histNLogsMax')} inputMode="numeric" />
          </FieldGrid>
        </Section>
      )}

      {camera && (
        <Section
          title="Telecamera"
          description={
            kind === 'camera-tcp'
              ? "La telecamera è raggiunta all'IP e alla porta del gruppo."
              : "I path sono relativi all'IP e alla porta del gruppo."
          }
        >
          <FieldGrid>
            <TextField
              {...bind('histInterval')}
              label="Intervallo di acquisizione"
              hint="Espressione cron (*/5 * * * *) o secondi, arrotondati al minuto."
            />
            {kind === 'camera-http' && (
              <>
                <TextField
                  {...bind('imgSnapshotPath')}
                  className="sm:col-span-2"
                  hint="Es. /cgi-bin/snapshot.cgi"
                />
                <TextField
                  {...bind('imgGoToPresetPath')}
                  className="sm:col-span-2 lg:col-span-3"
                  hint="Facoltativo: chiamato prima dello snapshot per posizionare la telecamera."
                />
                <TextField
                  {...bind('imgSnapshotDelay')}
                  label="Ritardo snapshot (ms)"
                  inputMode="numeric"
                  hint="Attesa tra il preset e lo snapshot."
                />
                <SelectField
                  label={FIELD_LABELS.imgAuthType}
                  value={form.imgAuthType}
                  options={VARIABLE_IMAGE_AUTH_TYPE_OPTIONS}
                  noneLabel="Nessuna"
                  onChange={(v) => set('imgAuthType', v)}
                />
                <TextField {...bind('imgAuthUser')} />
                <TextField {...bind('imgAuthPassword')} type="password" />
              </>
            )}
          </FieldGrid>
        </Section>
      )}

      <Section title="Descrizione e visualizzazione">
        <FieldGrid>
          <TextField {...bind('name')} className="sm:col-span-2" />
          <TextField {...bind('ordPrint')} inputMode="numeric" />
          <TextField {...bind('tags')} hint="Separati da virgola." />
          {!camera && <TextField {...bind('graphGroup')} />}
          {writes && (
            <TextField
              {...bind('writeAuthorizationLevel')}
              inputMode="numeric"
              hint="Livello minimo per scrivere (es. 30 = UserWork)."
            />
          )}
          <TextAreaField
            {...bind('note')}
            className="sm:col-span-2 lg:col-span-3"
          />
          <CheckField {...check('hidden')} />
          <CheckField {...check('preview')} />
          <CheckField {...check('enableLogs')} />
        </FieldGrid>
      </Section>

      {!camera && (
        <Section
          title="Presentazioni"
          description="Come le app di stazione mostrano e comandano la variabile."
        >
          <PresentationsEditor
            value={form.presentations}
            onChange={(v) => set('presentations', v)}
          />
        </Section>
      )}
    </div>
  )
}

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
    <Info size={16} className="shrink-0 mt-0.5 text-primary" />
    <p>{children}</p>
  </div>
)
