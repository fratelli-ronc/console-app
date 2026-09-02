import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CellSelectOption {
  value: string
  label: string
}

interface CellSelectProps {
  value: string
  options: CellSelectOption[]
  onCommit: (value: string) => void
  onCancel: () => void
}

export const CellSelect: React.FC<CellSelectProps> = ({
  value,
  options,
  onCommit,
  onCancel,
}) => {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      options.findIndex((o) => o.value === value),
      0,
    ),
  )
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.focus()
  }, [])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onCancel()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onCancel])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        e.stopPropagation()
        onCommit(options[activeIndex].value)
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        onCancel()
        break
    }
  }

  const currentLabel = options.find((o) => o.value === value)?.label ?? value

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between gap-2 text-foreground text-sm select-none">
        <span>{currentLabel}</span>
        <ChevronDown size={13} className="shrink-0 text-muted-foreground" />
      </div>

      <ul
        ref={listRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="absolute -left-4 top-[calc(100%+12px)] mt-1 z-50 w-[calc(100%+32px)] min-w-50 bg-popover border border-border rounded-lg shadow-md py-1 outline-none"
      >
        {options.map((option, i) => (
          <li
            key={option.value}
            onPointerDown={(e) => {
              e.preventDefault()
              onCommit(option.value)
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors',
              i === activeIndex
                ? 'bg-accent text-accent-foreground'
                : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Check
              size={13}
              className={cn(
                'shrink-0 transition-opacity',
                option.value === value ? 'opacity-100' : 'opacity-0',
              )}
            />
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
