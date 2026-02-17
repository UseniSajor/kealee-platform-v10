"use client"

import * as React from "react"
import Link from "next/link"
import {
  Copy,
  Download,
  File,
  FileText,
  Folder,
  Image as ImageIcon,
  Link2,
  MoreHorizontal,
  UploadCloud,
} from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

type StorageProvider = "local" | "aws-s3" | "cloudflare-r2"

type DocumentVersion = {
  id: string
  version: number
  filename: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string // ISO
  uploader: string
  file?: File
  objectUrl?: string
}

export type DocumentItem = {
  id: string
  key: string // logical identifier used for versioning, e.g. folder + normalized filename
  folder: string
  title: string
  latest: DocumentVersion
  versions: DocumentVersion[]
  shareToken?: string
}

export type DocumentUploadProps = {
  projectId?: string
  className?: string
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

function formatBytes(bytes: number) {
  const b = Number.isFinite(bytes) ? bytes : 0
  const kb = b / 1024
  const mb = kb / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  if (kb >= 1) return `${kb.toFixed(0)} KB`
  return `${b.toFixed(0)} B`
}

function isImage(mime: string) {
  return /^image\//.test(mime)
}

function isPdf(mime: string, name: string) {
  return mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")
}

function normalizeKey(folder: string, filename: string) {
  return `${folder.trim().toLowerCase()}/${filename.trim().toLowerCase()}`
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function DocumentUpload({ projectId, className }: DocumentUploadProps) {
  const [provider, setProvider] = React.useState<StorageProvider>("local")
  const [folder, setFolder] = React.useState<string>("General")
  const [folders, setFolders] = React.useState<string[]>(["General", "Plans", "Permits", "Invoices", "Photos"])
  const [items, setItems] = React.useState<DocumentItem[]>([])

  const [activeFolder, setActiveFolder] = React.useState<string>("All")
  const [query, setQuery] = React.useState<string>("")

  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const [preview, setPreview] = React.useState<{
    itemId: string
    versionId: string
  } | null>(null)

  const [busy, setBusy] = React.useState<null | "upload" | "share" | "export">(null)

  // Load existing documents from backend on mount
  React.useEffect(() => {
    async function loadDocuments() {
      if (!projectId || projectId === "global") return
      try {
        const result = await api.documents.list(projectId)
        if (result?.documents?.length) {
          const loaded: DocumentItem[] = result.documents.map((doc: any) => {
            const version: DocumentVersion = {
              id: doc.id,
              version: doc.version || 1,
              filename: doc.title || doc.name || "Untitled",
              mimeType: doc.mimeType || "application/octet-stream",
              sizeBytes: doc.sizeBytes || 0,
              uploadedAt: doc.createdAt || new Date().toISOString(),
              uploader: doc.uploaderName || doc.uploader || "Unknown",
              objectUrl: doc.url || doc.fileUrl,
            }
            return {
              id: doc.id,
              key: normalizeKey(doc.folder || "General", version.filename),
              folder: doc.folder || "General",
              title: version.filename,
              latest: version,
              versions: [version],
            }
          })
          setItems(loaded)
        }
      } catch (err) {
        console.warn("Could not load documents from API:", err)
      }
    }
    loadDocuments()

    return () => {
      // cleanup object URLs
      for (const i of items) {
        for (const v of i.versions) {
          if (v.objectUrl) URL.revokeObjectURL(v.objectUrl)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function upsertFolder(name: string) {
    const n = name.trim()
    if (!n) return
    setFolders((prev) => (prev.includes(n) ? prev : [...prev, n].sort((a, b) => a.localeCompare(b))))
    setFolder(n)
  }

  function withObjectUrl(file: File) {
    return URL.createObjectURL(file)
  }

  async function addFiles(fileList: FileList | File[], uploader = "PM") {
    const files = Array.from(fileList)
    if (!files.length) return
    setBusy("upload")

    const now = new Date().toISOString()

    // Try uploading to backend API first
    if (projectId && projectId !== "global") {
      try {
        const result = await api.documents.upload(projectId, files, { folder })
        // If backend upload succeeded, use the returned document data
        if (result?.documents) {
          setItems((prev) => {
            const next = [...prev]
            for (const doc of result.documents) {
              const version: DocumentVersion = {
                id: doc.id || uid("ver"),
                version: 1,
                filename: doc.title || doc.name,
                mimeType: doc.mimeType || "application/octet-stream",
                sizeBytes: doc.sizeBytes || 0,
                uploadedAt: doc.createdAt || now,
                uploader: doc.uploader || uploader,
                objectUrl: doc.url || doc.fileUrl,
              }
              const item: DocumentItem = {
                id: doc.id || uid("doc"),
                key: normalizeKey(folder, version.filename),
                folder,
                title: version.filename,
                latest: version,
                versions: [version],
              }
              next.unshift(item)
            }
            return next
          })
          setBusy(null)
          return
        }
      } catch (err) {
        console.warn("Backend upload failed, falling back to local:", err)
      }
    }

    // Fallback: local upload with object URLs (works for 'global' or when API fails)
    setItems((prev) => {
      const next = [...prev]
      for (const f of files) {
        const key = normalizeKey(folder, f.name)
        const existingIdx = next.findIndex((i) => i.key === key)
        const version: DocumentVersion = {
          id: uid("ver"),
          version: 1,
          filename: f.name,
          mimeType: f.type || "application/octet-stream",
          sizeBytes: f.size,
          uploadedAt: now,
          uploader,
          file: f,
          objectUrl: withObjectUrl(f),
        }

        if (existingIdx >= 0) {
          const existing = next[existingIdx]!
          const nextVerNum = (existing.latest?.version ?? existing.versions.length) + 1
          const v2: DocumentVersion = { ...version, version: nextVerNum }
          next[existingIdx] = { ...existing, latest: v2, versions: [v2, ...existing.versions] }
          continue
        }

        const item: DocumentItem = {
          id: uid("doc"),
          key,
          folder,
          title: f.name,
          latest: version,
          versions: [version],
        }
        next.unshift(item)
      }
      return next
    })

    setBusy(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  function exportCsv() {
    setBusy("export")
    const rows: Record<string, string>[] = items.map((i) => ({
      folder: i.folder,
      title: i.title,
      mimeType: i.latest.mimeType,
      sizeBytes: String(i.latest.sizeBytes),
      size: formatBytes(i.latest.sizeBytes),
      uploadedAt: i.latest.uploadedAt,
      uploader: i.latest.uploader,
      versions: String(i.versions.length),
    }))
    const headers = Object.keys(rows[0] ?? {})
    const escape = (v: string) => {
      const needs = /[",\n]/.test(v)
      const escaped = v.replaceAll('"', '""')
      return needs ? `"${escaped}"` : escaped
    }
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `documents-${projectId ?? "project"}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setBusy(null), 150)
  }

  async function shareItem(itemId: string) {
    setBusy("share")
    // Placeholder: call API to create share link token for client access.
    const token = uid("share")
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, shareToken: token } : i)))
    setBusy(null)
  }

  function openPreview(itemId: string, versionId: string) {
    setPreview({ itemId, versionId })
  }

  function closePreview() {
    setPreview(null)
  }

  function downloadVersion(v: DocumentVersion) {
    if (v.objectUrl) {
      const a = document.createElement("a")
      a.href = v.objectUrl
      a.download = v.filename
      a.click()
      return
    }
    alert("Download requires a stored file URL (placeholder for S3/R2).")
  }

  function moveItem(itemId: string, nextFolder: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, folder: nextFolder, key: normalizeKey(nextFolder, i.latest.filename) } : i))
    )
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (activeFolder !== "All" && i.folder !== activeFolder) return false
      if (!q) return true
      return (
        i.title.toLowerCase().includes(q) ||
        i.folder.toLowerCase().includes(q) ||
        i.latest.uploader.toLowerCase().includes(q)
      )
    })
  }, [items, activeFolder, query])

  const previewData = React.useMemo(() => {
    if (!preview) return null
    const item = items.find((i) => i.id === preview.itemId)
    if (!item) return null
    const v = item.versions.find((x) => x.id === preview.versionId) ?? item.latest
    return { item, v }
  }, [preview, items])

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Drag & drop uploads with folders, versions, previews, and share links.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!items.length || busy !== null}>
            <Download className="h-4 w-4" />
            Export list
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
          >
            <UploadCloud className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Upload</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-neutral-600">Storage</div>
                  <select
                    className="h-9 rounded-md border bg-white px-3 text-sm"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as StorageProvider)}
                    aria-label="Storage provider"
                  >
                    <option value="local">Local (placeholder)</option>
                    <option value="aws-s3">AWS S3 (placeholder)</option>
                    <option value="cloudflare-r2">Cloudflare R2 (placeholder)</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Folder</div>
                    <select
                      className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                    >
                      {folders.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">New folder</div>
                    <Input
                      placeholder="Create folder…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          upsertFolder((e.currentTarget as HTMLInputElement).value)
                          ;(e.currentTarget as HTMLInputElement).value = ""
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border bg-white p-6 text-center",
                  "border-dashed",
                  "transition-colors",
                  busy === "upload" ? "opacity-60" : "hover:bg-neutral-50"
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
                }}
              >
                <UploadCloud className="mx-auto h-6 w-6 text-neutral-700" />
                <div className="mt-2 font-medium text-neutral-900">Drag & drop files here</div>
                <div className="mt-1 text-sm text-neutral-600">or click to browse</div>
                <div className="mt-3 text-xs text-neutral-500">
                  Files are uploaded to the project via the API and stored securely.
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    addFiles(e.target.files ?? [])
                    e.currentTarget.value = ""
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">File list</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-9 rounded-md border bg-white px-3 text-sm"
                    value={activeFolder}
                    onChange={(e) => setActiveFolder(e.target.value)}
                    aria-label="Folder filter"
                  >
                    <option value="All">All folders</option>
                    {folders.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="sm:w-56" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Name</th>
                      <th className="text-left font-medium px-4 py-3">Folder</th>
                      <th className="text-left font-medium px-4 py-3">Type</th>
                      <th className="text-right font-medium px-4 py-3">Size</th>
                      <th className="text-left font-medium px-4 py-3">Upload date</th>
                      <th className="text-left font-medium px-4 py-3">Uploader</th>
                      <th className="text-right font-medium px-4 py-3">Versions</th>
                      <th className="text-right font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length ? (
                      filtered.map((i) => (
                        <tr key={i.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg border bg-neutral-50 p-2 text-neutral-900">
                                {isImage(i.latest.mimeType) ? (
                                  <ImageIcon className="h-4 w-4" />
                                ) : isPdf(i.latest.mimeType, i.latest.filename) ? (
                                  <FileText className="h-4 w-4" />
                                ) : (
                                  <File className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-neutral-900 truncate">{i.title}</div>
                                {i.shareToken ? (
                                  <div className="text-xs text-neutral-600 mt-0.5 inline-flex items-center gap-2">
                                    <Link2 className="h-3.5 w-3.5" />
                                    Share link ready
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            <div className="inline-flex items-center gap-2">
                              <Folder className="h-4 w-4 text-neutral-500" />
                              <select
                                className="h-8 rounded-md border bg-white px-2 text-sm"
                                value={i.folder}
                                onChange={(e) => moveItem(i.id, e.target.value)}
                              >
                                {folders.map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{i.latest.mimeType || "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                            {formatBytes(i.latest.sizeBytes)}
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            {new Date(i.latest.uploadedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{i.latest.uploader}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{i.versions.length}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openPreview(i.id, i.latest.id)}>
                                Preview
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => downloadVersion(i.latest)}>
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void shareItem(i.id)}
                                disabled={busy !== null}
                              >
                                Share
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => startVersionUpload(i.id)} disabled={busy !== null}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                          No documents yet. Upload files above to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Version control</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="text-sm text-neutral-600">
                Uploading a file with the same name in the same folder creates a new version (placeholder logic).
              </div>
              <div className="rounded-xl border bg-white p-4 text-sm text-neutral-700">
                <div className="font-medium text-neutral-900">How this wires to storage</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Store each version as a distinct object key in S3/R2.</li>
                  <li>Keep a logical document key for grouping versions.</li>
                  <li>Generate signed download links for preview/download.</li>
                  <li>Share links map to a token granting limited access.</li>
                </ul>
              </div>
              <div className="text-xs text-neutral-600">
                Provider selected: <span className="font-medium text-neutral-900">{provider}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Client share links</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="text-sm text-neutral-600">
                Generate a link for a client to view/download a document (placeholder).
              </div>
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {items.filter((i) => i.shareToken).length ? (
                    items
                      .filter((i) => i.shareToken)
                      .slice(0, 6)
                      .map((i) => {
                        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${i.shareToken}`
                        return (
                          <li key={i.id} className="px-4 py-3">
                            <div className="font-medium text-neutral-900 truncate">{i.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                              <span className="rounded-full border bg-neutral-50 px-2 py-1">token: {i.shareToken}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const ok = await copyText(url)
                                  if (!ok) alert("Copy failed (browser permissions).")
                                }}
                              >
                                <Copy className="h-4 w-4" />
                                Copy link
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={url} target="_blank" rel="noreferrer">
                                  Open
                                </Link>
                              </Button>
                            </div>
                          </li>
                        )
                      })
                  ) : (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No share links yet.</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {previewData ? (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 sm:p-8" role="dialog" aria-modal="true">
          <div className="mx-auto max-w-5xl rounded-xl bg-white shadow-lg overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="min-w-0">
                <div className="font-medium text-neutral-900 truncate">{previewData.item.title}</div>
                <div className="text-xs text-neutral-600 mt-0.5">
                  v{previewData.v.version} • {previewData.v.mimeType} • {formatBytes(previewData.v.sizeBytes)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadVersion(previewData.v)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>

            <div className="p-4">
              {isImage(previewData.v.mimeType) && previewData.v.objectUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewData.v.objectUrl}
                  alt={previewData.v.filename}
                  className="max-h-[70vh] w-full object-contain rounded-lg border bg-neutral-50"
                />
              ) : isPdf(previewData.v.mimeType, previewData.v.filename) && previewData.v.objectUrl ? (
                <iframe
                  title={previewData.v.filename}
                  src={previewData.v.objectUrl}
                  className="h-[70vh] w-full rounded-lg border"
                />
              ) : (
                <div className="rounded-lg border bg-neutral-50 p-6 text-sm text-neutral-700">
                  Preview not available for this file type (placeholder).
                </div>
              )}

              <div className="mt-4">
                <div className="text-sm font-medium text-neutral-900">Versions</div>
                <div className="mt-2 overflow-x-auto rounded-xl border bg-white">
                  <table className="min-w-[700px] w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Version</th>
                        <th className="text-left font-medium px-4 py-3">Filename</th>
                        <th className="text-left font-medium px-4 py-3">Uploaded</th>
                        <th className="text-left font-medium px-4 py-3">Uploader</th>
                        <th className="text-right font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.item.versions.map((v) => (
                        <tr key={v.id} className="border-t">
                          <td className="px-4 py-3 text-neutral-700">v{v.version}</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">{v.filename}</td>
                          <td className="px-4 py-3 text-neutral-700">{new Date(v.uploadedAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-neutral-700">{v.uploader}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openPreview(previewData.item.id, v.id)}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => downloadVersion(v)}>
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  function startVersionUpload(itemId: string) {
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = () => {
      if (!input.files?.length) return
      // uploading same filename in folder will bump version
      setFolder(item.folder)
      addFiles(input.files, "PM")
    }
    input.click()
  }
}

