import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { it } from 'react-day-picker/locale'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

// Dates go in and out as "YYYY-MM-DD", read in local time.
const parse = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const pad = (n: number) => String(n).padStart(2, '0')

const serialize = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// "YYYY-MM-DD" as the user reads it: "22/10/2026".
const display = (value: string) => {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

interface DatePickerProps {
  // "YYYY-MM-DD", or '' for none.
  value: string
  onChange: (value: string) => void
  placeholder?: string
  // Bounds, as "YYYY-MM-DD"; days outside them can't be picked.
  min?: string
  max?: string
  className?: string
}

// A date field that shows the date day first and opens a calendar, in
// Italian. Blank until a date is picked; the cross clears it.
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'gg/mm/aaaa',
  min,
  max,
  className,
}) => {
  const [open, setOpen] = useState(false)
  const selected = value ? parse(value) : undefined

  const disabled = [
    ...(min ? [{ before: parse(min) }] : []),
    ...(max ? [{ after: parse(max) }] : []),
  ]

  return (
    <div className={cn('relative w-40', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm transition-colors outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              value ? 'pr-8 text-foreground' : 'text-placeholder',
            )}
          >
            <CalendarDays size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">
              {value ? display(value) : placeholder}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-3">
          <DayPicker
            mode="single"
            locale={it}
            selected={selected}
            defaultMonth={selected}
            disabled={disabled}
            onSelect={(date) => {
              if (date) onChange(serialize(date))
              setOpen(false)
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                ),
            }}
            classNames={{
              months: 'relative',
              month_caption: 'flex h-8 items-center justify-center',
              caption_label: 'text-sm font-medium text-foreground capitalize',
              nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
              button_previous:
                'flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50',
              button_next:
                'flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50',
              month_grid: 'mt-2 border-collapse',
              weekday:
                'size-9 text-[0.7rem] font-normal text-muted-foreground capitalize',
              day: 'size-9 p-0 text-center text-sm',
              day_button:
                'size-9 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:pointer-events-none',
              today:
                '[&>button]:font-semibold [&:not([data-selected])>button]:text-primary',
              selected:
                '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
              outside: '[&>button]:text-muted-foreground/50',
              disabled: '[&>button]:text-muted-foreground/40',
              hidden: 'invisible',
            }}
          />
        </PopoverContent>
      </Popover>

      {value && (
        <button
          type="button"
          aria-label="Cancella data"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
