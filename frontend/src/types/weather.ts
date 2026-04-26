/**
 * Type definitions for weather data
 */

export interface WeatherData {
  id: number
  city: string
  temperature: number
  humidity: number
  wind_speed: number
  timestamp: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface DashboardCity {
  name: string
  latest: WeatherData
  history: WeatherData[]
}

export interface DashboardData {
  city1: DashboardCity
  city2: DashboardCity
}

export interface WSMessage {
  type: 'weather.update' | 'pong' | 'error'
  payload?: WeatherData
  message?: string
}

export type ConnectionStatus = 'online' | 'offline' | 'connecting'

export interface WeatherFilter {
  city?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}
