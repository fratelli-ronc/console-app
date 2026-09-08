// Option lists mirroring the database check constraints on group_variables
// (see console-api models/variable_model.go). Keep the two in sync.

export const VARIABLE_CLASS_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'analog', label: 'Analogica' },
  { value: 'digital', label: 'Digitale' },
  { value: 'preset', label: 'Preset' },
  { value: 'command', label: 'Comando' },
]

export const VARIABLE_FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: 'ARRAY', label: 'ARRAY' },
  { value: 'BCD', label: 'BCD' },
  { value: 'BOOL', label: 'BOOL' },
  { value: 'DWORD', label: 'DWORD' },
  { value: 'DWORD_Swap', label: 'DWORD Swap' },
  { value: 'JPEG', label: 'JPEG' },
  { value: 'JSON', label: 'JSON' },
  { value: 'MARKER', label: 'MARKER' },
  { value: 'REAL', label: 'REAL' },
  { value: 'REAL_Swap', label: 'REAL Swap' },
  { value: 'STRING', label: 'STRING' },
  { value: 'STRING_to_REAL', label: 'STRING → REAL' },
  { value: 'WORD', label: 'WORD' },
]

export const VARIABLE_DRIVER_OPTIONS: { value: string; label: string }[] = [
  { value: 'internalVar', label: 'Variabile interna' },
  { value: 'mx3-config', label: 'MX3 config' },
  { value: 'mx3-memev', label: 'MX3 memev' },
  { value: 'mx3-memev-ipg1a', label: 'MX3 memev IPG1A' },
  { value: 'mx3-memrce', label: 'MX3 memrce' },
  { value: 'mx3-oscillo', label: 'MX3 oscillo' },
  { value: 'python', label: 'Python' },
  { value: 'varMirroring', label: 'Var mirroring' },
]

// ── History sub-record ──────────────────────────────────────────────────────

export const VARIABLE_HISTORY_TRIGGER_TYPE_OPTIONS: {
  value: string
  label: string
}[] = [
  { value: 'onChange', label: 'On Change' },
  { value: 'onDemand', label: 'On Demand' },
  { value: 'onInterval', label: 'On Interval' },
]

export const VARIABLE_HISTORY_AGGREGATION_POLICY_OPTIONS: {
  value: string
  label: string
}[] = [
  { value: 'none', label: 'Nessuna' },
  { value: 'average_30', label: 'Media 30 min' },
  { value: 'average_60', label: 'Media 60 min' },
  { value: 'dailySum', label: 'Somma giornaliera' },
  { value: 'dailySumPower', label: 'Somma giornaliera (potenza)' },
]

// ── Memory-map sub-record ───────────────────────────────────────────────────

export const VARIABLE_MEMORY_MAP_FUNC_TYPE_OPTIONS: {
  value: string
  label: string
}[] = [
  { value: 'FUNC_MB_READ_COIL_STATUS', label: 'Read Coil Status' },
  { value: 'FUNC_MB_READ_HOLDING_REGISTERS', label: 'Read Holding Registers' },
  { value: 'FUNC_MB_READ_INPUT_REGISTERS', label: 'Read Input Registers' },
  { value: 'FUNC_MB_READ_INPUT_STATUS', label: 'Read Input Status' },
  { value: 'FUNC_MB_READ_SINGLE_REGISTER', label: 'Read Single Register' },
]

export const VARIABLE_MEMORY_MAP_FUNC_TYPE_WRITE_OPTIONS: {
  value: string
  label: string
}[] = [
  { value: 'FUNC_MB_FORCE_SINGLE_COIL', label: 'Force Single Coil' },
  { value: 'FUNC_MB_FORCE_MULTIPLE_COILS', label: 'Force Multiple Coils' },
  {
    value: 'FUNC_MB_PRESET_MULTIPLE_REGISTERS',
    label: 'Preset Multiple Registers',
  },
  { value: 'FUNC_MB_PRESET_SINGLE_REGISTER', label: 'Preset Single Register' },
]

// ── Image sub-record ────────────────────────────────────────────────────────

export const VARIABLE_IMAGE_AUTH_TYPE_OPTIONS: {
  value: string
  label: string
}[] = [{ value: 'V2_DIGEST_AUTH', label: 'V2 Digest Auth' }]
