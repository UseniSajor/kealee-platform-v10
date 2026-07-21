"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Eye,
  Layers,
  MessageSquare,
  AlertTriangle,
  Settings,
  Download,
  CheckCircle2,
} from "lucide-react"

import { api } from "@architect/lib/api"

export default function ModelViewerPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const modelId = params.modelId as string

  const [activeTab, setActiveTab] = React.useState<"viewer" | "annotations" | "clashes" | "properties">("viewer")
  const [selectedElement, setSelectedElement] = React.useState<string | null>(null)

  // Fetch model
  const { data: modelData, isLoading } = useQuery({
    queryKey: ["bim-model", modelId],
    queryFn: () => api.getBIMModel(modelId),
  })

  // Fetch annotations
  const { data: annotationsData } = useQuery({
    queryKey: ["model-annotations", modelId],
    queryFn: () => api.listAnnotations(modelId),
    enabled: activeTab === "annotations",
  })

  // Fetch clashes
  const { data: clashesData } = useQuery({
    queryKey: ["model-clashes", modelId],
    queryFn: () => api.getClashDetections(modelId),
    enabled: activeTab === "clashes",
  })

  const model = modelData?.model
  const annotations = annotationsData?.annotations || []
  const clashes = clashesData?.clashes || []

  const resolveAnnotationMutation = useMutation({
    mutationFn: (annotationId: string) => api.resolveAnnotation(annotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-annotations", modelId] })
    },
  })

  const runClashDetectionMutation = useMutation({
    mutationFn: () => api.runClashDetection(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-clashes", modelId] })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading model...</div>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Model not found</p>
          <button
            onClick={() => router.push(`/architect/projects/${projectId}/models`)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Models
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push(`/architect/projects/${projectId}/models`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Models
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{model.name}</h1>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <span>Version {model.versionNumber}</span>
                {model.modelFormat && <span>{model.modelFormat}</span>}
                {model.elementCount && <span>{model.elementCount.toLocaleString()} elements</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {model.convertedFileUrl && (
                <a
                  href={model.convertedFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-neutral-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("viewer")}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === "viewer"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Viewer
                </div>
              </button>
              <button
                onClick={() => setActiveTab("annotations")}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === "annotations"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Annotations ({annotations.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("clashes")}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === "clashes"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Clashes ({clashes.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("properties")}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === "properties"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Properties
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            {activeTab === "viewer" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">3D Model Viewer</h2>
                <div className="border border-neutral-200 rounded-lg p-8 text-center bg-neutral-50">
                  <Layers className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                  <p className="text-neutral-600 mb-4">3D Model Viewer</p>
                  <p className="text-sm text-neutral-500 mb-4">
                    Model viewer would be integrated here (e.g., Forge Viewer, Three.js, or similar)
                  </p>
                  {model.convertedFileUrl ? (
                    <p className="text-sm text-green-600 mb-4">Model ready for viewing</p>
                  ) : (
                    <p className="text-sm text-yellow-600 mb-4">
                      Model conversion: {model.conversionStatus || "PENDING"}
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        const name = prompt("View name:")
                        if (name) {
                          alert("Create view form would be implemented here")
                        }
                      }}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                    >
                      Save View
                    </button>
                    <button
                      onClick={() => {
                        const title = prompt("Annotation title:")
                        if (title) {
                          alert("Create annotation form would be implemented here")
                        }
                      }}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                    >
                      Add Annotation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "annotations" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Annotations</h2>
                  <button
                    onClick={() => {
                      const title = prompt("Annotation title:")
                      if (title) {
                        alert("Create annotation form would be implemented here")
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Add Annotation
                  </button>
                </div>
                {annotations.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                    <p>No annotations yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {annotations.map((annotation: any) => (
                      <div
                        key={annotation.id}
                        className="p-4 border border-neutral-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-neutral-900">{annotation.title}</h3>
                              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded-full px-2 py-1">
                                {annotation.annotationType}
                              </span>
                              {annotation.status === "RESOLVED" && (
                                <span className="text-xs bg-green-100 text-green-700 border border-green-300 rounded-full px-2 py-1">
                                  Resolved
                                </span>
                              )}
                            </div>
                            {annotation.description && (
                              <p className="text-sm text-neutral-600 mb-2">{annotation.description}</p>
                            )}
                            <div className="text-xs text-neutral-500">
                              Created by {annotation.createdBy?.name} • {new Date(annotation.createdAt).toLocaleDateString()}
                              {annotation.elementType && ` • Element: ${annotation.elementType}`}
                            </div>
                          </div>
                          {annotation.status === "OPEN" && (
                            <button
                              onClick={() => resolveAnnotationMutation.mutate(annotation.id)}
                              disabled={resolveAnnotationMutation.isPending}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "clashes" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Clash Detections</h2>
                  <button
                    onClick={() => runClashDetectionMutation.mutate()}
                    disabled={runClashDetectionMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {runClashDetectionMutation.isPending ? "Running..." : "Run Clash Detection"}
                  </button>
                </div>
                {clashes.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                    <p>No clashes detected</p>
                    <p className="text-sm mt-2">Run clash detection to find conflicts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clashes.map((clash: any) => (
                      <div
                        key={clash.id}
                        className="p-4 border border-neutral-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-neutral-900">
                                {clash.element1Type} vs {clash.element2Type}
                              </h3>
                              {clash.severity && (
                                <span className={`text-xs border rounded-full px-2 py-1 ${
                                  clash.severity === "CRITICAL" ? "bg-red-100 text-red-700 border-red-300" :
                                  clash.severity === "HIGH" ? "bg-orange-100 text-orange-700 border-orange-300" :
                                  clash.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                                  "bg-blue-100 text-blue-700 border-blue-300"
                                }`}>
                                  {clash.severity}
                                </span>
                              )}
                              <span className={`text-xs border rounded-full px-2 py-1 ${
                                clash.status === "RESOLVED" ? "bg-green-100 text-green-700 border-green-300" :
                                clash.status === "REVIEWED" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                "bg-neutral-100 text-neutral-700 border-neutral-300"
                              }`}>
                                {clash.status}
                              </span>
                            </div>
                            <div className="text-sm text-neutral-600 mb-2">
                              <div>{clash.element1Name || clash.element1Id} ↔ {clash.element2Name || clash.element2Id}</div>
                              {clash.clashDistance && (
                                <div className="text-xs text-neutral-500 mt-1">
                                  Overlap: {parseFloat(clash.clashDistance.toString()).toFixed(2)} units
                                </div>
                              )}
                            </div>
                            {clash.resolutionNotes && (
                              <p className="text-sm text-neutral-600 mt-2">{clash.resolutionNotes}</p>
                            )}
                          </div>
                          {clash.status !== "RESOLVED" && (
                            <button
                              onClick={() => {
                                const status = prompt("Update status (REVIEWED, RESOLVED, FALSE_POSITIVE):")
                                if (status) {
                                  alert("Update clash status would be implemented here")
                                }
                              }}
                              className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "properties" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Component Properties</h2>
                <div className="text-center py-12 text-neutral-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>Select an element in the viewer to view/edit properties</p>
                  {selectedElement && (
                    <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                      <p className="text-sm">Element ID: {selectedElement}</p>
                      <p className="text-xs text-neutral-500 mt-2">
                        Properties viewer would be implemented here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
