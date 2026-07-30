import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components'
import { cn } from '@/lib/utils'

export interface MoveTarget {
  id: string
  name: string
  ip: string
  depth: number
  isCurrent: boolean
}

interface MoveMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targets: MoveTarget[]
  // null = clicked the current parent: close the menu without moving
  onSelect: (parentId: string | null) => void
  children: React.ReactNode
}

export const MoveMenu: React.FC<MoveMenuProps> = ({
  open,
  onOpenChange,
  targets,
  onSelect,
  children,
}) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{children}</PopoverTrigger>

    <PopoverContent
      side="bottom"
      align="end"
      collisionPadding={8}
      className="w-75 overflow-hidden rounded-[10px] p-0 shadow-lg"
    >
      <MoveMenuContent targets={targets} onSelect={onSelect} />
    </PopoverContent>
  </Popover>
)

// Separate component so the search query resets every time the menu opens
const MoveMenuContent: React.FC<Pick<MoveMenuProps, 'targets' | 'onSelect'>> = ({
  targets,
  onSelect,
}) => {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = targets.filter(
    (t) => !q || t.name.toLowerCase().includes(q) || t.ip.includes(q),
  )

  return (
    <>
      <div className="border-b border-border px-3 pt-2.5 pb-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sposta sotto…
        </p>

        <input
          type="text"
          placeholder="Cerca server…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7.5 w-full rounded-md border border-border px-2.5 text-[13px] outline-none focus:border-primary transition-colors"
        />
      </div>

      <div
        className="overflow-y-auto p-1.5"
        style={{
          maxHeight:
            'min(230px, calc(var(--radix-popover-content-available-height) - 80px))',
        }}
      >
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.isCurrent ? null : t.id)}
            style={{ paddingLeft: 10 + (q ? 0 : t.depth * 14) }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md py-1.75 pr-2.5 text-left transition-colors',
              t.isCurrent
                ? 'cursor-default opacity-55'
                : 'cursor-pointer hover:bg-muted',
            )}
          >
            <span className="truncate text-[13px] font-medium text-foreground">
              {t.name}
            </span>

            {t.isCurrent && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                padre attuale
              </span>
            )}

            <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
              {t.ip}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
