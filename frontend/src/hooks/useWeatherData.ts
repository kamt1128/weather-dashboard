/**
 * Hook for fetching dashboard and weather list data with offline fallback
 */

import { useEffect, useState } from 'react'
import { fetchDashboard, fetchWeatherList } from '@/services/api'
import { getCachedDashboard, cacheDashboard, getCachedWeather, cacheWeatherList } from '@/services/storage'
import { useWeatherStore } from '@/store/weatherStore'
import { useUIStore } from '@/store/uiStore'
import { DashboardData, WeatherData } from '@/types/weather'

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(city1: string, city2: string): UseDashboardReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { dashboard, setDashboard, setLoading: setStoreLoading, setError: setStoreError } =
    useWeatherStore()
  const { isOnline } = useUIStore()

  const refetch = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isOnline) {
        const data = await fetchDashboard(city1, city2)
        setDashboard(data)
        await cacheDashboard(city1, city2, data)
      } else {
        // Offline mode: try cache
        const cached = await getCachedDashboard(city1, city2)
        if (cached) {
          setDashboard(cached)
        } else {
          setError('No hay datos en caché disponibles')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el dashboard'
      setError(message)
      setStoreError(message)

      // Try cache as fallback
      const cached = await getCachedDashboard(city1, city2)
      if (cached) {
        setDashboard(cached)
        setError(null)
      }
    } finally {
      setLoading(false)
      setStoreLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [city1, city2, isOnline])

  return { data: dashboard, loading, error, refetch }
}

interface UseWeatherListParams {
  page?: number
  page_size?: number
  city?: string
  search?: string
}

interface UseWeatherListReturn {
  data: WeatherData[]
  total: number
  loading: boolean
  error: string | null
}

export function useWeatherList(params: UseWeatherListParams): UseWeatherListReturn {
  const [data, setData] = useState<WeatherData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isOnline } = useUIStore()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (isOnline) {
          const response = await fetchWeatherList(params)
          setData(response.results)
          setTotal(response.count)
          await cacheWeatherList(response.results)
        } else {
          const cached = await getCachedWeather(params.city)
          setData(cached)
          setTotal(cached.length)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar datos'
        setError(message)
        const cached = await getCachedWeather(params.city)
        setData(cached)
        setTotal(cached.length)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.page, params.page_size, params.city, isOnline])

  return { data, total, loading, error }
}
