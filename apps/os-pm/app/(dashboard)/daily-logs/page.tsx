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

type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy" | "windy"

interface DailyLog {
  id: string
  date: string
  dayOfWeek: string
  weather: WeatherType
  tempHigh: number
  tempLow: number
  crewCount: number
  workPerformed: string[]
  hoursLogged: number
  materialsReceived: string[]
  visitors: string[]
  delaysNoted: string | null
  project: string
}

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

const MOCK_DAILY_LOGS: DailyLog[] = [
  {
    id: "DL-007", date: "2026-02-12", dayOfWeek: "Thursday",
    weather: "sunny", tempHigh: 58, tempLow: 42,
    crewCount: 24, hoursLogged: 192,
    workPerformed: ["Continued foundation wall forming on grid lines C-F", "Installed underground plumbing rough-in at elevator pit", "Received and staged structural steel delivery"],
    materialsReceived: ["W12x26 structural steel beams (12 ea)", "4\" PVC DWV pipe (200 LF)"],
    visitors: ["Building Inspector - Davis County", "Owner representative - John Mitchell"],
    delaysNoted: null, project: "Riverside Commons",
  },
  {
    id: "DL-006", date: "2026-02-11", dayOfWeek: "Wednesday",
    weather: "cloudy", tempHigh: 52, tempLow: 38,
    crewCount: 22, hoursLogged: 176,
    workPerformed: ["Stripped footing forms at grid lines A-C", "Placed rebar for foundation walls section 2", "Backfilled and compacted utility trenches"],
    materialsReceived: ["#5 rebar (4 tons)", "Form ties and hardware"],
    visitors: ["Geotechnical engineer - soil compaction testing"],
    delaysNoted: null, project: "Riverside Commons",
  },
  {
    id: "DL-005", date: "2026-02-10", dayOfWeek: "Tuesday",
    weather: "rainy", tempHigh: 48, tempLow: 36,
    crewCount: 12, hoursLogged: 72,
    workPerformed: ["Interior work only due to rain - layout for MEP penetrations", "Reviewed shop drawings with steel fabricator"],
    materialsReceived: [],
    visitors: [],
    delaysNoted: "Heavy rain from 6AM to 2PM. Exterior concrete work postponed. Lost approximately 4 hours of productive time for exterior crews.",
    project: "Riverside Commons",
  },
  {
    id: "DL-004", date: "2026-02-09", dayOfWeek: "Monday",
    weather: "cloudy", tempHigh: 50, tempLow: 34,
    crewCount: 26, hoursLogged: 208,
    workPerformed: ["Poured concrete for footings at grid lines A-C (42 CY)", "Set anchor bolts for structural steel base plates", "Installed perimeter drain tile and waterproofing"],
    materialsReceived: ["Ready-mix concrete (42 CY)", "Bituthene waterproofing membrane (800 SF)"],
    visitors: ["Architect - site observation visit"],
    delaysNoted: null, project: "Riverside Commons",
  },
  {
    id: "DL-003", date: "2026-02-08", dayOfWeek: "Sunday",
    weather: "sunny", tempHigh: 55, tempLow: 40,
    crewCount: 8, hoursLogged: 48,
    workPerformed: ["Weekend crew - continued rebar placement for footings", "Dewatering pump maintenance and monitoring"],
    materialsReceived: [],
    visitors: [],
    delaysNoted: null, project: "Riverside Commons",
  },
  {
    id: "DL-002", date: "2026-02-07", dayOfWeek: "Saturday",
    weather: "windy", tempHigh: 46, tempLow: 32,
    crewCount: 14, hoursLogged: 84,
    workPerformed: ["Excavated for grade beams at building east side", "Installed vapor barrier under slab-on-grade area"],
    materialsReceived: ["10-mil vapor barrier (2000 SF)"],
    visitors: [],
    delaysNoted: "High winds (35+ mph gusts) halted crane operations from 1PM onward. Crane crew reassigned to ground-level tasks.",
    project: "Riverside Commons",
  },
  {
    id: "DL-001", date: "2026-02-06", dayOfWeek: "Friday",
    weather: "sunny", tempHigh: 54, tempLow: 38,
    crewCount: 28, hoursLogged: 224,
    workPerformed: ["Completed footing excavation for grid lines D-F", "Placed mudsill and leveling pads", "Installed temporary power distribution panel", "OSHA safety walk-through with site superintendent"],
    materialsReceived: ["Temporary electrical panel and wire", "Mudsill lumber (2x6 PT)"],
    visitors: ["OSHA compliance officer", "Electrical subcontractor foreman"],
    delaysNoted: null, project: "Riverside Commons",
  },
]

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export default function DailyLogsPage() {
  const [expandedLog, setExpandedLog] = React.useState<string | null>("DL-007")
  const [weekOffset, setWeekOffset] = React.useState(0)

  const stats = React.useMemo(() => {
    const totalLogs = MOCK_DAILY_LOGS.length
    const avgCrew = Math.round(MOCK_DAILY_LOGS.reduce((sum, l) => sum + l.crewCount, 0) / totalLogs)
    const totalHours = MOCK_DAILY_LOGS.reduce((sum, l) => sum + l.hoursLogged, 0)
    const delayDays = MOCK_DAILY_LOGS.filter((l) => l.delaysNoted).length
    return { totalLogs, avgCrew, totalHours, delayDays }
  }, [])

  const weekDays = React.useMemo(() => {
    const today = new Date("2026-02-12T00:00:00")
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const log = MOCK_DAILY_LOGS.find((l) => l.date === dateStr)
      return { date: d, dateStr, dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }), dayNum: d.getDate(), hasLog: !!log, isToday: dateStr === "2026-02-12" }
    })
  }, [weekOffset])

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
                  const log = MOCK_DAILY_LOGS.find((l) => l.date === d.dateStr)
                  if (log) setExpandedLog(log.id)
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
        {MOCK_DAILY_LOGS.map((log) => {
          const WeatherIcon = WEATHER_ICONS[log.weather]
          const isExpanded = expandedLog === log.id
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
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg", WEATHER_COLORS[log.weather])}>
                      <WeatherIcon size={16} />
                      <span className="text-sm font-medium">{log.tempHigh}F</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Users size={14} />{log.crewCount} crew</span>
                      <span className="flex items-center gap-1"><Clock size={14} />{log.hoursLogged} hrs</span>
                      {log.materialsReceived.length > 0 && <span className="flex items-center gap-1"><Truck size={14} />{log.materialsReceived.length} deliveries</span>}
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
                          {log.workPerformed.map((item, i) => (
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
                            {log.weather.charAt(0).toUpperCase() + log.weather.slice(1)} - High: {log.tempHigh}F / Low: {log.tempLow}F
                          </p>
                        </div>
                        {log.materialsReceived.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Truck size={14} />Materials Received</h4>
                            <ul className="space-y-1">
                              {log.materialsReceived.map((item, i) => (
                                <li key={i} className="text-sm text-gray-600">- {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {log.visitors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Users size={14} />Visitors</h4>
                            <ul className="space-y-1">
                              {log.visitors.map((item, i) => (
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
