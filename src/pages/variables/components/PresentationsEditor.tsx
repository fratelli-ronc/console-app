import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Braces, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  OutlinedButton,
} from '@/components'
import type { VariablePresentation } from '@/client'
import { cn } from '@/lib/utils'
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from './FormFields'
import {
  PRESENTATION_TYPES,
  PRESENTATION_TYPE_OPTIONS,
  getAtPath,
  setAtPath,
  type PresentationField,
} from './presentationTypes'

interface PresentationsEditorProps {
  value: VariablePresentation[]
  onChange: (value: VariablePresentation[]) => void
}

let nextKey = 0
const newKey = () => ++nextKey

export const PresentationsEditor: React.FC<PresentationsEditorProps> = ({
  value,
  onChange,
}) => {
  // Entries have no ids of their own; these keep each card's local state
  // (half-typed numbers, JSON text) attached to it across reorders.
  const [keys, setKeys] = useState<number[]>(() => value.map(newKey))
  const [rawMode, setRawMode] = useState<Set<number>>(new Set())

  // The list was replaced from outside (a reload): start over.
  useEffect(() => {
    if (keys.length !== value.length) setKeys(value.map(newKey))
  }, [keys.length, value])

  const update = (index: number, entry: VariablePresentation) =>
    onChange(value.map((e, i) => (i === index ? entry : e)))

  const add = (type: string) => {
    onChange([...value, PRESENTATION_TYPES[type].template()])
    setKeys((prev) => [...prev, newKey()])
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    setKeys((prev) => prev.filter((_, i) => i !== index))
  }

  const move = (index: number, by: -1 | 1) => {
    const to = index + by
    if (to < 0 || to >= value.length) return
    const swap = <T,>(list: T[]) => {
      const copy = [...list]
      ;[copy[index], copy[to]] = [copy[to], copy[index]]
      return copy
    }
    onChange(swap(value))
    setKeys(swap)
  }

  const toggleRaw = (key: number) =>
    setRawMode((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">Nessuna presentazione.</p>
      )}

      {value.map((entry, index) => {
        const key = keys[index] ?? index
        const type = typeof entry.type === 'string' ? entry.type : ''
        const spec = PRESENTATION_TYPES[type]
        const raw = !spec || rawMode.has(key)

        return (
          <div
            key={key}
            className="rounded-lg border border-border bg-background p-3 flex flex-col gap-3"
          >
            <div className="flex items-end gap-2">
              <SelectField
                label="Tipo"
                className="w-56"
                value={type}
                options={PRESENTATION_TYPE_OPTIONS}
                onChange={(next) => {
                  if (next !== type)
                    update(index, PRESENTATION_TYPES[next].template())
                }}
              />
              {type === 'TEXT_STATUS' && <TextStatusPreview entry={entry} />}
              <div className="ml-auto flex items-center gap-1">
                <IconButton
                  label="Sposta su"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={14} />
                </IconButton>
                <IconButton
                  label="Sposta giù"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={14} />
                </IconButton>
                <IconButton
                  label={raw ? 'Modifica campi' : 'Modifica JSON'}
                  active={raw}
                  disabled={!spec}
                  onClick={() => toggleRaw(key)}
                >
                  <Braces size={14} />
                </IconButton>
                <IconButton
                  label="Elimina"
                  destructive
                  onClick={() => remove(index)}
                >
                  <Trash2 size={14} />
                </IconButton>
              </div>
            </div>

            {raw ? (
              <JsonEntryEditor
                entry={entry}
                onChange={(next) => update(index, next)}
              />
            ) : (
              spec.groups.map((group, g) => (
                <fieldset key={g} className="flex flex-col gap-2">
                  {group.title && (
                    <legend className="text-xs font-semibold text-foreground mb-2">
                      {group.title}
                    </legend>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-2">
                    {group.fields.map((field) => (
                      <PresentationFieldInput
                        key={field.path.join('.')}
                        field={field}
                        value={getAtPath(entry, field.path)}
                        onChange={(next) =>
                          update(index, setAtPath(entry, field.path, next))
                        }
                      />
                    ))}
                  </div>
                </fieldset>
              ))
            )}
          </div>
        )
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <OutlinedButton
            type="button"
            className="self-start inline-flex items-center gap-2"
          >
            <Plus size={14} />
            Aggiungi presentazione
          </OutlinedButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {Object.entries(PRESENTATION_TYPES).map(([type, spec]) => (
            <DropdownMenuItem
              key={type}
              onClick={() => add(type)}
              className="flex-col items-start gap-0.5"
            >
              <span>{spec.label}</span>
              <span className="text-xs text-muted-foreground">
                {spec.description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface PresentationFieldInputProps {
  field: PresentationField
  value: unknown
  onChange: (value: unknown) => void
}

// Blank text is stored as null, the way the legacy configs write an unset
// key.
const PresentationFieldInput: React.FC<PresentationFieldInputProps> = ({
  field,
  value,
  onChange,
}) => {
  if (field.kind === 'number')
    return (
      <NumberField
        label={field.label}
        value={typeof value === 'number' ? value : null}
        onChange={onChange}
      />
    )

  const textValue = value == null ? '' : String(value)
  const set = (next: string) => onChange(next === '' ? null : next)

  if (field.kind === 'color')
    return <ColorField label={field.label} value={textValue} onChange={set} />

  return <TextField label={field.label} value={textValue} onChange={set} />
}

// Colors are free text ("black", "#F09E94"): a swatch shows what the
// station apps will render.
const ColorField: React.FC<{
  label: string
  value: string
  onChange: (value: string) => void
}> = ({ label, value, onChange }) => (
  <div className="relative">
    <TextField label={label} value={value} onChange={onChange} />
    <span
      aria-hidden
      className="absolute right-2 bottom-2 size-5 rounded border border-border"
      style={{ background: value || 'transparent' }}
    />
  </div>
)

const TextStatusPreview: React.FC<{ entry: VariablePresentation }> = ({
  entry,
}) => {
  const text = getAtPath(entry, ['text'])
  const fg = getAtPath(entry, ['color'])
  const bg = getAtPath(entry, ['back-color'])
  return (
    <span
      className="h-9 min-w-24 px-3 inline-flex items-center justify-center rounded-lg border border-border text-sm truncate"
      style={{
        color: typeof fg === 'string' ? fg : undefined,
        background: typeof bg === 'string' ? bg : undefined,
      }}
    >
      {typeof text === 'string' && text ? text : 'Anteprima'}
    </span>
  )
}

// The whole entry as JSON, for keys the fields don't cover or types the
// editor doesn't know. Only text that parses to an object is applied.
const JsonEntryEditor: React.FC<{
  entry: VariablePresentation
  onChange: (entry: VariablePresentation) => void
}> = ({ entry, onChange }) => {
  const serialized = JSON.stringify(entry, null, 2)
  const [text, setText] = useState(serialized)
  const [error, setError] = useState<string | null>(null)

  // Follow outside changes unless the text already says the same thing.
  useEffect(() => {
    setText((prev) => {
      try {
        if (JSON.stringify(JSON.parse(prev)) === JSON.stringify(entry))
          return prev
      } catch {
        // half-typed: replaced below only if the entry really changed
      }
      return serialized
    })
  }, [entry, serialized])

  return (
    <TextAreaField
      label="JSON"
      mono
      rows={Math.min(16, serialized.split('\n').length + 1)}
      value={text}
      error={error}
      onChange={(next) => {
        setText(next)
        try {
          const parsed = JSON.parse(next)
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            setError('Deve essere un oggetto JSON.')
            return
          }
          setError(null)
          onChange(parsed)
        } catch {
          setError('JSON non valido: le modifiche non sono applicate.')
        }
      }}
    />
  )
}

const IconButton: React.FC<{
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  destructive?: boolean
  children: React.ReactNode
}> = ({ label, onClick, disabled, active, destructive, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'size-8 inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors cursor-pointer',
      'hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none',
      active && 'bg-muted text-foreground',
      destructive && 'hover:bg-destructive/10 hover:text-destructive',
    )}
  >
    {children}
  </button>
)
