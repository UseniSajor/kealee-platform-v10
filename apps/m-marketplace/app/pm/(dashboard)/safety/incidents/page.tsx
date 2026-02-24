"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  User,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { useSafetyIncidents } from "@pm/hooks/useSafety"

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

export default function SafetyIncidentsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [severityFilter, setSeverityFilter] = React.useState<string>("all")

  const { data, isLoading } = useSafetyIncidents({
    status: statusFilter !== "all" ? statusFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    search: search || undefined,
  })
  const incidents: Incident[] = data?.items ?? []

  const filtered = React.useMemo(() => {
    return incidents
  }, [incidents])

  const stats = React.useMemo(
    () => ({
      total: incidents.length,
      open: incidents.filter((i) => i.status === "reported" || i.status === "investigating").length,
      resolved: incidents.filter((i) => i.status === "resolved" || i.status === "closed").length,
      critical: incidents.filter((i) => i.severity === "serious" || i.severity === "critical").length,
    }),
    [incidents]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pm/safety">
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

