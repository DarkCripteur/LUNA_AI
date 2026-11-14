import { create } from 'zustand'

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  searchOpen: false,
  profileOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  setTheme: (theme) => set({ theme }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setProfileOpen: (profileOpen) => set({ profileOpen }),
}))
