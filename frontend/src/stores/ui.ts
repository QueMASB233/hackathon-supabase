import { create } from 'zustand'

type UiState = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  bootPlayed: boolean
  setBootPlayed: () => void
  composer: string
  setComposer: (value: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  bootPlayed: false,
  setBootPlayed: () => set({ bootPlayed: true }),
  composer: '',
  setComposer: (value) => set({ composer: value }),
}))
