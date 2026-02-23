"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { useCreatePhase, useUpdatePhase, useDeletePhase } from "@pm/hooks/useMultifamily"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhaseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETE"

const STATUS_CONFIG: Record<PhaseStatus, { label: string; color: string; bg: string }> = {
  PLANNED: { label: "Planned", color: "text-gray-600", bg: "bg-gray-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
  COMPLETE: { label: "Complete", color: "text-green-700", bg: "bg-green-100" },
}

interface Phase {
  id: string
  name: string
  description: string
  status: PhaseStatus
  startDate: string
  endDate: string
  unitCount: number
  completedUnits: number
  areas: string[]
}

const AREA_PRESETS = [
  "Building A",
  "Building B",
  "Building C",
  "North Wing",
  "South Wing",
  "East Wing",
  "West Wing",
  "Podium Level",
  "Parking Structure",
  "Amenity Level",
  "Common Areas",
  "Exterior / Site",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AreaPhasingPage() {
  const createPhase = useCreatePhase()
  const updatePhaseMutation = useUpdatePhase()
  const deletePhaseMutation = useDeletePhase()
  const [phases, setPhases] = React.useState<Phase[]>([])
  const [showNewPhase, setShowNewPhase] = React.useState(false)
  const [selectedPhase, setSelectedPhase] = React.useState<string | null>(null)
  const [newPhase, setNewPhase] = React.useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    areas: [] as string[],
    unitCount: 0,
  })

  function addPhase() {
    const phase: Phase = {
      id: `phase-${Date.now()}`,
      name: newPhase.name || `Phase ${phases.length + 1}`,
      description: newPhase.description,
      status: "PLANNED",
      startDate: newPhase.startDate,
      endDate: newPhase.endDate,
      unitCount: newPhase.unitCount,
      completedUnits: 0,
      areas: newPhase.areas,
    }
    setPhases((prev) => [...prev, phase])
    setShowNewPhase(false)
    setNewPhase({ name: "", description: "", startDate: "", endDate: "", areas: [], unitCount: 0 })
    // Persist to API
    createPhase.mutate({
      projectId: "current",
      name: phase.name,
      description: phase.description,
      startDate: phase.startDate,
      endDate: phase.endDate,
      unitCount: phase.unitCount,
      areas: phase.areas,
    })
  }

  function updatePhaseStatus(id: string, status: PhaseStatus) {
    setPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    )
    // Persist to API
    updatePhaseMutation.mutate({ id, status })
  }

  function removePhase(id: string) {
    setPhases((prev) => prev.filter((p) => p.id !== id))
    if (selectedPhase === id) setSelectedPhase(null)
    // Persist to API
    deletePhaseMutation.mutate(id)
  }

  function toggleArea(area: string) {
    setNewPhase((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }))
  }

  // Stats
  const totalPhases = phases.length
  const activePhases = phases.filter((p) => p.status === "IN_PROGRESS").length
  const completedPhases = phases.filter((p) => p.status === "COMPLETE").length
  const totalUnits = phases.reduce((s, p) => s + p.unitCount, 0)

  const detail = selectedPhase
    ? phases.find((p) => p.id === selectedPhase)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/pm/multifamily">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Area Phasing</h1>
            <p className="text-sm text-gray-500">
              Define construction phases by area and building
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewPhase(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Phase
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Phases</p>
            <p className="text-2xl font-bold">{totalPhases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-blue-600">{activePhases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {completedPhases}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Phased Units</p>
            <p className="text-2xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Phase List + Detail Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Phase List */}
        <div className="lg:col-span-2 space-y-3">
          {phases.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">
                  No phases defined yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create construction phases to organize work by building area
                  and timeline.
                </p>
                <Button onClick={() => setShowNewPhase(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Phase
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Timeline visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays size={16} />
                    Phase Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {phases.map((phase) => {
                      const cfg = STATUS_CONFIG[phase.status]
                      const pct =
                        phase.unitCount > 0
                          ? Math.round(
                              (phase.completedUnits / phase.unitCount) * 100,
                            )
                          : 0
                      return (
                        <div
                          key={phase.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedPhase === phase.id
                              ? "border-blue-300 bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedPhase(phase.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {phase.name}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {phase.startDate && (
                                <span>
                                  {phase.startDate} â†’ {phase.endDate}
                                </span>
                              )}
                              <span>{phase.unitCount} units</span>
                              <span>{phase.areas.join(", ") || "No areas"}</span>
                            </div>
                            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-gray-400 shrink-0"
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {detail ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{detail.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.description && (
                  <p className="text-sm text-gray-500">{detail.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Start Date</p>
                    <p className="font-medium">{detail.startDate || "â€”"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">End Date</p>
                    <p className="font-medium">{detail.endDate || "â€”"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Units</p>
                    <p className="font-medium">{detail.unitCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Completed</p>
                    <p className="font-medium">
                      {detail.completedUnits} / {detail.unitCount}
                    </p>
                  </div>
                </div>

                {detail.areas.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.areas.map((area) => (
                        <span
                          key={area}
                          className="text-xs bg-gray-100 px-2 py-0.5 rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <p className="text-xs text-gray-400">Update Status</p>
                  <select
                    value={detail.status}
                    onChange={(e) =>
                      updatePhaseStatus(
                        detail.id,
                        e.target.value as PhaseStatus,
                      )
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                      <option key={key} value={key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:bg-red-50"
                  onClick={() => removePhase(detail.id)}
                >
                  <Trash2 size={14} className="mr-2" />
                  Remove Phase
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Layers className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Select a phase to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Phase Modal */}
      {showNewPhase && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Add Phase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Phase Name</label>
                <Input
                  value={newPhase.name}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, name: e.target.value })
                  }
                  placeholder="e.g. Phase 1 â€” Building A Podium"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={newPhase.description}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, description: e.target.value })
                  }
                  placeholder="Brief description of phase scope..."
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[80px] resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newPhase.startDate}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, startDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newPhase.endDate}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, endDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Units in Phase
                </label>
                <Input
                  type="number"
                  value={newPhase.unitCount || ""}
                  onChange={(e) =>
                    setNewPhase({
                      ...newPhase,
                      unitCount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 13"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Areas / Buildings
                </label>
                <div className="flex flex-wrap gap-2">
                  {AREA_PRESETS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        newPhase.areas.includes(area)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewPhase(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addPhase}>Add Phase</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

