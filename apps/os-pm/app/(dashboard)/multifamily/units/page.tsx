"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Filter,
  Grid3X3,
  Home,
  Loader2,
  Plus,
  Search,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { useCreateUnit, useBulkCreateUnits } from "@/hooks/useMultifamily"

// ---------------------------------------------------------------------------
// Types
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

const UNIT_TYPES = ["Studio", "1BR", "1BR+Den", "2BR", "2BR+Den", "3BR", "Townhome"]

// ---------------------------------------------------------------------------
// Bulk unit generator
// ---------------------------------------------------------------------------

interface BulkConfig {
  buildingName: string
  floors: number
  unitsPerFloor: number
  unitType: string
  sqft: number
  startingNumber: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitTrackerPage() {
  const createUnit = useCreateUnit()
  const bulkCreate = useBulkCreateUnits()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [showBulkModal, setShowBulkModal] = React.useState(false)
  const [units, setUnits] = React.useState<any[]>([])

  // Bulk config state
  const [bulk, setBulk] = React.useState<BulkConfig>({
    buildingName: "Building A",
    floors: 4,
    unitsPerFloor: 13,
    unitType: "1BR",
    sqft: 750,
    startingNumber: 101,
  })

  function generateBulkUnits() {
    const generated: any[] = []
    let num = bulk.startingNumber
    for (let floor = 1; floor <= bulk.floors; floor++) {
      for (let u = 1; u <= bulk.unitsPerFloor; u++) {
        generated.push({
          number: String(num),
          building: bulk.buildingName,
          floor,
          unitType: bulk.unitType,
          sqft: bulk.sqft,
          status: "NOT_STARTED" as UnitStatus,
          punchItems: 0,
        })
        num++
      }
    }
    setUnits((prev) => [...prev, ...generated])
    setShowBulkModal(false)
  }

  function updateUnitStatus(index: number, status: UnitStatus) {
    setUnits((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], status }
      return updated
    })
  }

  // Filter units
  const filtered = units.filter((u) => {
    const matchesSearch =
      !search ||
      u.number?.toLowerCase().includes(search.toLowerCase()) ||
      u.building?.toLowerCase().includes(search.toLowerCase()) ||
      u.unitType?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const totalUnits = units.length
  const completeUnits = units.filter(
    (u) => u.status === "COMPLETE" || u.status === "TURNED_OVER",
  ).length
  const inProgressUnits = units.filter(
    (u) => !["NOT_STARTED", "COMPLETE", "TURNED_OVER"].includes(u.status),
  ).length
  const punchUnits = units.filter((u) => u.status === "PUNCH").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/multifamily">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Unit Tracker</h1>
            <p className="text-sm text-gray-500">
              Track construction status for every unit
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkModal(true)}
          >
            <Grid3X3 className="mr-2 h-4 w-4" />
            Bulk Add Units
          </Button>
          <Button
            onClick={() => {
              setUnits((prev) => [
                ...prev,
                {
                  number: String(prev.length + 101),
                  building: "Building A",
                  floor: 1,
                  unitType: "1BR",
                  sqft: 750,
                  status: "NOT_STARTED" as UnitStatus,
                  punchItems: 0,
                },
              ])
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Stats Row */}
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
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* Unit Grid */}
      {units.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Home className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No units yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start by adding individual units or use Bulk Add to generate units
              for your entire project.
            </p>
            <Button onClick={() => setShowBulkModal(true)}>
              <Grid3X3 className="mr-2 h-4 w-4" />
              Bulk Add Units
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((unit, idx) => {
            const cfg = STATUS_CONFIG[unit.status as UnitStatus] ?? STATUS_CONFIG.NOT_STARTED
            return (
              <Card
                key={`${unit.number}-${idx}`}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">Unit {unit.number}</p>
                      <p className="text-xs text-gray-400">
                        {unit.building} · Floor {unit.floor}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{unit.unitType}</span>
                    <span>{unit.sqft} SF</span>
                  </div>

                  {/* Status selector */}
                  <select
                    value={unit.status}
                    onChange={(e) =>
                      updateUnitStatus(
                        units.indexOf(unit),
                        e.target.value as UnitStatus,
                      )
                    }
                    className="w-full border rounded px-2 py-1 text-xs bg-white"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                      <option key={key} value={key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Bulk Add Units</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Building Name</label>
                <Input
                  value={bulk.buildingName}
                  onChange={(e) =>
                    setBulk({ ...bulk, buildingName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Floors</label>
                  <Input
                    type="number"
                    value={bulk.floors}
                    onChange={(e) =>
                      setBulk({ ...bulk, floors: parseInt(e.target.value) || 1 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Units/Floor</label>
                  <Input
                    type="number"
                    value={bulk.unitsPerFloor}
                    onChange={(e) =>
                      setBulk({
                        ...bulk,
                        unitsPerFloor: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Unit Type</label>
                  <select
                    value={bulk.unitType}
                    onChange={(e) =>
                      setBulk({ ...bulk, unitType: e.target.value })
                    }
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white h-10"
                  >
                    {UNIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Avg SF</label>
                  <Input
                    type="number"
                    value={bulk.sqft}
                    onChange={(e) =>
                      setBulk({ ...bulk, sqft: parseInt(e.target.value) || 500 })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Starting Number</label>
                <Input
                  type="number"
                  value={bulk.startingNumber}
                  onChange={(e) =>
                    setBulk({
                      ...bulk,
                      startingNumber: parseInt(e.target.value) || 101,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <p className="text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">
                This will generate{" "}
                <strong>{bulk.floors * bulk.unitsPerFloor}</strong> units (
                {bulk.floors} floors x {bulk.unitsPerFloor} per floor)
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={generateBulkUnits}>
                  Generate {bulk.floors * bulk.unitsPerFloor} Units
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
