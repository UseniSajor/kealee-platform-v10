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
  BarChart3,
  Filter,
} from "lucide-react"

import { api } from "@architect/lib/api"

export default function QCChecklistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const checklistId = params.checklistId as string

  const [showRandomSampleModal, setShowRandomSampleModal] = React.useState(false)
  const [checkName, setCheckName] = React.useState("")
  const [sampleSize, setSampleSize] = React.useState(10)
  const [sampleMethod, setSampleMethod] = React.useState("RANDOM")

  // Fetch QC checklist
  const { data: checklistData } = useQuery({
    queryKey: ["qc-checklist", checklistId],
    queryFn: () => api.getQCChecklist(checklistId),
  })

  // Fetch QC metrics
  const { data: metricsData } = useQuery({
    queryKey: ["qc-metrics", checklistId],
    queryFn: () => api.getQCMetrics(checklistId),
  })

  const checklist = checklistData?.checklist
  const metrics = metricsData?.metrics

  const updateItemStatusMutation = useMutation({
    mutationFn: (data: { itemId: string; itemStatus: string }) =>
      api.updateChecklistItemStatus(data.itemId, {
        itemStatus: data.itemStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklist", checklistId] })
      queryClient.invalidateQueries({ queryKey: ["qc-metrics", checklistId] })
    },
  })

  const createRandomSampleCheckMutation = useMutation({
    mutationFn: (data: { checkName: string; sampleSize: number; sampleMethod: string }) =>
      api.createRandomSampleCheck(checklistId, {
        ...data,
        targetType: "CHECKLIST",
        targetId: checklistId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklist", checklistId] })
      setShowRandomSampleModal(false)
      setCheckName("")
      setSampleSize(10)
      setSampleMethod("RANDOM")
    },
  })

  if (!checklist) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading checklist...</div>
      </div>
    )
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "PASSED":
        return "bg-green-100 text-green-700 border-green-300"
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-300"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "EXEMPT":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "NOT_STARTED":
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const completionPercentage = checklist.totalItems > 0
    ? ((checklist.passedItems + checklist.failedItems + checklist.exemptItems) / checklist.totalItems) * 100
    : 0

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/architect/projects/${projectId}/quality-control`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quality Control
          </button>

          {/* Checklist Header */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{checklist.checklistName}</h1>
                {checklist.phase && (
                  <div className="text-sm text-neutral-600">Phase: {checklist.phase}</div>
                )}
              </div>
              <span className={`text-xs border rounded-full px-3 py-1 ${
                checklist.status === "COMPLETED"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : checklist.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-yellow-100 text-yellow-700 border-yellow-300"
              }`}>
                {checklist.status}
              </span>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Progress</span>
                <span className="text-sm text-neutral-600">{completionPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                <span>{checklist.passedItems} passed</span>
                <span>{checklist.failedItems} failed</span>
                <span>{checklist.exemptItems} exempt</span>
                <span>{checklist.totalItems} total</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setShowRandomSampleModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                <Filter className="h-4 w-4" />
                Random Sample Check
              </button>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-neutral-900">{metrics.totalChecks}</div>
                <div className="text-sm text-neutral-600">Total Checks</div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-green-600">{parseFloat(metrics.passRate || "0").toFixed(1)}%</div>
                <div className="text-sm text-neutral-600">Pass Rate</div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-red-600">{metrics.totalErrors}</div>
                <div className="text-sm text-neutral-600">Total Errors</div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-blue-600">{metrics.actionsPending}</div>
                <div className="text-sm text-neutral-600">Pending Actions</div>
              </div>
            </div>
          )}

          {/* Checklist Items */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Checklist Items ({checklist.items?.length || 0})
            </h2>
            {checklist.items && checklist.items.length > 0 ? (
              <div className="space-y-3">
                {checklist.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.itemOrder}. {item.itemName}</span>
                          <span className={`text-xs border rounded-full px-2 py-1 ${getItemStatusColor(item.itemStatus)}`}>
                            {item.itemStatus}
                          </span>
                          {item.isRequired && (
                            <span className="text-xs bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-1">
                              Required
                            </span>
                          )}
                        </div>
                        {item.itemDescription && (
                          <p className="text-sm text-neutral-600 mb-1">{item.itemDescription}</p>
                        )}
                        {item.criteria && (
                          <p className="text-xs text-neutral-500 italic">Criteria: {item.criteria}</p>
                        )}
                        {item.checkNotes && (
                          <p className="text-sm text-neutral-600 mt-2 italic">Notes: {item.checkNotes}</p>
                        )}
                        {item.checkedAt && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Checked: {formatDate(item.checkedAt)} by {item.checkedBy?.name || "Unknown"}
                          </p>
                        )}
                        {item._count && item._count.errors > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            {item._count.errors} error{item._count.errors !== 1 ? "s" : ""} found
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            updateItemStatusMutation.mutate({
                              itemId: item.id,
                              itemStatus: "PASSED",
                            })
                          }}
                          disabled={updateItemStatusMutation.isPending}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => {
                            updateItemStatusMutation.mutate({
                              itemId: item.id,
                              itemStatus: "FAILED",
                            })
                          }}
                          disabled={updateItemStatusMutation.isPending}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <p>No checklist items</p>
              </div>
            )}
          </div>

          {/* Quality Checks */}
          {checklist.checks && checklist.checks.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quality Checks ({checklist.checks.length})
              </h2>
              <div className="space-y-3">
                {checklist.checks.map((check: any) => (
                  <div key={check.id} className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{check.checkName}</div>
                        <div className="text-sm text-neutral-600">
                          {check.checkType} • {check.itemsChecked} items checked • {check.itemsPassed} passed, {check.itemsFailed} failed
                        </div>
                      </div>
                      <span className={`text-xs border rounded-full px-2 py-1 ${
                        check.checkStatus === "COMPLETED"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-blue-100 text-blue-700 border-blue-300"
                      }`}>
                        {check.checkStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Random Sample Modal */}
          {showRandomSampleModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Create Random Sample Check</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Check Name
                    </label>
                    <input
                      type="text"
                      value={checkName}
                      onChange={(e) => setCheckName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      placeholder="Random Sample Check"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sample Size (max: {checklist.items?.length || 0})
                    </label>
                    <input
                      type="number"
                      value={sampleSize}
                      onChange={(e) => setSampleSize(parseInt(e.target.value) || 10)}
                      min="1"
                      max={checklist.items?.length || 1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sample Method
                    </label>
                    <select
                      value={sampleMethod}
                      onChange={(e) => setSampleMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    >
                      <option value="RANDOM">Random</option>
                      <option value="STRATIFIED">Stratified</option>
                      <option value="SYSTEMATIC">Systematic</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                      createRandomSampleCheckMutation.mutate({
                        checkName: checkName || "Random Sample Check",
                        sampleSize,
                        sampleMethod,
                      })
                    }}
                    disabled={createRandomSampleCheckMutation.isPending || !checkName.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createRandomSampleCheckMutation.isPending ? "Creating..." : "Create Check"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRandomSampleModal(false)
                      setCheckName("")
                      setSampleSize(10)
                      setSampleMethod("RANDOM")
                    }}
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
