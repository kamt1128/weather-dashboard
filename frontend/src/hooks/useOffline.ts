/**
 * Hook for offline/online state management with pending sync queue drainage
 */

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { fetchDashboard } from '@/services/api'
import { getPendingSync, removePendingSync, cacheDashboard } from '@/services/storage'

/**
 * Drains the pending sync queue when connection is restored.
 * Retries failed fetch_dashboard operations and removes them from queue on success.
 */
async function drainPendingSync(): Promise<void> {
  const items = await getPendingSync()
  if (items.length === 0) return

  console.info(`[offline-sync] Reintentando ${items.length} acción(es) pendiente(s)...`)

  for (const item of items) {
    try {
      if (item.action === 'fetch_dashboard') {
        const { city1, city2 } = item.payload
        const data = await fetchDashboard(city1, city2)
        await cacheDashboard(city1, city2, data)
        await removePendingSync(item.id)
        console.info(`[offline-sync] OK: fetch_dashboard(${city1}, ${city2})`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.warn(`[offline-sync] Falló (reintentaremos después): ${item.action}`, message)
      // Leave in queue for next reconnect attempt
    }
  }
}

export function useOffline(): void {
  const { setOnline } = useUIStore()

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true)
      // Drain pending sync queue when connection is restored
      await drainPendingSync()
    }

    const handleOffline = () => {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])
}
