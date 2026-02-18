"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  File,
  FileText,
  Loader2,
  Paperclip,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"
import { useCreateRFI } from "@/hooks/useRFIs"

// ---------------------------------------------------------------------------
// File upload helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPTED_TYPES = ".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewRFIPage() {
  const router = useRouter()
  const createRFI = useCreateRFI()
  const [form, setForm] = React.useState({
    subject: "",
    project: "",
    assignTo: "",
    priority: "medium",
    dueDate: "",
    drawingRef: "",
    specRef: "",
    question: "",
    costImpact: false,
    scheduleImpact: false,
  })

  const [attachments, setAttachments] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return
    const newFiles: File[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 50 MB limit.`)
        continue
      }
      if (attachments.some((a) => a.name === file.name && a.size === file.size)) continue
      newFiles.push(file)
    }
    setAttachments((prev) => [...prev, ...newFiles])
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    handleFilesSelected(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function submitForm(status: "draft" | "open") {
    createRFI.mutate(
      { ...form, status, attachmentCount: attachments.length },
      {
        onSuccess: async (result: any) => {
          if (attachments.length > 0 && result?.data?.id) {
            try {
              const { api } = await import("@/lib/api")
              await api.rfis.uploadAttachments(result.data.id, attachments)
            } catch {
              console.error("Attachment upload failed")
            }
          }
          router.push("/rfis")
        },
      }
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ---- Back button ---- */}
      <div className="flex items-center gap-4">
        <Link href="/rfis">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to RFIs
          </Button>
        </Link>
      </div>

      {/* ---- Page heading ---- */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New RFI</h1>
        <p className="text-gray-500 mt-1">
          Submit a new Request for Information
        </p>
      </div>

      {/* ---- Main form card ---- */}
      <Card>
        <CardHeader>
          <CardTitle>RFI Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Subject */}
          <div>
            <Label className="mb-1.5">Subject *</Label>
            <Input
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Brief description of the question or issue"
            />
          </div>

          {/* Project + Assign To */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Project *</Label>
              <select
                value={form.project}
                onChange={(e) => update("project", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white h-9 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="">Select project...</option>
                <option value="riverside">Riverside Commons</option>
                <option value="oakwood">Oakwood Office Park</option>
                <option value="summit">Summit Residences</option>
                <option value="harbor">Harbor View Condos</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5">Assign To *</Label>
              <select
                value={form.assignTo}
                onChange={(e) => update("assignTo", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white h-9 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="">Select recipient...</option>
                <option value="architect">Anderson Architects</option>
                <option value="structural">Structural Solutions LLC</option>
                <option value="mep">MEP Engineers LLC</option>
                <option value="owner">Owner Representative</option>
                <option value="geotech">Geotech Consultants</option>
              </select>
            </div>
          </div>

          {/* Priority + Due Date */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Priority</Label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white h-9 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5">Due Date *</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
              />
            </div>
          </div>

          {/* Drawing Ref + Spec Ref */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Drawing Reference</Label>
              <Input
                value={form.drawingRef}
                onChange={(e) => update("drawingRef", e.target.value)}
                placeholder="e.g. S-201, A-102"
              />
            </div>
            <div>
              <Label className="mb-1.5">Spec Reference</Label>
              <Input
                value={form.specRef}
                onChange={(e) => update("specRef", e.target.value)}
                placeholder="e.g. Section 03 30 00"
              />
            </div>
          </div>

          {/* Question textarea */}
          <div>
            <Label className="mb-1.5">Question *</Label>
            <textarea
              value={form.question}
              onChange={(e) => update("question", e.target.value)}
              placeholder="Describe the issue in detail. Reference specific drawings, specifications, or field conditions as applicable..."
              className="w-full border rounded-md px-3 py-2 text-sm min-h-[160px] resize-y focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            />
          </div>

          {/* Impact checkboxes */}
          <div>
            <Label className="mb-2">Impact Assessment</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.costImpact}
                  onChange={(e) => update("costImpact", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Potential Cost Impact
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.scheduleImpact}
                  onChange={(e) => update("scheduleImpact", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Potential Schedule Impact
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Attachments card ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip size={16} />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => {
              handleFilesSelected(e.target.files)
              e.target.value = ""
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer"
          >
            <Upload size={32} className="mx-auto mb-2" />
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-xs mt-1">
              PDF, DWG, DXF, JPG, PNG up to 50 MB each
            </p>
          </div>

          {attachments.length > 0 && (
            <ul className="space-y-2">
              {attachments.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <File size={16} className="shrink-0 text-blue-500" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="shrink-0 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ---- Action buttons ---- */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pb-8">
        <Link href="/rfis">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          variant="outline"
          className="gap-2"
          disabled={createRFI.isPending}
          onClick={() => submitForm("draft")}
        >
          {createRFI.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save as Draft
        </Button>
        <Button
          className="gap-2"
          disabled={createRFI.isPending}
          onClick={() => submitForm("open")}
        >
          {createRFI.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {createRFI.isPending ? "Submitting..." : "Submit RFI"}
        </Button>
      </div>
    </div>
  )
}
