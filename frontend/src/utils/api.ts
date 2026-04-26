/**
 * API utilities and helpers
 */

import { AxiosError } from 'axios'

export function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)

  return filtered.length > 0 ? '?' + filtered.join('&') : ''
}

export function parseError(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.detail || error.message || 'Error desconocido'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Error desconocido'
}
