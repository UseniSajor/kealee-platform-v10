"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  Calendar,
  DollarSign,
  FolderKanban,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react"

import { api } from "@pm/lib/api-client"
import { useRole } from "@pm/lib/role-context"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"

const MULTIFAMILY_CATEGORIES = ["Multifamily", "Mixed-Use", "MULTIFAMILY", "MIXED_USE", "NEW_CONSTRUCTION"]

type Project = {
  id: string
  name: string
  clientId: string
  clientName?: string
  category?: string
  status: string
  progress: number
  budget?: number
  spent?: number
  startDate?: string
  currentPhase?: string
  /** Multifamily-specific fields */
  totalUnits?: number
  completedUnits?: number
  drawnToDate?: number
  loanAmount?: number
}

export default function ProjectsPage() {
  const { isInternal } = useRole()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  React.useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      // Gather projects from all assigned clients
      const clientsResponse = await api.getMyClients()
      const allClients = clientsResponse.clients || []

      const allProjects: Project[] = []
      for (const client of allClients) {
        try {
          const clientData = await api.getClient(client.id)
          const clientProjects = (clientData.client as any)?.projects || []
          for (const p of clientProjects) {
            allProjects.push({
              ...p,
              clientId: client.id,
              clientName: client.name,
            })
          }
        } catch {
          // Client may not have projects endpoint yet
        }
      }

      // If no projects came from API, show placeholder data
      if (allProjects.length === 0) {
        setProjects([
          {
            id: "proj-1",
            name: "Downtown Office Renovation",
            clientId: "demo",
            clientName: "Acme Construction",
            category: "Commercial",
            status: "active",
            progress: 62,
            budget: 450000,
            spent: 216000,
            startDate: "2026-01-06",
            currentPhase: "Rough-In",
          },
          {
            id: "proj-2",
            name: "Hillside Custom Home",
            clientId: "demo",
            clientName: "Summit Builders",
            category: "Residential",
            status: "active",
            progress: 35,
            budget: 820000,
            spent: 287000,
            startDate: "2025-11-15",
            currentPhase: "Framing",
          },
          {
            id: "proj-3",
            name: "Warehouse Expansion Phase 2",
            clientId: "demo",
            clientName: "Pacific Logistics",
            category: "Industrial",
            status: "on_hold",
            progress: 18,
            budget: 1200000,
            spent: 216000,
            startDate: "2026-02-01",
            currentPhase: "Permitting",
          },
          {
            id: "proj-4",
            name: "Riverwalk Apartments",
            clientId: "demo",
            clientName: "Meridian Development",
            category: "Multifamily",
            status: "active",
            progress: 42,
            budget: 8500000,
            spent: 3570000,
            startDate: "2025-09-15",
            currentPhase: "Rough-In",
            totalUnits: 51,
            completedUnits: 8,
            loanAmount: 6800000,
            drawnToDate: 2720000,
          },
        ])
      } else {
        setProjects(allProjects)
      }
    } catch {
      // Fallback placeholder
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = React.useMemo(() => {
    let list = projects
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.clientName || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      )
    }
    return list
  }, [projects, statusFilter, search])

  const statuses = ["all", "active", "on_hold", "completed"]

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      on_hold: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
    }
    return map[status] || "bg-neutral-50 text-neutral-700 border-neutral-200"
  }

  function formatCurrency(value: number | undefined) {
    if (!value) return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-neutral-600 mt-1">
            {isInternal ? "All projects across your assigned clients." : "Your projects and portfolio."}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />New Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search projects, clients, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {statuses.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All" : s === "on_hold" ? "On Hold" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="rounded-lg border bg-emerald-50 p-2 text-emerald-700">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{projects.filter((p) => p.status === "active").length}</div>
              <div className="text-sm text-neutral-600">Active Projects</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="rounded-lg border bg-blue-50 p-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0}%
              </div>
              <div className="text-sm text-neutral-600">Avg Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="rounded-lg border bg-purple-50 p-2 text-purple-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(projects.reduce((sum, p) => sum + (p.budget || 0), 0))}
              </div>
              <div className="text-sm text-neutral-600">Total Budget</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-neutral-600">Loading projects...</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-neutral-600">
            <FolderKanban className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
            <div className="font-medium">No projects found</div>
            <div className="text-sm mt-1">
              {search ? "Try a different search term." : "Projects from your assigned clients will appear here."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const isMF = MULTIFAMILY_CATEGORIES.includes(project.category || "")
            return (
              <Link
                key={project.id}
                href={isInternal ? `/pm/clients/${project.clientId}/pm/projects/${project.id}/overview` : `/pm/projects/${project.id}`}
                className="block"
              >
                <Card className="hover:border-primary hover:shadow-md transition-all h-full">
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-neutral-900 truncate">{project.name}</div>
                          {isMF && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700 whitespace-nowrap">
                              <Building2 className="h-3 w-3" />
                              {project.totalUnits || 0} units
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {project.clientName || "â€”"}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                          statusBadge(project.status)
                        )}
                      >
                        {project.status === "on_hold" ? "On Hold" : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-neutral-600">Progress</span>
                        <span className="font-medium text-neutral-900">{project.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-neutral-100">
                        <div
                          className="h-2 rounded-full bg-neutral-900"
                          style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
                        />
                      </div>
                    </div>

                    {/* Multifamily unit progress â€” only for MF projects */}
                    {isMF && project.totalUnits && project.totalUnits > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-blue-600 text-xs font-medium">Unit Completion</span>
                          <span className="text-xs text-neutral-600">
                            {project.completedUnits || 0} / {project.totalUnits}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-blue-50">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{
                              width: `${Math.max(0, Math.min(100, Math.round(((project.completedUnits || 0) / project.totalUnits) * 100)))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {project.budget ? (
                        <div>
                          <div className="text-neutral-600">Budget</div>
                          <div className="font-medium text-neutral-900">{formatCurrency(project.budget)}</div>
                        </div>
                      ) : null}
                      {project.currentPhase ? (
                        <div>
                          <div className="text-neutral-600">Phase</div>
                          <div className="font-medium text-neutral-900">{project.currentPhase}</div>
                        </div>
                      ) : null}
                      {project.category ? (
                        <div>
                          <div className="text-neutral-600">Category</div>
                          <div className="font-medium text-neutral-900">{project.category}</div>
                        </div>
                      ) : null}
                      {project.startDate ? (
                        <div>
                          <div className="text-neutral-600">Started</div>
                          <div className="font-medium text-neutral-900">
                            {new Date(project.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : null}
                      {/* Draw progress for multifamily */}
                      {isMF && project.loanAmount && project.loanAmount > 0 ? (
                        <div>
                          <div className="text-neutral-600">Drawn</div>
                          <div className="font-medium text-green-700">
                            {formatCurrency(project.drawnToDate || 0)}
                            <span className="text-neutral-400 font-normal text-xs ml-1">
                              / {formatCurrency(project.loanAmount)}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

