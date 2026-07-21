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
  Shield,
  Download,
  Plus,
  Filter,
} from "lucide-react"

import { api } from "@architect/lib/api"

export default function ValidationPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [filters, setFilters] = React.useState<{
    validationStatus?: string
    category?: string
    codeStandard?: string
  }>({})

  // Fetch validations
  const { data: validationsData } = useQuery({
    queryKey: ["validations", projectId, filters],
    queryFn: () => api.listValidations(projectId, filters),
  })

  // Fetch code compliance records
  const { data: complianceData } = useQuery({
    queryKey: ["code-compliance", projectId],
    queryFn: () => api.listCodeComplianceRecords(projectId),
  })

  // Fetch drawing checklist
  const { data: checklistData } = useQuery({
    queryKey: ["drawing-checklist", projectId],
    queryFn: () => api.getDrawingChecklist(projectId),
  })

  const validations = validationsData?.validations || []
  const complianceRecords = complianceData?.records || []
  const checklistItems = checklistData?.items || []

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASSED":
        return "bg-green-100 text-green-700 border-green-300"
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-300"
      case "WARNING":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "EXEMPT":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getSeverityColor = (severity: string | null | undefined) => {
    if (!severity) return "bg-neutral-100 text-neutral-700 border-neutral-300"
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-300"
      case "ERROR":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "WARNING":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "INFO":
        return "bg-blue-100 text-blue-700 border-blue-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-green-100 text-green-700 border-green-300"
      case "NON_COMPLIANT":
        return "bg-red-100 text-red-700 border-red-300"
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "EXEMPT":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const generateReportMutation = useMutation({
    mutationFn: (data: { reportName: string; reportType: string }) =>
      api.generateValidationReport(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validations", projectId] })
    },
  })

  // Calculate summary
  const summary = {
    total: validations.length,
    passed: validations.filter((v: any) => v.validationStatus === "PASSED").length,
    failed: validations.filter((v: any) => v.validationStatus === "FAILED").length,
    warnings: validations.filter((v: any) => v.validationStatus === "WARNING").length,
    pending: validations.filter((v: any) => v.validationStatus === "PENDING" || v.validationStatus === "IN_PROGRESS").length,
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Design Validation</h1>
              <p className="text-neutral-600">Automated validation, code compliance, and accessibility checks</p>
            </div>
            <button
              onClick={() => {
                generateReportMutation.mutate({
                  reportName: `Validation Report - ${new Date().toLocaleDateString()}`,
                  reportType: "COMPREHENSIVE",
                })
              }}
              disabled={generateReportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Generate Report
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{summary.total}</div>
              <div className="text-sm text-neutral-600">Total Validations</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <div className="text-sm text-neutral-600">Passed</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-neutral-600">Failed</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
              <div className="text-sm text-neutral-600">Warnings</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-neutral-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={filters.validationStatus || ""}
                  onChange={(e) => setFilters({ ...filters, validationStatus: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="WARNING">Warning</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="EXEMPT">Exempt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                <select
                  value={filters.category || ""}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Categories</option>
                  <option value="DRAWING_CHECKLIST">Drawing Checklist</option>
                  <option value="CODE_COMPLIANCE">Code Compliance</option>
                  <option value="ACCESSIBILITY">Accessibility</option>
                  <option value="BUILDING_CODE">Building Code</option>
                  <option value="ENERGY_CODE">Energy Code</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Code Standard</label>
                <select
                  value={filters.codeStandard || ""}
                  onChange={(e) => setFilters({ ...filters, codeStandard: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Standards</option>
                  <option value="IBC">IBC</option>
                  <option value="IRC">IRC</option>
                  <option value="ADA">ADA</option>
                  <option value="ANSI_A117_1">ANSI A117.1</option>
                  <option value="ASHRAE_90_1">ASHRAE 90.1</option>
                  <option value="IECC">IECC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validations */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Validations ({validations.length})
              </h2>
              {validations.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No validations found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {validations.slice(0, 10).map((validation: any) => (
                    <div
                      key={validation.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{validation.rule?.name || "Unknown Rule"}</span>
                            <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(validation.validationStatus)}`}>
                              {validation.validationStatus}
                            </span>
                            {validation.severity && (
                              <span className={`text-xs border rounded-full px-2 py-1 ${getSeverityColor(validation.severity)}`}>
                                {validation.severity}
                              </span>
                            )}
                          </div>
                          {validation.validationMessage && (
                            <p className="text-sm text-neutral-600 mb-1">{validation.validationMessage}</p>
                          )}
                          {validation.codeReference && (
                            <p className="text-xs text-neutral-500">Code: {validation.codeReference}</p>
                          )}
                        </div>
                      </div>
                      {validation.issuesFound && validation.issuesFound.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {validation.issuesFound.length} issue{validation.issuesFound.length !== 1 ? "s" : ""} found
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Code Compliance */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Code Compliance ({complianceRecords.length})
              </h2>
              {complianceRecords.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No code compliance records</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceRecords.slice(0, 10).map((record: any) => (
                    <div
                      key={record.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{record.codeStandard} {record.codeSection}</span>
                            <span className={`text-xs border rounded-full px-2 py-1 ${getComplianceStatusColor(record.complianceStatus)}`}>
                              {record.complianceStatus}
                            </span>
                          </div>
                          {record.codeDescription && (
                            <p className="text-sm text-neutral-600 mb-1">{record.codeDescription}</p>
                          )}
                          {record.complianceNotes && (
                            <p className="text-sm text-neutral-500 italic">{record.complianceNotes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawing Checklist */}
          {checklistItems.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Drawing Checklist ({checklistItems.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklistItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{item.itemName}</span>
                        {item.isRequired && (
                          <span className="text-xs bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-1">
                            Required
                          </span>
                        )}
                      </div>
                      {item.locationOnSheet && (
                        <p className="text-xs text-neutral-500">Location: {item.locationOnSheet}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isPresent ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
