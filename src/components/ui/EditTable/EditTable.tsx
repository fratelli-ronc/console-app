import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CellSelect } from './CellSelect'
import {
  useEditTable,
  type EditTableSaveFn,
  type FetchParams,
  type FetchResult,
  type RowKey,
} from './useEditTable'

export type { FetchParams, FetchResult }

export type EditTableCellType = 'text' | 'number' | 'boolean' | 'select'

export interface EditTableSelectOption {
  value: string
  label: string
}

export interface EditTableColumn<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  key: keyof T & string
  label: string
  // e.g. '10rem'; when any column sets it the table switches to sized
  // columns with horizontal scroll.
  width?: string
  editable?: boolean
  // Picks the built-in cell editor. Defaults to 'text'.
  type?: EditTableCellType
  // Required for type 'select'.
  options?: EditTableSelectOption[]
  // Display-only formatting; editing always uses the built-in editor.
  renderFn?: (value: unknown, row: T) => React.ReactNode
}

export interface EditTableHandle<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  save: () => Promise<void>
  discard: () => void
  addRow: (seed: T) => void
}

interface EditTableProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  columns: EditTableColumn<T>[]
  pageSize?: number
  className?: string
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>
  onSave?: EditTableSaveFn<T>
  onDirtyChange?: (isDirty: boolean) => void
  rowKey?: (row: T) => RowKey | null | undefined
  // Renders a trailing trash-button column that removes the row.
  deletable?: boolean
}

function isColEditable(col: EditTableColumn<any>): boolean {
  return col.editable !== false
}

// Boolean cells toggle in place and never enter the editing state.
function canEnterEdit(col: EditTableColumn<any>): boolean {
  return isColEditable(col) && col.type !== 'boolean'
}

function coerceCellValue(
  col: EditTableColumn<any>,
  raw: string,
  original: unknown,
): unknown {
  if (col.type === 'number') {
    const trimmed = raw.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? original : parsed
  }
  return raw
}

const BooleanCell: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center w-4 h-4 rounded border transition-colors',
      checked
        ? 'bg-primary border-primary text-primary-foreground'
        : 'border-border bg-background',
    )}
  >
    {checked && <Check size={11} strokeWidth={3} />}
  </span>
)

type NavDirection = 'tab' | 'shift-tab' | 'up' | 'down' | 'left' | 'right'

function navigateCell(
  row: number,
  colKey: string,
  direction: NavDirection,
  columns: EditTableColumn<any>[],
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
    rowKey,
    deletable,
  }: EditTableProps<T>,
  ref: React.ForwardedRef<EditTableHandle<T>>,
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
    addRow,
    deleteRow,
    setEditingCell,
    setSelectedCell,
    handleDiscard,
    handleSave,
    nextPage,
    prevPage,
    goToPage,
  } = useEditTable<T>({ fetchFn, onSave, onDirtyChange, pageSize, rowKey })

  const scrollRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    save: handleSave,
    discard: handleDiscard,
    addRow: (seed: T) => {
      addRow(seed)
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
      })
    },
  }))

  const inputRef = useRef<HTMLInputElement>(null)
  const pendingNavRef = useRef<{ row: number; key: string } | null>(null)
  const editTriggeredByTypingRef = useRef(false)

  const focusCell = (row: number, key: string) => {
    requestAnimationFrame(() => {
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${key}"]`)
        ?.focus()
    })
  }

  // Commits a raw editor value onto a cell; unchanged raw text closes the
  // editor without touching history.
  const commitCell = (rowIndex: number, col: EditTableColumn<T>, raw: string) => {
    const original = currentData[rowIndex]?.[col.key]
    const value =
      String(original ?? '') === raw
        ? original
        : coerceCellValue(col, raw, original)
    commitEdit(rowIndex, col.key, value)
  }

  const toggleCell = (rowIndex: number, col: EditTableColumn<T>) => {
    commitEdit(rowIndex, col.key, !currentData[rowIndex]?.[col.key])
  }

  const startEdit = (rowIndex: number, col: EditTableColumn<T>, seed?: string) => {
    setSelectedCell(null)
    setEditingCell({ row: rowIndex, key: col.key })
    setInputValue(seed ?? String(currentData[rowIndex]?.[col.key] ?? ''))
  }

  const displayValue = (col: EditTableColumn<T>, row: T): React.ReactNode => {
    const value = row[col.key]
    if (col.renderFn) return col.renderFn(value, row)
    if (col.type === 'boolean') return <BooleanCell checked={!!value} />
    if (col.type === 'select')
      return (
        col.options?.find((o) => o.value === value)?.label ??
        String(value ?? '')
      )
    return String(value ?? '')
  }

  const hasWidths = columns.some((c) => c.width)
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
      <div ref={scrollRef} className="flex-1 overflow-auto overscroll-none">
        <table
          className={cn(
            'text-sm border-separate border-spacing-0',
            hasWidths ? 'table-auto w-max min-w-full' : 'w-full table-fixed',
          )}
        >
          {hasWidths && (
            <colgroup>
              {columns.map((col) => (
                <col
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                />
              ))}
              {deletable && <col style={{ width: '3rem' }} />}
            </colgroup>
          )}

          <thead>
            <tr className="sticky top-0 bg-muted z-10">
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-r border-border last:border-r-0 whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
              {deletable && (
                <th className="px-2 py-3 border-b border-border" />
              )}
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
                    if (col.type === 'select' && col.options) {
                      return (
                        <td
                          key={key}
                          className="px-4 py-3.5 border-b border-r border-border last:border-r-0 ring-2 ring-inset ring-primary/60 bg-background"
                        >
                          <CellSelect
                            value={inputValue}
                            options={col.options}
                            onCommit={(finalValue: string) => {
                              commitCell(rowIndex, col, finalValue)
                              setSelectedCell({ row: rowIndex, key })
                              focusCell(rowIndex, key)
                            }}
                            onCancel={() => {
                              setEditingCell(null)
                              setSelectedCell({ row: rowIndex, key })
                              focusCell(rowIndex, key)
                            }}
                          />
                        </td>
                      )
                    }

                    return (
                      <td
                        key={key}
                        className="px-4 py-3.5 border-b border-r border-border last:border-r-0 ring-2 ring-inset ring-primary/60 bg-background"
                      >
                        <input
                          ref={inputRef}
                          autoFocus
                          value={inputValue}
                          inputMode={
                            col.type === 'number' ? 'decimal' : undefined
                          }
                          onChange={(e) => setInputValue(e.target.value)}
                          onFocus={(e) => {
                            if (editTriggeredByTypingRef.current) {
                              editTriggeredByTypingRef.current = false
                              const len = e.target.value.length
                              e.target.setSelectionRange(len, len)
                            } else {
                              e.target.select()
                            }
                          }}
                          onBlur={() => {
                            const nav = pendingNavRef.current
                            pendingNavRef.current = null
                            commitCell(rowIndex, col, inputValue)
                            if (nav) {
                              const nextCol = columns.find(
                                (c) => c.key === nav.key,
                              )!
                              if (canEnterEdit(nextCol)) {
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
                        if (col.type === 'boolean') {
                          toggleCell(rowIndex, col)
                          return
                        }
                        startEdit(rowIndex, col)
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
                          case ' ':
                            if (isEditable && col.type === 'boolean') {
                              e.preventDefault()
                              toggleCell(rowIndex, col)
                            }
                            break
                          case 'Enter':
                          case 'F2':
                            if (!isEditable) break
                            e.preventDefault()
                            if (col.type === 'boolean') {
                              toggleCell(rowIndex, col)
                            } else {
                              startEdit(rowIndex, col)
                            }
                            break
                          default:
                            if (
                              canEnterEdit(col) &&
                              e.key.length === 1 &&
                              !e.ctrlKey &&
                              !e.metaKey &&
                              !e.altKey
                            ) {
                              e.preventDefault()
                              const isFreeInput =
                                col.type !== 'select'
                              editTriggeredByTypingRef.current = isFreeInput
                              startEdit(
                                rowIndex,
                                col,
                                isFreeInput ? e.key : undefined,
                              )
                            }
                        }
                      }}
                      className={cn(
                        'px-4 py-3.5 text-muted-foreground focus:outline-none border-r border-border last:border-r-0 whitespace-nowrap',
                        col.type === 'boolean' && 'text-center',
                        modified && 'bg-yellow-500/10',
                        isSelected &&
                          'ring-2 ring-inset ring-primary/40 bg-primary/5',
                        isEditable
                          ? 'cursor-pointer hover:bg-muted/30 hover:text-foreground'
                          : 'ring-muted',
                        rowIndex < currentData.length - 1 &&
                          'border-b border-border',
                      )}
                    >
                      {displayValue(col, item)}
                    </td>
                  )
                })}

                {deletable && (
                  <td
                    className={cn(
                      'px-2 py-2 text-center align-middle',
                      rowIndex < currentData.length - 1 &&
                        'border-b border-border',
                    )}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => deleteRow(rowIndex)}
                      title="Elimina riga"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm cursor-pointer"
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
                  'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs tabular-nums transition-colors cursor-pointer',
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm cursor-pointer"
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
  props: EditTableProps<T> & { ref?: React.Ref<EditTableHandle<T>> },
) => React.ReactElement | null
