/**
 * UI/connection state store using Zustand
 */

import { create } from 'zustand'
import { ConnectionStatus } from '@/types/weather'

interface UIStore {
  isOnline: boolean
  setOnline: (b: boolean) => void
  wsStatus: ConnectionStatus
  setWsStatus: (s: ConnectionStatus) => void
  printMode: boolean
  setPrintMode: (b: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (b) => set({ isOnline: b }),
  wsStatus: 'offline',
  setWsStatus: (s) => set({ wsStatus: s }),
  printMode: false,
  setPrintMode: (b) => set({ printMode: b }),
}))
