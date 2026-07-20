import { cn } from '@/lib/utils'

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

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  getRowKey: (item: T, index: number) => React.Key
  emptyState?: DataTableEmptyState
  skeletonRows?: number
  rowClassName?: string | ((item: T) => string)
  className?: string
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
        'rounded-xl border border-border overflow-hidden',
        className,
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide',
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
            <DataTableSkeleton columns={columns.length} rows={skeletonRows} />
          ) : (
            data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className={cn(
                  'hover:bg-muted/30 transition-colors',
                  typeof rowClassName === 'function'
                    ? rowClassName(item)
                    : rowClassName,
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5', col.cellClassName)}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
