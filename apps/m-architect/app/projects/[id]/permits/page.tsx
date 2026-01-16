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
  XCircle,
  Filter,
  Upload,
} from "lucide-react"

import { api } from "@/lib/api"

export default function PermitPackagesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [filters, setFilters] = React.useState<{
    status?: string
    packageType?: string
  }>({})
  const [showAutoGenerateModal, setShowAutoGenerateModal] = React.useState(false)

  // Fetch permit packages
  const { data: packagesData } = useQuery({
    queryKey: ["permit-packages", projectId, filters],
    queryFn: () => api.listPermitPackages(projectId, filters),
  })

  const packages = packagesData?.packages || []

  const autoGenerateMutation = useMutation({
    mutationFn: (data: {
      packageName: string
      packageType: string
      permitType?: string
      includeAllDrawings?: boolean
    }) => api.autoGeneratePermitPackage(projectId, {
      ...data,
      includeAllDrawings: data.includeAllDrawings !== false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permit-packages", projectId] })
      setShowAutoGenerateModal(false)
    },
  })

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-300"
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "READY":
        return "bg-emerald-100 text-emerald-700 border-emerald-300"
      case "REJECTED":
      case "CORRECTIONS_REQUIRED":
        return "bg-red-100 text-red-700 border-red-300"
      case "DRAFT":
      case "ASSEMBLING":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const summary = {
    total: packages.length,
    ready: packages.filter((p: any) => p.status === "READY").length,
    submitted: packages.filter((p: any) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW").length,
    approved: packages.filter((p: any) => p.status === "APPROVED").length,
    corrections: packages.filter((p: any) => p.status === "CORRECTIONS_REQUIRED").length,
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Permit Packages</h1>
              <p className="text-neutral-600">Generate and submit permit packages to jurisdictions</p>
            </div>
            <button
              onClick={() => setShowAutoGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Auto-Generate Package
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{summary.total}</div>
              <div className="text-sm text-neutral-600">Total Packages</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-emerald-600">{summary.ready}</div>
              <div className="text-sm text-neutral-600">Ready to Submit</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.submitted}</div>
              <div className="text-sm text-neutral-600">Under Review</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
              <div className="text-sm text-neutral-600">Approved</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-red-600">{summary.corrections}</div>
              <div className="text-sm text-neutral-600">Corrections Required</div>
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
                  <option value="DRAFT">Draft</option>
                  <option value="ASSEMBLING">Assembling</option>
                  <option value="READY">Ready</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CORRECTIONS_REQUIRED">Corrections Required</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Package Type</label>
                <select
                  value={filters.packageType || ""}
                  onChange={(e) => setFilters({ ...filters, packageType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Types</option>
                  <option value="BUILDING">Building</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="MECHANICAL">Mechanical</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="COMBINED">Combined</option>
                </select>
              </div>
            </div>
          </div>

          {/* Permit Packages */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Permit Packages ({packages.length})
            </h2>
            {packages.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No permit packages found</p>
                <p className="text-sm mt-2">Create a package to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((package_: any) => (
                  <div
                    key={package_.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/projects/${projectId}/permits/${package_.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-neutral-900">{package_.packageName}</h3>
                          <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(package_.status)}`}>
                            {package_.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-600 mb-2">
                          Type: {package_.packageType.replace("_", " ")}
                          {package_.permitType && ` • ${package_.permitType}`}
                        </div>
                        {package_.description && (
                          <p className="text-sm text-neutral-600">{package_.description}</p>
                        )}
                      </div>
                      {package_.calculatedFee && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-neutral-900">
                            ${parseFloat(package_.calculatedFee).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-500">Calculated Fee</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <span>{package_._count?.documents || 0} documents</span>
                      <span>{package_._count?.applicationForms || 0} forms</span>
                      {package_._count?.reviewComments > 0 && (
                        <span className="text-red-600">
                          {package_._count.reviewComments} review comments
                        </span>
                      )}
                      {package_.submittedAt && (
                        <span>Submitted: {formatDate(package_.submittedAt)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Generate Modal */}
          {showAutoGenerateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Auto-Generate Permit Package</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Package Name
                    </label>
                    <input
                      type="text"
                      id="packageName"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      placeholder="Building Permit Package"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Package Type
                    </label>
                    <select id="packageType" className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
                      <option value="BUILDING">Building</option>
                      <option value="ELECTRICAL">Electrical</option>
                      <option value="PLUMBING">Plumbing</option>
                      <option value="MECHANICAL">Mechanical</option>
                      <option value="STRUCTURAL">Structural</option>
                      <option value="COMBINED">Combined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Permit Type (Optional)
                    </label>
                    <input
                      type="text"
                      id="permitType"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      placeholder="New Construction, Remodel, etc."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeAllDrawings"
                      defaultChecked
                      className="rounded"
                    />
                    <label htmlFor="includeAllDrawings" className="text-sm text-neutral-700">
                      Include all approved drawings
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      const packageName = (document.getElementById("packageName") as HTMLInputElement)?.value || "Permit Package"
                      const packageType = (document.getElementById("packageType") as HTMLSelectElement)?.value || "BUILDING"
                      const permitType = (document.getElementById("permitType") as HTMLInputElement)?.value || undefined
                      const includeAllDrawings = (document.getElementById("includeAllDrawings") as HTMLInputElement)?.checked
                      autoGenerateMutation.mutate({
                        packageName,
                        packageType,
                        permitType,
                        includeAllDrawings,
                      })
                    }}
                    disabled={autoGenerateMutation.isPending}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {autoGenerateMutation.isPending ? "Generating..." : "Generate Package"}
                  </button>
                  <button
                    onClick={() => setShowAutoGenerateModal(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
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
