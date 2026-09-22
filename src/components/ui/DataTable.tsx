import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
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

export interface DataTableSelection<T = unknown> {
  selectedKeys: Set<React.Key>
  onSelectionChange: (selectedKeys: Set<React.Key>) => void
  isSelectable?: (item: T) => boolean
}

export interface DataTableExpansion<T> {
  expandedKeys: Set<React.Key>
  onExpandedChange: (expandedKeys: Set<React.Key>) => void
  renderExpanded: (item: T) => React.ReactNode
  canExpand?: (item: T) => boolean
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
  selection?: DataTableSelection<T>
  expansion?: DataTableExpansion<T>
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
  expansion,
}: DataTableProps<T>) {
  const selectableKeys = selection
    ? data.flatMap((item, index) =>
        (selection.isSelectable?.(item) ?? true)
          ? [getRowKey(item, index)]
          : [],
      )
    : []

  const totalColumns =
    columns.length + (selection ? 1 : 0) + (expansion ? 1 : 0)

  const toggleExpanded = (rowKey: React.Key) => {
    if (!expansion) return
    const next = new Set(expansion.expandedKeys)
    if (next.has(rowKey)) next.delete(rowKey)
    else next.add(rowKey)
    expansion.onExpandedChange(next)
  }

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
            {expansion && <th className="w-10 pl-4 pr-0 py-3" />}
            {selection && (
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={
                    selectableKeys.length > 0 &&
                    selection.selectedKeys.size === selectableKeys.length
                      ? true
                      : selection.selectedKeys.size > 0
                        ? 'indeterminate'
                        : false
                  }
                  disabled={selectableKeys.length === 0}
                  onCheckedChange={(checked) =>
                    selection.onSelectionChange(
                      checked ? new Set(selectableKeys) : new Set(),
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
            <DataTableSkeleton columns={totalColumns} rows={skeletonRows} />
          ) : (
            data.map((item, index) => {
              const rowKey = getRowKey(item, index)
              const selected = selection?.selectedKeys.has(rowKey) ?? false
              const selectable = selection?.isSelectable?.(item) ?? true
              const expandable =
                !!expansion && (expansion.canExpand?.(item) ?? true)
              const expanded =
                expandable && expansion!.expandedKeys.has(rowKey)
              const extraClassName =
                typeof rowClassName === 'function'
                  ? rowClassName(item)
                  : rowClassName
              return (
                <Fragment key={rowKey}>
                  <tr
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      selected && 'bg-primary/5',
                      extraClassName,
                    )}
                  >
                    {expansion && (
                      <td className="pl-4 pr-0 py-3.5">
                        {expandable && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(rowKey)}
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Comprimi riga' : 'Espandi riga'}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ChevronRight
                              size={16}
                              className={cn(
                                'transition-transform',
                                expanded && 'rotate-90',
                              )}
                            />
                          </button>
                        )}
                      </td>
                    )}
                    {selection && (
                      <td className="px-4 py-3.5">
                        <Checkbox
                          checked={selected}
                          disabled={!selectable}
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
                  {expanded && (
                    <tr className={cn('bg-muted/20', extraClassName)}>
                      <td colSpan={totalColumns} className="p-0">
                        {expansion!.renderExpanded(item)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
