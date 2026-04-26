/**
 * IndexedDB storage service using Dexie
 */

import Dexie, { Table } from 'dexie'
import { WeatherData, DashboardData } from '@/types/weather'

export interface StoredWeatherData extends WeatherData {
  syncedAt?: number
}

interface StoredDashboard {
  key: string
  data: DashboardData
  timestamp: number
}

interface PendingSync {
  id?: number
  action: string
  payload: any
  timestamp: number
}

export class WeatherDatabase extends Dexie {
  weather!: Table<StoredWeatherData>
  dashboard!: Table<StoredDashboard>
  pendingSync!: Table<PendingSync>

  constructor() {
    super('WeatherDB')
    this.version(1).stores({
      weather: '++id, city, timestamp, [city+timestamp]',
      dashboard: 'key, [city1+city2]',
      pendingSync: '++id, action, timestamp',
    })
  }
}

export const db = new WeatherDatabase()

export async function cacheWeatherList(items: WeatherData[]): Promise<void> {
  await db.weather.bulkPut(items)
}

export async function getCachedWeather(city?: string): Promise<WeatherData[]> {
  if (city) {
    return await db.weather.where('city').equals(city).toArray()
  }
  return await db.weather.toArray()
}

export async function cacheDashboard(
  city1: string,
  city2: string,
  data: DashboardData
): Promise<void> {
  const key = `${city1}:${city2}`
  await db.dashboard.put({
    key,
    data,
    timestamp: Date.now(),
  })
}

export async function getCachedDashboard(
  city1: string,
  city2: string
): Promise<DashboardData | null> {
  const key = `${city1}:${city2}`
  const record = await db.dashboard.get(key)
  return record ? record.data : null
}

export async function clearOldCache(olderThan: Date): Promise<void> {
  const timestamp = olderThan.getTime()
  await db.weather.where('timestamp').below(timestamp.toString()).delete()
  await db.dashboard.where('timestamp').below(timestamp).delete()
}
