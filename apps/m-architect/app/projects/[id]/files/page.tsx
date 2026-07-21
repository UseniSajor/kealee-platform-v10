"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Folder,
  File,
  Upload,
  Download,
  Lock,
  Unlock,
  CheckCircle2,
  Eye,
  FileText,
  Image as ImageIcon,
  Package,
} from "lucide-react"

import { api } from "@/lib/api"

export default function FilesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [selectedFolderId, setSelectedFolderId] = React.useState<string | undefined>(undefined)
  const [showUpload, setShowUpload] = React.useState(false)
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const initializeFoldersMutation = useMutation({
    mutationFn: () => api.initializeAIAFolders(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", projectId] })
    },
  })

  const { data: foldersData } = useQuery({
    queryKey: ["folders", projectId, selectedFolderId],
    queryFn: () => api.listFolders(projectId, selectedFolderId),
  })

  const { data: filesData } = useQuery({
    queryKey: ["files", projectId, selectedFolderId],
    queryFn: () => api.listFiles(projectId, selectedFolderId),
  })

  const folders = foldersData?.folders || []
  const files = filesData?.files || []

  const checkOutMutation = useMutation({
    mutationFn: ({ fileId, comment }: { fileId: string; comment?: string }) =>
      api.checkOutFile(fileId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
    },
  })

  const checkInMutation = useMutation({
    mutationFn: ({ fileId, newFileUrl }: { fileId: string; newFileUrl?: string }) =>
      api.checkInFile(fileId, newFileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
    },
  })

  const lockMutation = useMutation({
    mutationFn: ({ fileId, reason }: { fileId: string; reason?: string }) => api.lockFile(fileId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
    },
  })

  const unlockMutation = useMutation({
    mutationFn: (fileId: string) => api.unlockFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
    },
  })

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-600" />
      case "IMAGE":
        return <ImageIcon className="h-5 w-5 text-blue-600" />
      case "DWG":
      case "RVT":
      case "SKP":
      case "DXF":
      case "IFC":
        return <Package className="h-5 w-5 text-purple-600" />
      default:
        return <File className="h-5 w-5 text-neutral-600" />
    }
  }

  const formatFileSize = (bytes: string | number) => {
    const num = typeof bytes === "string" ? parseInt(bytes, 10) : bytes
    if (num < 1024) return `${num} B`
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`
    return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const [uploading, setUploading] = React.useState(false)

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) {
      setError("Please select files to upload")
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Get presigned URLs and upload each file to storage
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      )
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const uploadedFiles = await Promise.all(
        uploadFiles.map(async (file) => {
          // Get presigned URL from API
          const presignRes = await fetch(`${apiUrl}/files/presigned-url`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              folder: `architect/${projectId}`,
            }),
          })

          if (!presignRes.ok) {
            throw new Error(`Failed to get upload URL for ${file.name}`)
          }

          const { uploadUrl, fileUrl } = await presignRes.json()

          // Upload file to storage
          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          })

          // Register file in system
          await fetch(`${apiUrl}/files/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              fileUrl,
              folder: `architect/${projectId}`,
            }),
          })

          return {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileUrl,
          }
        })
      )

      // Register files in architect module
      if (uploadedFiles.length === 1) {
        await api.uploadFile(projectId, {
          folderId: selectedFolderId,
          ...uploadedFiles[0],
        })
      } else {
        await api.bulkUploadFiles(projectId, {
          folderId: selectedFolderId,
          files: uploadedFiles,
        })
      }

      setUploadFiles([])
      setShowUpload(false)
      queryClient.invalidateQueries({ queryKey: ["files", projectId] })
    } catch (err: any) {
      setError(err.message || "Failed to upload files")
    } finally {
      setUploading(false)
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">File Management</h1>
              <p className="text-neutral-600">Organize and manage design documents</p>
            </div>
            <div className="flex gap-2">
              {folders.length === 0 && (
                <button
                  onClick={() => initializeFoldersMutation.mutate()}
                  disabled={initializeFoldersMutation.isPending}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  {initializeFoldersMutation.isPending ? "Initializing..." : "Initialize AIA Folders"}
                </button>
              )}
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {showUpload && (
            <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Files
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setUploadFiles(files)
                      setError(null)
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
                  />
                  {uploadFiles.length > 0 && (
                    <p className="text-sm text-neutral-600 mt-2">
                      {uploadFiles.length} file(s) selected
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleFileUpload}
                    disabled={uploadFiles.length === 0 || uploading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={() => {
                      setShowUpload(false)
                      setUploadFiles([])
                      setError(null)
                    }}
                    className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedFolderId && (
            <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600">
              <button
                onClick={() => setSelectedFolderId(undefined)}
                className="hover:text-neutral-900"
              >
                Root
              </button>
              <span>/</span>
              <span>Current Folder</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Folders
                </h2>
                <div className="space-y-2">
                  {folders.length === 0 ? (
                    <p className="text-sm text-neutral-500">No folders yet</p>
                  ) : (
                    folders.map((folder: any) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium">{folder.name}</span>
                          </div>
                          {folder._count && (
                            <span className="text-xs text-neutral-500">
                              {folder._count.files} files
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Files {selectedFolderId && "(in folder)"}
                </h2>

                {files.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    <File className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                    <p>No files in this location</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file: any) => (
                      <div
                        key={file.id}
                        className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getFileIcon(file.fileType)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-neutral-900 truncate">{file.fileName}</h3>
                                {file.versionNumber > 1 && (
                                  <span className="text-xs text-neutral-500">v{file.versionNumber}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
                                <span>{formatFileSize(file.fileSize.toString())}</span>
                                <span>{file.fileType}</span>
                                {file.uploadedBy && <span>by {file.uploadedBy.name}</span>}
                              </div>
                              {file.description && (
                                <p className="text-sm text-neutral-600 mt-1">{file.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {file.checkedOutById && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-1">
                                Checked Out
                              </span>
                            )}
                            {file.lockedById && (
                              <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-1">
                                Locked
                              </span>
                            )}

                            <div className="flex gap-1">
                              {file.checkedOutById ? (
                                <button
                                  onClick={() => {
                                    const newUrl = prompt("New file URL (optional):")
                                    checkInMutation.mutate({
                                      fileId: file.id,
                                      newFileUrl: newUrl || undefined,
                                    })
                                  }}
                                  disabled={checkInMutation.isPending}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Check In"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const comment = prompt("Check-out comment (optional):")
                                    checkOutMutation.mutate({
                                      fileId: file.id,
                                      comment: comment || undefined,
                                    })
                                  }}
                                  disabled={checkOutMutation.isPending || !!file.lockedById}
                                  className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                                  title="Check Out"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}

                              {file.lockedById ? (
                                <button
                                  onClick={() => unlockMutation.mutate(file.id)}
                                  disabled={unlockMutation.isPending}
                                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                  title="Unlock"
                                >
                                  <Unlock className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const reason = prompt("Lock reason (optional):")
                                    lockMutation.mutate({
                                      fileId: file.id,
                                      reason: reason || undefined,
                                    })
                                  }}
                                  disabled={lockMutation.isPending || !!file.checkedOutById}
                                  className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                                  title="Lock"
                                >
                                  <Lock className="h-4 w-4" />
                                </button>
                              )}

                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                                title="View/Download"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {file.versionNumber > 1 && (
                          <div className="mt-2 pt-2 border-t border-neutral-200">
                            <button
                              onClick={() => router.push(`/projects/${projectId}/files/${file.id}`)}
                              className="text-xs text-primary hover:underline"
                            >
                              View version history ({file.versionNumber} versions)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
