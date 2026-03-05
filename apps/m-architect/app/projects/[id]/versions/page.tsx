"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  GitBranch,
  Tag,
  GitMerge,
  RotateCcw,
  Plus,
  GitCompare,
  History,
} from "lucide-react"

import { api } from "@/lib/api"

export default function VersionControlPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showCreateBranch, setShowCreateBranch] = React.useState(false)
  const [showCreateVersion, setShowCreateVersion] = React.useState(false)
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null)
  const [branchName, setBranchName] = React.useState("")
  const [branchDesc, setBranchDesc] = React.useState("")
  const [versionName, setVersionName] = React.useState("")
  const [versionDesc, setVersionDesc] = React.useState("")
  const [versionTag, setVersionTag] = React.useState("")

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ["branches", projectId],
    queryFn: () => api.listBranches(projectId),
  })

  // Fetch default branch
  const { data: defaultBranchData } = useQuery({
    queryKey: ["default-branch", projectId],
    queryFn: () => api.getDefaultBranch(projectId),
  })

  // Fetch versions
  const { data: versionsData } = useQuery({
    queryKey: ["versions", projectId, selectedBranch],
    queryFn: () => api.listVersions(projectId, selectedBranch ? { branchId: selectedBranch } : undefined),
    enabled: !!projectId,
  })

  // Fetch rollback history
  const { data: rollbacksData } = useQuery({
    queryKey: ["rollbacks", projectId],
    queryFn: () => api.getRollbackHistory(projectId),
  })

  const createBranchMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; baseBranchId?: string }) =>
      api.createBranch(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", projectId] })
      setShowCreateBranch(false)
      setBranchName("")
      setBranchDesc("")
    },
  })

  const createVersionMutation = useMutation({
    mutationFn: (data: { branchId: string; versionName?: string; description?: string; versionTag?: string }) =>
      api.createVersion(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", projectId] })
      setShowCreateVersion(false)
      setVersionName("")
      setVersionDesc("")
      setVersionTag("")
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: (data: { versionId: string; reason: string }) =>
      api.rollbackToVersion(projectId, data.versionId, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", projectId] })
      queryClient.invalidateQueries({ queryKey: ["rollbacks", projectId] })
    },
  })

  const branches = branchesData?.branches || []
  const defaultBranch = defaultBranchData?.branch
  const versions = versionsData?.versions || []
  const rollbacks = rollbacksData?.rollbacks || []

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-300"
      case "MERGED":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "ABANDONED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "LOCKED":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "SCHEMATIC_DESIGN":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "DESIGN_DEVELOPMENT":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "CONSTRUCTION_DOCUMENTS":
        return "bg-green-100 text-green-700 border-green-300"
      case "BID":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CONSTRUCTION":
        return "bg-orange-100 text-orange-700 border-orange-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Version Control</h1>
              <p className="text-neutral-600">Git-like branching, versioning, and rollback capabilities</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateBranch(true)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                <GitBranch className="h-4 w-4" />
                New Branch
              </button>
              <button
                onClick={() => setShowCreateVersion(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Tag className="h-4 w-4" />
                Create Version
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Branches */}
            <div className="lg:col-span-1 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branches ({branches.length})
              </h2>
              {branches.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No branches yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch: any) => (
                    <div
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBranch === branch.id
                          ? "border-primary bg-primary/5"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{branch.name}</span>
                          {branch.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(branch.status)}`}>
                          {branch.status}
                        </span>
                      </div>
                      {branch.description && (
                        <p className="text-sm text-neutral-600 mb-1">{branch.description}</p>
                      )}
                      <div className="text-xs text-neutral-500">
                        {branch._count?.versions || 0} version{branch._count?.versions !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Versions */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                Versions ({versions.length})
              </h2>
              {versions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Tag className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No versions yet</p>
                  <p className="text-sm mt-2">Create a version to snapshot the current project state</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version: any) => (
                    <div
                      key={version.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{version.versionNumber}</span>
                            {version.versionName && (
                              <span className="text-sm text-neutral-600">— {version.versionName}</span>
                            )}
                            {version.versionTag && (
                              <span className={`text-xs border rounded-full px-2 py-1 ${getTagColor(version.versionTag)}`}>
                                {version.versionTag.replace("_", " ")}
                              </span>
                            )}
                            {version.isTagged && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Tagged</span>
                            )}
                            {version.isLocked && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Locked</span>
                            )}
                          </div>
                          {version.description && (
                            <p className="text-sm text-neutral-600 mb-2">{version.description}</p>
                          )}
                          <div className="text-xs text-neutral-500">
                            Created by {version.createdBy?.name} on {formatDate(version.createdAt)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (versions.length > 1) {
                                const currentIndex = versions.findIndex((v: any) => v.id === version.id)
                                const prevVersion = versions[currentIndex + 1]
                                if (prevVersion) {
                                  try {
                                    const result = await api.compareVersions(projectId, prevVersion.id, version.id)
                                    const changes = result.comparison
                                    alert(
                                      `Comparing ${prevVersion.versionNumber} → ${version.versionNumber}:\n` +
                                      `Added: ${changes?.added?.length || 0} files\n` +
                                      `Modified: ${changes?.modified?.length || 0} files\n` +
                                      `Removed: ${changes?.removed?.length || 0} files`
                                    )
                                  } catch {
                                    alert("Failed to compare versions")
                                  }
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-1"
                          >
                            <GitCompare className="h-3 w-3" />
                            Compare
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rollback reason:")
                              if (reason) {
                                rollbackMutation.mutate({ versionId: version.id, reason })
                              }
                            }}
                            disabled={rollbackMutation.isPending}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            {rollbackMutation.isPending ? "..." : "Rollback"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rollback History */}
          {rollbacks.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Rollback History
              </h2>
              <div className="space-y-3">
                {rollbacks.slice(0, 5).map((rollback: any) => (
                  <div key={rollback.id} className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">
                          Rolled back from {rollback.fromVersion?.versionNumber} to {rollback.toVersion?.versionNumber}
                        </span>
                        {rollback.rollbackReason && (
                          <p className="text-sm text-neutral-600 mt-1">{rollback.rollbackReason}</p>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">{formatDate(rollback.createdAt)}</span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {rollback.affectedFiles?.length || 0} files, {rollback.affectedSheets?.length || 0} sheets affected
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Branch Modal */}
          {showCreateBranch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Branch</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Branch Name *</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. design-development-v2"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                    <textarea
                      value={branchDesc}
                      onChange={(e) => setBranchDesc(e.target.value)}
                      placeholder="Optional description"
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Base Branch</label>
                    <select
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      defaultValue={defaultBranch?.id || ""}
                    >
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}{b.isDefault ? " (default)" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {createBranchMutation.error && (
                  <p className="text-sm text-red-600 mb-4">{(createBranchMutation.error as Error).message}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCreateBranch(false); setBranchName(""); setBranchDesc("") }}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createBranchMutation.mutate({
                      name: branchName,
                      description: branchDesc || undefined,
                      baseBranchId: defaultBranch?.id,
                    })}
                    disabled={!branchName.trim() || createBranchMutation.isPending}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createBranchMutation.isPending ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Version Modal */}
          {showCreateVersion && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Version</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Branch *</label>
                    <select
                      value={selectedBranch || defaultBranch?.id || ""}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}{b.isDefault ? " (default)" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Version Name</label>
                    <input
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="e.g. Schematic Design Complete"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                    <textarea
                      value={versionDesc}
                      onChange={(e) => setVersionDesc(e.target.value)}
                      placeholder="What changed in this version?"
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phase Tag</label>
                    <select
                      value={versionTag}
                      onChange={(e) => setVersionTag(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">None</option>
                      <option value="SCHEMATIC_DESIGN">Schematic Design</option>
                      <option value="DESIGN_DEVELOPMENT">Design Development</option>
                      <option value="CONSTRUCTION_DOCUMENTS">Construction Documents</option>
                      <option value="BID">Bid</option>
                      <option value="CONSTRUCTION">Construction</option>
                    </select>
                  </div>
                </div>
                {createVersionMutation.error && (
                  <p className="text-sm text-red-600 mb-4">{(createVersionMutation.error as Error).message}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCreateVersion(false); setVersionName(""); setVersionDesc(""); setVersionTag("") }}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createVersionMutation.mutate({
                      branchId: selectedBranch || defaultBranch?.id || "",
                      versionName: versionName || undefined,
                      description: versionDesc || undefined,
                      versionTag: versionTag || undefined,
                    })}
                    disabled={createVersionMutation.isPending || (!selectedBranch && !defaultBranch?.id)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createVersionMutation.isPending ? "Creating..." : "Create"}
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
