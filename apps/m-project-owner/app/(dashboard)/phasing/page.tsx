"use client"

import * as React from "react"
import {
  CalendarDays,
  ChevronRight,
  Layers,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { useOwnerProfile } from "@/lib/user-context"
import { getPhases, type AreaPhase } from "@/lib/client-api"
import { supabase } from "@/lib/supabase"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type PhaseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETE"

const STATUS_CONFIG: Record<PhaseStatus, { label: string; color: string; bg: string }> = {
  PLANNED: { label: "Planned", color: "text-gray-600", bg: "bg-gray-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
  COMPLETE: { label: "Complete", color: "text-green-700", bg: "bg-green-100" },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AreaPhasingPage() {
  const [phases, setPhases] = React.useState<AreaPhase[]>([])
  const [selectedPhase, setSelectedPhase] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/projects`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        )
        if (!res.ok) throw new Error("Failed to load projects")
        const data = await res.json()
        const projects = data.projects || []
        const mfProject = projects.find((p: any) =>
          ["Multifamily", "Mixed-Use", "MULTIFAMILY", "MIXED_USE"].includes(p.category || ""),
        ) || projects[0]

        if (mfProject) {
          const phasesRes = await getPhases(mfProject.id)
          setPhases(phasesRes.phases || [])
        }
      } catch (err) {
        console.warn("Failed to load phases:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPhases = phases.length
  const activePhases = phases.filter(p => p.status === "IN_PROGRESS").length
  const completedPhases = phases.filter(p => p.status === "COMPLETE").length
  const totalUnits = phases.reduce((s, p) => s + p.unitCount, 0)

  const detail = selectedPhase ? phases.find(p => p.id === selectedPhase) : null

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
      <div>
        <h1 className="text-2xl font-bold">Area Phasing</h1>
        <p className="text-sm text-gray-500">
          View construction phases by area and building
        </p>
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
            <p className="text-2xl font-bold text-green-600">{completedPhases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Phased Units</p>
            <p className="text-2xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Phase List + Detail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Phase List */}
        <div className="lg:col-span-2 space-y-3">
          {phases.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">No phases defined yet</h3>
                <p className="text-sm text-gray-500">
                  Your project manager will define construction phases for your project.
                </p>
              </CardContent>
            </Card>
          ) : (
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
                    const cfg = STATUS_CONFIG[phase.status as PhaseStatus] ?? STATUS_CONFIG.PLANNED
                    const pct = phase.unitCount > 0
                      ? Math.round((phase.completedUnits / phase.unitCount) * 100)
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
                            <p className="font-medium text-sm truncate">{phase.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {phase.startDate && (
                              <span>
                                {new Date(phase.startDate).toLocaleDateString()} → {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : "TBD"}
                              </span>
                            )}
                            <span>{phase.unitCount} units</span>
                            <span>{(phase.areas || []).join(", ") || "No areas"}</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
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
                    <p className="font-medium">{detail.startDate ? new Date(detail.startDate).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">End Date</p>
                    <p className="font-medium">{detail.endDate ? new Date(detail.endDate).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Units</p>
                    <p className="font-medium">{detail.unitCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Completed</p>
                    <p className="font-medium">{detail.completedUnits} / {detail.unitCount}</p>
                  </div>
                </div>
                {(detail.areas || []).length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {(detail.areas || []).map((area: string) => (
                        <span key={area} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
    </div>
  )
}
