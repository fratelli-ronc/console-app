import { cn } from '@/lib/utils'
import { Checkbox } from './Checkbox'

export interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  render: (item: T) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableEmptyState {
  icon?: React.ReactNode
  title: string
  description?: string
}

interface DataTableSkeletonProps {
  columns: number
  rows: number
}

const SKELETON_WIDTHS = ['60%', '80%', '50%']

const DataTableSkeleton: React.FC<DataTableSkeletonProps> = ({
  columns,
  rows,
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-0">
        {Array.from({ length: columns }).map((_, j) => (
          <td key={j} className="px-4 py-7">
            <div
              className="h-4 bg-muted rounded animate-pulse"
              style={{ width: SKELETON_WIDTHS[j % SKELETON_WIDTHS.length] }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
)

export interface DataTableSelection {
  selectedKeys: Set<React.Key>
  onSelectionChange: (selectedKeys: Set<React.Key>) => void
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  getRowKey: (item: T, index: number) => React.Key
  emptyState?: DataTableEmptyState
  skeletonRows?: number
  rowClassName?: string | ((item: T) => string)
  className?: string
  selection?: DataTableSelection
}

export function DataTable<T>({
  columns,
  data,
  loading,
  getRowKey,
  emptyState,
  skeletonRows = 5,
  rowClassName,
  className,
  selection,
}: DataTableProps<T>) {
  if (!loading && data.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {emptyState.icon && (
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            {emptyState.icon}
          </div>
        )}
        <p className="text-sm font-medium text-foreground">
          {emptyState.title}
        </p>
        {emptyState.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {emptyState.description}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border overflow-x-auto overscroll-x-none',
        className,
      )}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {selection && (
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={
                    data.length > 0 &&
                    selection.selectedKeys.size === data.length
                      ? true
                      : selection.selectedKeys.size > 0
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) =>
                    selection.onSelectionChange(
                      checked
                        ? new Set(
                            data.map((item, index) => getRowKey(item, index)),
                          )
                        : new Set(),
                    )
                  }
                  aria-label="Seleziona tutto"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap',
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {loading ? (
            <DataTableSkeleton
              columns={columns.length + (selection ? 1 : 0)}
              rows={skeletonRows}
            />
          ) : (
            data.map((item, index) => {
              const rowKey = getRowKey(item, index)
              const selected = selection?.selectedKeys.has(rowKey) ?? false
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    'hover:bg-muted/30 transition-colors',
                    selected && 'bg-primary/5',
                    typeof rowClassName === 'function'
                      ? rowClassName(item)
                      : rowClassName,
                  )}
                >
                  {selection && (
                    <td className="px-4 py-3.5">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => {
                          const next = new Set(selection.selectedKeys)
                          if (checked) next.add(rowKey)
                          else next.delete(rowKey)
                          selection.onSelectionChange(next)
                        }}
                        aria-label="Seleziona riga"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 whitespace-nowrap',
                        col.cellClassName,
                      )}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
