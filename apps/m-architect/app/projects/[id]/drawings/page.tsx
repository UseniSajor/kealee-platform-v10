"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Layers,
  Edit,
  Eye,
} from "lucide-react"

import { api } from "@/lib/api"

export default function DrawingsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showCreateSheet, setShowCreateSheet] = React.useState(false)
  const [showCreateSet, setShowCreateSet] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    discipline?: string
    status?: string
  }>({})
  const [selectedSheet, setSelectedSheet] = React.useState<string | null>(null)

  // Fetch sheets
  const { data: sheetsData } = useQuery({
    queryKey: ["sheets", projectId, filters],
    queryFn: () => api.listSheets(projectId, filters),
  })

  // Fetch drawing sets
  const { data: setsData } = useQuery({
    queryKey: ["drawing-sets", projectId],
    queryFn: () => api.listDrawingSets(projectId),
  })

  const sheets = sheetsData?.sheets || []
  const sets = setsData?.sets || []

  const updateSheetMutation = useMutation({
    mutationFn: ({ sheetId, data }: { sheetId: string; data: any }) =>
      api.updateSheet(sheetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheets", projectId] })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
      case "STARTED":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CHECKED":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-300"
      case "ISSUED":
        return "bg-indigo-100 text-indigo-700 border-indigo-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getDisciplineName = (discipline: string) => {
    const names: Record<string, string> = {
      A_ARCHITECTURAL: "Architectural",
      S_STRUCTURAL: "Structural",
      M_MECHANICAL: "Mechanical",
      E_ELECTRICAL: "Electrical",
      P_PLUMBING: "Plumbing",
      C_CIVIL: "Civil",
      L_LANDSCAPE: "Landscape",
      I_INTERIORS: "Interiors",
      FP_FIRE_PROTECTION: "Fire Protection",
      T_TELECOMMUNICATIONS: "Telecommunications",
      OTHER: "Other",
    }
    return names[discipline] || discipline
  }

  const getDisciplineColor = (discipline: string) => {
    const colors: Record<string, string> = {
      A_ARCHITECTURAL: "bg-blue-50 text-blue-700 border-blue-300",
      S_STRUCTURAL: "bg-gray-50 text-gray-700 border-gray-300",
      M_MECHANICAL: "bg-green-50 text-green-700 border-green-300",
      E_ELECTRICAL: "bg-yellow-50 text-yellow-700 border-yellow-300",
      P_PLUMBING: "bg-cyan-50 text-cyan-700 border-cyan-300",
      C_CIVIL: "bg-orange-50 text-orange-700 border-orange-300",
      L_LANDSCAPE: "bg-emerald-50 text-emerald-700 border-emerald-300",
      I_INTERIORS: "bg-pink-50 text-pink-700 border-pink-300",
      FP_FIRE_PROTECTION: "bg-red-50 text-red-700 border-red-300",
      T_TELECOMMUNICATIONS: "bg-purple-50 text-purple-700 border-purple-300",
      OTHER: "bg-neutral-50 text-neutral-700 border-neutral-300",
    }
    return colors[discipline] || "bg-neutral-50 text-neutral-700 border-neutral-300"
  }

  // Group sheets by discipline
  const sheetsByDiscipline = React.useMemo(() => {
    const grouped: Record<string, any[]> = {}
    sheets.forEach((sheet: any) => {
      if (!grouped[sheet.discipline]) {
        grouped[sheet.discipline] = []
      }
      grouped[sheet.discipline].push(sheet)
    })
    return grouped
  }, [sheets])

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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Drawing Sets</h1>
              <p className="text-neutral-600">Manage drawing sheets and sets</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateSet(true)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                <Layers className="h-4 w-4" />
                Create Set
              </button>
              <button
                onClick={() => setShowCreateSheet(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Sheet
              </button>
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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Discipline</label>
                <select
                  value={filters.discipline || ""}
                  onChange={(e) => setFilters({ ...filters, discipline: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Disciplines</option>
                  <option value="A_ARCHITECTURAL">Architectural</option>
                  <option value="S_STRUCTURAL">Structural</option>
                  <option value="M_MECHANICAL">Mechanical</option>
                  <option value="E_ELECTRICAL">Electrical</option>
                  <option value="P_PLUMBING">Plumbing</option>
                  <option value="C_CIVIL">Civil</option>
                  <option value="L_LANDSCAPE">Landscape</option>
                  <option value="I_INTERIORS">Interiors</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="STARTED">Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CHECKED">Checked</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ISSUED">Issued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drawing Sets */}
          {sets.length > 0 && (
            <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Drawing Sets ({sets.length})</h2>
              <div className="space-y-3">
                {sets.map((set: any) => (
                  <div
                    key={set.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-neutral-900">{set.name}</h3>
                        {set.description && (
                          <p className="text-sm text-neutral-600 mt-1">{set.description}</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">
                          {set.sheetIds.length} sheet{set.sheetIds.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/projects/${projectId}/drawings/sets/${set.id}`)}
                          className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          View
                        </button>
                        {set.combinedPdfFileId && (
                          <a
                            href={`/files/${set.combinedPdfFileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sheets by Discipline */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Drawing Sheets ({sheets.length})</h2>

            {sheets.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No drawing sheets found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(sheetsByDiscipline).map(([discipline, disciplineSheets]) => (
                  <div key={discipline}>
                    <h3 className="text-md font-semibold text-neutral-700 mb-3">
                      {getDisciplineName(discipline)} ({disciplineSheets.length})
                    </h3>
                    <div className="space-y-2">
                      {disciplineSheets.map((sheet: any) => (
                        <div
                          key={sheet.id}
                          className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs border rounded-full px-2 py-1 ${getDisciplineColor(sheet.discipline)}`}>
                                  {sheet.fullSheetNumber}
                                </span>
                                {sheet.currentRevision !== "0" && (
                                  <span className="text-xs text-neutral-500">Rev {sheet.currentRevision}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-neutral-900">{sheet.sheetTitle}</h3>
                                  <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(sheet.status)}`}>
                                    {sheet.status.replace("_", " ")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-neutral-600">
                                  {sheet.drawnBy && <span>Drawn by: {sheet.drawnBy.name}</span>}
                                  {sheet.checkedBy && <span>Checked by: {sheet.checkedBy.name}</span>}
                                  {sheet.approvedBy && <span>Approved by: {sheet.approvedBy.name}</span>}
                                </div>
                                {sheet.revisionHistory && (sheet.revisionHistory as any[]).length > 0 && (
                                  <div className="mt-2 text-xs text-neutral-500">
                                    {(sheet.revisionHistory as any[]).length} revision{(sheet.revisionHistory as any[]).length !== 1 ? "s" : ""}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  const newStatus = prompt("New status (NOT_STARTED, STARTED, IN_PROGRESS, CHECKED, APPROVED, ISSUED):")
                                  if (newStatus) {
                                    updateSheetMutation.mutate({
                                      sheetId: sheet.id,
                                      data: { status: newStatus },
                                    })
                                  }
                                }}
                                disabled={updateSheetMutation.isPending}
                                className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                              >
                                Update Status
                              </button>
                              <button
                                onClick={() => setSelectedSheet(sheet.id)}
                                className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Sheet Modal */}
          {showCreateSheet && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Drawing Sheet</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  Sheet creation form would be implemented here with discipline selection, title, and file upload.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateSheet(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert("Create sheet form would be implemented here")
                      setShowCreateSheet(false)
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Set Modal */}
          {showCreateSet && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Drawing Set</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  Drawing set creation form would be implemented here with name, description, and sheet selection.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateSet(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert("Create set form would be implemented here")
                      setShowCreateSet(false)
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
