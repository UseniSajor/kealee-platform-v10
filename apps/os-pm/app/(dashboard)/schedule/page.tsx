"use client"

import * as React from "react"
import { Calendar, Diamond, GanttChart, LayoutList, Search, Target, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type TaskStatus = "not-started" | "in-progress" | "on-track" | "behind" | "complete"
type ViewMode = "gantt" | "calendar" | "list"

interface ScheduleTask {
  id: string; name: string; phase: string; assignee: string; assigneeInitials: string
  startDate: string; endDate: string; progress: number; status: TaskStatus
  isMilestone: boolean; dependencies: string[]
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  "not-started": "bg-gray-300", "in-progress": "bg-blue-500",
  "on-track": "bg-green-500", behind: "bg-red-500", complete: "bg-emerald-600",
}
const STATUS_LABELS: Record<TaskStatus, string> = {
  "not-started": "Not Started", "in-progress": "In Progress",
  "on-track": "On Track", behind: "Behind", complete: "Complete",
}
const PHASES = ["Foundation", "Framing", "Rough-In", "Drywall", "Finish", "Punch"]

const MOCK_TASKS: ScheduleTask[] = [
  { id: "T-001", name: "Excavation & Grading", phase: "Foundation", assignee: "Mike Torres", assigneeInitials: "MT", startDate: "2026-02-02", endDate: "2026-02-13", progress: 100, status: "complete", isMilestone: false, dependencies: [] },
  { id: "T-002", name: "Footing Pour", phase: "Foundation", assignee: "Mike Torres", assigneeInitials: "MT", startDate: "2026-02-16", endDate: "2026-02-20", progress: 75, status: "on-track", isMilestone: false, dependencies: ["T-001"] },
  { id: "T-003", name: "Foundation Walls", phase: "Foundation", assignee: "Sarah Kim", assigneeInitials: "SK", startDate: "2026-02-23", endDate: "2026-03-06", progress: 30, status: "in-progress", isMilestone: false, dependencies: ["T-002"] },
  { id: "M-001", name: "Foundation Complete", phase: "Foundation", assignee: "PM Office", assigneeInitials: "PM", startDate: "2026-03-06", endDate: "2026-03-06", progress: 0, status: "not-started", isMilestone: true, dependencies: ["T-003"] },
  { id: "T-004", name: "Floor Framing", phase: "Framing", assignee: "Jake Hernandez", assigneeInitials: "JH", startDate: "2026-03-09", endDate: "2026-03-20", progress: 0, status: "not-started", isMilestone: false, dependencies: ["M-001"] },
  { id: "T-005", name: "Wall Framing", phase: "Framing", assignee: "Jake Hernandez", assigneeInitials: "JH", startDate: "2026-03-23", endDate: "2026-04-03", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-004"] },
  { id: "T-006", name: "Roof Framing", phase: "Framing", assignee: "Jake Hernandez", assigneeInitials: "JH", startDate: "2026-04-06", endDate: "2026-04-17", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-005"] },
  { id: "M-002", name: "Dry-In Milestone", phase: "Framing", assignee: "PM Office", assigneeInitials: "PM", startDate: "2026-04-17", endDate: "2026-04-17", progress: 0, status: "not-started", isMilestone: true, dependencies: ["T-006"] },
  { id: "T-007", name: "Electrical Rough-In", phase: "Rough-In", assignee: "Lisa Dunn", assigneeInitials: "LD", startDate: "2026-04-20", endDate: "2026-05-01", progress: 0, status: "not-started", isMilestone: false, dependencies: ["M-002"] },
  { id: "T-008", name: "Plumbing Rough-In", phase: "Rough-In", assignee: "Tom Reyes", assigneeInitials: "TR", startDate: "2026-04-20", endDate: "2026-05-08", progress: 0, status: "not-started", isMilestone: false, dependencies: ["M-002"] },
  { id: "T-009", name: "HVAC Rough-In", phase: "Rough-In", assignee: "Tom Reyes", assigneeInitials: "TR", startDate: "2026-04-27", endDate: "2026-05-08", progress: 0, status: "not-started", isMilestone: false, dependencies: ["M-002"] },
  { id: "T-010", name: "Drywall Hanging", phase: "Drywall", assignee: "Carlos Vega", assigneeInitials: "CV", startDate: "2026-05-11", endDate: "2026-05-22", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-007","T-008","T-009"] },
  { id: "T-011", name: "Drywall Taping & Mud", phase: "Drywall", assignee: "Carlos Vega", assigneeInitials: "CV", startDate: "2026-05-25", endDate: "2026-06-05", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-010"] },
  { id: "T-012", name: "Interior Paint", phase: "Finish", assignee: "Nina Brooks", assigneeInitials: "NB", startDate: "2026-06-08", endDate: "2026-06-19", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-011"] },
  { id: "T-013", name: "Trim & Cabinets", phase: "Finish", assignee: "Jake Hernandez", assigneeInitials: "JH", startDate: "2026-06-15", endDate: "2026-06-26", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-011"] },
  { id: "T-014", name: "Flooring Install", phase: "Finish", assignee: "Nina Brooks", assigneeInitials: "NB", startDate: "2026-06-22", endDate: "2026-07-03", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-012"] },
  { id: "T-015", name: "Punch List Walk", phase: "Punch", assignee: "PM Office", assigneeInitials: "PM", startDate: "2026-07-06", endDate: "2026-07-10", progress: 0, status: "behind", isMilestone: false, dependencies: ["T-012","T-013","T-014"] },
  { id: "T-016", name: "Punch List Corrections", phase: "Punch", assignee: "All Trades", assigneeInitials: "AT", startDate: "2026-07-13", endDate: "2026-07-17", progress: 0, status: "not-started", isMilestone: false, dependencies: ["T-015"] },
  { id: "M-003", name: "Substantial Completion", phase: "Punch", assignee: "PM Office", assigneeInitials: "PM", startDate: "2026-07-17", endDate: "2026-07-17", progress: 0, status: "not-started", isMilestone: true, dependencies: ["T-016"] },
]

function parseDate(d: string) { return new Date(d + "T00:00:00") }
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) }
function formatDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) }

export default function SchedulePage() {
  const [view, setView] = React.useState<ViewMode>("gantt")
  const [search, setSearch] = React.useState("")
  const [phaseFilter, setPhaseFilter] = React.useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all")
  const assignees = React.useMemo(() => [...new Set(MOCK_TASKS.map((t) => t.assignee))], [])
  const filteredTasks = React.useMemo(() => {
    return MOCK_TASKS.filter((t) => {
      if (phaseFilter !== "all" && t.phase !== phaseFilter) return false
      if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false
      if (search) { const q = search.toLowerCase(); return t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q) }
      return true
    })
  }, [search, phaseFilter, assigneeFilter])
  const stats = React.useMemo(() => ({
    total: MOCK_TASKS.filter((t) => !t.isMilestone).length,
    onTrack: MOCK_TASKS.filter((t) => t.status === "on-track" || t.status === "complete").length,
    behind: MOCK_TASKS.filter((t) => t.status === "behind").length,
    milestones: MOCK_TASKS.filter((t) => t.isMilestone && t.status !== "complete").length,
  }), [])
  const ganttStart = parseDate("2026-02-01")
  const ganttEnd = parseDate("2026-07-31")
  const totalDays = daysBetween(ganttStart, ganttEnd)
  const months = React.useMemo(() => {
    const result: { label: string; days: number; offset: number }[] = []
    const cur = new Date(ganttStart)
    while (cur < ganttEnd) {
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const end = monthEnd > ganttEnd ? ganttEnd : monthEnd
      const days = daysBetween(cur, end) + 1
      const offset = daysBetween(ganttStart, cur)
      result.push({ label: cur.toLocaleDateString("en-US", { month: "short", year: "numeric" }), days, offset })
      cur.setMonth(cur.getMonth() + 1); cur.setDate(1)
    }
    return result
  }, [])
  function getBarStyle(task: ScheduleTask) {
    const start = daysBetween(ganttStart, parseDate(task.startDate))
    const duration = daysBetween(parseDate(task.startDate), parseDate(task.endDate)) + 1
    return { left: (start / totalDays * 100) + "%", width: (duration / totalDays * 100) + "%" }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Schedule</h1><p className="text-gray-500 mt-1">Project timeline and task management</p></div>
        <div className="flex items-center gap-2"><div className="flex bg-gray-100 rounded-lg p-1">
          {([["gantt", GanttChart], ["calendar", Calendar], ["list", LayoutList]] as const).map(([mode, Icon]) => (
            <button key={mode} onClick={() => setView(mode as ViewMode)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === mode ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900")}><Icon size={16} />{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
          ))}
        </div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: stats.total, icon: Target, color: "text-blue-600 bg-blue-50" },
          { label: "On Track", value: stats.onTrack, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Behind Schedule", value: stats.behind, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          { label: "Milestones Upcoming", value: stats.milestones, icon: Diamond, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><div className={cn("p-2 rounded-lg", s.color)}><s.icon size={20} /></div><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div></CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white"><option value="all">All Phases</option>{PHASES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white"><option value="all">All Assignees</option>{assignees.map((a) => <option key={a} value={a}>{a}</option>)}</select>
      </div></CardContent></Card>

      {view === "gantt" && (<Card><CardHeader className="pb-2"><CardTitle className="text-lg">Gantt Chart</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto"><div className="min-w-[900px]">
        <div className="flex border-b bg-gray-50"><div className="w-72 shrink-0 px-4 py-2 text-xs font-semibold text-gray-500 border-r">Task</div><div className="flex-1 relative h-8">{months.map((m) => (<div key={m.label} className="absolute top-0 h-full flex items-center border-r px-2 text-xs font-medium text-gray-600" style={{ left: (m.offset / totalDays * 100) + "%", width: (m.days / totalDays * 100) + "%" }}>{m.label}</div>))}</div></div>
        {filteredTasks.map((task, i) => { const bar = getBarStyle(task); return (
          <div key={task.id} className={cn("flex items-center border-b hover:bg-gray-50 transition-colors", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
            <div className="w-72 shrink-0 px-4 py-3 border-r flex items-center gap-3">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white", task.status === "complete" ? "bg-emerald-600" : task.status === "behind" ? "bg-red-500" : task.status === "on-track" ? "bg-green-500" : task.status === "in-progress" ? "bg-blue-500" : "bg-gray-400")}>{task.assigneeInitials}</div>
              <div className="min-w-0"><p className={cn("text-sm font-medium truncate", task.isMilestone && "text-purple-700")}>{task.isMilestone && <Diamond size={12} className="inline mr-1 text-purple-500" />}{task.name}</p><p className="text-xs text-gray-400">{formatDate(task.startDate)} - {formatDate(task.endDate)}</p></div>
            </div>
            <div className="flex-1 relative h-12">
              {task.isMilestone ? (<div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-purple-500 border-2 border-purple-700" style={{ left: bar.left }} />) : (
                <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full overflow-hidden" style={{ left: bar.left, width: bar.width }}>
                  <div className={cn("h-full rounded-full opacity-30", STATUS_COLORS[task.status])} />
                  <div className={cn("absolute top-0 left-0 h-full rounded-full", STATUS_COLORS[task.status])} style={{ width: task.progress + "%" }} />
                  {task.progress > 0 && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">{task.progress}%</span>}
                </div>)}
            </div>
          </div>) })}
      </div></CardContent></Card>)}

      {view === "list" && (<Card><CardHeader className="pb-2"><CardTitle className="text-lg">Task List</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left px-4 py-3 font-medium text-gray-600">Task</th><th className="text-left px-4 py-3 font-medium text-gray-600">Phase</th><th className="text-left px-4 py-3 font-medium text-gray-600">Assignee</th><th className="text-left px-4 py-3 font-medium text-gray-600">Start</th><th className="text-left px-4 py-3 font-medium text-gray-600">End</th><th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th><th className="text-left px-4 py-3 font-medium text-gray-600">Status</th><th className="text-left px-4 py-3 font-medium text-gray-600">Deps</th></tr></thead><tbody>
        {filteredTasks.map((task) => (<tr key={task.id} className="border-b hover:bg-gray-50"><td className="px-4 py-3 font-medium">{task.isMilestone && <Diamond size={12} className="inline mr-1 text-purple-500" />}{task.name}</td><td className="px-4 py-3 text-gray-600">{task.phase}</td><td className="px-4 py-3 text-gray-600">{task.assignee}</td><td className="px-4 py-3 text-gray-500">{formatDate(task.startDate)}</td><td className="px-4 py-3 text-gray-500">{formatDate(task.endDate)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", STATUS_COLORS[task.status])} style={{ width: task.progress + "%" }} /></div><span className="text-xs text-gray-500">{task.progress}%</span></div></td><td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium text-white", STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span></td><td className="px-4 py-3 text-xs text-gray-400">{task.dependencies.join(", ") || "---"}</td></tr>))}
      </tbody></table></div></CardContent></Card>)}

      {view === "calendar" && (<Card><CardHeader><CardTitle className="text-lg">Calendar View</CardTitle></CardHeader><CardContent><div className="text-center py-12 text-gray-400"><Calendar size={48} className="mx-auto mb-4" /><p className="text-lg font-medium">Calendar view coming soon</p><p className="text-sm">Switch to Gantt or List view to see task details.</p></div></CardContent></Card>)}
    </div>
  )
}
