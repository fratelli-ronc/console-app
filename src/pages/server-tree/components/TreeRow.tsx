import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  ChevronRight,
  GripVertical,
  Lock,
  MoreHorizontal,
  Network,
  Server,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeServer } from '../data'
import { MoveMenu, type MoveTarget } from './MoveMenu'

const INDENT = 24
const BASE_PADDING = 8
// Icon is h-7/w-7 (28px); children indent from its center so the guide
// line appears to drop straight down from the central icon.
const CHILD_BASE_PADDING = BASE_PADDING + 32

interface TreeRowProps {
  server: TreeServer
  depth: number
  childCount: number
  isCentral: boolean
  isCollapsed: boolean
  isMoved: boolean
  dropDisabled: boolean
  menuOpen: boolean
  moveTargets: MoveTarget[]
  onToggle: () => void
  onMenuOpenChange: (open: boolean) => void
  onSelectParent: (parentId: string | null) => void
}

export const TreeRow: React.FC<TreeRowProps> = ({
  server,
  depth,
  childCount,
  isCentral,
  isCollapsed,
  isMoved,
  dropDisabled,
  menuOpen,
  moveTargets,
  onToggle,
  onMenuOpenChange,
  onSelectParent,
}) => {
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({ id: server.id, disabled: isCentral })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: server.id,
    disabled: dropDisabled,
  })

  return (
    <div ref={setDropRef} className="relative">
      <div
        ref={setDragRef}
        {...listeners}
        {...attributes}
        style={{
          paddingLeft:
            depth === 0
              ? BASE_PADDING
              : CHILD_BASE_PADDING +
                (depth - 1) * (depth > 1 ? INDENT * 2 : INDENT),
        }}
        className={cn(
          'relative flex h-11 items-center gap-2 rounded-lg pr-2 transition-colors outline-none',
          isCentral ? 'cursor-default' : 'cursor-grab',
          isOver
            ? 'bg-accent ring-[1.5px] ring-inset ring-primary'
            : menuOpen
              ? 'bg-muted'
              : 'hover:bg-muted',
          isDragging && 'opacity-45',
        )}
      >
        {depth > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 left-3"
            style={{
              width: depth * (depth > 1 ? INDENT * 2 : INDENT),
              backgroundImage:
                depth > 1
                  ? 'repeating-linear-gradient(to right, transparent 0 10px, color-mix(in oklch, var(--muted-foreground) 45%, transparent) 10px 11px, transparent 11px 48px)'
                  : 'repeating-linear-gradient(to right, transparent 0 10px, color-mix(in oklch, var(--muted-foreground) 45%, transparent) 10px 11px, transparent 11px 24px)',
            }}
          />
        )}

        {!isCentral && (
          <GripVertical
            size={14}
            className="shrink-0 text-muted-foreground/50"
          />
        )}

        {!isCentral && childCount > 0 && (
          <button
            onClick={onToggle}
            className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground hover:bg-border/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronRight
              size={15}
              className={cn(
                'transition-transform duration-100',
                !isCollapsed && 'rotate-90',
              )}
            />
          </button>
        )}

        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]',
            isCentral
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground',
            childCount == 0 && 'ml-1.5',
          )}
        >
          {isCentral ? <Network size={14} /> : <Server size={14} />}
        </span>

        <span className="truncate text-[13px] font-semibold text-foreground">
          {server.name}
        </span>

        {isCentral && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
            <Lock size={10} strokeWidth={2.5} />
            Centrale
          </span>
        )}

        {isMoved && (
          <span className="shrink-0 rounded-full bg-secondary/35 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            spostato
          </span>
        )}

        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {server.ip}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          {childCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {childCount} server
            </span>
          )}

          {!isCentral && (
            <MoveMenu
              open={menuOpen}
              onOpenChange={onMenuOpenChange}
              targets={moveTargets}
              onSelect={onSelectParent}
            >
              <button
                type="button"
                title="Sposta in…"
                className="flex h-6.5 w-6.5 items-center justify-center rounded-md text-muted-foreground hover:bg-border/60 hover:text-foreground transition-colors cursor-pointer"
              >
                <MoreHorizontal size={15} />
              </button>
            </MoveMenu>
          )}
        </span>
      </div>
    </div>
  )
}
