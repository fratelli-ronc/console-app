export interface LoginResponse {
  token: string
  refresh_token: string
}

export interface UserProfile {
  id: string
  email: string
}
