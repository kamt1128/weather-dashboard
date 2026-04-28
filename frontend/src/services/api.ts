/**
 * API client service with axios
 */

import axios, { AxiosError } from 'axios'
import { WeatherData, PaginatedResponse, DashboardData } from '@/types/weather'
import { useUIStore } from '@/store/uiStore'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.message)

    // Network error
    if (!error.response) {
      useUIStore.setState({ isOnline: false })
    }

    return Promise.reject(error)
  }
)

interface WeatherListResponse
  extends PaginatedResponse<WeatherData> {
  page: number
  page_size: number
}

type WeatherListRawResponse =
  | WeatherData[]
  | (Partial<WeatherListResponse> & {
      results?: WeatherData[]
    })

function normalizeWeatherListResponse(
  raw: WeatherListRawResponse,
  params: { page?: number; page_size?: number }
): WeatherListResponse {
  if (Array.isArray(raw)) {
    const fallbackPageSize = params.page_size ?? 20
    return {
      page: params.page ?? 1,
      page_size: fallbackPageSize,
      count: raw.length,
      next: null,
      previous: null,
      results: raw,
    }
  }

  const results = Array.isArray(raw.results) ? raw.results : []
  return {
    page: typeof raw.page === 'number' ? raw.page : params.page ?? 1,
    page_size:
      typeof raw.page_size === 'number' ? raw.page_size : params.page_size ?? 20,
    count: typeof raw.count === 'number' ? raw.count : results.length,
    next: raw.next ?? null,
    previous: raw.previous ?? null,
    results,
  }
}

export async function fetchWeatherList(params: {
  page?: number
  page_size?: number
  city?: string
  search?: string
}): Promise<WeatherListResponse> {
  const response = await apiClient.get<WeatherListRawResponse>('/weather/', {
    params,
  })
  return normalizeWeatherListResponse(response.data, params)
}

export async function fetchDashboard(city1: string, city2: string): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>('/weather/dashboard-data/', {
    params: { city1, city2 },
  })
  return response.data
}

export function exportCsvUrl(params: {
  city?: string
  start_date?: string
  end_date?: string
}): string {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()
  return `${apiUrl}/weather/export-csv/?${queryString}`
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await apiClient.get<{ status: string }>('/health/')
  return response.data
}

export default apiClient
