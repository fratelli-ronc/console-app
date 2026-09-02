import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'
import { useUnsavedChangesPrompt } from '../ConfirmDialog'
import { FilledButton } from '../FilledButton'
import { TextButton } from '../TextButton'
import {
  EditTable,
  type EditTableColumn,
  type EditTableHandle,
} from './EditTable'
import type { EditTableChanges, EditTableSaveFn, RowKey } from './useEditTable'

export type { EditTableChanges, EditTableColumn, EditTableSaveFn, RowKey }

export interface EditTablePanelHandle<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  // Appends a seeded row to the grid and scrolls it into view. Drive the
  // "add" affordance from wherever it makes sense for the page (e.g. the
  // PageHeader) and call this on click.
  addRow: (seed: T) => void
}

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
  // Renders a per-row trash button.
  deletable?: boolean
  emptyMessage?: React.ReactNode
  onDirtyChange?: (isDirty: boolean) => void
}

function EditTablePanelInner<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  {
    columns,
    fetchFn,
    onSave,
    rowKey,
    filterFn,
    className,
    filters,
    deletable = false,
    emptyMessage,
    onDirtyChange,
  }: EditTablePanelProps<T>,
  ref: React.ForwardedRef<EditTablePanelHandle<T>>,
) {
  const tableRef = useRef<EditTableHandle<T>>(null)
  const [isDirty, setIsDirty] = useState(false)

  const { unsavedChangesDialog } = useUnsavedChangesPrompt(isDirty)

  useImperativeHandle(ref, () => ({
    addRow: (seed: T) => tableRef.current?.addRow(seed),
  }))

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

export const EditTablePanel = forwardRef(EditTablePanelInner) as <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  props: EditTablePanelProps<T> & {
    ref?: React.Ref<EditTablePanelHandle<T>>
  },
) => React.ReactElement | null
