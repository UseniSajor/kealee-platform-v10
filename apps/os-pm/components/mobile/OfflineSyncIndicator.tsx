"use client"

import * as React from "react"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface OfflineSyncIndicatorProps {
  isOnline: boolean
  pendingChanges: number
}

export function OfflineSyncIndicator({
  isOnline,
  pendingChanges,
}: OfflineSyncIndicatorProps) {
  if (isOnline && pendingChanges === 0) {
    return null // Don't show when online and synced
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Online</span>
                {pendingChanges > 0 && (
                  <span className="text-xs text-neutral-600">
                    Syncing {pendingChanges} changes...
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Offline</span>
                {pendingChanges > 0 && (
                  <span className="text-xs text-neutral-600">
                    {pendingChanges} pending
                  </span>
                )}
              </>
            )}
          </div>
          {pendingChanges > 0 && (
            <RefreshCw className="h-4 w-4 text-neutral-400 animate-spin" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
