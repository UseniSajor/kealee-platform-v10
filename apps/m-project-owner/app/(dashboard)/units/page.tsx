"use client"

import * as React from "react"
import {
  Building2,
  Grid3X3,
  Home,
  Plus,
  Search,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { useOwnerProfile } from "@/lib/user-context"
import {
  getUnits,
  getUnitStats,
  updateUnit,
  type MultifamilyUnit,
  type UnitStats,
} from "@/lib/client-api"
import { supabase } from "@/lib/supabase"

// ---------------------------------------------------------------------------
// Types & Config
// ---------------------------------------------------------------------------

type UnitStatus = "NOT_STARTED" | "ROUGH_IN" | "DRYWALL" | "FINISH" | "PUNCH" | "COMPLETE" | "TURNED_OVER"

const STATUS_CONFIG: Record<UnitStatus, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-gray-600", bg: "bg-gray-100" },
  ROUGH_IN: { label: "Rough-In", color: "text-orange-700", bg: "bg-orange-100" },
  DRYWALL: { label: "Drywall", color: "text-yellow-700", bg: "bg-yellow-100" },
  FINISH: { label: "Finish", color: "text-blue-700", bg: "bg-blue-100" },
  PUNCH: { label: "Punch List", color: "text-purple-700", bg: "bg-purple-100" },
  COMPLETE: { label: "Complete", color: "text-green-700", bg: "bg-green-100" },
  TURNED_OVER: { label: "Turned Over", color: "text-emerald-800", bg: "bg-emerald-100" },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitTrackerPage() {
  const { portalTabs } = useOwnerProfile()
  const [units, setUnits] = React.useState<MultifamilyUnit[]>([])
  const [stats, setStats] = React.useState<UnitStats | null>(null)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [loading, setLoading] = React.useState(true)
  const [projectId, setProjectId] = React.useState<string | null>(null)

  // Load project + units from API
  React.useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Get user's first project (in production, this would be route-based)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/projects`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        )
        if (!res.ok) throw new Error("Failed to load projects")
        const data = await res.json()
        const projects = data.projects || []
        // Find first multifamily project
        const mfProject = projects.find((p: any) =>
          ["Multifamily", "Mixed-Use", "MULTIFAMILY", "MIXED_USE"].includes(p.category || ""),
        ) || projects[0]

        if (mfProject) {
          setProjectId(mfProject.id)
          const [unitsRes, statsRes] = await Promise.all([
            getUnits(mfProject.id),
            getUnitStats(mfProject.id),
          ])
          setUnits(unitsRes.units || [])
          setStats(statsRes)
        }
      } catch (err) {
        console.warn("Failed to load units:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter
  const filtered = units.filter((u) => {
    const matchesSearch =
      !search ||
      u.number.toLowerCase().includes(search.toLowerCase()) ||
      u.building.toLowerCase().includes(search.toLowerCase()) ||
      u.unitType.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats from API or computed
  const totalUnits = stats?.total ?? units.length
  const completeUnits = stats?.complete ?? units.filter(u => u.status === "COMPLETE" || u.status === "TURNED_OVER").length
  const inProgressUnits = stats?.inProgress ?? units.filter(u => !["NOT_STARTED", "COMPLETE", "TURNED_OVER"].includes(u.status)).length
  const punchUnits = stats?.punch ?? units.filter(u => u.status === "PUNCH").length

  async function handleStatusChange(unit: MultifamilyUnit, newStatus: string) {
    try {
      await updateUnit(unit.id, { status: newStatus } as any)
      setUnits((prev) =>
        prev.map((u) => (u.id === unit.id ? { ...u, status: newStatus } : u)),
      )
    } catch {
      // Fallback: update locally
      setUnits((prev) =>
        prev.map((u) => (u.id === unit.id ? { ...u, status: newStatus } : u)),
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Unit Tracker</h1>
          <p className="text-sm text-gray-500">
            Track construction status for every unit in your project
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Units</p>
            <p className="text-2xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{inProgressUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Punch List</p>
            <p className="text-2xl font-bold text-purple-600">{punchUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Complete</p>
            <p className="text-2xl font-bold text-green-600">
              {completeUnits}
              {totalUnits > 0 && (
                <span className="text-sm font-normal text-gray-400 ml-1">
                  ({Math.round((completeUnits / totalUnits) * 100)}%)
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-white h-10"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Unit Grid */}
      {units.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Home className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No units yet</h3>
            <p className="text-sm text-gray-500">
              Your project manager will add units as they set up your multifamily project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((unit) => {
            const cfg = STATUS_CONFIG[unit.status as UnitStatus] ?? STATUS_CONFIG.NOT_STARTED
            return (
              <Card key={unit.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">Unit {unit.number}</p>
                      <p className="text-xs text-gray-400">
                        {unit.building} · Floor {unit.floor}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{unit.unitType}</span>
                    <span>{unit.sqft} SF</span>
                    {unit.punchItems > 0 && (
                      <span className="text-purple-600">{unit.punchItems} punch items</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
