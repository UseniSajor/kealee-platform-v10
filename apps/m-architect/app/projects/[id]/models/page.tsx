"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  Box,
  Eye,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FileText,
} from "lucide-react"

import { api } from "@/lib/api"

export default function ModelsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showUpload, setShowUpload] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    modelFormat?: string
    isLatestVersion?: boolean
  }>({ isLatestVersion: true })
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null)

  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ["bim-models", projectId, filters],
    queryFn: () => api.listBIMModels(projectId, filters),
  })

  const models = modelsData?.models || []

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "RVT":
        return "🏗️"
      case "IFC":
        return "📐"
      case "SKP":
        return "🎨"
      default:
        return "📦"
    }
  }

  const getFormatName = (format: string) => {
    const names: Record<string, string> = {
      RVT: "Revit",
      IFC: "IFC",
      SKP: "SketchUp",
      DWG_3D: "3D DWG",
      OBJ: "OBJ",
      GLTF: "glTF",
      OTHER: "Other",
    }
    return names[format] || format
  }

  const getConversionStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300"
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-300"
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const formatFileSize = (bytes: string | number) => {
    const num = typeof bytes === "string" ? parseInt(bytes, 10) : bytes
    if (num < 1024) return `${num} B`
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`
    return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">3D/BIM Models</h1>
              <p className="text-neutral-600">View and manage 3D models and BIM files</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Upload Model
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-neutral-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Format</label>
                <select
                  value={filters.modelFormat || ""}
                  onChange={(e) => setFilters({ ...filters, modelFormat: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Formats</option>
                  <option value="RVT">Revit (RVT)</option>
                  <option value="IFC">IFC</option>
                  <option value="SKP">SketchUp (SKP)</option>
                  <option value="DWG_3D">3D DWG</option>
                  <option value="OBJ">OBJ</option>
                  <option value="GLTF">glTF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Version</label>
                <select
                  value={filters.isLatestVersion === undefined ? "" : filters.isLatestVersion.toString()}
                  onChange={(e) => setFilters({ ...filters, isLatestVersion: e.target.value === "" ? undefined : e.target.value === "true" })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Versions</option>
                  <option value="true">Latest Only</option>
                  <option value="false">All Versions</option>
                </select>
              </div>
            </div>
          </div>

          {/* Models List */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Models ({models.length})</h2>

            {models.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Box className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No models found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {models.map((model: any) => (
                  <div
                    key={model.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-3xl">{getFormatIcon(model.modelFormat)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-900">{model.name}</h3>
                            {model.versionNumber > 1 && (
                              <span className="text-xs text-neutral-500">v{model.versionNumber}</span>
                            )}
                            {model.isLatestVersion && (
                              <span className="text-xs bg-primary text-white rounded-full px-2 py-1">
                                Latest
                              </span>
                            )}
                            {model.conversionStatus && (
                              <span className={`text-xs border rounded-full px-2 py-1 ${getConversionStatusColor(model.conversionStatus)}`}>
                                {model.conversionStatus}
                              </span>
                            )}
                          </div>
                          {model.description && (
                            <p className="text-sm text-neutral-600 mb-2">{model.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span>{getFormatName(model.modelFormat)}</span>
                            <span>{formatFileSize(model.fileSize.toString())}</span>
                            {model.elementCount && (
                              <span>{model.elementCount.toLocaleString()} elements</span>
                            )}
                            {model._count && (
                              <>
                                {model._count.annotations > 0 && (
                                  <span className="text-blue-600">{model._count.annotations} annotations</span>
                                )}
                                {model._count.clashDetections > 0 && (
                                  <span className="text-red-600">{model._count.clashDetections} clashes</span>
                                )}
                                {model._count.views > 0 && (
                                  <span className="text-purple-600">{model._count.views} views</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => router.push(`/projects/${projectId}/models/${model.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          <Eye className="h-4 w-4" />
                          View Model
                        </button>
                        {model.previousVersion && (
                          <button
                            onClick={() => {
                              const comparison = prompt("Compare with version? (Enter version number):")
                              if (comparison) {
                                router.push(`/projects/${projectId}/models/${model.id}/compare/${model.previousVersion.id}`)
                              }
                            }}
                            className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                          >
                            Compare
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Modal */}
          {showUpload && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Upload BIM Model</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  Model upload form would be implemented here with file selection, format detection, and metadata entry.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUpload(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert("Upload model form would be implemented here")
                      setShowUpload(false)
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Upload
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
