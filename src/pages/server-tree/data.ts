import type { Server } from '@/client/coolify'
import type { ServerTreeRelation } from '@/client'

export interface TreeServer {
  id: string
  name: string
  ip: string
  parent: string | null
}

// Static IP of the center node — the root of the tree.
export const CENTRAL_SERVER_IP = '10.0.10.69'

// The console /server-tree endpoint doesn't exist yet, so relations are
// mocked as empty for now (every server falls back to being a direct child
// of the center). Swap for a real getServerTree() call once it ships.
export const MOCK_SERVER_TREE_RELATIONS: ServerTreeRelation[] = []

// Numeric comparison of dotted IPv4 addresses (a plain string sort would put
// "10.0.10.10" before "10.0.10.9").
export function compareIp(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 4; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

// Combines the flat server list with the server-tree parent/children relations
// into the flat { id, parent } shape the tree UI works with. A server with no
// entry in `relations` is implied to be a direct child of the center node.
export function buildTreeServers(
  servers: Server[],
  relations: ServerTreeRelation[],
): TreeServer[] {
  const centralId = servers.find((s) => s.ip === CENTRAL_SERVER_IP)?.uuid ?? null

  const parentOf = new Map<string, string>()
  for (const relation of relations) {
    for (const childId of relation.childrenServerIds) {
      parentOf.set(childId, relation.serverId)
    }
  }

  return servers.map((s) => ({
    id: s.uuid,
    name: s.name,
    ip: s.ip,
    parent: s.uuid === centralId ? null : (parentOf.get(s.uuid) ?? centralId),
  }))
}
