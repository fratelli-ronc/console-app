import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverAnchor, PopoverContent } from '../Popover'
import type { CellSelectOption } from './CellSelect'

interface SearchableCellSelectProps {
  value: string
  options: CellSelectOption[]
  onCommit: (value: string) => void
  onCancel: () => void
}

// Drop-in replacement for CellSelect with a type-to-filter input, for
// columns whose option list is too long to scan (see EditTableColumn.searchable).
// Rendered in a portaled Popover so the list is never clipped by the grid's
// scroll container.
export const SearchableCellSelect: React.FC<SearchableCellSelectProps> = ({
  value,
  options,
  onCommit,
  onCancel,
}) => {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      options.findIndex((o) => o.value === value),
      0,
    ),
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  // Keep the highlight in range as the filtered list shrinks.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(filtered.length - 1, 0)))
  }, [filtered.length])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const currentLabel = options.find((o) => o.value === value)?.label ?? ''

  const commitActive = () => {
    const opt = filtered[activeIndex]
    if (opt) onCommit(opt.value)
    else onCancel()
  }

  return (
    <Popover open onOpenChange={(next) => !next && onCancel()}>
      <PopoverAnchor asChild>
        <div className="flex items-center justify-between gap-2 text-foreground text-sm select-none">
          <span className="truncate">{currentLabel}</span>
          <ChevronDown size={13} className="shrink-0 text-muted-foreground" />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        alignOffset={-16}
        sideOffset={16}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-[calc(var(--radix-popover-trigger-width)+32px)] min-w-50 rounded-lg p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <SearchIcon size={14} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Cerca…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onKeyDown={(e) => {
              switch (e.key) {
                case 'ArrowDown':
                  e.preventDefault()
                  setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
                  break
                case 'ArrowUp':
                  e.preventDefault()
                  setActiveIndex((i) => Math.max(i - 1, 0))
                  break
                case 'Enter':
                case 'Tab':
                  e.preventDefault()
                  commitActive()
                  break
                case 'Escape':
                  e.preventDefault()
                  onCancel()
                  break
              }
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-placeholder"
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Nessun risultato.
            </p>
          ) : (
            filtered.map((opt, i) => (
              <button
                key={opt.value}
                ref={i === activeIndex ? activeRef : undefined}
                type="button"
                onMouseMove={() => setActiveIndex(i)}
                onClick={() => onCommit(opt.value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm cursor-pointer transition-colors',
                  i === activeIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'text-popover-foreground',
                )}
              >
                <Check
                  size={13}
                  className={cn(
                    'shrink-0 transition-opacity',
                    opt.value === value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
