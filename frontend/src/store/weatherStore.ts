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
  applyRealtimeUpdate: (w: WeatherData) => void
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
  applyRealtimeUpdate: (w) =>
    set((state) => {
      if (!state.dashboard) {
        return {}
      }

      const normalize = (value: string) => value.trim().toLowerCase()
      const sameCity = (a: string, b: string) => normalize(a) === normalize(b)
      const updateHistory = (history: WeatherData[]) =>
        [w, ...history.filter((item) => item.id !== w.id)].slice(0, 24)

      const city1Matches =
        sameCity(w.city, state.dashboard.city1.name) || sameCity(w.city, state.city1)
      const city2Matches =
        sameCity(w.city, state.dashboard.city2.name) || sameCity(w.city, state.city2)

      if (!city1Matches && !city2Matches) {
        return {}
      }

      return {
        dashboard: {
          ...state.dashboard,
          city1: city1Matches
            ? {
                ...state.dashboard.city1,
                latest: w,
                history: updateHistory(state.dashboard.city1.history),
              }
            : state.dashboard.city1,
          city2: city2Matches
            ? {
                ...state.dashboard.city2,
                latest: w,
                history: updateHistory(state.dashboard.city2.history),
              }
            : state.dashboard.city2,
        },
      }
    }),
  loading: false,
  setLoading: (b) => set({ loading: b }),
  error: null,
  setError: (e) => set({ error: e }),
}))
