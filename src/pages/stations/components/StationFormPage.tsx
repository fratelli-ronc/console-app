import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, FormPage, ToggleSwitch, useConfirm } from '@/components'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components'
import {
  Station,
  StationPhotoRef,
  createStation,
  getNextStationId,
  getStation,
  updateStation,
} from '@/client'
import { saveFormResolvingConflicts } from '@/lib/versionConflicts'
import { TagPicker } from './TagPicker'
import { StationPhotoField } from './StationPhotoField'

// The form's state for station (blank for a new one), as strings wherever
// a text input edits it.
const toFormValues = (station?: Station) => ({
  stationId: station ? String(station.stationId) : '',
  name: station?.name ?? '',
  address: station?.address ?? '',
  city: station?.city ?? '',
  tel: station?.tel ?? '',
  smsServer: station?.smsServer ?? '',
  maintenanceMode: station?.maintenanceMode ?? '',
  ordPrint: station?.ordPrint != null ? String(station.ordPrint) : '',
  enabled: station?.enabled ?? true,
  tagIds: station?.tags.map((t) => t.id) ?? [],
})

type FormValues = ReturnType<typeof toFormValues>

// What a save sends for values - all but the business id, which is fixed
// once the station exists.
const toFields = (values: FormValues) => ({
  enabled: values.enabled,
  name: values.name,
  address: values.address,
  city: values.city,
  tel: values.tel,
  smsServer: values.smsServer,
  maintenanceMode: values.maintenanceMode,
  ordPrint: values.ordPrint === '' ? undefined : Number(values.ordPrint),
  tagIds: values.tagIds,
})

const FIELD_LABELS: Record<keyof ReturnType<typeof toFields>, string> = {
  enabled: 'Stazione attiva',
  name: 'Nome',
  address: 'Indirizzo',
  city: 'Città',
  tel: 'Telefono',
  smsServer: 'Server SMS',
  maintenanceMode: 'Modalità manutenzione',
  ordPrint: 'Ordine di stampa',
  tagIds: 'Tag',
}

interface StationFormPageProps {
  mode: 'create' | 'edit'
  initialValues?: Station
}

export const StationFormPage: React.FC<StationFormPageProps> = ({
  mode,
  initialValues,
}) => {
  const navigate = useNavigate()
  const { confirm, confirmDialog } = useConfirm()

  const [initial] = useState(() => toFormValues(initialValues))
  const [stationId, setStationId] = useState(initial.stationId)
  const [name, setName] = useState(initial.name)
  const [address, setAddress] = useState(initial.address)
  const [city, setCity] = useState(initial.city)
  const [tel, setTel] = useState(initial.tel)
  const [smsServer, setSmsServer] = useState(initial.smsServer)
  const [maintenanceMode, setMaintenanceMode] = useState(
    initial.maintenanceMode,
  )
  const [ordPrint, setOrdPrint] = useState(initial.ordPrint)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [tagIds, setTagIds] = useState(initial.tagIds)
  const [photo, setPhoto] = useState<StationPhotoRef | null>(
    initialValues?.photo ?? null,
  )
  const [loading, setLoading] = useState(false)

  const isCreate = mode === 'create'

  // Propose the next free ID from the server (it counts soft-deleted
  // stations); skip it if the user already typed one.
  useEffect(() => {
    if (!isCreate) return
    getNextStationId().then((res) => {
      if (res) setStationId((prev) => prev || String(res.stationId))
    })
  }, [isCreate])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fields = toFields({
      stationId,
      name,
      address,
      city,
      tel,
      smsServer,
      maintenanceMode,
      ordPrint,
      enabled,
      tagIds,
    })

    const done = isCreate
      ? (await createStation({ stationId: Number(stationId), ...fields })) !==
        null
      : await saveFormResolvingConflicts({
          initial: initialValues!,
          fields,
          toFields: (station) => toFields(toFormValues(station)),
          update: (payload) => updateStation(initialValues!.id, payload),
          refetch: () => getStation(initialValues!.id),
          labels: FIELD_LABELS,
          subject: {
            changed: 'La stazione è stata modificata',
            deleted: 'La stazione è stata eliminata',
          },
          confirm,
        })

    setLoading(false)
    if (done) navigate('/stations')
  }

  return (
    <FormPage
      title={isCreate ? 'Nuova stazione' : 'Modifica stazione'}
      subtitle={
        isCreate
          ? 'Compila i campi per aggiungere una nuova stazione al sistema.'
          : 'Modifica i dati della stazione.'
      }
      submitLabel={
        loading
          ? 'Salvataggio…'
          : isCreate
            ? 'Crea stazione'
            : 'Salva modifiche'
      }
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/stations')}
    >
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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Modalità manutenzione
          </label>
          <Select
            value={maintenanceMode || 'none'}
            onValueChange={(v) => setMaintenanceMode(v === 'none' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessuna</SelectItem>
              <SelectItem value="station">Stazione</SelectItem>
              <SelectItem value="group">Gruppo</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          <p className="text-sm font-medium text-foreground">Stazione attiva</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enabled
              ? 'La stazione è operativa.'
              : 'La stazione è disattivata.'}
          </p>
        </div>
        <ToggleSwitch checked={enabled} onChange={setEnabled} />
      </div>

      {confirmDialog}
    </FormPage>
  )
}
