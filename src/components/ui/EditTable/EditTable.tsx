import { cn } from '@/lib/utils'
import { forwardRef, useImperativeHandle } from 'react'
import { useEditTable, type FetchParams, type FetchResult } from './useEditTable'

export type { FetchParams, FetchResult }

export interface EditTableHandle {
  save: () => Promise<void>
  discard: () => void
}

interface Column {
  key: string
  label: string
  editable?: boolean
}

interface EditTableProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: Column[]
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>
  onSave?: (data: T[]) => void | Promise<void>
  onDirtyChange?: (isDirty: boolean) => void
  pageSize?: number
  className?: string
}

function EditTableInner<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  { columns, fetchFn, onSave, onDirtyChange, pageSize, className }: EditTableProps<T>,
  ref: React.ForwardedRef<EditTableHandle>,
) {
  const {
    containerRef,
    currentData,
    activePage,
    pageCount,
    pageSize: ps,
    total,
    editingCell,
    inputValue,
    setInputValue,
    isCellModified,
    commitEdit,
    setEditingCell,
    handleDiscard,
    handleSave,
    nextPage,
    prevPage,
    goToPage,
  } = useEditTable(fetchFn, onSave, onDirtyChange, pageSize)

  useImperativeHandle(ref, () => ({ save: handleSave, discard: handleDiscard }))

  const pageNumbers = getPageNumbers(activePage, pageCount)
  const startRow = total === 0 ? 0 : activePage * ps + 1
  const endRow = activePage * ps + currentData.length

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-xl border border-border flex flex-col overflow-hidden',
        className,
      )}
    >
      <div className="flex-1 overflow-auto overscroll-none">
        <table className="w-full text-sm table-fixed border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 bg-muted">
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-card">
            {currentData.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => {
                  const { key } = col
                  const isEditable = col.editable !== false
                  const isEditing =
                    editingCell?.row === rowIndex && editingCell?.key === key
                  const modified = isCellModified(rowIndex, key)

                  if (isEditing) {
                    return (
                      <td
                        key={key}
                        className="px-4 py-3.5 border-b border-border ring-2 ring-inset ring-primary/60 bg-background"
                      >
                        <input
                          autoFocus
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => commitEdit(rowIndex, key, inputValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              commitEdit(rowIndex, key, inputValue)
                            } else if (e.key === 'Tab') {
                              e.preventDefault()
                              commitEdit(rowIndex, key, inputValue)
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              setEditingCell(null)
                            }
                          }}
                          className="w-full bg-transparent outline-none text-foreground text-sm"
                        />
                      </td>
                    )
                  }

                  return (
                    <td
                      key={key}
                      onClick={() => {
                        if (!isEditable) return
                        setEditingCell({ row: rowIndex, key })
                        setInputValue(String(item[key] ?? ''))
                      }}
                      className={cn(
                        'px-4 py-3.5 text-muted-foreground',
                        isEditable &&
                          'cursor-pointer hover:bg-muted/30 hover:text-foreground',
                        modified && 'bg-yellow-500/10',
                        rowIndex < currentData.length - 1 && 'border-b border-border',
                      )}
                    >
                      {String(item[key] ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={prevPage}
            disabled={activePage === 0}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm"
          >
            ‹
          </button>

          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span
                key={`ellipsis-${i}`}
                className="inline-flex items-center justify-center w-7 h-7 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs tabular-nums transition-colors',
                  p === activePage
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border',
                )}
              >
                {p + 1}
              </button>
            ),
          )}

          <button
            onClick={nextPage}
            disabled={activePage === pageCount - 1}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm"
          >
            ›
          </button>
        </div>

        <span className="text-xs text-muted-foreground tabular-nums">
          {total === 0 ? '0' : `${startRow}–${endRow}`} di {total}
        </span>
      </div>
    </div>
  )
}

function getPageNumbers(page: number, pageCount: number): (number | '...')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i)
  const pages: (number | '...')[] = [0]
  if (page > 2) pages.push('...')
  for (
    let i = Math.max(1, page - 1);
    i <= Math.min(pageCount - 2, page + 1);
    i++
  )
    pages.push(i)
  if (page < pageCount - 3) pages.push('...')
  pages.push(pageCount - 1)
  return pages
}

export const EditTable = forwardRef(EditTableInner) as <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  props: EditTableProps<T> & { ref?: React.Ref<EditTableHandle> },
) => React.ReactElement | null
