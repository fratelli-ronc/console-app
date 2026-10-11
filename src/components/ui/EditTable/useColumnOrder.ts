import { useCallback, useMemo, useState } from 'react'
import { useUserStore } from '@/store'

// Bump when the stored shape changes; old entries are then ignored.
const STORAGE_VERSION = 'v1'

const storageKeyFor = (userId: string, tableKey: string) =>
  `ronc.${userId}.table.${tableKey}.columnOrder.${STORAGE_VERSION}`

// localStorage can throw (quota, disabled storage) — a missing preference
// just falls back to the default order.
function readOrder(key: string | null): string[] | null {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) &&
      parsed.every((k): k is string => typeof k === 'string')
      ? parsed
      : null
  } catch {
    return null
  }
}

function writeOrder(key: string | null, order: string[] | null) {
  if (!key) return
  try {
    if (order) localStorage.setItem(key, JSON.stringify(order))
    else localStorage.removeItem(key)
  } catch {
    // Non-critical UI preference — ignore.
  }
}

// Reconciles a saved key order with the current column set: saved keys that
// no longer exist are dropped, and columns added since the order was saved
// are slotted in right after the column that precedes them by default (or
// first, when they lead the default order).
function applyOrder<C extends { key: string }>(
  columns: C[],
  saved: string[] | null,
): C[] {
  if (!saved) return columns

  const byKey = new Map(columns.map((c) => [c.key, c]))
  const result = saved.flatMap((key) => {
    const col = byKey.get(key)
    return col ? [col] : []
  })
  const placed = new Set(result.map((c) => c.key))

  columns.forEach((col, defaultIndex) => {
    if (placed.has(col.key)) return
    const prevKey = columns[defaultIndex - 1]?.key
    const at = prevKey ? result.findIndex((c) => c.key === prevKey) + 1 : 0
    result.splice(at, 0, col)
    placed.add(col.key)
  })

  return result
}

// Per-user, locally persisted column order for a table. Without a tableKey
// it's a no-op that returns the columns in their default order.
export function useColumnOrder<C extends { key: string }>(
  columns: C[],
  tableKey?: string,
) {
  const userId = useUserStore((s) => s.user?.id)
  const storageKey =
    tableKey && userId ? storageKeyFor(userId, tableKey) : null

  // Track which storage key the in-memory order was loaded for, so a user
  // or table switch re-reads storage instead of reusing a stale order.
  const [state, setState] = useState(() => ({
    storageKey,
    order: readOrder(storageKey),
  }))
  const savedOrder =
    state.storageKey === storageKey ? state.order : readOrder(storageKey)
  if (state.storageKey !== storageKey) {
    setState({ storageKey, order: savedOrder })
  }

  const orderedColumns = useMemo(
    () => applyOrder(columns, savedOrder),
    [columns, savedOrder],
  )

  const isCustomized = orderedColumns.some(
    (col, i) => col.key !== columns[i]?.key,
  )

  // Moves activeKey into overKey's slot (sortable-list semantics).
  const reorder = useCallback(
    (activeKey: string, overKey: string) => {
      if (activeKey === overKey) return
      const keys = orderedColumns.map((c) => c.key)
      const from = keys.indexOf(activeKey)
      const to = keys.indexOf(overKey)
      if (from === -1 || to === -1) return
      keys.splice(to, 0, ...keys.splice(from, 1))
      writeOrder(storageKey, keys)
      setState({ storageKey, order: keys })
    },
    [orderedColumns, storageKey],
  )

  const reset = useCallback(() => {
    writeOrder(storageKey, null)
    setState({ storageKey, order: null })
  }, [storageKey])

  return { orderedColumns, reorder, reset, isCustomized }
}
