import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, FormPage, ToggleSwitch, SearchableSelect } from '@/components'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components'
import {
  Group,
  Station,
  createGroup,
  updateGroup,
  listStations,
} from '@/client'
import { GroupTagPicker } from './GroupTagPicker'

interface GroupFormPageProps {
  mode: 'create' | 'edit'
  initialValues?: Group
}

export const PROTOCOL_OPTIONS: { value: string; label: string }[] = [
  { value: 'ModBusTcp', label: 'Modbus TCP' },
  { value: 'RtuOverTcp', label: 'RTU over TCP' },
  { value: 'M-Bus', label: 'M-Bus' },
  { value: 'Leitwind', label: 'Leitwind' },
  { value: 'HTTP/img', label: 'HTTP (immagine)' },
  { value: 'TCP/img', label: 'TCP (immagine)' },
]

export const NETWORK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'LAN', label: 'LAN' },
  { value: 'NB_IoT', label: 'NB-IoT' },
]

export const GroupFormPage: React.FC<GroupFormPageProps> = ({
  mode,
  initialValues,
}) => {
  const navigate = useNavigate()

  const [stations, setStations] = useState<Station[] | null>(null)

  const [groupId, setGroupId] = useState(
    initialValues ? String(initialValues.groupId) : '',
  )
  const [name, setName] = useState(initialValues?.name ?? '')
  const [stationId, setStationId] = useState(
    initialValues?.stationId != null ? String(initialValues.stationId) : '',
  )
  const [protocol, setProtocol] = useState(
    initialValues?.protocol ?? PROTOCOL_OPTIONS[0].value,
  )
  const [networkType, setNetworkType] = useState(
    initialValues?.networkType ?? NETWORK_TYPE_OPTIONS[0].value,
  )
  const [ipAddress, setIpAddress] = useState(initialValues?.ipAddress ?? '')
  const [portNumber, setPortNumber] = useState(
    initialValues?.portNumber != null ? String(initialValues.portNumber) : '',
  )
  const [connectionTimeout, setConnectionTimeout] = useState(
    initialValues?.connectionTimeout != null
      ? String(initialValues.connectionTimeout)
      : '',
  )
  const [transactionTimeout, setTransactionTimeout] = useState(
    initialValues?.transactionTimeout != null
      ? String(initialValues.transactionTimeout)
      : '',
  )
  const [unitId, setUnitId] = useState(
    initialValues?.unitId != null ? String(initialValues.unitId) : '',
  )
  const [unitIdModBusSlave, setUnitIdModBusSlave] = useState(
    initialValues?.unitIdModBusSlave != null
      ? String(initialValues.unitIdModBusSlave)
      : '',
  )
  const [ordPrint, setOrdPrint] = useState(
    initialValues?.ordPrint != null ? String(initialValues.ordPrint) : '',
  )
  const [lat, setLat] = useState(
    initialValues?.lat != null ? String(initialValues.lat) : '',
  )
  const [long, setLong] = useState(
    initialValues?.long != null ? String(initialValues.long) : '',
  )
  const [tel, setTel] = useState(initialValues?.tel ?? '')
  const [webcamUrl, setWebcamUrl] = useState(initialValues?.webcamUrl ?? '')
  const [driveDocUrl, setDriveDocUrl] = useState(
    initialValues?.driveDocUrl ?? '',
  )
  const [drivePhotoUrl, setDrivePhotoUrl] = useState(
    initialValues?.drivePhotoUrl ?? '',
  )
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true)
  const [tagIds, setTagIds] = useState(
    initialValues?.tags.map((t) => t.id) ?? [],
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listStations().then((res) => {
      if (res) setStations(res.sort((a, b) => a.stationId - b.stationId))
    })
  }, [])

  const isCreate = mode === 'create'

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fields = {
      stationId: stationId === '' ? null : Number(stationId),
      name,
      enabled,
      unitId: unitId === '' ? undefined : Number(unitId),
      ordPrint: ordPrint === '' ? undefined : Number(ordPrint),
      lat: lat === '' ? undefined : Number(lat),
      long: long === '' ? undefined : Number(long),
      webcamUrl,
      driveDocUrl,
      drivePhotoUrl,
      tel,
      ipAddress,
      portNumber: portNumber === '' ? undefined : Number(portNumber),
      connectionTimeout:
        connectionTimeout === '' ? undefined : Number(connectionTimeout),
      transactionTimeout:
        transactionTimeout === '' ? undefined : Number(transactionTimeout),
      protocol,
      networkType,
      unitIdModBusSlave:
        unitIdModBusSlave === '' ? undefined : Number(unitIdModBusSlave),
      tagIds,
    }

    const res = isCreate
      ? await createGroup({ groupId: Number(groupId), ...fields })
      : await updateGroup(initialValues!.id, fields)

    setLoading(false)
    if (res !== null) navigate('/groups')
  }

  return (
    <FormPage
      title={isCreate ? 'Nuovo gruppo' : 'Modifica gruppo'}
      subtitle={
        isCreate
          ? 'Compila i campi per aggiungere un nuovo gruppo al sistema.'
          : 'Modifica i dati del gruppo.'
      }
      submitLabel={
        loading ? 'Salvataggio…' : isCreate ? 'Crea gruppo' : 'Salva modifiche'
      }
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/groups')}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          required
          label="ID gruppo"
          value={groupId}
          type="number"
          placeholder="1"
          disabled={!isCreate}
          onChange={setGroupId}
        />
        <TextInput
          label="Nome"
          value={name}
          placeholder="Gruppo Principale"
          onChange={setName}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Stazione
          </label>
          <SearchableSelect
            value={stationId}
            onValueChange={setStationId}
            placeholder="Nessuna"
            searchPlaceholder="Cerca stazione…"
            emptyMessage="Nessuna stazione trovata."
            options={[
              { value: '', label: 'Nessuna' },
              ...(stations ?? []).map((station) => ({
                value: String(station.id),
                label: station.name || `ID ${station.stationId}`,
              })),
            ]}
          />
        </div>
        <TextInput
          label="Ordine di stampa"
          value={ordPrint}
          type="number"
          placeholder="1"
          onChange={setOrdPrint}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Protocollo
          </label>
          <Select value={protocol} onValueChange={setProtocol}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROTOCOL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Rete</label>
          <Select value={networkType} onValueChange={setNetworkType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORK_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Indirizzo IP"
          value={ipAddress}
          placeholder="192.168.1.10"
          onChange={setIpAddress}
        />
        <TextInput
          label="Porta"
          value={portNumber}
          type="number"
          placeholder="502"
          onChange={setPortNumber}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Timeout connessione (ms)"
          value={connectionTimeout}
          type="number"
          placeholder="3000"
          onChange={setConnectionTimeout}
        />
        <TextInput
          label="Timeout transazione (ms)"
          value={transactionTimeout}
          type="number"
          placeholder="1000"
          onChange={setTransactionTimeout}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Unit ID"
          value={unitId}
          type="number"
          placeholder="1"
          onChange={setUnitId}
        />
        <TextInput
          label="Unit ID (Modbus slave)"
          value={unitIdModBusSlave}
          type="number"
          placeholder="1"
          onChange={setUnitIdModBusSlave}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Latitudine"
          value={lat}
          placeholder="45.4642"
          onChange={setLat}
        />
        <TextInput
          label="Longitudine"
          value={long}
          placeholder="9.19"
          onChange={setLong}
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
          label="URL webcam"
          value={webcamUrl}
          placeholder="https://…"
          onChange={setWebcamUrl}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="URL documenti Drive"
          value={driveDocUrl}
          placeholder="https://…"
          onChange={setDriveDocUrl}
        />
        <TextInput
          label="URL foto Drive"
          value={drivePhotoUrl}
          placeholder="https://…"
          onChange={setDrivePhotoUrl}
        />
      </div>

      <GroupTagPicker selectedIds={tagIds} onChange={setTagIds} />

      <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-muted/40">
        <div>
          <p className="text-sm font-medium text-foreground">Gruppo attivo</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enabled ? 'Il gruppo è operativo.' : 'Il gruppo è disattivato.'}
          </p>
        </div>
        <ToggleSwitch checked={enabled} onChange={setEnabled} />
      </div>
    </FormPage>
  )
}
