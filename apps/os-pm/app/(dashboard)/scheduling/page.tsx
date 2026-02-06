"use client"

import * as React from "react"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  List,
  GanttChart,
  Search,
} from "lucide-react"
import { format, differenceInDays, addDays } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = "completed" | "on_track" | "at_risk" | "delayed"

type ScheduleTask = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  percentComplete: number
  resource: string
  status: TaskStatus
  dependencies: string[]
  isCriticalPath: boolean
}

// ---------------------------------------------------------------------------
// Mock data -- typical residential construction schedule
// ---------------------------------------------------------------------------

const PROJECT_START = new Date(2026, 0, 12) // Jan 12 2026

function d(offset: number, duration: number): [Date, Date] {
  return [addDays(PROJECT_START, offset), addDays(PROJECT_START, offset + duration)]
}

const MOCK_TASKS: ScheduleTask[] = [
  {
    id: "T-001",
    name: "Foundation",
    ...spread(d(0, 14)),
    percentComplete: 100,
    resource: "ABC Concrete",
    status: "completed",
    dependencies: [],
    isCriticalPath: true,
  },
  {
    id: "T-002",
    name: "Framing",
    ...spread(d(14, 18)),
    percentComplete: 100,
    resource: "Pinnacle Framers",
    status: "completed",
    dependencies: ["T-001"],
    isCriticalPath: true,
  },
  {
    id: "T-003",
    name: "Electrical Rough-In",
    ...spread(d(32, 10)),
    percentComplete: 85,
    resource: "Volt Electric",
    status: "on_track",
    dependencies: ["T-002"],
    isCriticalPath: false,
  },
  {
    id: "T-004",
    name: "Plumbing Rough-In",
    ...spread(d(32, 10)),
    percentComplete: 70,
    resource: "ProFlow Plumbing",
    status: "at_risk",
    dependencies: ["T-002"],
    isCriticalPath: false,
  },
  {
    id: "T-005",
    name: "HVAC",
    ...spread(d(35, 12)),
    percentComplete: 50,
    resource: "CoolAir Mechanical",
    status: "on_track",
    dependencies: ["T-002"],
    isCriticalPath: false,
  },
  {
    id: "T-006",
    name: "Insulation",
    ...spread(d(44, 5)),
    percentComplete: 20,
    resource: "Thermal Pros",
    status: "on_track",
    dependencies: ["T-003", "T-004", "T-005"],
    isCriticalPath: true,
  },
  {
    id: "T-007",
    name: "Drywall",
    ...spread(d(49, 12)),
    percentComplete: 0,
    resource: "WallCraft Inc.",
    status: "on_track",
    dependencies: ["T-006"],
    isCriticalPath: true,
  },
  {
    id: "T-008",
    name: "Painting",
    ...spread(d(61, 10)),
    percentComplete: 0,
    resource: "Premier Painters",
    status: "on_track",
    dependencies: ["T-007"],
    isCriticalPath: true,
  },
  {
    id: "T-009",
    name: "Flooring",
    ...spread(d(71, 8)),
    percentComplete: 0,
    resource: "Summit Floors",
    status: "on_track",
    dependencies: ["T-008"],
    isCriticalPath: false,
  },
  {
    id: "T-010",
    name: "Final Inspection",
    ...spread(d(80, 3)),
    percentComplete: 0,
    resource: "City Inspector",
    status: "delayed",
    dependencies: ["T-008", "T-009"],
    isCriticalPath: true,
  },
  {
    id: "T-011",
    name: "Punch List",
    ...spread(d(83, 7)),
    percentComplete: 0,
    resource: "Pinnacle Framers",
    status: "on_track",
    dependencies: ["T-010"],
    isCriticalPath: true,
  },
  {
    id: "T-012",
    name: "Closeout",
    ...spread(d(90, 5)),
    percentComplete: 0,
    resource: "PM Team",
    status: "on_track",
    dependencies: ["T-011"],
    isCriticalPath: true,
  },
]

/** Helper to spread a [start, end] tuple into { startDate, endDate }. */
function spread([startDate, endDate]: [Date, Date]) {
  return { startDate, endDate }
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<TaskStatus, string> = {
  completed: "Completed",
  on_track: "On Track",
  at_risk: "At Risk",
  delayed: "Delayed",
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  on_track: "bg-emerald-50 text-emerald-700 border-emerald-200",
  at_risk: "bg-amber-50 text-amber-700 border-amber-200",
  delayed: "bg-red-50 text-red-700 border-red-200",
}

const STATUS_BAR: Record<TaskStatus, string> = {
  completed: "bg-blue-500",
  on_track: "bg-emerald-500",
  at_risk: "bg-amber-500",
  delayed: "bg-red-500",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SchedulingPage() {
  const [view, setView] = React.useState<"list" | "timeline">("list")
  const [query, setQuery] = React.useState("")

  // ---- filtered tasks --------------------------------------------------
  const tasks = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_TASKS
    return MOCK_TASKS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.resource.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    )
  }, [query])

  // ---- stats -----------------------------------------------------------
  const stats = React.useMemo(() => {
    const total = MOCK_TASKS.length
    const onTrack = MOCK_TASKS.filter((t) => t.status === "on_track").length
    const delayed = MOCK_TASKS.filter((t) => t.status === "delayed" || t.status === "at_risk").length
    const criticalPath = MOCK_TASKS.filter((t) => t.isCriticalPath).length
    return { total, onTrack, delayed, criticalPath }
  }, [])

  // ---- timeline math ---------------------------------------------------
  const timeline = React.useMemo(() => {
    const allStarts = MOCK_TASKS.map((t) => t.startDate.getTime())
    const allEnds = MOCK_TASKS.map((t) => t.endDate.getTime())
    const minDate = new Date(Math.min(...allStarts))
    const maxDate = new Date(Math.max(...allEnds))
    const totalDays = differenceInDays(maxDate, minDate) || 1
    return { minDate, maxDate, totalDays }
  }, [])

  const today = new Date()

  // ---- render ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <p className="text-neutral-600 mt-1">
            Manage project schedules, Gantt view, and resource assignments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 w-56"
            />
          </div>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant={view === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("timeline")}
          >
            <GanttChart className="h-4 w-4" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="rounded-lg bg-neutral-100 p-2">
              <CalendarDays className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Total Tasks</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">On Track</div>
              <div className="text-2xl font-bold">{stats.onTrack}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Delayed</div>
              <div className="text-2xl font-bold">{stats.delayed}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Critical Path</div>
              <div className="text-2xl font-bold">{stats.criticalPath}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List View */}
      {view === "list" && (
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">Schedule Tasks</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Task Name</th>
                    <th className="text-left font-medium px-4 py-3">Start Date</th>
                    <th className="text-left font-medium px-4 py-3">End Date</th>
                    <th className="text-right font-medium px-4 py-3">Duration</th>
                    <th className="text-right font-medium px-4 py-3">% Complete</th>
                    <th className="text-left font-medium px-4 py-3">Resource</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Dependencies</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const duration = differenceInDays(t.endDate, t.startDate)
                    return (
                      <tr
                        key={t.id}
                        className={cn(
                          "border-t",
                          t.isCriticalPath && "bg-amber-50/40"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900">{t.name}</span>
                            {t.isCriticalPath && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                CP
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {format(t.startDate, "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {format(t.endDate, "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-neutral-900">
                          {duration}d
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 rounded-full bg-neutral-200 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  STATUS_BAR[t.status]
                                )}
                                style={{ width: `${t.percentComplete}%` }}
                              />
                            </div>
                            <span className="tabular-nums text-neutral-900 w-9 text-right">
                              {t.percentComplete}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{t.resource}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              STATUS_BADGE[t.status]
                            )}
                          >
                            {STATUS_LABEL[t.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs">
                          {t.dependencies.length > 0 ? t.dependencies.join(", ") : "\u2014"}
                        </td>
                      </tr>
                    )
                  })}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                        No tasks match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline / Gantt View */}
      {view === "timeline" && (
        <Card className="py-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Gantt Timeline</CardTitle>
              <div className="flex items-center gap-4 text-xs text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> On Track
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" /> At Risk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-red-500" /> Delayed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" /> Completed
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="overflow-x-auto rounded-xl border bg-white">
              {/* Month markers */}
              <div className="flex border-b bg-neutral-50">
                <div className="w-48 min-w-[192px] shrink-0 px-4 py-2 text-xs font-medium text-neutral-600">
                  Task
                </div>
                <div className="relative flex-1 min-w-[600px]">
                  <div className="flex h-full">
                    {Array.from({ length: Math.ceil(timeline.totalDays / 30) + 1 }).map(
                      (_, i) => {
                        const monthDate = addDays(timeline.minDate, i * 30)
                        return (
                          <div
                            key={i}
                            className="flex-1 border-l border-neutral-200 px-2 py-2 text-xs text-neutral-500"
                          >
                            {format(monthDate, "MMM d")}
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Task rows */}
              {tasks.map((t) => {
                const offsetDays = differenceInDays(t.startDate, timeline.minDate)
                const duration = differenceInDays(t.endDate, t.startDate)
                const leftPct = (offsetDays / timeline.totalDays) * 100
                const widthPct = Math.max((duration / timeline.totalDays) * 100, 1)

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "flex border-b last:border-b-0 hover:bg-neutral-50/70 transition-colors",
                      t.isCriticalPath && "bg-amber-50/30"
                    )}
                  >
                    {/* Task label */}
                    <div className="w-48 min-w-[192px] shrink-0 px-4 py-3 flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 truncate">
                        {t.name}
                      </span>
                      {t.isCriticalPath && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 shrink-0">
                          CP
                        </span>
                      )}
                    </div>

                    {/* Bar area */}
                    <div className="relative flex-1 min-w-[600px] py-2">
                      {/* Today marker */}
                      {(() => {
                        const todayOffset = differenceInDays(today, timeline.minDate)
                        if (todayOffset < 0 || todayOffset > timeline.totalDays) return null
                        const todayPct = (todayOffset / timeline.totalDays) * 100
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                            style={{ left: `${todayPct}%` }}
                          />
                        )
                      })()}

                      {/* Task bar */}
                      <div
                        className={cn(
                          "absolute h-7 rounded-md flex items-center overflow-hidden",
                          STATUS_BAR[t.status],
                          t.isCriticalPath && "ring-2 ring-amber-400/50"
                        )}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        {/* Progress fill (lighter overlay for incomplete portion) */}
                        {t.percentComplete < 100 && (
                          <div
                            className="absolute inset-0 bg-white/40"
                            style={{ left: `${t.percentComplete}%` }}
                          />
                        )}
                        {widthPct > 8 && (
                          <span className="relative z-10 px-2 text-[10px] font-semibold text-white truncate">
                            {t.percentComplete}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {tasks.length === 0 && (
                <div className="px-4 py-10 text-center text-neutral-600 text-sm">
                  No tasks match your search.
                </div>
              )}

              {/* Today legend */}
              <div className="border-t bg-neutral-50 px-4 py-2 flex items-center gap-2 text-xs text-neutral-500">
                <span className="inline-block h-3 w-px bg-red-400" />
                Today: {format(today, "MMM d, yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
