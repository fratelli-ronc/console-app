import { create } from 'zustand'
import type { ServicesByVersionMap } from '@/client/coolify'

interface UpdateImageState {
  isOpen: boolean
  imageName: string | null
  versions: ServicesByVersionMap
  completedAt: number | null
  open: (imageName: string, versions: ServicesByVersionMap) => void
  close: () => void
  markCompleted: () => void
}

export const useUpdateImageStore = create<UpdateImageState>((set) => ({
  isOpen: false,
  imageName: null,
  versions: {},
  completedAt: null,
  open: (imageName, versions) => set({ isOpen: true, imageName, versions }),
  close: () => set({ isOpen: false }),
  markCompleted: () => set({ completedAt: Date.now() }),
}))
