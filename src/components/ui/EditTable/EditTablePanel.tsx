import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilledButton } from '../FilledButton'
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
  FetchParams,
  FetchResult,
  RowKey,
} from './useEditTable'

export type {
  EditTableChanges,
  EditTableColumn,
  EditTableSaveFn,
  FetchParams,
  FetchResult,
  RowKey,
}

interface EditTablePanelProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: EditTableColumn<T>[]
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>
  // Receives only the touched rows; return false to keep the table dirty
  // (e.g. when the save request failed).
  onSave?: EditTableSaveFn<T>
  rowKey?: (row: T) => RowKey | null | undefined
  pageSize?: number
  className?: string
  filters?: React.ReactNode
  // When set, an add button appends newRow() to the grid.
  newRow?: () => T
  addLabel?: string
  addDisabled?: boolean
  // Renders a per-row trash button.
  deletable?: boolean
  onDirtyChange?: (isDirty: boolean) => void
}

export function EditTablePanel<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  columns,
  fetchFn,
  onSave,
  rowKey,
  pageSize,
  className,
  filters,
  newRow,
  addLabel = 'Aggiungi',
  addDisabled = false,
  deletable = false,
  onDirtyChange,
}: EditTablePanelProps<T>) {
  const tableRef = useRef<EditTableHandle<T>>(null)
  const [isDirty, setIsDirty] = useState(false)

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
          {newRow && (
            <OutlinedButton
              type="button"
              disabled={addDisabled}
              onClick={() => tableRef.current?.addRow(newRow())}
              className="inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              {addLabel}
            </OutlinedButton>
          )}

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
        deletable={deletable}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty)
          onDirtyChange?.(dirty)
        }}
        pageSize={pageSize}
      />
    </div>
  )
}
