/**
 * Formatting utilities for weather data
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

export function formatTemperature(t: number): string {
  return `${t.toFixed(1)}°C`
}

export function formatHumidity(h: number): string {
  return `${h}%`
}

export function formatWind(w: number): string {
  return `${w.toFixed(1)} m/s`
}

export function formatTimestamp(t: string): string {
  return dayjs(t).fromNow()
}

export function formatDatetime(t: string): string {
  return dayjs(t).format('DD/MM/YYYY HH:mm')
}

export function getWeatherIcon(temp: number, humidity: number): string {
  if (temp > 25) return '☀️'
  if (temp > 15) return '🌤️'
  if (temp > 5) return '☁️'
  if (humidity > 70) return '🌧️'
  return '❄️'
}
