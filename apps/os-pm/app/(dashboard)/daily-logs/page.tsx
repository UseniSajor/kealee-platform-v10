"use client"

import * as React from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudRain,
  CloudSnow,
  Droplets,
  HardHat,
  Loader2,
  Plus,
  Sun,
  Thermometer,
  Truck,
  Users,
  Wind,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"
import { useDailyLogs } from "@/hooks/useDailyLogs"

type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy" | "windy"

const WEATHER_ICONS: Record<WeatherType, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
}

const WEATHER_COLORS: Record<WeatherType, string> = {
  sunny: "text-yellow-500 bg-yellow-50",
  cloudy: "text-gray-500 bg-gray-100",
  rainy: "text-blue-500 bg-blue-50",
  snowy: "text-cyan-500 bg-cyan-50",
  windy: "text-teal-500 bg-teal-50",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export default function DailyLogsPage() {
  const [expandedLog, setExpandedLog] = React.useState<string | null>(null)
  const [weekOffset, setWeekOffset] = React.useState(0)

  const { data, isLoading } = useDailyLogs({})
  const items = data?.items ?? []

  // Auto-expand first log
  React.useEffect(() => {
    if (items.length > 0 && expandedLog === null) {
      setExpandedLog(items[0].id)
    }
  }, [items, expandedLog])

  const stats = React.useMemo(() => {
    const totalLogs = items.length
    const avgCrew = totalLogs > 0 ? Math.round(items.reduce((sum: number, l: any) => sum + (l.crewCount || 0), 0) / totalLogs) : 0
    const totalHours = items.reduce((sum: number, l: any) => sum + (l.hoursLogged || 0), 0)
    const delayDays = items.filter((l: any) => l.delaysNoted).length
    return { totalLogs, avgCrew, totalHours, delayDays }
  }, [items])

  const weekDays = React.useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const log = items.find((l: any) => l.date?.startsWith(dateStr))
      const todayStr = new Date().toISOString().split("T")[0]
      return { date: d, dateStr, dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }), dayNum: d.getDate(), hasLog: !!log, logId: log?.id, isToday: dateStr === todayStr }
    })
  }, [weekOffset, items])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Logs</h1>
          <p className="text-gray-500 mt-1">Daily field reports and activity tracking</p>
        </div>
        <Button className="gap-2"><Plus size={16} />New Daily Log</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Logs This Month", value: stats.totalLogs, icon: Calendar, color: "text-blue-600 bg-blue-50" },
          { label: "Avg Crew Size", value: stats.avgCrew, icon: Users, color: "text-green-600 bg-green-50" },
          { label: "Total Hours", value: stats.totalHours.toLocaleString(), icon: Clock, color: "text-purple-600 bg-purple-50" },
          { label: "Delay Days", value: stats.delayDays, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}><s.icon size={20} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
            <span className="text-sm font-medium text-gray-700">
              {weekDays[0].date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => {
                  if (d.logId) setExpandedLog(d.logId)
                }}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-colors border",
                  d.isToday ? "border-blue-500 bg-blue-50" : "border-transparent hover:bg-gray-50",
                  d.hasLog && "cursor-pointer"
                )}
              >
                <span className="text-xs text-gray-500">{d.dayLabel}</span>
                <span className={cn("text-lg font-bold", d.isToday ? "text-blue-600" : "text-gray-900")}>{d.dayNum}</span>
                {d.hasLog && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map((log: any) => {
          const WeatherIcon = WEATHER_ICONS[log.weather as WeatherType] || Cloud
          const isExpanded = expandedLog === log.id
          const workPerformed = log.workPerformed ?? []
          const materialsReceived = log.materialsReceived ?? []
          const visitors = log.visitors ?? []
          return (
            <Card key={log.id} className={cn("transition-shadow", isExpanded && "ring-2 ring-blue-200")}>
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-500">{log.dayOfWeek}</p>
                      <p className="text-lg font-bold text-gray-900">{formatDate(log.date)}</p>
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg", WEATHER_COLORS[log.weather as WeatherType] || "text-gray-500 bg-gray-100")}>
                      <WeatherIcon size={16} />
                      <span className="text-sm font-medium">{log.tempHigh}F</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Users size={14} />{log.crewCount} crew</span>
                      <span className="flex items-center gap-1"><Clock size={14} />{log.hoursLogged} hrs</span>
                      {materialsReceived.length > 0 && <span className="flex items-center gap-1"><Truck size={14} />{materialsReceived.length} deliveries</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.delaysNoted && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Delay</span>
                    )}
                    <ChevronRight size={16} className={cn("text-gray-400 transition-transform", isExpanded && "rotate-90")} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><HardHat size={14} />Work Performed</h4>
                        <ul className="space-y-1">
                          {workPerformed.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">-</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Thermometer size={14} />Weather</h4>
                          <p className="text-sm text-gray-600">
                            {(log.weather ?? "").charAt(0).toUpperCase() + (log.weather ?? "").slice(1)} - High: {log.tempHigh}F / Low: {log.tempLow}F
                          </p>
                        </div>
                        {materialsReceived.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Truck size={14} />Materials Received</h4>
                            <ul className="space-y-1">
                              {materialsReceived.map((item: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600">- {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {visitors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Users size={14} />Visitors</h4>
                            <ul className="space-y-1">
                              {visitors.map((item: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600">- {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    {log.delaysNoted && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} />Delays Noted</h4>
                        <p className="text-sm text-red-700">{log.delaysNoted}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                      <span>Log ID: {log.id}</span>
                      <span>{formatFullDate(log.date)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
