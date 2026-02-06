"use client"

import * as React from "react"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import {
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Navigation,
} from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type ViewMode = "list" | "calendar" | "map"

type DispatchStatus =
  | "unassigned"
  | "assigned"
  | "en_route"
  | "on_site"
  | "in_progress"
  | "completed"
  | "cancelled"

type Priority = "low" | "normal" | "high" | "emergency"

type DispatchItem = {
  id: string
  title: string
  project: string
  status: DispatchStatus
  assignedTo: string
  phone: string
  scheduledDate: Date
  scheduledTime: string
  duration: string
  priority: Priority
  address: string
  notes: string
}

const STATUS_CONFIG: Record<
  DispatchStatus,
  { label: string; bg: string; text: string; icon?: React.ElementType }
> = {
  unassigned: { label: "Unassigned", bg: "bg-gray-100", text: "text-gray-700" },
  assigned: { label: "Assigned", bg: "bg-blue-100", text: "text-blue-700" },
  en_route: { label: "En Route", bg: "bg-amber-100", text: "text-amber-700", icon: Truck },
  on_site: { label: "On Site", bg: "bg-green-100", text: "text-green-700", icon: MapPin },
  in_progress: { label: "In Progress", bg: "bg-blue-100", text: "text-blue-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" },
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bg: string; text: string; pulse?: boolean; icon?: React.ElementType }
> = {
  low: { label: "Low", bg: "bg-gray-100", text: "text-gray-700" },
  normal: { label: "Normal", bg: "bg-blue-100", text: "text-blue-700" },
  high: { label: "High", bg: "bg-orange-100", text: "text-orange-700" },
  emergency: { label: "Emergency", bg: "bg-red-100", text: "text-red-700", pulse: true, icon: AlertTriangle },
}

const today = new Date()
const tomorrow = addDays(today, 1)
const dayAfter = addDays(today, 2)
const yesterday = addDays(today, -1)

const MOCK_DISPATCHES: DispatchItem[] = [
  {
    id: "d1",
    title: "Emergency Plumbing Repair - Main Line Break",
    project: "Riverside Apartments Phase 2",
    status: "en_route",
    assignedTo: "Mike Torres",
    phone: "(555) 234-5678",
    scheduledDate: today,
    scheduledTime: "07:00 AM",
    duration: "3h",
    priority: "emergency",
    address: "4200 Riverside Dr, Unit B",
    notes: "Water shut-off required before crew arrives. Tenant notified.",
  },
  {
    id: "d2",
    title: "Electrical Panel Inspection",
    project: "Oakwood Office Complex",
    status: "on_site",
    assignedTo: "Sarah Chen",
    phone: "(555) 345-6789",
    scheduledDate: today,
    scheduledTime: "08:00 AM",
    duration: "2h",
    priority: "high",
    address: "890 Oakwood Blvd, Suite 100",
    notes: "Final inspection before energizing. Inspector arriving at 8:30.",
  },
  {
    id: "d3",
    title: "HVAC System Installation - 3rd Floor",
    project: "Metro Health Clinic Buildout",
    status: "in_progress",
    assignedTo: "James Rodriguez",
    phone: "(555) 456-7890",
    scheduledDate: today,
    scheduledTime: "07:30 AM",
    duration: "8h",
    priority: "normal",
    address: "1500 Metro Center Way, 3rd Fl",
    notes: "Ductwork and handler install. Crane access confirmed for rooftop unit.",
  },
  {
    id: "d4",
    title: "Concrete Pour - Foundation Slab B",
    project: "Sunset Ridge Homes Lot 14",
    status: "assigned",
    assignedTo: "Carlos Mendes",
    phone: "(555) 567-8901",
    scheduledDate: today,
    scheduledTime: "06:00 AM",
    duration: "6h",
    priority: "high",
    address: "Lot 14, Sunset Ridge Subdivision",
    notes: "28 yards ready-mix. Pump truck on site by 5:45 AM. Weather clear.",
  },
  {
    id: "d5",
    title: "Framing Crew - Second Floor Walls",
    project: "Lakeside Custom Home",
    status: "assigned",
    assignedTo: "Derek Williams",
    phone: "(555) 678-9012",
    scheduledDate: today,
    scheduledTime: "07:00 AM",
    duration: "8h",
    priority: "normal",
    address: "2750 Lakeside Trail",
    notes: "Lumber delivery confirmed for 6:30 AM. 4-person crew.",
  },
  {
    id: "d6",
    title: "Fire Sprinkler Rough-In",
    project: "Downtown Retail Renovation",
    status: "unassigned",
    assignedTo: "",
    phone: "",
    scheduledDate: today,
    scheduledTime: "09:00 AM",
    duration: "5h",
    priority: "high",
    address: "310 Main St, Ground Floor",
    notes: "Needs certified sprinkler fitter. Coordinate with GC for ceiling access.",
  },
  {
    id: "d7",
    title: "Roof Leak Repair - Emergency Tarp",
    project: "Greenfield Elementary School",
    status: "completed",
    assignedTo: "Tony Vasquez",
    phone: "(555) 789-0123",
    scheduledDate: today,
    scheduledTime: "06:30 AM",
    duration: "2h",
    priority: "emergency",
    address: "400 Greenfield Ave",
    notes: "Temporary tarp installed. Permanent repair scheduled for next week.",
  },
  {
    id: "d8",
    title: "Drywall Finishing - Level 5",
    project: "Oakwood Office Complex",
    status: "assigned",
    assignedTo: "Maria Gonzalez",
    phone: "(555) 890-1234",
    scheduledDate: tomorrow,
    scheduledTime: "08:00 AM",
    duration: "8h",
    priority: "normal",
    address: "890 Oakwood Blvd, Suite 200",
    notes: "Level 5 finish for executive boardroom. 3-person crew.",
  },
  {
    id: "d9",
    title: "Grading & Site Prep",
    project: "Hillcrest Commercial Park",
    status: "assigned",
    assignedTo: "Ray Patterson",
    phone: "(555) 901-2345",
    scheduledDate: tomorrow,
    scheduledTime: "06:00 AM",
    duration: "10h",
    priority: "normal",
    address: "Hillcrest Pkwy & Commerce Dr",
    notes: "Excavator and skid steer on site. Erosion control in place.",
  },
  {
    id: "d10",
    title: "Elevator Shaft Inspection",
    project: "Metro Health Clinic Buildout",
    status: "unassigned",
    assignedTo: "",
    phone: "",
    scheduledDate: dayAfter,
    scheduledTime: "10:00 AM",
    duration: "3h",
    priority: "high",
    address: "1500 Metro Center Way",
    notes: "State inspector required. Waiting on scheduling confirmation.",
  },
  {
    id: "d11",
    title: "Waterproofing - Below Grade Walls",
    project: "Riverside Apartments Phase 2",
    status: "cancelled",
    assignedTo: "Mike Torres",
    phone: "(555) 234-5678",
    scheduledDate: yesterday,
    scheduledTime: "07:00 AM",
    duration: "6h",
    priority: "normal",
    address: "4200 Riverside Dr",
    notes: "Cancelled due to rain. Rescheduled to next Monday.",
  },
  {
    id: "d12",
    title: "Window Installation - South Facade",
    project: "Lakeside Custom Home",
    status: "completed",
    assignedTo: "Derek Williams",
    phone: "(555) 678-9012",
    scheduledDate: yesterday,
    scheduledTime: "08:00 AM",
    duration: "6h",
    priority: "normal",
    address: "2750 Lakeside Trail",
    notes: "All 12 units installed and sealed. Punch list item: trim on unit 7.",
  },
]

const HOURS = ["6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"]

function parseHourIndex(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0
  let hour = parseInt(match[1], 10)
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hour !== 12) hour += 12
  if (ampm === "AM" && hour === 12) hour = 0
  return Math.max(0, hour - 6)
}

export default function DispatchPage() {
  const [view, setView] = React.useState<ViewMode>("list")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | DispatchStatus>("all")
  const [items, setItems] = React.useState<DispatchItem[]>(MOCK_DISPATCHES)

  const filtered = React.useMemo(() => {
    let result = items
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.project.toLowerCase().includes(q) ||
          d.assignedTo.toLowerCase().includes(q) ||
          d.address.toLowerCase().includes(q)
      )
    }
    return result
  }, [items, statusFilter, search])

  const stats = React.useMemo(() => {
    const todayItems = items.filter((d) => isSameDay(d.scheduledDate, today))
    return {
      todayTotal: todayItems.length,
      enRoute: todayItems.filter((d) => d.status === "en_route").length,
      onSite: todayItems.filter((d) => d.status === "on_site" || d.status === "in_progress").length,
      completed: todayItems.filter((d) => d.status === "completed").length,
    }
  }, [items])

  function updateStatus(id: string, newStatus: DispatchStatus) {
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    )
  }

  function renderStatusBadge(status: DispatchStatus) {
    const config = STATUS_CONFIG[status]
    const Icon = config.icon
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          config.bg,
          config.text
        )}
      >
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {config.label}
      </span>
    )
  }

  function renderPriorityBadge(priority: Priority) {
    const config = PRIORITY_CONFIG[priority]
    const Icon = config.icon
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          config.bg,
          config.text,
          config.pulse && "animate-pulse"
        )}
      >
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {config.label}
      </span>
    )
  }

  // Calendar view helpers
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispatch & Field Service</h1>
          <p className="text-neutral-600 mt-1">
            Schedule crews, track field assignments, and manage service calls
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => alert("New dispatch (placeholder)")}>
            <Plus className="h-4 w-4" />
            New Dispatch
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "list", label: "List", icon: Search },
            { id: "calendar", label: "Calendar", icon: Calendar },
            { id: "map", label: "Map", icon: Navigation },
          ] as const
        ).map((v) => (
          <Button
            key={v.id}
            variant={view === v.id ? "default" : "outline"}
            size="sm"
            onClick={() => setView(v.id)}
          >
            <v.icon className="h-4 w-4" />
            {v.label}
          </Button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.todayTotal}</div>
                <div className="text-sm text-neutral-600">Today&apos;s Jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Truck className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.enRoute}</div>
                <div className="text-sm text-neutral-600">En Route</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <MapPin className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.onSite}</div>
                <div className="text-sm text-neutral-600">On Site</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-neutral-600">Completed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {view !== "map" ? (
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search jobs, crews, addresses..."
                  className="pl-9 sm:w-80"
                />
              </div>
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | DispatchStatus)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
                <option value="en_route">En Route</option>
                <option value="on_site">On Site</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="text-sm text-neutral-600 ml-auto">
                <span className="font-medium">{filtered.length}</span> jobs
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* List View */}
      {view === "list" ? (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Job Title</th>
                <th className="text-left font-medium px-4 py-3">Project</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Assigned To</th>
                <th className="text-left font-medium px-4 py-3">Scheduled</th>
                <th className="text-left font-medium px-4 py-3">Duration</th>
                <th className="text-left font-medium px-4 py-3">Priority</th>
                <th className="text-left font-medium px-4 py-3">Address</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{d.title}</div>
                      {d.notes ? (
                        <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5 max-w-[260px]">
                          {d.notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{d.project}</td>
                    <td className="px-4 py-3">{renderStatusBadge(d.status)}</td>
                    <td className="px-4 py-3">
                      {d.assignedTo ? (
                        <div>
                          <div className="flex items-center gap-1 text-neutral-900">
                            <User className="h-3 w-3 text-neutral-400" />
                            {d.assignedTo}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {d.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        {format(d.scheduledDate, "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {d.scheduledTime}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{d.duration}</td>
                    <td className="px-4 py-3">{renderPriorityBadge(d.priority)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-neutral-700 max-w-[180px]">
                        <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                        <span className="truncate">{d.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {d.status === "assigned" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(d.id, "en_route")}
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Mark En Route
                          </Button>
                        ) : null}
                        {d.status === "en_route" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(d.id, "on_site")}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Mark Arrived
                          </Button>
                        ) : null}
                        {d.status === "on_site" || d.status === "in_progress" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(d.id, "completed")}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Mark Complete
                          </Button>
                        ) : null}
                        {d.status === "unassigned" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alert("Assign crew (placeholder)")}
                          >
                            <User className="h-3.5 w-3.5" />
                            Assign
                          </Button>
                        ) : null}
                        {d.status === "completed" || d.status === "cancelled" ? (
                          <span className="text-xs text-neutral-400 px-2 py-1">
                            {d.status === "completed" ? "Done" : "Cancelled"}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-neutral-600">
                    No dispatch jobs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Calendar View */}
      {view === "calendar" ? (
        <Card className="py-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Week of {format(weekStart, "MMM dd, yyyy")}
              </CardTitle>
              <div className="text-sm text-neutral-600">
                {filtered.length} jobs this week
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Day headers */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b">
                  <div className="px-2 py-2 text-xs font-medium text-neutral-500">Time</div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "px-2 py-2 text-center text-xs font-medium border-l",
                        isSameDay(day, today)
                          ? "bg-blue-50 text-blue-700"
                          : "text-neutral-600"
                      )}
                    >
                      <div>{format(day, "EEE")}</div>
                      <div className="text-lg font-bold">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>

                {/* Hour rows */}
                {HOURS.map((hour, hourIdx) => (
                  <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b last:border-b-0">
                    <div className="px-2 py-3 text-xs text-neutral-400 border-r">{hour}</div>
                    {weekDays.map((day) => {
                      const dayJobs = filtered.filter(
                        (d) => isSameDay(d.scheduledDate, day) && parseHourIndex(d.scheduledTime) === hourIdx
                      )
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "border-l px-1 py-1 min-h-[48px]",
                            isSameDay(day, today) ? "bg-blue-50/30" : ""
                          )}
                        >
                          {dayJobs.map((job) => {
                            const statusCfg = STATUS_CONFIG[job.status]
                            return (
                              <div
                                key={job.id}
                                className={cn(
                                  "rounded px-1.5 py-1 text-[10px] leading-tight mb-1 cursor-pointer border",
                                  statusCfg.bg,
                                  statusCfg.text
                                )}
                                title={`${job.title} - ${job.assignedTo || "Unassigned"} (${job.duration})`}
                              >
                                <div className="font-medium truncate">{job.title.length > 28 ? job.title.slice(0, 28) + "..." : job.title}</div>
                                <div className="truncate opacity-75">
                                  {job.assignedTo || "Unassigned"} - {job.duration}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Map View Placeholder */}
      {view === "map" ? (
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">Map View</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="rounded-xl border bg-neutral-50 flex flex-col items-center justify-center py-20">
              <Navigation className="h-12 w-12 text-neutral-300 mb-4" />
              <div className="font-medium text-neutral-900">Map View Coming Soon</div>
              <div className="text-sm text-neutral-600 mt-1 max-w-md text-center">
                GPS tracking and real-time crew locations will be displayed here.
                Requires integration with a mapping provider (Google Maps, Mapbox).
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setView("list")}>
                Switch to List View
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
