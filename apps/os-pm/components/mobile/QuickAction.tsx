"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface QuickActionProps {
  icon: string
  label: string
  onClick: () => void
  integration?: string
}

export function QuickAction({ icon, label, onClick, integration }: QuickActionProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-neutral-50 active:scale-95 transition-transform"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-2">{icon}</div>
        <div className="text-sm font-medium">{label}</div>
        {integration && (
          <div className="text-xs text-neutral-500 mt-1">{integration}</div>
        )}
      </CardContent>
    </Card>
  )
}
