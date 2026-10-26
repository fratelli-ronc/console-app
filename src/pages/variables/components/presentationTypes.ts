import type { VariablePresentation } from '@/client'

// The presentation entry types the station apps understand, with the keys
// each one carries. The shapes mirror the legacy station configs exactly
// ("back-color", buttonSX/buttonDX, nested action / feedback objects…), as
// those apps still read them that way. Keys the editor has no field for
// are left untouched.

export type PresentationFieldKind = 'text' | 'number' | 'color'

export interface PresentationField {
  path: string[]
  label: string
  kind: PresentationFieldKind
}

export interface PresentationFieldGroup {
  // Untitled groups hold the entry's own top-level fields.
  title?: string
  fields: PresentationField[]
}

export interface PresentationTypeSpec {
  label: string
  description: string
  groups: PresentationFieldGroup[]
  template: () => VariablePresentation
}

const text = (path: string[], label: string): PresentationField => ({
  path,
  label,
  kind: 'text',
})
const num = (path: string[], label: string): PresentationField => ({
  path,
  label,
  kind: 'number',
})
const color = (path: string[], label: string): PresentationField => ({
  path,
  label,
  kind: 'color',
})

// The keys every reference to another variable carries besides its id:
// where that variable lives and what it is - shown next to the command in
// the station apps.
const refContext = (base: string[]): PresentationField[] => [
  text([...base, 'station'], 'Stazione'),
  text([...base, 'group'], 'Gruppo'),
  text([...base, 'classType'], 'Classe'),
  text([...base, 'description'], 'Descrizione'),
]

const emptyRef = () => ({
  station: null,
  group: null,
  classType: null,
  description: null,
})

export const PRESENTATION_TYPES: Record<string, PresentationTypeSpec> = {
  TEXT_STATUS: {
    label: 'Stato testuale',
    description:
      'Testo e colori mostrati quando il valore soddisfa la condizione.',
    groups: [
      {
        fields: [
          text(['text'], 'Testo'),
          text(['condition'], 'Condizione'),
          color(['color'], 'Colore testo'),
          color(['back-color'], 'Colore sfondo'),
        ],
      },
    ],
    template: () => ({
      type: 'TEXT_STATUS',
      text: '',
      condition: '',
      color: 'black',
      'back-color': '#E4E4E4',
    }),
  },

  UP_DOWN_SLIDE: {
    label: 'Preset (slider)',
    description: 'Imposta un valore tra minimo e massimo con passo fisso.',
    groups: [
      {
        fields: [
          num(['minPresetValue'], 'Minimo'),
          num(['maxPresetValue'], 'Massimo'),
          num(['step'], 'Passo'),
          text(['buttonSX'], 'Pulsante sinistro'),
          text(['buttonDX'], 'Pulsante destro'),
        ],
      },
      {
        title: 'Retroazione',
        fields: [
          text(['feedback', 'label'], 'Etichetta'),
          num(['feedback', 'varIdRef'], 'ID variabile'),
        ],
      },
    ],
    template: () => ({
      type: 'UP_DOWN_SLIDE',
      minPresetValue: null,
      maxPresetValue: null,
      step: null,
      buttonSX: 'DEC',
      buttonDX: 'INC',
      feedback: { label: null, varIdRef: null },
    }),
  },

  SINGLE_COMMAND: {
    label: 'Comando singolo',
    description: 'Un pulsante che scrive sulla variabile.',
    groups: [{ fields: [text(['labelButton'], 'Etichetta pulsante')] }],
    template: () => ({
      type: 'SINGLE_COMMAND',
      labelButton: 'Esegui',
      text: null,
      condition: null,
    }),
  },

  DUAL_COMMAND: {
    label: 'Comando doppio',
    description:
      'Due pulsanti che scrivono su altre variabili, con retroazione.',
    groups: (['buttonSX', 'buttonDX'] as const)
      .map((side): PresentationFieldGroup => ({
        title: side === 'buttonSX' ? 'Pulsante sinistro' : 'Pulsante destro',
        fields: [
          text([side, 'label'], 'Etichetta'),
          num([side, 'action', 'varIdRef'], 'ID variabile'),
          num([side, 'action', 'writeValue'], 'Valore scritto'),
          ...refContext([side]),
        ],
      }))
      .concat({
        title: 'Retroazione',
        fields: [
          text(['feedback', 'label'], 'Etichetta'),
          num(['feedback', 'varIdRef'], 'ID variabile'),
          ...refContext(['feedback']),
        ],
      }),
    template: () => ({
      type: 'DUAL_COMMAND',
      buttonSX: {
        label: null,
        action: { varIdRef: null, writeValue: 1 },
        ...emptyRef(),
      },
      buttonDX: {
        label: null,
        action: { varIdRef: null, writeValue: 1 },
        ...emptyRef(),
      },
      feedback: { label: null, varIdRef: null, ...emptyRef() },
      text: null,
      condition: null,
    }),
  },

  SLIDE_TOGGLE: {
    label: 'Interruttore',
    description:
      'Scrive un valore per acceso e uno per spento, con lettura e retroazione.',
    groups: [
      {
        title: 'Scrittura acceso',
        fields: [
          num(['writeOn', 'varIdRef'], 'ID variabile'),
          num(['writeOn', 'writeValue'], 'Valore scritto'),
          ...refContext(['writeOn']),
        ],
      },
      {
        title: 'Scrittura spento',
        fields: [
          num(['writeOff', 'varIdRef'], 'ID variabile'),
          num(['writeOff', 'writeValue'], 'Valore scritto'),
          ...refContext(['writeOff']),
        ],
      },
      {
        title: 'Lettura',
        fields: [
          num(['read', 'varIdRef'], 'ID variabile'),
          ...refContext(['read']),
        ],
      },
      {
        title: 'Retroazione',
        fields: [
          text(['feedback', 'label'], 'Etichetta'),
          num(['feedback', 'varIdRef'], 'ID variabile'),
          ...refContext(['feedback']),
        ],
      },
    ],
    template: () => ({
      type: 'SLIDE_TOGGLE',
      writeOn: { varIdRef: null, writeValue: 1, ...emptyRef() },
      writeOff: { varIdRef: null, writeValue: 0, ...emptyRef() },
      read: { varIdRef: null, ...emptyRef() },
      feedback: { label: null, varIdRef: null, ...emptyRef() },
      text: null,
      condition: null,
    }),
  },

  ENABLER: {
    label: 'Abilitazione',
    description:
      "Abilita il comando solo quando un'altra variabile soddisfa la condizione.",
    groups: [
      {
        fields: [
          num(['varIdRef'], 'ID variabile'),
          text(['enabledWhen'], 'Abilitato quando'),
          ...refContext([]),
        ],
      },
    ],
    template: () => ({
      type: 'ENABLER',
      varIdRef: null,
      enabledWhen: 'x=1',
      ...emptyRef(),
      text: null,
      condition: null,
    }),
  },
}

export const PRESENTATION_TYPE_OPTIONS = Object.entries(PRESENTATION_TYPES).map(
  ([value, spec]) => ({ value, label: spec.label }),
)

export const getAtPath = (entry: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (node, key) =>
      node && typeof node === 'object'
        ? (node as Record<string, unknown>)[key]
        : undefined,
    entry,
  )

// A copy of entry with value at path, creating intermediate objects as
// needed. Everything else is shared, untouched.
export const setAtPath = (
  entry: VariablePresentation,
  path: string[],
  value: unknown,
): VariablePresentation => {
  const [key, ...rest] = path
  if (rest.length === 0) return { ...entry, [key]: value }
  const child = entry[key]
  const base =
    child && typeof child === 'object' && !Array.isArray(child)
      ? (child as VariablePresentation)
      : {}
  return { ...entry, [key]: setAtPath(base, rest, value) }
}
