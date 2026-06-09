import { cn } from '@/lib/utils'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import {
  useEditTable,
  type FetchParams,
  type FetchResult,
} from './useEditTable'

export type { FetchParams, FetchResult }

export interface EditTableHandle {
  save: () => Promise<void>
  discard: () => void
}

interface Column {
  key: string
  label: string
  editable?: boolean
  renderFn?: (value: any) => React.JSX.Element | string
}

interface EditTableProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: Column[]
  pageSize?: number
  className?: string
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>
  onSave?: (data: T[]) => void | Promise<void>
  onDirtyChange?: (isDirty: boolean) => void
}

function isColEditable(col: Column): boolean {
  return col.editable !== false && !col.renderFn
}

type NavDirection = 'tab' | 'shift-tab' | 'up' | 'down' | 'left' | 'right'

function navigateCell(
  row: number,
  colKey: string,
  direction: NavDirection,
  columns: Column[],
  rowCount: number,
): { row: number; key: string } | null {
  const colIndex = columns.findIndex((c) => c.key === colKey)
  if (colIndex === -1) return null

  if (direction === 'tab' || direction === 'shift-tab') {
    const editableCols = columns.filter(isColEditable)
    if (editableCols.length === 0) return null

    const fwd = direction === 'tab'
    if (fwd) {
      const next = editableCols.find(
        (c) => columns.findIndex((col) => col.key === c.key) > colIndex,
      )

      if (next) return { row, key: next.key }

      if (row < rowCount - 1) return { row: row + 1, key: editableCols[0].key }

      return null
    } else {
      const prev = [...editableCols]
        .reverse()
        .find((c) => columns.findIndex((col) => col.key === c.key) < colIndex)

      if (prev) return { row, key: prev.key }

      if (row > 0)
        return { row: row - 1, key: editableCols[editableCols.length - 1].key }

      return null
    }
  }

  switch (direction) {
    case 'up':
      return row > 0 ? { row: row - 1, key: colKey } : null
    case 'down':
      return row < rowCount - 1 ? { row: row + 1, key: colKey } : null
    case 'left':
      return colIndex > 0 ? { row, key: columns[colIndex - 1].key } : null
    case 'right':
      return colIndex < columns.length - 1
        ? { row, key: columns[colIndex + 1].key }
        : null
  }
}

function EditTableInner<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  {
    columns,
    pageSize,
    className,
    fetchFn,
    onSave,
    onDirtyChange,
  }: EditTableProps<T>,
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
    selectedCell,
    inputValue,
    setInputValue,
    isCellModified,
    commitEdit,
    setEditingCell,
    setSelectedCell,
    handleDiscard,
    handleSave,
    nextPage,
    prevPage,
    goToPage,
  } = useEditTable(fetchFn, onSave, onDirtyChange, pageSize)

  useImperativeHandle(ref, () => ({ save: handleSave, discard: handleDiscard }))

  const inputRef = useRef<HTMLInputElement>(null)
  const pendingNavRef = useRef<{ row: number; key: string } | null>(null)

  const focusCell = (row: number, key: string) => {
    requestAnimationFrame(() => {
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${key}"]`)
        ?.focus()
    })
  }

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

                  const isEditable = isColEditable(col)
                  const isEditing =
                    editingCell?.row === rowIndex && editingCell?.key === key

                  const modified = isCellModified(rowIndex, key)

                  const isSelected =
                    !isEditing &&
                    selectedCell?.row === rowIndex &&
                    selectedCell?.key === key

                  if (isEditing) {
                    return (
                      <td
                        key={key}
                        className="px-4 py-3.5 border-b border-border ring-2 ring-inset ring-primary/60 bg-background"
                      >
                        <input
                          ref={inputRef}
                          autoFocus
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            const nav = pendingNavRef.current
                            pendingNavRef.current = null
                            commitEdit(rowIndex, key, inputValue)
                            if (nav) {
                              const nextEditable = isColEditable(
                                columns.find((c) => c.key === nav.key)!,
                              )
                              if (nextEditable) {
                                setSelectedCell(null)
                                setEditingCell(nav)
                                setInputValue(
                                  String(currentData[nav.row]?.[nav.key] ?? ''),
                                )
                              } else {
                                setSelectedCell(nav)
                                focusCell(nav.row, nav.key)
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            const nav = (dir: NavDirection) => {
                              e.preventDefault()
                              pendingNavRef.current = navigateCell(
                                rowIndex,
                                key,
                                dir,
                                columns,
                                currentData.length,
                              )
                              inputRef.current?.blur()
                            }
                            switch (e.key) {
                              case 'Tab':
                                nav(e.shiftKey ? 'shift-tab' : 'tab')
                                break
                              case 'Enter':
                                nav(e.shiftKey ? 'up' : 'down')
                                break
                              case 'ArrowUp':
                                nav('up')
                                break
                              case 'ArrowDown':
                                nav('down')
                                break
                              case 'Escape':
                                e.preventDefault()
                                setEditingCell(null)
                                setSelectedCell({ row: rowIndex, key })
                                focusCell(rowIndex, key)
                                break
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
                      tabIndex={isEditable ? 0 : -1}
                      data-row={rowIndex}
                      data-col={key}
                      onClick={() => {
                        if (!isEditable) return
                        setSelectedCell(null)
                        setEditingCell({ row: rowIndex, key })
                        setInputValue(String(item[key] ?? ''))
                      }}
                      onFocus={() => setSelectedCell({ row: rowIndex, key })}
                      onBlur={() => setSelectedCell(null)}
                      onKeyDown={(e) => {
                        const moveSelection = (dir: NavDirection) => {
                          e.preventDefault()
                          const next = navigateCell(
                            rowIndex,
                            key,
                            dir,
                            columns,
                            currentData.length,
                          )
                          if (!next) return
                          setSelectedCell(next)
                          focusCell(next.row, next.key)
                        }

                        switch (e.key) {
                          case 'Tab':
                            // only intercept if there's a target; otherwise let browser Tab out
                            {
                              const next = navigateCell(
                                rowIndex,
                                key,
                                e.shiftKey ? 'shift-tab' : 'tab',
                                columns,
                                currentData.length,
                              )
                              if (next) {
                                e.preventDefault()
                                setSelectedCell(next)
                                focusCell(next.row, next.key)
                              }
                            }
                            break
                          case 'ArrowUp':
                            moveSelection('up')
                            break
                          case 'ArrowDown':
                            moveSelection('down')
                            break
                          case 'ArrowLeft':
                            moveSelection('left')
                            break
                          case 'ArrowRight':
                            moveSelection('right')
                            break
                          case 'Enter':
                          case 'F2':
                            if (isEditable) {
                              e.preventDefault()
                              setSelectedCell(null)
                              setEditingCell({ row: rowIndex, key })
                              setInputValue(String(item[key] ?? ''))
                            }
                            break
                          default:
                            if (
                              isEditable &&
                              e.key.length === 1 &&
                              !e.ctrlKey &&
                              !e.metaKey &&
                              !e.altKey
                            ) {
                              e.preventDefault()
                              setSelectedCell(null)
                              setEditingCell({ row: rowIndex, key })
                              setInputValue(e.key)
                            }
                        }
                      }}
                      className={cn(
                        'px-4 py-3.5 text-muted-foreground focus:outline-none',
                        isEditable &&
                          'cursor-pointer hover:bg-muted/30 hover:text-foreground',
                        modified && 'bg-yellow-500/10',
                        isSelected &&
                          'ring-2 ring-inset ring-primary/40 bg-primary/5',
                        rowIndex < currentData.length - 1 &&
                          'border-b border-border',
                      )}
                    >
                      {col.renderFn
                        ? col.renderFn(item[key])
                        : String(item[key] ?? '')}
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
