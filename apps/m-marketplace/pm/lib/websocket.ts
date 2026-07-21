/**
 * WebSocket Client for Real-time PM Updates
 */

type WebSocketMessage = {
  type: string
  event?: string
  channel?: string
  data?: any
}

type WebSocketCallbacks = {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

class PMWebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private callbacks: WebSocketCallbacks = {}
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 5000
  private isConnecting = false
  private isManualClose = false

  constructor(url: string) {
    this.url = url
  }

  connect(callbacks?: WebSocketCallbacks) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    if (this.isConnecting) {
      return // Already connecting
    }

    this.callbacks = callbacks || {}
    this.isManualClose = false
    this.isConnecting = true

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.callbacks.onConnect?.()
        // Subscribe to PM task updates
        this.send({ type: "subscribe", channel: "pm_tasks" })
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          this.callbacks.onMessage?.(message)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      this.ws.onerror = (error) => {
        this.isConnecting = false
        this.callbacks.onError?.(error)
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.callbacks.onDisconnect?.()

      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.callbacks)
          }, this.reconnectDelay)
        }
      }
    } catch (error) {
      this.isConnecting = false
      this.callbacks.onError?.(error as Event)
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket is not connected")
    }
  }

  disconnect() {
    this.isManualClose = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.ws?.close()
    this.ws = null
  }

  getStatus(): "disconnected" | "connecting" | "connected" | "error" {
    if (!this.ws) return "disconnected"
    if (this.ws.readyState === WebSocket.CONNECTING) return "connecting"
    if (this.ws.readyState === WebSocket.OPEN) return "connected"
    return "error"
  }
}

let wsClientSingleton: PMWebSocketClient | null = null

export function getWebSocketClient(): PMWebSocketClient | null {
  const url = process.env.NEXT_PUBLIC_PM_WS_URL
  if (!url) {
    return null
  }

  if (!wsClientSingleton) {
    wsClientSingleton = new PMWebSocketClient(url)
  }

  return wsClientSingleton
}

export function usePMWebSocket(callbacks?: WebSocketCallbacks) {
  const client = getWebSocketClient()

  React.useEffect(() => {
    if (!client) return

    client.connect(callbacks)

    return () => {
      client.disconnect()
    }
  }, [client, callbacks])

  return {
    status: client?.getStatus() || "disconnected",
    send: (message: WebSocketMessage) => client?.send(message),
  }
}

export { PMWebSocketClient }
