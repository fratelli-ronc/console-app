import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TextInput,
  FormPage,
  ToggleSwitch,
  SearchableSelect,
  useConfirm,
} from '@/components'
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
  getGroup,
  getNextGroupId,
  updateGroup,
  listStations,
} from '@/client'
import { listServers, type Server } from '@/client/coolify'
import { saveFormResolvingConflicts } from '@/lib/versionConflicts'
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
  { value: 'HTTP/img', label: 'Immagine - HTTP' },
  { value: 'TCP/img', label: 'Immagine - TCP' },
]

export const NETWORK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'LAN', label: 'LAN' },
  { value: 'NB_IoT', label: 'NB-IoT' },
]

const optionalNumber = (value: number | null | undefined) =>
  value != null ? String(value) : ''

const numberOrUndefined = (value: string) =>
  value === '' ? undefined : Number(value)

// The form's state for group (blank for a new one), as strings wherever a
// text input edits it.
const toFormValues = (group?: Group) => ({
  groupId: group ? String(group.groupId) : '',
  name: group?.name ?? '',
  stationId: optionalNumber(group?.stationId),
  protocol: group?.protocol ?? PROTOCOL_OPTIONS[0].value,
  networkType: group?.networkType ?? NETWORK_TYPE_OPTIONS[0].value,
  serverIp: group?.serverIp ?? '',
  ipAddress: group?.ipAddress ?? '',
  portNumber: optionalNumber(group?.portNumber),
  connectionTimeout: optionalNumber(group?.connectionTimeout),
  transactionTimeout: optionalNumber(group?.transactionTimeout),
  unitId: optionalNumber(group?.unitId),
  unitIdModBusSlave: optionalNumber(group?.unitIdModBusSlave),
  ordPrint: optionalNumber(group?.ordPrint),
  lat: optionalNumber(group?.lat),
  long: optionalNumber(group?.long),
  tel: group?.tel ?? '',
  webcamUrl: group?.webcamUrl ?? '',
  driveDocUrl: group?.driveDocUrl ?? '',
  drivePhotoUrl: group?.drivePhotoUrl ?? '',
  enabled: group?.enabled ?? true,
  tagIds: group?.tags.map((t) => t.id) ?? [],
})

type FormValues = ReturnType<typeof toFormValues>

// What a save sends for values - all but the business id, which is fixed
// once the group exists.
const toFields = (values: FormValues) => ({
  stationId: values.stationId === '' ? null : Number(values.stationId),
  name: values.name,
  enabled: values.enabled,
  unitId: numberOrUndefined(values.unitId),
  ordPrint: numberOrUndefined(values.ordPrint),
  lat: numberOrUndefined(values.lat),
  long: numberOrUndefined(values.long),
  webcamUrl: values.webcamUrl,
  driveDocUrl: values.driveDocUrl,
  drivePhotoUrl: values.drivePhotoUrl,
  tel: values.tel,
  serverIp: values.serverIp,
  ipAddress: values.ipAddress,
  portNumber: numberOrUndefined(values.portNumber),
  connectionTimeout: numberOrUndefined(values.connectionTimeout),
  transactionTimeout: numberOrUndefined(values.transactionTimeout),
  protocol: values.protocol,
  networkType: values.networkType,
  unitIdModBusSlave: numberOrUndefined(values.unitIdModBusSlave),
  tagIds: values.tagIds,
})

const FIELD_LABELS: Record<keyof ReturnType<typeof toFields>, string> = {
  stationId: 'Stazione',
  name: 'Nome',
  enabled: 'Gruppo attivo',
  unitId: 'Unit ID',
  ordPrint: 'Ordine di stampa',
  lat: 'Latitudine',
  long: 'Longitudine',
  webcamUrl: 'URL webcam',
  driveDocUrl: 'URL documenti Drive',
  drivePhotoUrl: 'URL foto Drive',
  tel: 'Telefono',
  serverIp: 'Server',
  ipAddress: 'Indirizzo IP',
  portNumber: 'Porta',
  connectionTimeout: 'Timeout connessione',
  transactionTimeout: 'Timeout transazione',
  protocol: 'Protocollo',
  networkType: 'Rete',
  unitIdModBusSlave: 'Unit ID (Modbus slave)',
  tagIds: 'Tag',
}

export const GroupFormPage: React.FC<GroupFormPageProps> = ({
  mode,
  initialValues,
}) => {
  const navigate = useNavigate()
  const { confirm, confirmDialog } = useConfirm()

  const [stations, setStations] = useState<Station[] | null>(null)
  const [servers, setServers] = useState<Server[] | null>(null)

  const [initial] = useState(() => toFormValues(initialValues))
  const [groupId, setGroupId] = useState(initial.groupId)
  const [name, setName] = useState(initial.name)
  const [stationId, setStationId] = useState(initial.stationId)
  const [protocol, setProtocol] = useState(initial.protocol)
  const [networkType, setNetworkType] = useState(initial.networkType)
  const [serverIp, setServerIp] = useState(initial.serverIp)
  const [ipAddress, setIpAddress] = useState(initial.ipAddress)
  const [portNumber, setPortNumber] = useState(initial.portNumber)
  const [connectionTimeout, setConnectionTimeout] = useState(
    initial.connectionTimeout,
  )
  const [transactionTimeout, setTransactionTimeout] = useState(
    initial.transactionTimeout,
  )
  const [unitId, setUnitId] = useState(initial.unitId)
  const [unitIdModBusSlave, setUnitIdModBusSlave] = useState(
    initial.unitIdModBusSlave,
  )
  const [ordPrint, setOrdPrint] = useState(initial.ordPrint)
  const [lat, setLat] = useState(initial.lat)
  const [long, setLong] = useState(initial.long)
  const [tel, setTel] = useState(initial.tel)
  const [webcamUrl, setWebcamUrl] = useState(initial.webcamUrl)
  const [driveDocUrl, setDriveDocUrl] = useState(initial.driveDocUrl)
  const [drivePhotoUrl, setDrivePhotoUrl] = useState(initial.drivePhotoUrl)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [tagIds, setTagIds] = useState(initial.tagIds)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listStations().then((res) => {
      if (res) setStations(res.sort((a, b) => a.stationId - b.stationId))
    })
    listServers().then((res) => {
      if (res) setServers(res)
    })
  }, [])

  const serverOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'Nessuno' },
      ...(servers ?? []).map((server) => ({
        value: server.ip,
        label: `${server.ip} — ${server.name}`,
      })),
    ]
    if (serverIp && !opts.some((opt) => opt.value === serverIp)) {
      opts.push({ value: serverIp, label: serverIp })
    }
    return opts
  }, [servers, serverIp])

  const isCreate = mode === 'create'

  // Propose the next free ID from the server (it counts soft-deleted
  // groups); skip it if the user already typed one.
  useEffect(() => {
    if (!isCreate) return
    getNextGroupId().then((res) => {
      if (res) setGroupId((prev) => prev || String(res.groupId))
    })
  }, [isCreate])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fields = toFields({
      groupId,
      name,
      stationId,
      protocol,
      networkType,
      serverIp,
      ipAddress,
      portNumber,
      connectionTimeout,
      transactionTimeout,
      unitId,
      unitIdModBusSlave,
      ordPrint,
      lat,
      long,
      tel,
      webcamUrl,
      driveDocUrl,
      drivePhotoUrl,
      enabled,
      tagIds,
    })

    const done = isCreate
      ? (await createGroup({ groupId: Number(groupId), ...fields })) !== null
      : await saveFormResolvingConflicts({
          initial: initialValues!,
          fields,
          toFields: (group) => toFields(toFormValues(group)),
          update: (payload) => updateGroup(initialValues!.id, payload),
          refetch: () => getGroup(initialValues!.id),
          labels: FIELD_LABELS,
          subject: {
            changed: 'Il gruppo è stato modificato',
            deleted: 'Il gruppo è stato eliminato',
          },
          confirm,
        })

    setLoading(false)
    if (done) navigate('/groups')
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Server</label>
        <SearchableSelect
          value={serverIp}
          onValueChange={setServerIp}
          placeholder="Nessuno"
          searchPlaceholder="Cerca server…"
          emptyMessage="Nessun server trovato."
          options={serverOptions}
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

      {confirmDialog}
    </FormPage>
  )
}
