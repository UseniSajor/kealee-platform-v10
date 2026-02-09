"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Plus,
  Filter,
  BarChart3,
  TrendingUp,
  Shield,
  X,
} from "lucide-react"

import { api } from "@/lib/api"

export default function QualityControlPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [filters, setFilters] = React.useState<{
    status?: string
    phase?: string
  }>({})

  // Create checklist modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [checklistName, setChecklistName] = React.useState("")
  const [checklistPhase, setChecklistPhase] = React.useState("")

  const createChecklistMutation = useMutation({
    mutationFn: () => api.createQCChecklist(projectId, {
      checklistName,
      phase: checklistPhase || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklists", projectId] })
      setShowCreateModal(false)
      setChecklistName("")
      setChecklistPhase("")
    },
  })

  // Fetch QC checklists
  const { data: checklistsData } = useQuery({
    queryKey: ["qc-checklists", projectId, filters],
    queryFn: () => api.listQCChecklists(projectId, filters),
  })

  const checklists = checklistsData?.checklists || []

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const summary = {
    total: checklists.length,
    completed: checklists.filter((c: any) => c.status === "COMPLETED").length,
    inProgress: checklists.filter((c: any) => c.status === "IN_PROGRESS").length,
    pending: checklists.filter((c: any) => c.status === "PENDING").length,
  }

  // Calculate overall metrics
  const overallMetrics = {
    totalItems: checklists.reduce((sum: number, c: any) => sum + (c._count?.items || 0), 0),
    totalChecks: checklists.reduce((sum: number, c: any) => sum + (c._count?.checks || 0), 0),
    averagePassRate: checklists.length > 0
      ? checklists.reduce((sum: number, c: any) => sum + (parseFloat(c.metrics?.passRate || "0")), 0) / checklists.length
      : 0,
    totalErrors: checklists.reduce((sum: number, c: any) => sum + (c.metrics?.totalErrors || 0), 0),
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Quality Control</h1>
              <p className="text-neutral-600">Quality control checklists, error tracking, and continuous improvement</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Checklist
            </button>
          </div>

          {/* Overall Metrics */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{summary.total}</div>
              <div className="text-sm text-neutral-600">Total Checklists</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-sm text-neutral-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{overallMetrics.averagePassRate.toFixed(1)}%</div>
              <div className="text-sm text-neutral-600">Avg Pass Rate</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-red-600">{overallMetrics.totalErrors}</div>
              <div className="text-sm text-neutral-600">Total Errors</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-neutral-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phase</label>
                <select
                  value={filters.phase || ""}
                  onChange={(e) => setFilters({ ...filters, phase: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Phases</option>
                  <option value="SD">Schematic Design</option>
                  <option value="DD">Design Development</option>
                  <option value="CD">Construction Documents</option>
                </select>
              </div>
            </div>
          </div>

          {/* QC Checklists */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quality Control Checklists ({checklists.length})
            </h2>
            {checklists.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No quality control checklists found</p>
                <p className="text-sm mt-2">Create a checklist to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checklists.map((checklist: any) => (
                  <div
                    key={checklist.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/projects/${projectId}/quality-control/${checklist.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-neutral-900">{checklist.checklistName}</h3>
                          <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(checklist.status)}`}>
                            {checklist.status}
                          </span>
                        </div>
                        {checklist.phase && (
                          <div className="text-sm text-neutral-600 mb-2">Phase: {checklist.phase}</div>
                        )}
                        {checklist.phaseInstance && (
                          <div className="text-sm text-neutral-600">Phase Instance: {checklist.phaseInstance.name}</div>
                        )}
                      </div>
                      {checklist.metrics && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-neutral-900">
                            {parseFloat(checklist.metrics.passRate || "0").toFixed(1)}% Pass Rate
                          </div>
                          <div className="text-xs text-neutral-500">
                            {checklist.metrics.totalErrors || 0} errors
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <span>{checklist._count?.items || 0} items</span>
                      <span>{checklist._count?.checks || 0} checks</span>
                      {checklist.completedAt && (
                        <span>Completed: {formatDate(checklist.completedAt)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Checklist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New QC Checklist</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Checklist Name *</label>
                <input
                  type="text"
                  value={checklistName}
                  onChange={(e) => setChecklistName(e.target.value)}
                  placeholder="e.g. SD Phase QC Review"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phase</label>
                <select
                  value={checklistPhase}
                  onChange={(e) => setChecklistPhase(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">Select Phase</option>
                  <option value="PRE_DESIGN">Pre-Design</option>
                  <option value="SCHEMATIC_DESIGN">Schematic Design</option>
                  <option value="DESIGN_DEVELOPMENT">Design Development</option>
                  <option value="CONSTRUCTION_DOCUMENTS">Construction Documents</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => createChecklistMutation.mutate()}
                  disabled={!checklistName || createChecklistMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createChecklistMutation.isPending ? "Creating..." : "Create Checklist"}
                </button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {createChecklistMutation.isError && (
                <p className="text-sm text-red-600">Failed to create checklist. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
