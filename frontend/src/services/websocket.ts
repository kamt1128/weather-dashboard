/**
 * WebSocket service with exponential backoff and ping/pong
 */

import { WSMessage } from '@/types/weather'

type EventCallback = (data: any) => void

export class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectDelay = 30000
  private pingInterval: ReturnType<typeof setTimeout> | null = null
  private pongTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionalClose = false
  private listeners: Record<string, EventCallback[]> = {}
  private subscribedCities: string[] = []

  constructor(
    url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/weather/'
  ) {
    this.url = url
  }

  connect(url?: string): Promise<void> {
    if (url) this.url = url

    // Cancela cualquier reconexión pendiente
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // Si ya hay un socket activo o conectando, no abrir otro
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return Promise.resolve()
    }

    this.intentionalClose = false

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
          // Solo intenta reconectar si el cierre NO fue intencional
          if (!this.intentionalClose) {
            this.attemptReconnect()
          }
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WSMessage & {
              data?: Record<string, unknown>
            }

            if (message.type === 'pong') {
              this.clearPongTimeout()
            } else if (message.type === 'weather.update') {
              const payload = message.payload ?? message.data
              if (payload) {
                this.emit('message', payload)
              }
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
    this.intentionalClose = true
    this.stopPing()
    // Cancela cualquier intento de reconexión pendiente
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      // Quita los handlers para que onclose no dispare lógica residual
      this.ws.onopen = null
      this.ws.onerror = null
      this.ws.onclose = null
      this.ws.onmessage = null
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close()
      }
      this.ws = null
    }
  }

  subscribe(cities: string[]): void {
    const normalizedCities = Array.from(
      new Set(cities.map((city) => city.trim()).filter(Boolean))
    )
    this.subscribedCities = normalizedCities
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'subscribe', cities: normalizedCities })
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
      // Cierra el socket actual sin marcar como intencional
      // para que onclose dispare reconexión con backoff
      if (this.ws) {
        this.ws.close()
      }
    }, 30000)
  }

  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout)
      this.pongTimeout = null
    }
  }

  private attemptReconnect(): void {
    // Evita encolar múltiples timers de reconexión en paralelo
    if (this.reconnectTimer) {
      return
    }
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )
    this.reconnectAttempts++
    console.log(`Attempting to reconnect in ${delay}ms...`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }
}

export const wsManager = new WebSocketManager()
