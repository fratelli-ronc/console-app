export interface ServerTreeRelation {
  id: number
  serverId: string
  childrenServerIds: string[]
}

export interface ServerTreeRelationRequest {
  serverId: string
  childrenServerIds: string[]
}
