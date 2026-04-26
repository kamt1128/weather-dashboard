/**
 * Hook for WebSocket connection and subscription management
 */

import { useEffect } from 'react'
import { wsManager } from '@/services/websocket'
import { cacheWeatherList } from '@/services/storage'
import { useWeatherStore } from '@/store/weatherStore'
import { useUIStore } from '@/store/uiStore'

export function useWebSocket(): void {
  const { city1, city2, pushLiveUpdate } = useWeatherStore()
  const { setWsStatus } = useUIStore()

  useEffect(() => {
    const handleMessage = async (data: any) => {
      pushLiveUpdate(data)
      await cacheWeatherList([data])
    }

    const handleOpen = () => {
      setWsStatus('online')
      wsManager.subscribe([city1, city2])
    }

    const handleClose = () => {
      setWsStatus('offline')
    }

    const handleError = (error: any) => {
      console.error('WS error:', error)
      setWsStatus('offline')
    }

    setWsStatus('connecting')
    const url = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/weather/'
    wsManager.connect(url)

    wsManager.on('message', handleMessage)
    wsManager.on('open', handleOpen)
    wsManager.on('close', handleClose)
    wsManager.on('error', handleError)

    return () => {
      wsManager.off('message', handleMessage)
      wsManager.off('open', handleOpen)
      wsManager.off('close', handleClose)
      wsManager.off('error', handleError)
      wsManager.disconnect()
    }
  }, [])

  // Re-subscribe when cities change
  useEffect(() => {
    wsManager.subscribe([city1, city2])
  }, [city1, city2])
}
