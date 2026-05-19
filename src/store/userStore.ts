import { UserProfile } from '@/client'
import { create } from 'zustand'

interface UserState {
  user: UserProfile | null
  setUser: (user: UserProfile) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
