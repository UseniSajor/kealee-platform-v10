"use client"

import * as React from "react"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Filter,
  List,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type InspectionStatus = "scheduled" | "passed" | "failed" | "pending-reinspection" | "cancelled"
type InspectionType = "foundation" | "framing" | "rough-electrical" | "rough-plumbing" | "rough-hvac" | "insulation" | "drywall" | "final"
type ViewMode = "list" | "calendar"

interface Inspection {
  id: string
  type: InspectionType
  description: string
  date: string
  time: string
  inspector: string
  status: InspectionStatus
  project: string
  location: string
  notes: string
}

const STATUS_STYLES: Record<InspectionStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  "pending-reinspection": "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-600",
}

const STATUS_ICONS: Record<InspectionStatus, React.ElementType> = {
  scheduled: Clock,
  passed: CheckCircle2,
  failed: XCircle,
  "pending-reinspection": RefreshCw,
  cancelled: XCircle,
}

const STATUS_LABELS: Record<InspectionStatus, string> = {
  scheduled: "Scheduled",
  passed: "Passed",
  failed: "Failed",
  "pending-reinspection": "Pending Re-inspection",
  cancelled: "Cancelled",
}

const TYPE_LABELS: Record<InspectionType, string> = {
  foundation: "Foundation",
  framing: "Framing",
  "rough-electrical": "Rough Electrical",
  "rough-plumbing": "Rough Plumbing",
  "rough-hvac": "Rough HVAC",
  insulation: "Insulation",
  drywall: "Drywall",
  final: "Final",
}

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: "INS-001", type: "foundation", description: "Foundation footing inspection - Grid Lines A-C",
    date: "2026-02-06", time: "9:00 AM", inspector: "Robert Davis",
    status: "passed", project: "Riverside Commons", location: "Building A - Foundation",
    notes: "All footings conform to approved plans. Rebar spacing verified. Soil bearing confirmed per geotech report.",
  },
  {
    id: "INS-002", type: "foundation", description: "Foundation wall inspection before backfill",
    date: "2026-02-10", time: "10:00 AM", inspector: "Robert Davis",
    status: "passed", project: "Riverside Commons", location: "Building A - Foundation Walls",
    notes: "Walls properly formed and poured. Waterproofing membrane applied per spec. Drain tile installed correctly.",
  },
  {
    id: "INS-003", type: "rough-plumbing", description: "Underground plumbing rough-in inspection",
    date: "2026-02-12", time: "2:00 PM", inspector: "Maria Chen",
    status: "scheduled", project: "Riverside Commons", location: "Building A - Below Slab",
    notes: "Pressure test required at time of inspection. All cleanouts must be accessible.",
  },
  {
    id: "INS-004", type: "framing", description: "Structural framing inspection - 1st floor",
    date: "2026-03-25", time: "9:00 AM", inspector: "Robert Davis",
    status: "scheduled", project: "Riverside Commons", location: "Building A - Level 1",
    notes: "Shear wall nailing and hold-down anchors to be verified. Engineering calcs on site.",
  },
  {
    id: "INS-005", type: "rough-electrical", description: "Rough electrical inspection - all floors",
    date: "2026-04-28", time: "10:00 AM", inspector: "James Park",
    status: "scheduled", project: "Riverside Commons", location: "Building A - All Levels",
    notes: "Panel schedules, wire sizing, and AFCI/GFCI protection to be reviewed.",
  },
  {
    id: "INS-006", type: "rough-hvac", description: "Rough HVAC and ductwork inspection",
    date: "2026-05-05", time: "9:00 AM", inspector: "Maria Chen",
    status: "scheduled", project: "Riverside Commons", location: "Building A - All Levels",
    notes: "Duct sizing per Manual D. Fire/smoke dampers at rated assemblies. Refrigerant line pressure test.",
  },
  {
    id: "INS-007", type: "insulation", description: "Insulation inspection before drywall",
    date: "2026-05-08", time: "1:00 PM", inspector: "Robert Davis",
    status: "scheduled", project: "Summit Residences", location: "Building B - All Levels",
    notes: "R-values per energy code. Vapor barrier installation. Air sealing at penetrations.",
  },
  {
    id: "INS-008", type: "rough-plumbing", description: "Water supply and DWV rough-in inspection",
    date: "2026-02-01", time: "10:00 AM", inspector: "Maria Chen",
    status: "failed", project: "Oakwood Office", location: "Building C - Level 2",
    notes: "FAILED: 3 joints on 2\" copper supply line did not hold pressure test. Insufficient slope on 3\" horizontal drain line in ceiling space. Re-inspection required after corrections.",
  },
  {
    id: "INS-009", type: "rough-plumbing", description: "Water supply and DWV re-inspection",
    date: "2026-02-14", time: "10:00 AM", inspector: "Maria Chen",
    status: "pending-reinspection", project: "Oakwood Office", location: "Building C - Level 2",
    notes: "Re-inspection of failed items from INS-008. Contractor reports corrections complete.",
  },
  {
    id: "INS-010", type: "final", description: "Final building inspection",
    date: "2026-09-20", time: "9:00 AM", inspector: "Robert Davis",
    status: "scheduled", project: "Riverside Commons", location: "Building A - Complete",
    notes: "Final walk-through. All systems operational. CO prerequisites: fire alarm test, elevator cert, health dept approval.",
  },
]

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export default function InspectionsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [view, setView] = React.useState<ViewMode>("list")

  const filtered = React.useMemo(() => {
    return MOCK_INSPECTIONS.filter((ins) => {
      if (statusFilter !== "all" && ins.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return ins.description.toLowerCase().includes(q) || ins.inspector.toLowerCase().includes(q) || TYPE_LABELS[ins.type].toLowerCase().includes(q) || ins.project.toLowerCase().includes(q)
      }
      return true
    })
  }, [search, statusFilter])

  const stats = React.useMemo(() => ({
    scheduled: MOCK_INSPECTIONS.filter((i) => i.status === "scheduled").length,
    passed: MOCK_INSPECTIONS.filter((i) => i.status === "passed").length,
    failed: MOCK_INSPECTIONS.filter((i) => i.status === "failed").length,
    pendingReinspection: MOCK_INSPECTIONS.filter((i) => i.status === "pending-reinspection").length,
  }), [])

  const calendarWeeks = React.useMemo(() => {
    const inspectionDates = new Map<string, Inspection[]>()
    MOCK_INSPECTIONS.forEach((ins) => {
      const existing = inspectionDates.get(ins.date) ?? []
      existing.push(ins)
      inspectionDates.set(ins.date, existing)
    })

    const today = new Date("2026-02-12T00:00:00")
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDay = startOfMonth.getDay()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

    const weeks: (null | { day: number; dateStr: string; inspections: Inspection[]; isToday: boolean })[][] = []
    let week: (null | { day: number; dateStr: string; inspections: Inspection[]; isToday: boolean })[] = []

    for (let i = 0; i < startDay; i++) week.push(null)

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(today.getFullYear(), today.getMonth(), day)
      const dateStr = d.toISOString().split("T")[0]
      week.push({ day, dateStr, inspections: inspectionDates.get(dateStr) ?? [], isToday: dateStr === "2026-02-12" })
      if (week.length === 7) { weeks.push(week); week = [] }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week) }
    return weeks
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-500 mt-1">Schedule and track building inspections</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {([["list", List], ["calendar", Calendar]] as const).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setView(mode as ViewMode)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === mode ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900")}>
                <Icon size={16} />{mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <Button className="gap-2"><Plus size={16} />Schedule Inspection</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-blue-600 bg-blue-50" },
          { label: "Passed", value: stats.passed, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-600 bg-red-50" },
          { label: "Pending Re-inspection", value: stats.pendingReinspection, icon: RefreshCw, color: "text-yellow-600 bg-yellow-50" },
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search inspections..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "scheduled", "passed", "failed", "pending-reinspection"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                  {s === "all" ? "All" : s === "pending-reinspection" ? "Re-inspection" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date / Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Inspector</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ins) => {
                    const StatusIcon = STATUS_ICONS[ins.status]
                    return (
                      <tr key={ins.id} className={cn("border-b hover:bg-gray-50", ins.status === "failed" && "bg-red-50/30")}>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {TYPE_LABELS[ins.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{ins.description}</p>
                          <p className="text-xs text-gray-400">{ins.location}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-gray-700">{formatDate(ins.date)}</p>
                          <p className="text-xs text-gray-400">{ins.time}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ins.inspector}</td>
                        <td className="px-4 py-3 text-gray-600">{ins.project}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", STATUS_STYLES[ins.status])}>
                            <StatusIcon size={12} />{STATUS_LABELS[ins.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-xs text-gray-500 truncate" title={ins.notes}>{ins.notes}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {view === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle>February 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-600">{day}</div>
              ))}
              {calendarWeeks.flat().map((cell, i) => (
                <div key={i} className={cn("bg-white min-h-[80px] p-1.5", cell?.isToday && "bg-blue-50")}>
                  {cell && (
                    <>
                      <p className={cn("text-xs font-medium mb-1", cell.isToday ? "text-blue-600" : "text-gray-700")}>{cell.day}</p>
                      <div className="space-y-0.5">
                        {cell.inspections.map((ins) => {
                          const StatusIcon = STATUS_ICONS[ins.status]
                          return (
                            <div key={ins.id} className={cn("px-1 py-0.5 rounded text-[10px] leading-tight truncate", STATUS_STYLES[ins.status])} title={ins.description}>
                              <StatusIcon size={8} className="inline mr-0.5" />
                              {TYPE_LABELS[ins.type]}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
