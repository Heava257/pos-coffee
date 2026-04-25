import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      isFullScreen: false,
      isHeaderVisible: true,
      isSidebarCollapsed: false,
      toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
      setFullScreen: (value) => set({ isFullScreen: value }),
      setHeaderVisible: (value) => set({ isHeaderVisible: value }),
      toggleHeader: () => set((state) => ({ isHeaderVisible: !state.isHeaderVisible })),
      setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
