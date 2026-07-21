/**
 * React hook for PM WebSocket connection
 */

import { useEffect, useState } from "react"
import { PMWebSocketClient } from "@pm/lib/websocket"

type WebSocketCallbacks = {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: any) => void
}

export function usePMWebSocket(callbacks?: WebSocketCallbacks) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected")
  const [client, setClient] = useState<PMWebSocketClient | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_PM_WS_URL
    if (!url) {
      return
    }

    const wsClient = new PMWebSocketClient(url)

    wsClient.connect({
      onConnect: () => {
        setStatus("connected")
        callbacks?.onConnect?.()
      },
      onDisconnect: () => {
        setStatus("disconnected")
        callbacks?.onDisconnect?.()
      },
      onError: (error) => {
        setStatus("error")
        callbacks?.onError?.(error)
      },
      onMessage: (message) => {
        callbacks?.onMessage?.(message)
      },
    })

    setClient(wsClient)

    return () => {
      wsClient.disconnect()
    }
  }, [])

  return {
    status,
    send: (message: any) => client?.send(message),
  }
}
