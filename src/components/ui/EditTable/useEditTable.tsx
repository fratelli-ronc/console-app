import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type FetchParams = {
  page: number
  pageSize: number
}

export type FetchResult<T> = {
  data: T[]
  total: number
}

export type RowKey = string | number

export type EditTableChanges<T> = {
  created: T[]
  updated: T[]
  deleted: RowKey[]
}

// Returning false keeps the table dirty (e.g. the API call failed);
// anything else counts as success and reloads the current page.
export type EditTableSaveFn<T> = (
  changes: EditTableChanges<T>,
) => boolean | void | Promise<boolean | void>

export interface UseEditTableOptions<T> {
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>
  onSave?: EditTableSaveFn<T>
  onDirtyChange?: (isDirty: boolean) => void
  pageSize?: number
  // Stable identity of a row; rows without a key count as newly created.
  rowKey?: (row: T) => RowKey | null | undefined
}

const DISCARD_PROMPT = 'Ci sono modifiche non salvate. Continuare e scartarle?'

export function useEditTable<T extends Record<string, unknown>>({
  fetchFn,
  onSave,
  onDirtyChange,
  pageSize = 20,
  rowKey = (row) => row.id as RowKey | null | undefined,
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
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const historyIndexRef = useRef(historyIndex)
  historyIndexRef.current = historyIndex
  const historyLengthRef = useRef(history.length)
  historyLengthRef.current = history.length

  const currentData = history[historyIndex] ?? []

  const keyOf = useCallback(
    (row: T): RowKey | null => rowKey(row) ?? null,
    [rowKey],
  )

  const initialByKey = useMemo(() => {
    const map = new Map<RowKey, T>()
    for (const row of initialRows) {
      const key = keyOf(row)
      if (key != null) map.set(key, row)
    }
    return map
  }, [initialRows, keyOf])

  const changes = useMemo<EditTableChanges<T>>(() => {
    const created: T[] = []
    const updated: T[] = []
    const currentKeys = new Set<RowKey>()

    for (const row of currentData) {
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
  }, [currentData, initialByKey, keyOf])

  const isDirty =
    changes.created.length + changes.updated.length + changes.deleted.length >
    0
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const activePage = page
  const pageRef = useRef(page)
  pageRef.current = page

  const doLoad = useCallback(
    (targetPage: number) => {
      fetchFn({ page: targetPage, pageSize }).then(({ data, total }) => {
        setInitialRows(data)
        setHistory([data])
        setHistoryIndex(0)
        setTotal(total)
        setPage(targetPage)
        setEditingCell(null)
        setSelectedCell(null)
      })
    },
    [fetchFn, pageSize],
  )

  // Guards unsaved changes: declining the prompt keeps the current data
  // (the caller's filter state may then be ahead of the grid until the
  // user saves or discards).
  const loadPage = useCallback(
    (targetPage: number) => {
      if (isDirtyRef.current && !window.confirm(DISCARD_PROMPT)) return
      doLoad(targetPage)
    },
    [doLoad],
  )

  useEffect(() => {
    loadPage(0)
  }, [loadPage])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty])

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

  const commitEdit = (row: number, key: string, value: unknown) => {
    setEditingCell(null)

    if (currentData[row]?.[key] === value) return

    pushRows(
      currentData.map((r, i) => (i === row ? { ...r, [key]: value } : r)) as T[],
    )
  }

  const addRow = (seed: T) => {
    setEditingCell(null)
    setSelectedCell(null)
    pushRows([...currentData, seed])
  }

  const deleteRow = (row: number) => {
    setEditingCell(null)
    setSelectedCell(null)
    pushRows(currentData.filter((_, i) => i !== row))
  }

  const handleSave = async () => {
    if (!onSave || !isDirtyRef.current) return

    const ok = await onSave(changes)
    if (ok === false) return

    doLoad(pageRef.current)
  }

  const handleDiscard = () => {
    setHistory([initialRows])
    setHistoryIndex(0)
    setEditingCell(null)
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

  const nextPage = () => loadPage(Math.min(activePage + 1, pageCount - 1))
  const prevPage = () => loadPage(Math.max(activePage - 1, 0))
  const goToPage = (p: number) => loadPage(p)

  return {
    containerRef,
    currentData,
    activePage,
    pageCount,
    pageSize,
    total,
    editingCell,
    selectedCell,
    inputValue,
    isDirty,
    changes,
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
  }
}
