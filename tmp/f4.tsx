"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { AlertTriangle, Plus, Search } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type IncidentType = "Near Miss" | "First Aid" | "Recordable" | "Lost Time"
type Severity = "Critical" | "High" | "Medium" | "Low"
type IncidentStatus = "Open" | "Under Review" | "Closed"

interface Incident {
  id: string; date: string; type: IncidentType; severity: Severity
  description: string; status: IncidentStatus; reportedBy: string; location: string
}

const SEV: Record<Severity, string> = { Critical: "bg-red-100 text-red-800", High: "bg-orange-100 text-orange-800", Medium: "bg-yellow-100 text-yellow-800", Low: "bg-green-100 text-green-800" }
const STC: Record<IncidentStatus, string> = { Open: "bg-blue-100 text-blue-800", "Under Review": "bg-amber-100 text-amber-800", Closed: "bg-gray-100 text-gray-600" }

const DATA: Incident[] = [
  { id: "INC-021", date: "2026-02-08", type: "Near Miss", severity: "High", description: "Unsecured ladder on level 3 scaffolding", status: "Under Review", reportedBy: "Carlos Ruiz", location: "Bldg A, Floor 3" },
  { id: "INC-020", date: "2026-02-05", type: "First Aid", severity: "Low", description: "Minor cut from sheet metal edge", status: "Closed", reportedBy: "James Wilson", location: "Bldg B, Mech Room" },
  { id: "INC-019", date: "2026-01-30", type: "Near Miss", severity: "Medium", description: "Material fell from overhead hoist", status: "Closed", reportedBy: "Mike Torres", location: "Bldg A, Floor 5" },
  { id: "INC-018", date: "2026-01-22", type: "Recordable", severity: "High", description: "Sprained ankle from uneven ground", status: "Closed", reportedBy: "David Chen", location: "Excavation Zone" },
  { id: "INC-017", date: "2026-01-15", type: "First Aid", severity: "Low", description: "Eye irritation from concrete dust", status: "Closed", reportedBy: "Ana Morales", location: "Bldg A, Floor 1" },
  { id: "INC-016", date: "2026-01-08", type: "Near Miss", severity: "Medium", description: "Electrical panel left open in active area", status: "Closed", reportedBy: "Tom Bradley", location: "Bldg B, Elec Room" },
  { id: "INC-015", date: "2025-12-18", type: "Lost Time", severity: "Critical", description: "Worker fell from 6ft platform - back strain", status: "Closed", reportedBy: "John Martinez", location: "Bldg A, Floor 4" },
  { id: "INC-014", date: "2025-12-10", type: "First Aid", severity: "Low", description: "Bee sting on exterior work", status: "Closed", reportedBy: "Sarah Kim", location: "Site Exterior" },
]

const TYPES: IncidentType[] = ["Near Miss", "First Aid", "Recordable", "Lost Time"]
const SEVS: Severity[] = ["Critical", "High", "Medium", "Low"]

export default function IncidentsPage() {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<IncidentType | "All">("All")
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All")
  const filtered = useMemo(() => DATA.filter((inc) => {
    const mq = !query || inc.description.toLowerCase().includes(query.toLowerCase())
    return mq && (typeFilter === "All" || inc.type === typeFilter) && (sevFilter === "All" || inc.severity === sevFilter)
  }), [query, typeFilter, sevFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage all safety incident reports.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Create Incident Report</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search incidents..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border bg-white px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="All">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="rounded-md border bg-white px-3 py-2 text-sm" value={sevFilter} onChange={(e) => setSevFilter(e.target.value as any)}>
            <option value="All">All Severities</option>
            {SEVS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reported By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => (
                  <tr key={inc.id} className="cursor-pointer border-b hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{inc.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{inc.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{inc.type}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEV[inc.severity])}>{inc.severity}</span></td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm">{inc.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{inc.reportedBy}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STC[inc.status])}>{inc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No incidents match your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
