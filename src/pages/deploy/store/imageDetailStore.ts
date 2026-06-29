import { create } from 'zustand'
import type { ServiceByImage } from '@/client/coolify'

interface ImageDetailState {
  isOpen: boolean
  imageName: string | null
  version: string | null
  services: ServiceByImage[]
  open: (imageName: string, version: string, services: ServiceByImage[]) => void
  close: () => void
}

export const useImageDetailStore = create<ImageDetailState>((set) => ({
  isOpen: false,
  imageName: null,
  version: null,
  services: [],
  open: (imageName, version, services) =>
    set({ isOpen: true, imageName, version, services }),
  close: () => set({ isOpen: false }),
}))
