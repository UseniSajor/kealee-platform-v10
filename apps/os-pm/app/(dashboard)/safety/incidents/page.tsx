"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Filter,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  User,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type IncidentSeverity = "minor" | "moderate" | "serious" | "critical"
type IncidentType = "near-miss" | "first-aid" | "recordable" | "lost-time"
type IncidentStatus = "reported" | "investigating" | "resolved" | "closed"

interface Incident {
  id: string
  number: string
  title: string
  date: string
  time: string
  severity: IncidentSeverity
  type: IncidentType
  location: string
  reportedBy: string
  status: IncidentStatus
  description: string
}

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  serious: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
}

const STATUS_STYLES: Record<IncidentStatus, string> = {
  reported: "bg-blue-100 text-blue-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
}

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Reported",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
}

const TYPE_LABELS: Record<IncidentType, string> = {
  "near-miss": "Near Miss",
  "first-aid": "First Aid",
  recordable: "Recordable",
  "lost-time": "Lost Time",
}

const TYPE_STYLES: Record<IncidentType, string> = {
  "near-miss": "bg-blue-50 text-blue-700",
  "first-aid": "bg-yellow-50 text-yellow-700",
  recordable: "bg-orange-50 text-orange-700",
  "lost-time": "bg-red-50 text-red-700",
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "1", number: "INC-001", title: "Tripping hazard - unsecured extension cord",
    date: "2026-02-10", time: "09:15 AM", severity: "minor", type: "near-miss",
    location: "Building A - 2nd Floor", reportedBy: "Jake Wilson", status: "resolved",
    description: "Worker tripped over unsecured extension cord running across the hallway on the 2nd floor. No injury occurred but could have resulted in a fall.",
  },
  {
    id: "2", number: "INC-002", title: "Worker struck by falling debris from overhead work",
    date: "2026-02-07", time: "02:30 PM", severity: "moderate", type: "first-aid",
    location: "Building B - Roof Level", reportedBy: "Maria Santos", status: "investigating",
    description: "A small piece of concrete fell from the roof edge during demolition and struck a worker on the hard hat. Worker was not injured but had minor neck strain from the impact.",
  },
  {
    id: "3", number: "INC-003", title: "Near-miss: forklift close call in parking area",
    date: "2026-02-05", time: "07:45 AM", severity: "minor", type: "near-miss",
    location: "Staging Area - East Lot", reportedBy: "Tom Reeves", status: "closed",
    description: "Forklift operator backed up without a spotter and nearly struck a pedestrian worker who was walking behind. No contact was made.",
  },
  {
    id: "4", number: "INC-004", title: "Chemical spill - paint thinner in storage room",
    date: "2026-02-01", time: "11:00 AM", severity: "serious", type: "recordable",
    location: "Building A - Storage Room B", reportedBy: "Angela Cruz", status: "resolved",
    description: "A 5-gallon container of paint thinner tipped over and spilled onto the floor. Two workers reported eye and throat irritation. Area was evacuated and cleaned per HAZMAT protocol.",
  },
  {
    id: "5", number: "INC-005", title: "Ladder slip - worker fell from 6-foot step ladder",
    date: "2026-01-22", time: "01:15 PM", severity: "moderate", type: "first-aid",
    location: "Building C - Unit 201", reportedBy: "Dave Martinez", status: "closed",
    description: "Electrician slipped off a 6-foot step ladder while reaching overhead. Worker fell approximately 4 feet. First aid was administered on site for a sprained wrist.",
  },
  {
    id: "6", number: "INC-006", title: "Heat exhaustion incident during concrete pour",
    date: "2026-01-15", time: "03:00 PM", severity: "serious", type: "lost-time",
    location: "Building A - Foundation", reportedBy: "Carlos Rivera", status: "closed",
    description: "Concrete crew member exhibited signs of heat exhaustion during an afternoon pour. Worker was transported to the hospital, treated, and released. Required 3 days off work for recovery.",
  },
]

export default function SafetyIncidentsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [severityFilter, setSeverityFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return MOCK_INCIDENTS.filter((inc) => {
      if (statusFilter !== "all" && inc.status !== statusFilter) return false
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          inc.number.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.reportedBy.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, statusFilter, severityFilter])

  const stats = React.useMemo(
    () => ({
      total: MOCK_INCIDENTS.length,
      open: MOCK_INCIDENTS.filter((i) => i.status === "reported" || i.status === "investigating").length,
      resolved: MOCK_INCIDENTS.filter((i) => i.status === "resolved" || i.status === "closed").length,
      critical: MOCK_INCIDENTS.filter((i) => i.severity === "serious" || i.severity === "critical").length,
    }),
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/safety">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Safety
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Safety Incidents</h1>
          <p className="text-gray-500 mt-1">Track and manage safety incidents and near-misses</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: stats.total, icon: ShieldAlert, color: "text-blue-600 bg-blue-50" },
          { label: "Open / Investigating", value: stats.open, icon: Clock, color: "text-orange-600 bg-orange-50" },
          { label: "Resolved / Closed", value: stats.resolved, icon: AlertTriangle, color: "text-green-600 bg-green-50" },
          { label: "Serious / Critical", value: stats.critical, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Severities</option>
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="serious">Serious</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filtered.map((incident) => (
          <Card key={incident.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-sm font-mono font-bold text-blue-600">{incident.number}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEVERITY_STYLES[incident.severity])}>
                      {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_STYLES[incident.type])}>
                      {TYPE_LABELS[incident.type]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[incident.status])}>
                      {STATUS_LABELS[incident.status]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(incident.date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" at "}
                      {incident.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {incident.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      Reported by {incident.reportedBy}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <ShieldAlert size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No incidents found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
