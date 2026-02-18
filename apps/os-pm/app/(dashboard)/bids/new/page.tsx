"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  File,
  Loader2,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { useCreateBid } from "@/hooks/useBids"

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

const tradeOptions = [
  "Concrete",
  "Steel",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Drywall",
  "Painting",
  "Roofing",
  "Masonry",
  "Flooring",
  "Fire Protection",
  "Glazing",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewBidPackagePage() {
  const router = useRouter()
  const createBid = useCreateBid()
  const [name, setName] = React.useState("")
  const [trade, setTrade] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [preBidDate, setPreBidDate] = React.useState("")
  const [scopeItems, setScopeItems] = React.useState<string[]>([""])
  const [contractors, setContractors] = React.useState<string[]>([""])
  const [attachments, setAttachments] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const addScope = () => setScopeItems([...scopeItems, ""])
  const removeScope = (i: number) =>
    setScopeItems(scopeItems.filter((_, idx) => idx !== i))
  const updateScope = (i: number, v: string) => {
    const n = [...scopeItems]
    n[i] = v
    setScopeItems(n)
  }
  const addContractor = () => setContractors([...contractors, ""])
  const removeContractor = (i: number) =>
    setContractors(contractors.filter((_, idx) => idx !== i))
  const updateContractor = (i: number, v: string) => {
    const n = [...contractors]
    n[i] = v
    setContractors(n)
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
      if (
        attachments.some((a) => a.name === file.name && a.size === file.size)
      )
        continue
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
    createBid.mutate(
      {
        name,
        trade,
        description: desc,
        dueDate,
        preBidDate,
        scopeItems: scopeItems.filter(Boolean),
        contractors: contractors.filter(Boolean),
        status,
        attachmentCount: attachments.length,
      },
      {
        onSuccess: async (result: any) => {
          if (attachments.length > 0 && result?.data?.id) {
            try {
              const { api } = await import("@/lib/api")
              await api.bids.uploadAttachments(result.data.id, attachments)
            } catch {
              console.error("Attachment upload failed")
            }
          }
          router.push("/bids")
        },
      }
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Create Bid Package</h1>
      </div>

      {/* ---- Package details ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Package Name</label>
            <Input
              placeholder="e.g. BP-009 Roofing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Trade</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select trade...</option>
              {tradeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the scope of work..."
              className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Pre-Bid Meeting Date
              </label>
              <Input
                type="date"
                value={preBidDate}
                onChange={(e) => setPreBidDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Scope items ---- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scope Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addScope}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {scopeItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-6">
                {i + 1}.
              </span>
              <Input
                placeholder="Scope item description..."
                value={item}
                onChange={(e) => updateScope(i, e.target.value)}
              />
              {scopeItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeScope(i)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---- Invite contractors ---- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invite Contractors</CardTitle>
          <Button variant="outline" size="sm" onClick={addContractor}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contractor
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {contractors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Contractor name or email..."
                value={c}
                onChange={(e) => updateContractor(i, e.target.value)}
              />
              {contractors.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeContractor(i)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---- Attachments ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Attach Documents</CardTitle>
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
            className="flex items-center justify-center rounded-lg border-2 border-dashed py-8 hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="text-center text-gray-400 hover:text-blue-400">
              <Paperclip className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DWG, or image files up to 50 MB
              </p>
            </div>
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

      {/* ---- Actions ---- */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          disabled={createBid.isPending}
          onClick={() => submitForm("draft")}
        >
          {createBid.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save as Draft
        </Button>
        <Button
          className="gap-2"
          disabled={createBid.isPending}
          onClick={() => submitForm("open")}
        >
          {createBid.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {createBid.isPending ? "Sending..." : "Send to Contractors"}
        </Button>
      </div>
    </div>
  )
}
