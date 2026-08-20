import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { TextInput, FilledButton } from '@/components'
import { cn } from '@/lib/utils'
import {
  Station,
  StationPhotoRef,
  createStation,
  updateStation,
} from '@/client'
import { TagPicker } from './TagPicker'
import { StationPhotoField } from './StationPhotoField'

interface StationFormPageProps {
  mode: 'create' | 'edit'
  initialValues?: Station
}

const ToggleSwitch: React.FC<{
  checked: boolean
  onChange: (value: boolean) => void
}> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
      checked ? 'bg-primary' : 'bg-input',
    )}
  >
    <span
      className={cn(
        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0',
      )}
    />
  </button>
)

export const StationFormPage: React.FC<StationFormPageProps> = ({
  mode,
  initialValues,
}) => {
  const navigate = useNavigate()

  const [stationId, setStationId] = useState(
    initialValues ? String(initialValues.stationId) : '',
  )
  const [name, setName] = useState(initialValues?.name ?? '')
  const [address, setAddress] = useState(initialValues?.address ?? '')
  const [city, setCity] = useState(initialValues?.city ?? '')
  const [tel, setTel] = useState(initialValues?.tel ?? '')
  const [smsServer, setSmsServer] = useState(initialValues?.smsServer ?? '')
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialValues?.maintenanceMode ?? '',
  )
  const [ordPrint, setOrdPrint] = useState(
    initialValues?.ordPrint != null ? String(initialValues.ordPrint) : '',
  )
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true)
  const [tagIds, setTagIds] = useState(
    initialValues?.tags.map((t) => t.id) ?? [],
  )
  const [photo, setPhoto] = useState<StationPhotoRef | null>(
    initialValues?.photo ?? null,
  )
  const [loading, setLoading] = useState(false)

  const isCreate = mode === 'create'
  const title = isCreate ? 'Nuova stazione' : 'Modifica stazione'
  const subtitle = isCreate
    ? 'Compila i campi per aggiungere una nuova stazione al sistema.'
    : 'Modifica i dati della stazione.'

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fields = {
      enabled,
      name,
      address,
      city,
      tel,
      smsServer,
      maintenanceMode,
      ordPrint: ordPrint === '' ? undefined : Number(ordPrint),
      tagIds,
    }

    const res = isCreate
      ? await createStation({ stationId: Number(stationId), ...fields })
      : await updateStation(initialValues!.id, fields)

    setLoading(false)
    if (res !== null) navigate('/stations')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-0.5 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0 cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              required
              label="ID stazione"
              value={stationId}
              type="number"
              placeholder="1"
              disabled={!isCreate}
              onChange={setStationId}
            />
            <TextInput
              required
              label="Nome"
              value={name}
              placeholder="Stazione Centrale"
              onChange={setName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Indirizzo"
              value={address}
              placeholder="Via Roma 1"
              onChange={setAddress}
            />
            <TextInput
              label="Città"
              value={city}
              placeholder="Milano"
              onChange={setCity}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Telefono"
              value={tel}
              type="tel"
              placeholder="+39 02 1234567"
              onChange={setTel}
            />
            <TextInput
              label="Server SMS"
              value={smsServer}
              placeholder="sms.example.com"
              onChange={setSmsServer}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Modalità manutenzione"
              value={maintenanceMode}
              placeholder="none"
              onChange={setMaintenanceMode}
            />
            <TextInput
              label="Ordine di stampa"
              value={ordPrint}
              type="number"
              placeholder="1"
              onChange={setOrdPrint}
            />
          </div>

          <TagPicker selectedIds={tagIds} onChange={setTagIds} />

          {!isCreate && (
            <StationPhotoField
              stationId={initialValues!.id}
              photo={photo}
              onUploaded={setPhoto}
            />
          )}

          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-muted/40">
            <div>
              <p className="text-sm font-medium text-foreground">
                Stazione attiva
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enabled
                  ? 'La stazione è operativa.'
                  : 'La stazione è disattivata.'}
              </p>
            </div>
            <ToggleSwitch checked={enabled} onChange={setEnabled} />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <FilledButton type="submit" disabled={loading}>
              {loading
                ? 'Salvataggio…'
                : isCreate
                  ? 'Crea stazione'
                  : 'Salva modifiche'}
            </FilledButton>
            <button
              type="button"
              onClick={() => navigate('/stations')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
