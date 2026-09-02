import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'
import { useUnsavedChangesPrompt } from '../ConfirmDialog'
import { FilledButton } from '../FilledButton'
import { OutlinedButton } from '../OutlinedButton'
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
  const [pendingCount, setPendingCount] = useState(0)
  const [saving, setSaving] = useState(false)

  const { unsavedChangesDialog } = useUnsavedChangesPrompt(isDirty)

  useImperativeHandle(ref, () => ({
    addRow: (seed: T) => tableRef.current?.addRow(seed),
  }))

  const runSave = useCallback(async () => {
    setSaving(true)
    try {
      await tableRef.current?.save()
    } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void runSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [runSave])

  return (
    <div className={cn('h-full flex flex-col gap-6', className)}>
      {filters && <div className="flex items-start gap-3">{filters}</div>}

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
        onDirtyChange={(dirty, count) => {
          setIsDirty(dirty)
          setPendingCount(count)
          onDirtyChange?.(dirty)
        }}
      />

      {isDirty && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />

          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">
              {pendingCount === 1
                ? '1 modifica in sospeso'
                : `${pendingCount} modifiche in sospeso`}
            </p>

            <p className="text-xs text-muted-foreground">
              Le modifiche alla tabella non sono ancora applicate.
            </p>
          </div>

          <span className="ml-auto" />

          <OutlinedButton
            type="button"
            disabled={saving}
            onClick={() => tableRef.current?.discard()}
          >
            Annulla
          </OutlinedButton>

          <FilledButton type="button" disabled={saving} onClick={runSave}>
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </FilledButton>
        </div>
      )}

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
