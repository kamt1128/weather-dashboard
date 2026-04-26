/**
 * WebSocket service with exponential backoff and ping/pong
 */

import { WSMessage } from '@/types/weather'

type EventCallback = (data: any) => void

export class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private pingInterval: NodeJS.Timeout | null = null
  private pongTimeout: NodeJS.Timeout | null = null
  private listeners: Record<string, EventCallback[]> = {}
  private subscribedCities: string[] = []

  constructor(
    url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/weather/'
  ) {
    this.url = url
  }

  connect(url?: string): Promise<void> {
    if (url) this.url = url

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.startPing()
          this.emit('open', null)

          // Re-subscribe to saved cities
          if (this.subscribedCities.length > 0) {
            this.subscribe(this.subscribedCities)
          }

          resolve()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.stopPing()
          this.emit('close', null)
          this.attemptReconnect()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data)
            if (message.type === 'pong') {
              this.clearPongTimeout()
            } else if (message.type === 'weather.update' && message.payload) {
              this.emit('message', message.payload)
            } else if (message.type === 'error') {
              this.emit('error', message.message)
            }
          } catch (error) {
            console.error('WebSocket parse error:', error)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.stopPing()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  subscribe(cities: string[]): void {
    this.subscribedCities = cities
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ subscribe: cities })
    }
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: EventCallback): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data))
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' })
      this.setPongTimeout()
    }, 25000)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    this.clearPongTimeout()
  }

  private setPongTimeout(): void {
    this.clearPongTimeout()
    this.pongTimeout = setTimeout(() => {
      console.warn('Pong timeout, reconnecting...')
      this.disconnect()
      this.connect()
    }, 10000)
  }

  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout)
      this.pongTimeout = null
    }
  }

  private attemptReconnect(): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )
    this.reconnectAttempts++
    console.log(`Attempting to reconnect in ${delay}ms...`)
    setTimeout(() => this.connect(), delay)
  }
}

export const wsManager = new WebSocketManager()
