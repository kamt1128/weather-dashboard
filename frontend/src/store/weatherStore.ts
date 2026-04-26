/**
 * Zustand store for weather data
 */

import { create } from 'zustand'
import { WeatherData, DashboardData } from '@/types/weather'

interface WeatherStore {
  city1: string
  city2: string
  setCity1: (c: string) => void
  setCity2: (c: string) => void
  dashboard: DashboardData | null
  setDashboard: (d: DashboardData | null) => void
  liveUpdates: WeatherData[]
  pushLiveUpdate: (w: WeatherData) => void
  loading: boolean
  setLoading: (b: boolean) => void
  error: string | null
  setError: (e: string | null) => void
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  city1: 'Bogotá',
  city2: 'Madrid',
  setCity1: (c) => set({ city1: c }),
  setCity2: (c) => set({ city2: c }),
  dashboard: null,
  setDashboard: (d) => set({ dashboard: d }),
  liveUpdates: [],
  pushLiveUpdate: (w) =>
    set((state) => ({
      liveUpdates: [w, ...state.liveUpdates].slice(0, 50),
    })),
  loading: false,
  setLoading: (b) => set({ loading: b }),
  error: null,
  setError: (e) => set({ error: e }),
}))
