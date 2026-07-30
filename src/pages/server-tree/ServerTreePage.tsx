import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import toast from 'react-hot-toast'
import { CornerDownRight, Server } from 'lucide-react'
import {
  FilledButton,
  OutlinedButton,
  PageHeader,
  Search,
  TextButton,
} from '@/components'
import { listServers } from '@/client/coolify'
import {
  buildTreeServers,
  compareIp,
  MOCK_SERVER_TREE_RELATIONS,
  type TreeServer,
} from './data'
import { TreeRow } from './components/TreeRow'
import type { MoveTarget } from './components/MoveMenu'

interface RowModel {
  server: TreeServer
  depth: number
  childIds: string[]
}

export const ServerTreePage: React.FC = () => {
  const [servers, setServers] = useState<TreeServer[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const serverList = await listServers()
      if (serverList) {
        setServers(buildTreeServers(serverList, MOCK_SERVER_TREE_RELATIONS))
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Distance threshold keeps clicks on the row's buttons from starting a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const byId = new Map(servers.map((s) => [s.id, s]))

  const parentOf = (id: string): string | null => {
    const drafted = draft[id]
    if (drafted !== undefined) return drafted
    return byId.get(id)?.parent ?? null
  }

  const isDescendantOf = (ancestorId: string, id: string): boolean => {
    let p = parentOf(id)
    while (p) {
      if (p === ancestorId) return true
      p = parentOf(p)
    }
    return false
  }

  const childrenMap = new Map<string, string[]>()
  for (const s of servers) {
    const p = parentOf(s.id)
    if (!p) continue
    const list = childrenMap.get(p)
    if (list) list.push(s.id)
    else childrenMap.set(p, [s.id])
  }
  for (const list of childrenMap.values()) {
    list.sort((a, b) => compareIp(byId.get(a)?.ip ?? '', byId.get(b)?.ip ?? ''))
  }

  const root = servers.find((s) => s.parent === null)

  // While searching, show matches plus their ancestors and ignore collapse state
  const query = search.trim().toLowerCase()
  let visible: Set<string> | null = null
  if (query) {
    visible = new Set()
    for (const s of servers) {
      if (!s.name.toLowerCase().includes(query) && !s.ip.includes(query))
        continue
      let cur: string | null = s.id
      while (cur) {
        visible.add(cur)
        cur = parentOf(cur)
      }
    }
  }

  const rows: RowModel[] = []
  const walk = (id: string, depth: number) => {
    if (visible && !visible.has(id)) return
    const server = byId.get(id)
    if (!server) return
    const childIds = childrenMap.get(id) ?? []
    rows.push({ server, depth, childIds })
    if (query || !collapsed.has(id)) {
      for (const childId of childIds) walk(childId, depth + 1)
    }
  }
  if (root) walk(root.id, 0)

  const moveTargets: MoveTarget[] = []
  if (menuFor && root) {
    const currentParent = parentOf(menuFor)
    // Skips the whole subtree of the server being moved, so cycles are impossible
    const walkTargets = (id: string, depth: number) => {
      if (id === menuFor) return
      const s = byId.get(id)
      if (!s) return
      moveTargets.push({
        id,
        name: s.name,
        ip: s.ip,
        depth,
        isCurrent: id === currentParent,
      })
      for (const childId of childrenMap.get(id) ?? []) {
        walkTargets(childId, depth + 1)
      }
    }
    walkTargets(root.id, 0)
  }

  const canDropOn = (targetId: string): boolean =>
    dragId !== null &&
    dragId !== targetId &&
    !isDescendantOf(dragId, targetId) &&
    parentOf(dragId) !== targetId

  const dragServer = dragId ? byId.get(dragId) : null

  function handleDragStart({ active }: DragStartEvent) {
    setDragId(String(active.id))
    setMenuFor(null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragId(null)
    if (over && canDropOn(String(over.id))) {
      moveServer(String(active.id), String(over.id))
    }
  }

  function moveServer(id: string, parentId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(parentId)
      return next
    })
    setDraft((prev) => {
      const next = { ...prev }
      if (parentId === byId.get(id)?.parent) delete next[id]
      else next[id] = parentId
      return next
    })
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function collapseAll() {
    const next = new Set<string>()
    for (const s of servers) {
      if (s.id !== root?.id && (childrenMap.get(s.id) ?? []).length > 0)
        next.add(s.id)
    }
    setCollapsed(next)
  }

  const dirtyCount = Object.keys(draft).length

  function handleSave() {
    setServers((prev) =>
      prev.map((s) =>
        draft[s.id] !== undefined ? { ...s, parent: draft[s.id] } : s,
      ),
    )
    setDraft({})
    toast.success(
      `Alberatura salvata (${dirtyCount} ${dirtyCount === 1 ? 'modifica' : 'modifiche'})`,
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alberatura"
        subtitle="Visualizzazione e gestione delle relazioni padre-figlio tra i server."
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Search value={search} onChange={setSearch} />

        <TextButton
          type="button"
          onClick={() => setCollapsed(new Set())}
          className="shrink-0 font-medium text-primary hover:text-primary hover:bg-primary/10"
        >
          Espandi tutto
        </TextButton>

        <TextButton
          type="button"
          onClick={collapseAll}
          className="shrink-0 font-medium text-primary hover:text-primary hover:bg-primary/10"
        >
          Comprimi tutto
        </TextButton>

        <span className="ml-auto flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <CornerDownRight size={13} className="shrink-0" />
          <span className="truncate">
            Trascina un server su un altro per renderlo suo figlio
          </span>
        </span>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="space-y-1 rounded-xl border border-border bg-card p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDragId(null)}
        >
          <div className="rounded-xl border border-border bg-card p-2">
            {rows.map(({ server, depth, childIds }) => (
              <TreeRow
                key={server.id}
                server={server}
                depth={depth}
                childCount={childIds.length}
                isCentral={server.id === root?.id}
                isCollapsed={!query && collapsed.has(server.id)}
                isMoved={draft[server.id] !== undefined}
                dropDisabled={!canDropOn(server.id)}
                menuOpen={menuFor === server.id}
                moveTargets={moveTargets}
                onToggle={() => toggleCollapsed(server.id)}
                onMenuOpenChange={(open) =>
                  setMenuFor(open ? server.id : null)
                }
                onSelectParent={(parentId) => {
                  setMenuFor(null)
                  if (parentId) moveServer(server.id, parentId)
                }}
              />
            ))}

            {rows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <Server size={22} className="text-primary" />
                </div>

                <p className="text-sm font-medium text-foreground">
                  Nessun server trovato
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Prova a modificare la ricerca.
                </p>
              </div>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {dragServer && (
              <div className="flex h-11 w-max cursor-grabbing items-center gap-2 rounded-lg border border-border bg-card px-3 shadow-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-accent text-accent-foreground">
                  <Server size={14} />
                </span>

                <span className="text-[13px] font-semibold text-foreground">
                  {dragServer.name}
                </span>

                <span className="font-mono text-xs text-muted-foreground">
                  {dragServer.ip}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Pending changes bar */}
      {dirtyCount > 0 && (
        <div className="sticky bottom-2 z-40 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />

          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">
              {dirtyCount === 1
                ? '1 modifica in sospeso'
                : `${dirtyCount} modifiche in sospeso`}
            </p>

            <p className="text-xs text-muted-foreground">
              Le modifiche all'alberatura non sono ancora applicate.
            </p>
          </div>

          <span className="ml-auto" />

          <OutlinedButton type="button" onClick={() => setDraft({})}>
            Annulla
          </OutlinedButton>

          <FilledButton type="button" onClick={handleSave}>
            Salva modifiche
          </FilledButton>
        </div>
      )}
    </div>
  )
}
