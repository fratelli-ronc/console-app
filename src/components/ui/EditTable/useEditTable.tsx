import { useCallback, useEffect, useRef, useState } from 'react'

export type FetchParams = {
  page: number
  pageSize: number
}

export type FetchResult<T> = {
  data: T[]
  total: number
}

export function useEditTable<T extends Record<string, unknown>>(
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>,
  onSave?: (data: T[]) => void | Promise<void>,
  onDirtyChange?: (isDirty: boolean) => void,
  pageSize: number = 20,
) {
  const [initialData, setInitialData] = useState<T[]>([])
  const [history, setHistory] = useState<T[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [editingCell, setEditingCell] = useState<{
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
  const isDirty = JSON.stringify(currentData) !== JSON.stringify(initialData)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const activePage = page

  const loadPage = useCallback(
    (targetPage: number) => {
      fetchFn({ page: targetPage, pageSize }).then(({ data, total }) => {
        setInitialData(data)
        setHistory([data])
        setHistoryIndex(0)
        setTotal(total)
        setPage(targetPage)
        setEditingCell(null)
      })
    },
    [fetchFn, pageSize],
  )

  useEffect(() => {
    loadPage(0)
  }, [loadPage])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (containerRef.current?.contains(document.activeElement)) return

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

  const commitEdit = (row: number, key: string, value: string) => {
    const newData = currentData.map((r, i) =>
      i === row ? { ...r, [key]: value } : r,
    ) as T[]
    setHistory((h) => [...h.slice(0, historyIndex + 1), newData])
    setHistoryIndex((i) => i + 1)
    setEditingCell(null)
  }

  const handleSave = async () => {
    if (!onSave) return
    await onSave(currentData)
    setInitialData(currentData)
    setHistory([currentData])
    setHistoryIndex(0)
  }

  const handleDiscard = () => {
    setHistory([initialData])
    setHistoryIndex(0)
    setEditingCell(null)
  }

  const isCellModified = (row: number, key: string) =>
    String(currentData[row]?.[key]) !== String(initialData[row]?.[key])

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
    inputValue,
    isDirty,
    setInputValue,
    isCellModified,
    commitEdit,
    setEditingCell,
    handleDiscard,
    handleSave,
    nextPage,
    prevPage,
    goToPage,
  }
}
