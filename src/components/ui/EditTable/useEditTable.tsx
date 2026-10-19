import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type RowKey = string | number

export type EditTableChanges<T> = {
  created: T[]
  updated: T[]
  deleted: RowKey[]
}

// Returning false keeps the table dirty (e.g. the API call failed);
// anything else counts as success and reloads the data.
export type EditTableSaveFn<T> = (
  changes: EditTableChanges<T>,
) => boolean | void | Promise<boolean | void>

// What rebase did: how many cells someone else changed to another value
// than the edit replayed over them, and how many edited rows were dropped
// because someone deleted them.
export type EditTableRebaseResult = {
  conflicts: number
  dropped: number
}

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

const cellId = (key: RowKey, field: string) => `${key}\u0000${field}`

export interface UseEditTableOptions<T> {
  fetchFn: () => Promise<T[]>
  onSave?: EditTableSaveFn<T>
  onDirtyChange?: (isDirty: boolean, pendingCount: number) => void
  // Stable identity of a row; rows without a key count as newly created.
  rowKey?: (row: T) => RowKey | null | undefined
  // Client-side view filter. Rows that fail the predicate are hidden from
  // the grid but stay in state — edits, dirty tracking and save all act on
  // the full set. Unsaved new rows are always shown regardless of the filter.
  filterFn?: (row: T) => boolean
}

export function useEditTable<T extends Record<string, unknown>>({
  fetchFn,
  onSave,
  onDirtyChange,
  rowKey = (row) => row.id as RowKey | null | undefined,
  filterFn,
}: UseEditTableOptions<T>) {
  const [initialRows, setInitialRows] = useState<T[]>([])
  const [history, setHistory] = useState<T[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [editingCell, setEditingCell] = useState<{
    row: number
    key: string
  } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{
    row: number
    key: string
  } | null>(null)
  const [inputValue, setInputValue] = useState('')
  // Cells (see cellId) rebase replayed an edit over that someone else had
  // changed too. Cleared by the next load or discard.
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set())

  const containerRef = useRef<HTMLDivElement>(null)
  const historyIndexRef = useRef(historyIndex)
  historyIndexRef.current = historyIndex
  const historyLengthRef = useRef(history.length)
  historyLengthRef.current = history.length

  const fullData = history[historyIndex] ?? []

  const keyOf = useCallback(
    (row: T): RowKey | null => rowKey(row) ?? null,
    [rowKey],
  )

  // The rows actually rendered: the full set minus anything the caller's
  // filter rejects, but always keeping unsaved new rows visible. Cell
  // indices coming back from the grid are positions in this array.
  const currentData = useMemo(() => {
    if (!filterFn) return fullData
    return fullData.filter((row) => keyOf(row) == null || filterFn(row))
  }, [fullData, filterFn, keyOf])

  // Clear any active cell when the filter changes — its index would
  // otherwise point at a different (or vanished) row.
  useEffect(() => {
    setEditingCell(null)
    setSelectedCell(null)
  }, [filterFn])

  const initialByKey = useMemo(() => {
    const map = new Map<RowKey, T>()
    for (const row of initialRows) {
      const key = keyOf(row)
      if (key != null) map.set(key, row)
    }
    return map
  }, [initialRows, keyOf])

  // Dirty tracking always runs against the full set, never the filtered view.
  const changes = useMemo<EditTableChanges<T>>(() => {
    const created: T[] = []
    const updated: T[] = []
    const currentKeys = new Set<RowKey>()

    for (const row of fullData) {
      const key = keyOf(row)
      if (key == null) {
        created.push(row)
        continue
      }
      currentKeys.add(key)
      const initial = initialByKey.get(key)
      if (initial && JSON.stringify(initial) !== JSON.stringify(row))
        updated.push(row)
    }

    const deleted = [...initialByKey.keys()].filter(
      (key) => !currentKeys.has(key),
    )

    return { created, updated, deleted }
  }, [fullData, initialByKey, keyOf])

  const pendingCount =
    changes.created.length + changes.updated.length + changes.deleted.length
  const isDirty = pendingCount > 0
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const doLoad = useCallback(() => {
    fetchFn().then((data) => {
      setInitialRows(data)
      setHistory([data])
      setHistoryIndex(0)
      setEditingCell(null)
      setSelectedCell(null)
      setConflictCells(new Set())
    })
  }, [fetchFn])

  // Refetches, then replays the unsaved edits on top: every field edited
  // here is set again on the fresh row, rows deleted here stay deleted and
  // new rows are kept. Edits to rows deleted since are dropped. Use it when
  // a save was refused because the rows changed underneath: saving again
  // then writes only these edits over the fresh data.
  const rebase = async (): Promise<EditTableRebaseResult> => {
    const fresh = await fetchFn()

    const currentByKey = new Map<RowKey, T>()
    for (const row of fullData) {
      const key = keyOf(row)
      if (key != null) currentByKey.set(key, row)
    }

    const conflicts = new Set<string>()
    const rows: T[] = []
    const freshKeys = new Set<RowKey>()
    for (const freshRow of fresh) {
      const key = keyOf(freshRow)
      const initial = key == null ? undefined : initialByKey.get(key)
      if (key == null || !initial) {
        // Added by someone else since the last load.
        rows.push(freshRow)
        continue
      }
      freshKeys.add(key)
      const current = currentByKey.get(key)
      if (!current) continue // deleted here

      const merged: Record<string, unknown> = { ...freshRow }
      for (const field of Object.keys(current)) {
        if (sameValue(current[field], initial[field])) continue
        if (
          !sameValue(freshRow[field], initial[field]) &&
          !sameValue(freshRow[field], current[field])
        ) {
          conflicts.add(cellId(key, field))
        }
        merged[field] = current[field]
      }
      rows.push(merged as T)
    }

    let dropped = 0
    for (const [key, current] of currentByKey) {
      const initial = initialByKey.get(key)
      if (!freshKeys.has(key) && initial && !sameValue(initial, current))
        dropped++
    }
    rows.push(...fullData.filter((row) => keyOf(row) == null))

    setInitialRows(fresh)
    setHistory([rows])
    setHistoryIndex(0)
    setEditingCell(null)
    setSelectedCell(null)
    setConflictCells(conflicts)
    return { conflicts: conflicts.size, dropped }
  }

  // Refetch whenever the caller swaps in a new fetchFn (i.e. the scope
  // changed). Protecting unsaved edits against a scope change is the
  // caller's job: watch `onDirtyChange` and guard the control that changes
  // scope, so that declining the prompt leaves the control — and the grid
  // — untouched.
  useEffect(() => {
    doLoad()
  }, [doLoad])

  useEffect(() => {
    onDirtyChange?.(isDirty, pendingCount)
  }, [isDirty, pendingCount])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active?.tagName === 'INPUT' && containerRef.current?.contains(active))
        return

      const isUndo = (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey
      const isRedo = (e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey

      if (isUndo && historyIndexRef.current > 0) {
        e.preventDefault()
        setHistoryIndex((i) => i - 1)
        setEditingCell(null)
      }
      if (isRedo && historyIndexRef.current < historyLengthRef.current - 1) {
        e.preventDefault()
        setHistoryIndex((i) => i + 1)
        setEditingCell(null)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const pushRows = (newRows: T[]) => {
    setHistory((h) => [...h.slice(0, historyIndexRef.current + 1), newRows])
    setHistoryIndex((i) => i + 1)
  }

  // `row` is an index into the filtered view; map it back to the full set
  // by object identity before writing history.
  const commitEdit = (row: number, key: string, value: unknown) => {
    setEditingCell(null)

    const target = currentData[row]
    if (!target || target[key] === value) return

    pushRows(
      fullData.map((r) => (r === target ? { ...r, [key]: value } : r)) as T[],
    )
  }

  const addRow = (seed: T) => {
    setEditingCell(null)
    setSelectedCell(null)
    pushRows([...fullData, seed])
  }

  const deleteRow = (row: number) => {
    setEditingCell(null)
    setSelectedCell(null)
    const target = currentData[row]
    if (!target) return
    pushRows(fullData.filter((r) => r !== target))
  }

  const handleSave = async () => {
    if (!onSave || !isDirtyRef.current) return

    const ok = await onSave(changes)
    if (ok === false) return

    doLoad()
  }

  const handleDiscard = () => {
    setHistory([initialRows])
    setHistoryIndex(0)
    setEditingCell(null)
    setConflictCells(new Set())
  }

  const isCellModified = (row: number, key: string) => {
    const current = currentData[row]
    if (!current) return false
    const rowId = keyOf(current)
    if (rowId == null) return true // new row
    const initial = initialByKey.get(rowId)
    if (!initial) return true
    return String(current[key] ?? '') !== String(initial[key] ?? '')
  }

  const isCellConflicted = (row: number, key: string) => {
    const current = currentData[row]
    const rowId = current && keyOf(current)
    return rowId != null && conflictCells.has(cellId(rowId, key))
  }

  return {
    containerRef,
    currentData,
    totalRowCount: fullData.length,
    editingCell,
    selectedCell,
    inputValue,
    isDirty,
    changes,
    keyOf,
    setInputValue,
    isCellModified,
    isCellConflicted,
    commitEdit,
    addRow,
    deleteRow,
    setEditingCell,
    setSelectedCell,
    handleDiscard,
    handleSave,
    reload: doLoad,
    rebase,
  }
}
