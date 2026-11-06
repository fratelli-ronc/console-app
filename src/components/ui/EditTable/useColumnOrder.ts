import { useCallback, useMemo, useState } from 'react'
import { useUserStore } from '@/store'

// Bump when the stored shape changes; old entries are then ignored.
const STORAGE_VERSION = 'v1'

const storageKeysFor = (userId: string, tableKey: string) => {
  const base = `ronc.${userId}.table.${tableKey}`
  return {
    order: `${base}.columnOrder.${STORAGE_VERSION}`,
    pins: `${base}.columnPins.${STORAGE_VERSION}`,
  }
}

type StorageKeys = ReturnType<typeof storageKeysFor>

// localStorage can throw (quota, disabled storage) — a missing preference
// just falls back to the default.
function readKeys(key: string | undefined): string[] | null {
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

function writeKeys(key: string | undefined, keys: string[] | null) {
  if (!key) return
  try {
    if (keys?.length) localStorage.setItem(key, JSON.stringify(keys))
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

// Moves activeKey into overKey's slot (sortable-list semantics).
function moveKey(keys: string[], activeKey: string, overKey: string) {
  const next = [...keys]
  const from = next.indexOf(activeKey)
  const to = next.indexOf(overKey)
  if (from === -1 || to === -1) return null
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

const load = (keys: StorageKeys | null) => ({
  keys,
  order: readKeys(keys?.order),
  pins: readKeys(keys?.pins),
})

// Per-user, locally persisted column order and pins for a table. Pinned
// columns come first, in the order they were pinned; the rest follow the
// saved order, which pinning never touches — so unpinning a column puts it
// back where it was. Without a tableKey it's a no-op that returns the
// columns in their default order.
export function useColumnOrder<C extends { key: string }>(
  columns: C[],
  tableKey?: string,
) {
  const userId = useUserStore((s) => s.user?.id)
  const storageKeys = useMemo(
    () => (tableKey && userId ? storageKeysFor(userId, tableKey) : null),
    [tableKey, userId],
  )

  // Track which storage keys the in-memory state was loaded for, so a user
  // or table switch re-reads storage instead of reusing stale preferences.
  const [state, setState] = useState(() => load(storageKeys))
  const current = state.keys === storageKeys ? state : load(storageKeys)
  if (state.keys !== storageKeys) setState(current)
  const { order: savedOrder, pins: savedPins } = current

  // The column order ignoring pins.
  const baseColumns = useMemo(
    () => applyOrder(columns, savedOrder),
    [columns, savedOrder],
  )

  const pinnedKeys = useMemo(() => {
    const existing = new Set(columns.map((c) => c.key))
    return [...new Set(savedPins ?? [])].filter((k) => existing.has(k))
  }, [columns, savedPins])

  const orderedColumns = useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]))
    const pinned = new Set(pinnedKeys)
    return [
      ...pinnedKeys.map((k) => byKey.get(k)!),
      ...baseColumns.filter((c) => !pinned.has(c.key)),
    ]
  }, [columns, baseColumns, pinnedKeys])

  const isCustomized =
    pinnedKeys.length > 0 ||
    baseColumns.some((col, i) => col.key !== columns[i]?.key)

  const update = useCallback(
    (patch: { order?: string[]; pins?: string[] }) => {
      if (patch.order) writeKeys(storageKeys?.order, patch.order)
      if (patch.pins) writeKeys(storageKeys?.pins, patch.pins)
      setState({
        keys: storageKeys,
        order: patch.order ?? savedOrder,
        pins: patch.pins ?? savedPins,
      })
    },
    [storageKeys, savedOrder, savedPins],
  )

  // Columns only move within their own zone: pinned among pinned, unpinned
  // among unpinned. A drop across the boundary is ignored.
  const reorder = useCallback(
    (activeKey: string, overKey: string) => {
      if (activeKey === overKey) return
      const activePinned = pinnedKeys.includes(activeKey)
      if (activePinned !== pinnedKeys.includes(overKey)) return

      if (activePinned) {
        const pins = moveKey(pinnedKeys, activeKey, overKey)
        if (pins) update({ pins })
      } else {
        const order = moveKey(
          baseColumns.map((c) => c.key),
          activeKey,
          overKey,
        )
        if (order) update({ order })
      }
    },
    [pinnedKeys, baseColumns, update],
  )

  const togglePin = useCallback(
    (key: string) => {
      update({
        pins: pinnedKeys.includes(key)
          ? pinnedKeys.filter((k) => k !== key)
          : [...pinnedKeys, key],
      })
    },
    [pinnedKeys, update],
  )

  const reset = useCallback(() => {
    writeKeys(storageKeys?.order, null)
    writeKeys(storageKeys?.pins, null)
    setState({ keys: storageKeys, order: null, pins: null })
  }, [storageKeys])

  return {
    orderedColumns,
    pinnedKeys,
    reorder,
    togglePin,
    reset,
    isCustomized,
  }
}
