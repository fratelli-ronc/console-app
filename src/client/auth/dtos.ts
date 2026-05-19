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
  refresh_token: string
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
