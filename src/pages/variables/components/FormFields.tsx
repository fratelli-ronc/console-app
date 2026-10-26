import { useEffect, useId, useState } from 'react'
import {
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components'
import { cn } from '@/lib/utils'

// Compact labelled inputs for the variable edit dialog, which packs far more
// fields than the app's single-column forms.

const INPUT =
  'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-placeholder outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed'

interface FieldShellProps {
  id: string
  label: string
  hint?: React.ReactNode
  error?: string | null
  className?: string
  children: React.ReactNode
}

const FieldShell: React.FC<FieldShellProps> = ({
  id,
  label,
  hint,
  error,
  className,
  children,
}) => (
  <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-destructive">{error}</p>
    ) : (
      hint && <p className="text-xs text-muted-foreground">{hint}</p>
    )}
  </div>
)

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password'
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  disabled?: boolean
  hint?: React.ReactNode
  error?: string | null
  className?: string
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  disabled,
  hint,
  error,
  className,
}) => {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(INPUT, error && 'border-destructive')}
      />
    </FieldShell>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  mono?: boolean
  error?: string | null
  className?: string
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  rows = 3,
  mono,
  error,
  className,
}) => {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} className={className}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={cn(
          INPUT,
          'h-auto py-2 resize-y',
          mono && 'font-mono text-xs',
          error && 'border-destructive',
        )}
      />
    </FieldShell>
  )
}

// Parses what a user typed as a number, accepting a decimal comma ("2,7").
// Blank is null; anything unparseable is NaN.
export const parseNumber = (raw: string): number | null => {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  return Number(trimmed.replace(',', '.'))
}

interface NumberFieldProps {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  className?: string
}

// A number held as a number, not a string (presentation entries store
// numbers). It keeps its own text so half-typed values like "0," or "-"
// survive re-renders, and only reports values that parse.
export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  className,
}) => {
  const [text, setText] = useState(value == null ? '' : String(value))

  // Follow outside changes (another entry type, a JSON edit) without
  // clobbering what is being typed.
  useEffect(() => {
    setText((prev) => {
      const parsed = parseNumber(prev)
      return parsed === value || (parsed !== null && Number.isNaN(parsed))
        ? prev
        : value == null
          ? ''
          : String(value)
    })
  }, [value])

  const parsed = parseNumber(text)
  const invalid = parsed !== null && Number.isNaN(parsed)

  return (
    <TextField
      label={label}
      value={text}
      inputMode="decimal"
      error={invalid ? 'Numero non valido' : null}
      className={className}
      onChange={(next) => {
        setText(next)
        const n = parseNumber(next)
        if (n === null || !Number.isNaN(n)) onChange(n)
      }}
    />
  )
}

export interface FieldOption {
  value: string
  label: string
}

// Radix Select can't carry an empty-string value, so "none" travels as a
// sentinel.
const NONE = '__none__'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: FieldOption[]
  // Offers a blank choice with this label.
  noneLabel?: string
  hint?: React.ReactNode
  className?: string
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  noneLabel,
  hint,
  className,
}) => {
  const id = useId()
  // A stored value the option list doesn't know (legacy data) is still
  // shown rather than silently replaced.
  const all =
    value && !options.some((opt) => opt.value === value)
      ? [...options, { value, label: value }]
      : options

  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <Select
        value={value === '' ? NONE : value}
        onValueChange={(next) => onChange(next === NONE ? '' : next)}
      >
        <SelectTrigger id={id} className="h-9 w-full">
          <SelectValue placeholder={noneLabel ?? '—'} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel !== undefined && (
            <SelectItem value={NONE}>{noneLabel}</SelectItem>
          )}
          {all.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

interface CheckFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export const CheckField: React.FC<CheckFieldProps> = ({
  label,
  checked,
  onChange,
}) => {
  const id = useId()
  return (
    <div className="pt-5 h-full flex flex-col justify-center">
      <label
        htmlFor={id}
        className="flex items-center gap-2 h-9 text-sm text-foreground cursor-pointer select-none"
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(state) => onChange(state === true)}
        />
        {label}
      </label>
    </div>
  )
}

interface SectionProps {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  action,
  children,
}) => (
  <section className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
)

// The field grid inside a section: two columns, three on wide dialogs.
export const FieldGrid: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div
    className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3',
      className,
    )}
  >
    {children}
  </div>
)
