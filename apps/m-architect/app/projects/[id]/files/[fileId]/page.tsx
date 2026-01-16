"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, FileText, Download, Eye, History } from "lucide-react"

import { api } from "@/lib/api"

export default function FileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fileId = params.fileId as string
  const projectId = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => api.getFile(fileId),
  })

  const file = data?.file

  const formatFileSize = (bytes: string | number) => {
    const num = typeof bytes === "string" ? parseInt(bytes, 10) : bytes
    if (num < 1024) return `${num} B`
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`
    return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading file...</div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "File not found"}
          </p>
          <button
            onClick={() => router.push(`/projects/${projectId}/files`)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Files
          </button>
        </div>
      </div>
    )
  }

  const versions = file.versions || []

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}/files`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Files
          </button>

          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{file.fileName}</h1>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>{formatFileSize(file.fileSize.toString())}</span>
                  <span>{file.fileType}</span>
                  <span>Version {file.versionNumber}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Eye className="h-4 w-4" />
                  View
                </a>
                <a
                  href={file.fileUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>

            {file.description && (
              <div className="mb-4">
                <p className="text-sm text-neutral-600">{file.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-600 mb-1">Status</p>
                <p className="font-medium">{file.status}</p>
              </div>
              <div>
                <p className="text-neutral-600 mb-1">Uploaded</p>
                <p className="font-medium">{formatDate(file.createdAt)}</p>
              </div>
              {file.checkedOutBy && (
                <div>
                  <p className="text-neutral-600 mb-1">Checked Out By</p>
                  <p className="font-medium">{file.checkedOutBy.name}</p>
                </div>
              )}
              {file.lockedBy && (
                <div>
                  <p className="text-neutral-600 mb-1">Locked By</p>
                  <p className="font-medium">{file.lockedBy.name}</p>
                </div>
              )}
            </div>
          </div>

          {versions.length > 1 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </h2>
              <div className="space-y-3">
                {versions.map((version: any, index: number) => (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-lg ${
                      version.isLatestVersion
                        ? "border-primary bg-primary/5"
                        : "border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {version.versionNumber}</span>
                          {version.isLatestVersion && (
                            <span className="text-xs bg-primary text-white rounded-full px-2 py-1">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {formatDate(version.createdAt)} • {formatFileSize(version.fileSize.toString())}
                        </div>
                        {version.uploadedBy && (
                          <div className="text-xs text-neutral-500 mt-1">
                            Uploaded by {version.uploadedBy.name}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={version.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          View
                        </a>
                        <a
                          href={version.fileUrl}
                          download
                          className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {file.fileType === "PDF" && file.fileUrl && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="border border-neutral-200 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-600 mb-4">PDF Preview</p>
                <p className="text-sm text-neutral-500">
                  Preview integration would be implemented here (e.g., PDF.js, CAD viewer, etc.)
                </p>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
