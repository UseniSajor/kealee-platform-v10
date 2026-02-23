"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Stamp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Plus,
  Filter,
  Shield,
  FileText,
  X,
} from "lucide-react"

import { api } from "@architect/lib/api"

export default function StampsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [filters, setFilters] = React.useState<{
    applicationStatus?: string
    targetType?: string
  }>({})

  // Create stamp template modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [stampType, setStampType] = React.useState("ARCHITECT_SEAL")
  const [stampName, setStampName] = React.useState("")
  const [licenseNumber, setLicenseNumber] = React.useState("")
  const [licenseState, setLicenseState] = React.useState("")
  const [licenseExpiration, setLicenseExpiration] = React.useState("")

  const createTemplateMutation = useMutation({
    mutationFn: () => api.createStampTemplate({
      stampType,
      stampName,
      licenseNumber,
      licenseState,
      licenseExpirationDate: licenseExpiration || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stamp-templates"] })
      setShowCreateModal(false)
      setStampType("ARCHITECT_SEAL")
      setStampName("")
      setLicenseNumber("")
      setLicenseState("")
      setLicenseExpiration("")
    },
  })

  // Fetch stamp templates
  const { data: templatesData } = useQuery({
    queryKey: ["stamp-templates"],
    queryFn: () => api.listStampTemplates(),
  })

  // Fetch stamp applications
  const { data: applicationsData } = useQuery({
    queryKey: ["stamp-applications", projectId, filters],
    queryFn: () => api.listStampApplications(projectId, filters),
  })

  // Fetch license validations
  const { data: validationsData } = useQuery({
    queryKey: ["license-validations"],
    queryFn: () => api.listLicenseValidations(),
  })

  const templates = templatesData?.templates || []
  const applications = applicationsData?.applications || []
  const validations = validationsData?.validations || []

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "VERIFIED":
      case "APPLIED":
        return "bg-green-100 text-green-700 border-green-300"
      case "PENDING_VERIFICATION":
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "EXPIRED":
      case "REJECTED":
      case "REVOKED":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getStampTypeLabel = (type: string) => {
    return type.replace("_", " ")
  }

  const summary = {
    templates: templates.length,
    active: templates.filter((t: any) => t.status === "ACTIVE").length,
    applications: applications.length,
    verified: applications.filter((a: any) => a.applicationStatus === "VERIFIED").length,
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/architect/projects/${projectId}`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Architect Stamps</h1>
              <p className="text-neutral-600">Digital seal management and stamp application workflow</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Stamp Template
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{summary.templates}</div>
              <div className="text-sm text-neutral-600">Stamp Templates</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-green-600">{summary.active}</div>
              <div className="text-sm text-neutral-600">Active Stamps</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{summary.applications}</div>
              <div className="text-sm text-neutral-600">Applications</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-green-600">{summary.verified}</div>
              <div className="text-sm text-neutral-600">Verified</div>
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
                  value={filters.applicationStatus || ""}
                  onChange={(e) => setFilters({ ...filters, applicationStatus: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPLIED">Applied</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Target Type</label>
                <select
                  value={filters.targetType || ""}
                  onChange={(e) => setFilters({ ...filters, targetType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Types</option>
                  <option value="SHEET">Sheet</option>
                  <option value="DELIVERABLE">Deliverable</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stamp Templates */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stamp className="h-5 w-5" />
                Stamp Templates ({templates.length})
              </h2>
              {templates.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Stamp className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No stamp templates found</p>
                  <p className="text-sm mt-2">Create a template to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template: any) => (
                    <div
                      key={template.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{template.stampName}</span>
                            <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(template.status)}`}>
                              {template.status}
                            </span>
                            {template.isVerified && (
                              <span title="Verified">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {getStampTypeLabel(template.stampType)} • {template.licenseState} #{template.licenseNumber}
                          </div>
                          {template.expiresAt && (
                            <div className="text-xs text-neutral-500 mt-1">
                              Expires: {formatDate(template.expiresAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      {template._count && (
                        <div className="text-xs text-neutral-500">
                          {template._count.applications || 0} application{template._count.applications !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stamp Applications */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Stamp Applications ({applications.length})
              </h2>
              {applications.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No stamp applications found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((application: any) => (
                    <div
                      key={application.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
                      onClick={() => router.push(`/architect/projects/${projectId}/stamps/${application.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{application.stampTemplate?.stampName || "Unknown Stamp"}</span>
                            <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(application.applicationStatus)}`}>
                              {application.applicationStatus}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-600">
                            {application.targetType}: {application.targetId}
                          </div>
                          {application.appliedAt && (
                            <div className="text-xs text-neutral-500 mt-1">
                              Applied: {formatDate(application.appliedAt)} by {application.appliedBy?.name || "Unknown"}
                            </div>
                          )}
                        </div>
                      </div>
                      {application.verifiedAt && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Verified {formatDate(application.verifiedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* License Validations */}
          {validations.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                License Validations ({validations.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validations.map((validation: any) => (
                  <div
                    key={validation.id}
                    className="p-4 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{validation.licenseeName}</span>
                      {validation.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {validation.licenseState} #{validation.licenseNumber}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Status: {validation.status} • Validated: {formatDate(validation.validatedAt)}
                    </div>
                    {validation.expirationDate && (
                      <div className={`text-xs mt-1 ${
                        new Date(validation.expirationDate) < new Date() ? "text-red-600" : "text-neutral-500"
                      }`}>
                        Expires: {formatDate(validation.expirationDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Stamp Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Stamp Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Stamp Type</label>
                <select
                  value={stampType}
                  onChange={(e) => setStampType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="ARCHITECT_SEAL">Architect Seal</option>
                  <option value="ENGINEER_SEAL">Engineer Seal</option>
                  <option value="SURVEYOR_SEAL">Surveyor Seal</option>
                  <option value="REVIEW_STAMP">Review Stamp</option>
                  <option value="APPROVAL_STAMP">Approval Stamp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Stamp Name *</label>
                <input
                  type="text"
                  value={stampName}
                  onChange={(e) => setStampName(e.target.value)}
                  placeholder="e.g. John Doe, RA"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">License Number *</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. 12345"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">License State *</label>
                <input
                  type="text"
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="e.g. CA"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">License Expiration</label>
                <input
                  type="date"
                  value={licenseExpiration}
                  onChange={(e) => setLicenseExpiration(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => createTemplateMutation.mutate()}
                  disabled={!stampName || !licenseNumber || !licenseState || createTemplateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                </button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {createTemplateMutation.isError && (
                <p className="text-sm text-red-600">Failed to create stamp template. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
