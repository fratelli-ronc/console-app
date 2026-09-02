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
