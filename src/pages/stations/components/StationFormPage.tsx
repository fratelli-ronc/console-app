import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, FormPage, ToggleSwitch } from '@/components'
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
  updateStation,
} from '@/client'
import { TagPicker } from './TagPicker'
import { StationPhotoField } from './StationPhotoField'

interface StationFormPageProps {
  mode: 'create' | 'edit'
  initialValues?: Station
}

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
    </FormPage>
  )
}
