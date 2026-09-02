import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnsavedChangesPrompt } from '../ConfirmDialog'
import { FilledButton } from '../FilledButton'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../HoverCard'
import { OutlinedButton } from '../OutlinedButton'
import { TextButton } from '../TextButton'
import {
  EditTable,
  type EditTableColumn,
  type EditTableHandle,
} from './EditTable'
import type {
  EditTableChanges,
  EditTableSaveFn,
  RowKey,
} from './useEditTable'

export type { EditTableChanges, EditTableColumn, EditTableSaveFn, RowKey }

interface EditTablePanelProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: EditTableColumn<T>[]
  fetchFn: () => Promise<T[]>
  // Receives only the touched rows; return false to keep the table dirty
  // (e.g. when the save request failed).
  onSave?: EditTableSaveFn<T>
  rowKey?: (row: T) => RowKey | null | undefined
  // Client-side view filter: non-matching rows are hidden but kept in state
  // (edits survive filtering, and changing it never triggers a refetch).
  filterFn?: (row: T) => boolean
  className?: string
  filters?: React.ReactNode
  // When set, an add button appends newRow() to the grid.
  newRow?: () => T
  addLabel?: string
  addDisabled?: boolean
  // When the add button is disabled, hovering it reveals this text in a
  // popover explaining why.
  disabledReason?: string
  // Renders a per-row trash button.
  deletable?: boolean
  emptyMessage?: React.ReactNode
  onDirtyChange?: (isDirty: boolean) => void
}

export function EditTablePanel<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  columns,
  fetchFn,
  onSave,
  rowKey,
  filterFn,
  className,
  filters,
  newRow,
  addLabel = 'Aggiungi',
  addDisabled = false,
  disabledReason,
  deletable = false,
  emptyMessage,
  onDirtyChange,
}: EditTablePanelProps<T>) {
  const tableRef = useRef<EditTableHandle<T>>(null)
  const [isDirty, setIsDirty] = useState(false)

  const { unsavedChangesDialog } = useUnsavedChangesPrompt(isDirty)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        tableRef.current?.save()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={cn('h-full flex flex-col gap-6', className)}>
      <div className="flex items-start gap-3">
        {filters}

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {newRow &&
            (() => {
              const button = (
                <OutlinedButton
                  type="button"
                  disabled={addDisabled}
                  onClick={() => tableRef.current?.addRow(newRow())}
                  className="inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  {addLabel}
                </OutlinedButton>
              )

              if (!addDisabled || !disabledReason) return button

              return (
                <HoverCard openDelay={100}>
                  <HoverCardTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      {button}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto max-w-xs p-3">
                    <p className="text-xs text-muted-foreground">
                      {disabledReason}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )
            })()}

          <TextButton
            type="button"
            disabled={!isDirty}
            onClick={() => tableRef.current?.discard()}
          >
            Annulla
          </TextButton>

          <FilledButton
            type="button"
            disabled={!isDirty}
            onClick={() => tableRef.current?.save()}
          >
            Salva
          </FilledButton>
        </div>
      </div>

      <EditTable
        ref={tableRef}
        className="flex-1 min-h-0"
        columns={columns}
        fetchFn={fetchFn}
        onSave={onSave}
        rowKey={rowKey}
        filterFn={filterFn}
        deletable={deletable}
        emptyMessage={emptyMessage}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty)
          onDirtyChange?.(dirty)
        }}
      />

      {unsavedChangesDialog}
    </div>
  )
}
