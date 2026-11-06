import type { Group } from '@/client'
import type {
  ModbusReadFunction,
  ModbusReadRequest,
  ModbusReadResult,
} from '@/lib/modbus'
import { parseNumber } from './FormFields'
import type { VariableForm } from './variableForm'

// ── Request ─────────────────────────────────────────────────────────────────
//
// What the edit dialog's Modbus test reads, built from the form as typed
// (saved or not) and the variable's group, the way gobus-opc would poll it.

const READ_FUNCTIONS: Record<
  string,
  { fn: ModbusReadFunction; label: string }
> = {
  FUNC_MB_READ_COIL_STATUS: { fn: 'coils', label: 'Coil' },
  FUNC_MB_READ_INPUT_STATUS: { fn: 'discreteInputs', label: 'Input status' },
  FUNC_MB_READ_HOLDING_REGISTERS: {
    fn: 'holdingRegisters',
    label: 'Holding register',
  },
  FUNC_MB_READ_INPUT_REGISTERS: {
    fn: 'inputRegisters',
    label: 'Input register',
  },
  // ronc-api reads it from the input registers.
  FUNC_MB_READ_SINGLE_REGISTER: {
    fn: 'inputRegisters',
    label: 'Input register',
  },
}

const isBitFunction = (fn: ModbusReadFunction) =>
  fn === 'coils' || fn === 'discreteInputs'

// Registers a format takes when the variable sets no quantity (gobus-opc's
// FormatToMemQuantity).
const FORMAT_WORDS: Record<string, number> = {
  BOOL: 1,
  MARKER: 1,
  WORD: 1,
  BCD: 1,
  REAL: 2,
  REAL_Swap: 2,
  DWORD: 2,
  DWORD_Swap: 2,
}

// Used when the group leaves a timeout empty.
const DEFAULT_TIMEOUT_MS = 3000

export type ModbusTestPlan =
  | { ok: false; reason: string }
  | { ok: true; request: ModbusReadRequest; summary: string }

const fail = (reason: string): ModbusTestPlan => ({ ok: false, reason })

const isInt = (n: number | null, min: number, max: number): n is number =>
  n != null && Number.isInteger(n) && n >= min && n <= max

export const planModbusTest = (
  form: VariableForm,
  group: Group | undefined,
): ModbusTestPlan => {
  if (!group) return fail('Scegli il gruppo della variabile.')
  const rtuOverTcp = group.protocol === 'RtuOverTcp'
  if (!rtuOverTcp && group.protocol !== 'ModBusTcp')
    return fail(`Il protocollo del gruppo (${group.protocol}) non è Modbus.`)
  if (!group.ipAddress || group.portNumber == null)
    return fail('Il gruppo non ha indirizzo IP e porta.')

  const read = READ_FUNCTIONS[form.mmFuncType]
  if (!read) return fail('Scegli la funzione di lettura.')

  const address = parseNumber(form.mmMemAddress)
  if (!isInt(address, 0, 65535))
    return fail("Indica un indirizzo di memoria valido (0–65535).")

  const bits = isBitFunction(read.fn)
  const typed = parseNumber(form.mmMemQuantity)
  let quantity: number
  if (typed != null && typed > 0) {
    if (!isInt(typed, 1, bits ? 2000 : 125))
      return fail(`Quantità non valida (1–${bits ? 2000 : 125}).`)
    quantity = typed
  } else if (bits) {
    quantity = 1
  } else {
    const words = FORMAT_WORDS[form.format]
    if (!words)
      return fail(
        form.format
          ? `Indica la quantità: il formato ${form.format} non la determina.`
          : 'Indica il formato o la quantità.',
      )
    quantity = words
  }

  // gobus-opc sets the unit id only for RTU over TCP; on plain TCP the
  // library's default (1) goes out.
  const unitId = rtuOverTcp ? (group.unitId ?? 0) : 1

  const request: ModbusReadRequest = {
    host: group.ipAddress,
    port: group.portNumber,
    rtuOverTcp,
    unitId,
    function: read.fn,
    address,
    quantity,
    connectTimeoutMs: group.connectionTimeout || DEFAULT_TIMEOUT_MS,
    transactionTimeoutMs: group.transactionTimeout || DEFAULT_TIMEOUT_MS,
  }
  const scheme = rtuOverTcp ? 'rtuovertcp' : 'tcp'
  const summary =
    `${scheme}://${request.host}:${request.port} · unit ${unitId} · ` +
    `${read.label} ${address}` +
    (quantity > 1 ? ` × ${quantity}` : '')
  return { ok: true, request, summary }
}

// ── Decoding ────────────────────────────────────────────────────────────────
//
// The value the station apps would show, decoded from the raw reply like
// ronc-api does (OpcModbusMemoryData.TryRead, then the exponent). K is not
// applied there, so it isn't here either.

export type DecodedValue = { value: string } | { note: string }

const note = (text: string): DecodedValue => ({ note: text })

const withUnit = (text: string, unit: string) =>
  unit.trim() ? `${text} ${unit.trim()}` : text

const onOff = (bit: boolean) => (bit ? '1 (ON)' : '0 (OFF)')

const bcd = (word: number): number | null => {
  let result = 0
  let multiplier = 1
  for (let w = word; w > 0; w >>= 4) {
    const digit = w & 0xf
    if (digit > 9) return null
    result += digit * multiplier
    multiplier *= 10
  }
  return result
}

const float32 = (bitsValue: number) => {
  const view = new DataView(new ArrayBuffer(4))
  view.setUint32(0, bitsValue >>> 0)
  return view.getFloat32(0)
}

// Low word first; byte order within a word as ronc-api reads strings.
const ascii = (words: number[]) =>
  String.fromCharCode(...words.flatMap((w) => [w & 0xff, w >> 8])).replace(
    /\0+$/,
    '',
  )

const applyExponent = (n: number, exponent: number) =>
  exponent > 0
    ? n * 10 ** exponent
    : exponent < 0
      ? n / 10 ** -exponent
      : n

// A float32 carries about 7 significant digits; more is noise.
const formatReal = (n: number) =>
  Number.isFinite(n) ? String(Number(n.toPrecision(7))) : String(n)

export const decodeModbusValue = (
  form: VariableForm,
  result: ModbusReadResult,
): DecodedValue => {
  const unit = form.measureUnit
  const exponentRaw = parseNumber(form.exponent)
  const exponent =
    exponentRaw != null && Number.isInteger(exponentRaw) ? exponentRaw : 0

  if (result.bits) {
    if (result.bits.length === 0) return note('Nessun bit ricevuto.')
    return { value: onOff(result.bits[0]) }
  }

  const words = result.registers ?? []
  const need = (n: number) =>
    words.length < n ? note(`Il formato richiede ${n} registri.`) : null

  switch (form.format) {
    case '':
      return note('Nessun formato: solo dati grezzi.')
    case 'WORD':
      return (
        need(1) ?? {
          value: withUnit(String(applyExponent(words[0], exponent)), unit),
        }
      )
    case 'BCD': {
      const missing = need(1)
      if (missing) return missing
      const n = bcd(words[0])
      return n == null
        ? note('Valore BCD non valido (cifra oltre 9).')
        : { value: withUnit(String(applyExponent(n, exponent)), unit) }
    }
    case 'BOOL': {
      const bitId = parseNumber(form.mmBitId)
      if (!isInt(bitId, 0, 15)) return note('Indica il bit ID (0–15).')
      return need(1) ?? { value: onOff(((words[0] >> bitId) & 1) === 1) }
    }
    case 'MARKER':
      return note('MARKER si legge solo da coil o input status.')
    case 'DWORD':
    case 'DWORD_Swap': {
      const missing = need(2)
      if (missing) return missing
      const [low, high] = words
      const n =
        form.format === 'DWORD' ? (high << 16) | low : (low << 16) | high
      return { value: withUnit(String(applyExponent(n, exponent)), unit) }
    }
    case 'REAL':
    case 'REAL_Swap': {
      const missing = need(2)
      if (missing) return missing
      const [low, high] = words
      const n = float32(
        form.format === 'REAL' ? (high << 16) | low : (low << 16) | high,
      )
      return { value: withUnit(formatReal(applyExponent(n, exponent)), unit) }
    }
    case 'STRING':
      return { value: JSON.stringify(ascii(words)) }
    case 'STRING_to_REAL': {
      const text = ascii(words).trim()
      const parsed = text === '' ? NaN : Number(text)
      const n = Number.isNaN(parsed) ? 0 : parsed
      return { value: withUnit(String(applyExponent(n, exponent)), unit) }
    }
    case 'ARRAY':
      return { value: `[${words.join(', ')}]` }
    default:
      return note(`Il formato ${form.format} non si decodifica da Modbus.`)
  }
}
