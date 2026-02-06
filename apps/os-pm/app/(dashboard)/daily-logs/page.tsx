"use client"

import * as React from "react"
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Users,
  HardHat,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type WeatherCondition = "CLEAR" | "CLOUDY" | "RAIN" | "WINDY" | "OVERCAST" | "PARTLY_CLOUDY" | "STORM"

type DailyLog = {
  id: string
  date: string // ISO date
  projectName: string
  weather: {
    condition: WeatherCondition
    tempF: number
    notes?: string
  }
  crewCount: number
  crewHours: number
  workPerformed: string
  safetyIncidents: number
  safetyNotes?: string
  status: "submitted" | "draft"
  submittedBy?: string
}

const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
  CLEAR: Sun,
  CLOUDY: Cloud,
  RAIN: CloudRain,
  WINDY: Wind,
  OVERCAST: Cloud,
  PARTLY_CLOUDY: Cloud,
  STORM: CloudRain,
}

const WEATHER_LABELS: Record<WeatherCondition, string> = {
  CLEAR: "Clear",
  CLOUDY: "Cloudy",
  RAIN: "Rain",
  WINDY: "Windy",
  OVERCAST: "Overcast",
  PARTLY_CLOUDY: "Partly Cloudy",
  STORM: "Storm",
}

const MOCK_LOGS: DailyLog[] = [
  {
    id: "dl-001",
    date: "2026-02-06T08:00:00.000Z",
    projectName: "Riverside Office Complex",
    weather: { condition: "CLEAR", tempF: 52, notes: "Morning fog cleared by 9am" },
    crewCount: 18,
    crewHours: 144,
    workPerformed:
      "Completed 3rd floor concrete pour for east wing. Began forming columns on level 2 west side. Electricians pulled wire through conduit on floors 1 and 2. Elevator shaft reinforcement ongoing.",
    safetyIncidents: 0,
    status: "submitted",
    submittedBy: "Mike Torres",
  },
  {
    id: "dl-002",
    date: "2026-02-05T08:00:00.000Z",
    projectName: "Riverside Office Complex",
    weather: { condition: "CLOUDY", tempF: 48 },
    crewCount: 16,
    crewHours: 128,
    workPerformed:
      "Set formwork for 3rd floor east wing slab. Installed rebar grid and post-tension cables. Mechanical crew continued HVAC duct installation on floor 1. Waterproofing membrane applied to foundation walls.",
    safetyIncidents: 0,
    status: "submitted",
    submittedBy: "Mike Torres",
  },
  {
    id: "dl-003",
    date: "2026-02-05T08:00:00.000Z",
    projectName: "Oakwood Residential Phase 2",
    weather: { condition: "RAIN", tempF: 44, notes: "Intermittent rain throughout the day" },
    crewCount: 8,
    crewHours: 56,
    workPerformed:
      "Interior framing on units 204-208. Plumbing rough-in for building B second floor. Rain delayed exterior sheathing work; crew reassigned to interior tasks after 10am.",
    safetyIncidents: 1,
    safetyNotes: "Minor slip on wet decking; worker assessed by on-site medic, returned to work.",
    status: "submitted",
    submittedBy: "Sarah Chen",
  },
  {
    id: "dl-004",
    date: "2026-02-04T08:00:00.000Z",
    projectName: "Oakwood Residential Phase 2",
    weather: { condition: "PARTLY_CLOUDY", tempF: 55 },
    crewCount: 12,
    crewHours: 96,
    workPerformed:
      "Exterior sheathing on building B north elevation. Window rough openings framed for units 201-203. Fire-stopping installed at floor penetrations. Siding delivery received and staged.",
    safetyIncidents: 0,
    status: "submitted",
    submittedBy: "Sarah Chen",
  },
  {
    id: "dl-005",
    date: "2026-02-04T08:00:00.000Z",
    projectName: "Downtown Parking Garage",
    weather: { condition: "WINDY", tempF: 42, notes: "Wind gusts up to 30mph, crane ops suspended at 11am" },
    crewCount: 22,
    crewHours: 154,
    workPerformed:
      "Poured level 3 deck section A. Wind conditions halted crane operations at 11am; ground-level rebar tying and form stripping continued. Installed precast stair treads for levels 1-2.",
    safetyIncidents: 0,
    status: "submitted",
    submittedBy: "James Wright",
  },
  {
    id: "dl-006",
    date: "2026-02-03T08:00:00.000Z",
    projectName: "Riverside Office Complex",
    weather: { condition: "OVERCAST", tempF: 50 },
    crewCount: 14,
    crewHours: 112,
    workPerformed:
      "Stripped forms on 2nd floor slab. Surveyor verified elevation control points. Underground utility tie-ins on south side. Material delivery: structural steel for levels 3-4 staged in laydown area.",
    safetyIncidents: 0,
    status: "submitted",
    submittedBy: "Mike Torres",
  },
  {
    id: "dl-007",
    date: "2026-02-06T08:00:00.000Z",
    projectName: "Downtown Parking Garage",
    weather: { condition: "CLEAR", tempF: 54 },
    crewCount: 20,
    crewHours: 160,
    workPerformed:
      "Crane operations resumed. Erected structural steel columns for level 4. Welding crew joined connections on level 3. Installed expansion joints on level 2 deck.",
    safetyIncidents: 0,
    status: "draft",
  },
  {
    id: "dl-008",
    date: "2026-02-02T08:00:00.000Z",
    projectName: "Maple Street Renovation",
    weather: { condition: "STORM", tempF: 38, notes: "Thunderstorm from 1pm-4pm, site evacuated" },
    crewCount: 6,
    crewHours: 30,
    workPerformed:
      "Morning: interior demolition of 2nd floor partition walls. Asbestos abatement crew completed bathroom tile removal in units A and B. Site evacuated at 1pm due to severe weather; all equipment secured.",
    safetyIncidents: 1,
    safetyNotes: "Site evacuation due to lightning within 1 mile. All personnel accounted for. No injuries.",
    status: "submitted",
    submittedBy: "Pat Reynolds",
  },
]

export default function DailyLogsPage() {
  const [logs] = React.useState<DailyLog[]>(MOCK_LOGS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [projectFilter, setProjectFilter] = React.useState("all")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const projects = React.useMemo(() => {
    const set = new Set(logs.map((l) => l.projectName))
    return Array.from(set).sort()
  }, [logs])

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return logs
      .filter((log) => {
        if (projectFilter !== "all" && log.projectName !== projectFilter) return false
        if (q && !(
          log.projectName.toLowerCase().includes(q) ||
          log.workPerformed.toLowerCase().includes(q) ||
          (log.submittedBy ?? "").toLowerCase().includes(q)
        )) return false
        if (dateFrom) {
          const logDate = log.date.slice(0, 10)
          if (logDate < dateFrom) return false
        }
        if (dateTo) {
          const logDate = log.date.slice(0, 10)
          if (logDate > dateTo) return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [logs, searchQuery, projectFilter, dateFrom, dateTo])

  const todayStr = new Date().toISOString().slice(0, 10)

  const stats = React.useMemo(() => {
    const totalLogs = logs.length
    const todaysLogs = logs.filter((l) => l.date.slice(0, 10) === todayStr)
    const hasTodayLog = todaysLogs.length > 0
    const avgCrew = logs.length
      ? Math.round(logs.reduce((sum, l) => sum + l.crewCount, 0) / logs.length)
      : 0
    const currentMonth = todayStr.slice(0, 7)
    const monthIncidents = logs
      .filter((l) => l.date.slice(0, 7) === currentMonth)
      .reduce((sum, l) => sum + l.safetyIncidents, 0)
    return { totalLogs, hasTodayLog, avgCrew, monthIncidents }
  }, [logs, todayStr])

  function getWeatherIcon(condition: WeatherCondition) {
    const Icon = WEATHER_ICONS[condition] ?? Cloud
    return Icon
  }

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen).trimEnd() + "..."
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Logs</h1>
          <p className="text-neutral-600 mt-1">
            Record daily site activity, weather, crew, and progress
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New Daily Log
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Total Logs</div>
                <div className="text-2xl font-bold tabular-nums">{stats.totalLogs}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", stats.hasTodayLog ? "bg-emerald-50" : "bg-amber-50")}>
                <HardHat className={cn("h-5 w-5", stats.hasTodayLog ? "text-emerald-600" : "text-amber-600")} />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Today&apos;s Log</div>
                <div className={cn("text-lg font-bold", stats.hasTodayLog ? "text-emerald-700" : "text-amber-700")}>
                  {stats.hasTodayLog ? "Exists" : "Missing"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-50 p-2">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Avg Crew Size</div>
                <div className="text-2xl font-bold tabular-nums">{stats.avgCrew}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", stats.monthIncidents > 0 ? "bg-red-50" : "bg-emerald-50")}>
                <AlertTriangle className={cn("h-5 w-5", stats.monthIncidents > 0 ? "text-red-600" : "text-emerald-600")} />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Safety Incidents</div>
                <div className="text-2xl font-bold tabular-nums">{stats.monthIncidents}</div>
                <div className="text-xs text-neutral-500">this month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="pl-9"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
                placeholder="From"
              />
              <span className="text-neutral-400 text-sm">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                placeholder="To"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Cards */}
      <div className="space-y-4">
        {filtered.map((log) => {
          const WeatherIcon = getWeatherIcon(log.weather.condition)
          return (
            <Card key={log.id} className="py-0 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Date, Project, Weather */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-semibold text-neutral-900">
                        {format(new Date(log.date), "EEEE, MMM d, yyyy")}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          log.status === "submitted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {log.status === "submitted" ? "Submitted" : "Draft"}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-neutral-700">{log.projectName}</div>

                    {/* Weather + Crew row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1.5">
                        <WeatherIcon className="h-4 w-4" />
                        {WEATHER_LABELS[log.weather.condition]}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Thermometer className="h-4 w-4" />
                        {log.weather.tempF}&deg;F
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {log.crewCount} crew
                      </span>
                      <span className="text-neutral-400">|</span>
                      <span>{log.crewHours} labor hrs</span>
                    </div>

                    {/* Work performed */}
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {truncate(log.workPerformed, 180)}
                    </p>
                  </div>

                  {/* Right: Safety + Author */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {log.safetyIncidents > 0 ? (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        {log.safetyIncidents} incident{log.safetyIncidents !== 1 ? "s" : ""}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700">
                        <HardHat className="h-4 w-4" />
                        No incidents
                      </div>
                    )}
                    {log.submittedBy ? (
                      <div className="text-xs text-neutral-500">by {log.submittedBy}</div>
                    ) : null}
                  </div>
                </div>

                {/* Safety notes if present */}
                {log.safetyNotes ? (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-800">
                    <span className="font-medium">Safety note:</span> {log.safetyNotes}
                  </div>
                ) : null}

                {/* Weather notes if present */}
                {log.weather.notes ? (
                  <div className="mt-2 text-xs text-neutral-500 italic">
                    Weather: {log.weather.notes}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}

        {/* Empty state */}
        {!filtered.length ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">No daily logs found</h3>
            <p className="text-sm text-neutral-600 mb-4">
              {searchQuery || projectFilter !== "all" || dateFrom || dateTo
                ? "Try adjusting your filters or search terms."
                : "Create your first daily log to start tracking site activity."}
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Daily Log
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
