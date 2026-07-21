"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@pm/lib/utils"

type Change = {
  value: number
  label?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  change,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  iconClassName?: string
  change?: Change
}) {
  const isUp = (change?.value ?? 0) >= 0
  const ChangeIcon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-700">{title}</CardTitle>
        <div className={cn("rounded-md p-2 bg-neutral-100 text-neutral-700", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="text-2xl font-bold leading-none">{value}</div>
          {change ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                isUp ? "text-emerald-700" : "text-red-700"
              )}
            >
              <ChangeIcon className="h-4 w-4" />
              <span>
                {Math.abs(change.value)}% {isUp ? "up" : "down"}
              </span>
              {change.label ? <span className="text-neutral-500 font-normal">• {change.label}</span> : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

