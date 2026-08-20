export const UserAuthLevel = {
  ReadOnly: 0,
  User: 1,
  Work: 2,
  WorkTec: 3,
  Admin: 4,
  SuperAdmin: 5,
} as const

export type UserAuthLevel = (typeof UserAuthLevel)[keyof typeof UserAuthLevel]

export interface LoginResponse {
  token: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  username: string
  authorization: UserAuthLevel
  name: string
  email: string
  phone: string
  avatar: string
}

export interface AuthUser {
  id: number
  username: string
  authorization: UserAuthLevel
  name: string
  email: string
  phone: string
  avatar: string
  enabled: boolean
}

export interface ListUsersResponse {
  users: AuthUser[]
}

export interface UpsertUserRequest {
  username: string
  password?: string
  name: string
  email: string
  phone: string
  authLevel: UserAuthLevel
  enabled?: boolean
}

export interface UserProfilationScope {
  allowAll: boolean
}

export interface UserProfilation {
  user: AuthUser
  scope: UserProfilationScope
}

export type SyncEventType = 'upsert' | 'delete'

export interface SyncFailingOp {
  id: string
  userId: number
  eventType: SyncEventType
  attempts: number
  lastError: string
  updatedAt: string
}

export interface SyncNodeStatus {
  name: string
  bootstrapped: boolean
  pending: number
  failing: SyncFailingOp[]
}

export interface SyncStatusResponse {
  nodes: SyncNodeStatus[]
}
