"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { AlertCircle, Camera, ChevronRight, MapPin, Plus, Search, User } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type Priority = "Critical" | "High" | "Medium" | "Low"
type Status = "Open" | "In Progress" | "Ready for Review" | "Closed"

interface PunchItem {
  id: string; title: string; location: string; status: Status
  assignee: string; priority: Priority; trade: string
  createdAt: string; photoCount: number
}

const PC: Record<Priority, string> = {
  Critical: "bg-red-100 text-red-800 border-red-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Low: "bg-green-100 text-green-800 border-green-200",
}

const SC: Record<Status, string> = {
  Open: "bg-blue-100 text-blue-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Ready for Review": "bg-purple-100 text-purple-800",
  Closed: "bg-gray-100 text-gray-600",
}

const DATA: PunchItem[] = [
  { id: "PI-001", title: "Drywall patch needed - Unit 302", location: "Bldg A, Floor 3, Unit 302", status: "Open", assignee: "Martinez Drywall Co.", priority: "High", trade: "Drywall", createdAt: "2026-02-05", photoCount: 3 },
  { id: "PI-002", title: "Paint touch-up - Lobby", location: "Bldg A, Main Lobby", status: "In Progress", assignee: "ProCoat Painters", priority: "Medium", trade: "Painting", createdAt: "2026-02-03", photoCount: 2 },
  { id: "PI-003", title: "HVAC grille misaligned - Conference Room", location: "Bldg B, Floor 2, Rm 210", status: "Open", assignee: "Apex Mechanical", priority: "Low", trade: "HVAC", createdAt: "2026-02-06", photoCount: 1 },
  { id: "PI-004", title: "Fire caulking missing at penetration", location: "Bldg A, Floor 1, Elec Room", status: "Open", assignee: "SafeGuard Firestop", priority: "Critical", trade: "Firestopping", createdAt: "2026-02-07", photoCount: 4 },
  { id: "PI-005", title: "Carpet seam separation - Suite 400", location: "Bldg B, Floor 4, Suite 400", status: "Ready for Review", assignee: "FloorCraft Inc.", priority: "Medium", trade: "Flooring", createdAt: "2026-01-28", photoCount: 2 },
  { id: "PI-006", title: "Door hardware not latching - Stairwell B", location: "Bldg A, Stairwell B, Floor 2", status: "Closed", assignee: "Allied Door & Hardware", priority: "High", trade: "Doors", createdAt: "2026-01-20", photoCount: 1 },
  { id: "PI-007", title: "Light fixture flickering - Parking Garage", location: "Parking Garage, Level P2", status: "In Progress", assignee: "BrightStar Electric", priority: "Medium", trade: "Electrical", createdAt: "2026-02-04", photoCount: 0 },
  { id: "PI-008", title: "Cracked tile at elevator threshold", location: "Bldg A, Floor 1, Elevator 2", status: "Open", assignee: "Precision Tile Works", priority: "High", trade: "Tile", createdAt: "2026-02-08", photoCount: 5 },
]

const STS: Status[] = ["Open", "In Progress", "Ready for Review", "Closed"]

export default function PunchListPage() {
  const [query, setQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState<Status | "All">("All")
  const filtered = useMemo(() => DATA.filter((i) => {
    const ms = !query || i.title.toLowerCase().includes(query.toLowerCase())
      || i.location.toLowerCase().includes(query.toLowerCase())
    return ms && (activeStatus === "All" || i.status === activeStatus)
  }), [query, activeStatus])
  const stats = useMemo(() => {
    const t = DATA.length
    const o = DATA.filter((i) => i.status === "Open").length
    const c = DATA.filter((i) => i.status === "Closed").length
    return { total: t, open: o, closed: c, pct: t > 0 ? Math.round((c / t) * 100) : 0 }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Punch List</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage punch list items across all project areas.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />Create Item
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-sm font-medium text-gray-500">Total Items</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm font-medium text-gray-500">Open</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.open}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm font-medium text-gray-500">Closed</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.closed}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search items, locations, or assignees..."
            value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={activeStatus === "All" ? "default" : "outline"}
            size="sm" onClick={() => setActiveStatus("All")}>All</Button>
          {STS.map((s) => (
            <Button key={s} variant={activeStatus === s ? "default" : "outline"}
              size="sm" onClick={() => setActiveStatus(s)}>{s}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((item) => (
          <Card key={item.id} className="group cursor-pointer hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex h-36 items-center justify-center rounded-t-lg bg-gray-100">
                <Camera className="h-8 w-8 text-gray-300" />
                <span className="ml-2 text-xs text-gray-400">
                  {item.photoCount > 0 ? item.photoCount + " photos" : "No photos"}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <span className="text-xs text-gray-400">{item.id}</span>
                  <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" /><span className="truncate">{item.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User className="h-3.5 w-3.5" /><span className="truncate">{item.assignee}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", PC[item.priority])}>
                    {item.priority}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SC[item.status])}>
                    {item.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No punch list items found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  )
}
