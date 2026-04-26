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

export async function fetchWeatherList(params: {
  page?: number
  page_size?: number
  city?: string
  search?: string
}): Promise<PaginatedResponse<WeatherData>> {
  const response = await apiClient.get<PaginatedResponse<WeatherData>>('/weather/', {
    params,
  })
  return response.data
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
