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
//
// The relations name servers by IP — that is the address a group carries, and
// what a deploy needs — while the tree itself works in Coolify uuids, so both
// ends are translated here. A relation naming an IP no server currently has is
// dropped, leaving that server where an unmentioned one goes: under the center.
export function buildTreeServers(
  servers: Server[],
  relations: ServerTreeRelation[],
): TreeServer[] {
  const centralId = servers.find((s) => s.ip === CENTRAL_SERVER_IP)?.uuid ?? null
  const idByIp = new Map(servers.map((s) => [s.ip, s.uuid]))

  const parentOf = new Map<string, string>()
  for (const relation of relations) {
    const parentId = idByIp.get(relation.serverIp)
    if (!parentId) continue
    for (const childIp of relation.childrenServerIps) {
      const childId = idByIp.get(childIp)
      if (childId) parentOf.set(childId, parentId)
    }
  }

  return servers.map((s) => ({
    id: s.uuid,
    name: s.name,
    ip: s.ip,
    parent: s.uuid === centralId ? null : (parentOf.get(s.uuid) ?? centralId),
  }))
}
