"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Save,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api/index"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistItem {
  label: string
  status: "pending" | "complete"
  assignee: string
  dueDate: string
  notes: string
}

interface Checklist {
  id: string
  name: string
  projectName: string
  templateName: string
  status: string
  assignee: string
  dueDate: string
  items: ChecklistItem[]
}

const statusColor: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Complete: "bg-green-50 text-green-700",
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETE: "bg-green-50 text-green-700",
}

function normalizeStatus(items: ChecklistItem[]): string {
  if (items.length === 0) return "Not Started"
  const completed = items.filter((i) => i.status === "complete").length
  if (completed === items.length) return "Complete"
  if (completed > 0) return "In Progress"
  return "Not Started"
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MobilizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [checklist, setChecklist] = React.useState<Checklist | null>(null)
  const [items, setItems] = React.useState<ChecklistItem[]>([])
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null)
  const [dirty, setDirty] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    loadChecklist()
  }, [id])

  async function loadChecklist() {
    setLoading(true)
    try {
      const res = await api.mobilization.get(id)
      const data = res as any
      const cl =
        data?.checklist ||
        data?.mobilization ||
        data?.data?.checklist ||
        data?.data ||
        data ||
        {}

      const rawItems = cl.items || cl.checklistItems || []
      const mappedItems: ChecklistItem[] = (Array.isArray(rawItems) ? rawItems : []).map(
        (item: any) => ({
          label: item.label || item.name || item.title || "",
          status:
            item.status === "complete" || item.status === "COMPLETE" || item.completed
              ? "complete"
              : "pending",
          assignee: item.assignee || item.assignedTo || "",
          dueDate: item.dueDate
            ? new Date(item.dueDate).toISOString().split("T")[0]
            : "",
          notes: item.notes || "",
        })
      )

      const parsed: Checklist = {
        id: cl.id || id,
        name: cl.name || cl.title || "Mobilization Checklist",
        projectName: cl.projectName || cl.project?.name || "",
        templateName: cl.templateName || cl.template?.name || "",
        status: cl.status || normalizeStatus(mappedItems),
        assignee: cl.assignee || cl.assignedTo || "",
        dueDate: cl.dueDate ? new Date(cl.dueDate).toISOString().split("T")[0] : "",
        items: mappedItems,
      }

      setChecklist(parsed)
      setItems(mappedItems)
    } catch (err) {
      console.error("Failed to load mobilization checklist:", err)
    } finally {
      setLoading(false)
    }
  }

  // ---- Derived values ----
  const completedCount = items.filter((i) => i.status === "complete").length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const computedStatus = normalizeStatus(items)
  const allComplete = completedCount === totalCount && totalCount > 0

  // ---- Item handlers ----
  function toggleItem(idx: number) {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        status: next[idx].status === "complete" ? "pending" : "complete",
      }
      return next
    })
    setDirty(true)
  }

  function updateItemField(idx: number, field: keyof ChecklistItem, value: string) {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setDirty(true)
  }

  function toggleExpand(idx: number) {
    setExpandedIdx(expandedIdx === idx ? null : idx)
  }

  // ---- Save ----
  async function handleSave() {
    if (!checklist) return
    setSaving(true)
    try {
      await api.mobilization.update(id, {
        status: computedStatus,
        items,
      })
      setDirty(false)
    } catch (err) {
      console.error("Failed to save:", err)
    } finally {
      setSaving(false)
    }
  }

  // ---- Mark Complete ----
  async function handleMarkComplete() {
    if (!checklist) return
    setSaving(true)
    try {
      const completedItems = items.map((i) => ({ ...i, status: "complete" as const }))
      await api.mobilization.update(id, {
        status: "Complete",
        items: completedItems,
      })
      setItems(completedItems)
      setDirty(false)
    } catch (err) {
      console.error("Failed to mark complete:", err)
    } finally {
      setSaving(false)
    }
  }

  // ---- Export PDF ----
  async function handleExportPdf() {
    setExporting(true)
    try {
      const res = await api.mobilization.exportPdf(id)
      const data = res as any
      const url = data?.url || data?.downloadUrl || data?.data?.url
      if (url) {
        window.open(url, "_blank")
      }
    } catch (err) {
      console.error("Failed to export PDF:", err)
    } finally {
      setExporting(false)
    }
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading checklist...</span>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Checklist not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pm/mobilization">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{checklist.name}</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusColor[computedStatus] || "bg-gray-100 text-gray-700"
              )}
            >
              {computedStatus}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {checklist.projectName}
            {checklist.projectName && checklist.templateName ? " \u00b7 " : ""}
            {checklist.templateName}
            {checklist.assignee ? ` \u00b7 Assigned to ${checklist.assignee}` : ""}
            {checklist.dueDate ? ` \u00b7 Due ${checklist.dueDate}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
          {dirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          )}
          {!allComplete && (
            <Button size="sm" onClick={handleMarkComplete} disabled={saving}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} items complete ({progress}%)
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progress === 100
                  ? "bg-green-500"
                  : progress > 0
                    ? "bg-blue-500"
                    : "bg-gray-300"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist items */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {items.map((item, idx) => {
              const isExpanded = expandedIdx === idx
              return (
                <div key={idx} className="px-4 py-0">
                  {/* Main row */}
                  <div className="flex items-center gap-3 py-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleItem(idx)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        item.status === "complete"
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white hover:border-blue-400"
                      )}
                    >
                      {item.status === "complete" && <Check className="h-4 w-4" />}
                    </button>

                    {/* Label */}
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium",
                        item.status === "complete" && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Assignee badge */}
                    {item.assignee && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted-foreground">
                        {item.assignee}
                      </span>
                    )}

                    {/* Due date badge */}
                    {item.dueDate && (
                      <span className="text-xs text-muted-foreground">{item.dueDate}</span>
                    )}

                    {/* Status */}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        item.status === "complete"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.status === "complete" ? "Complete" : "Pending"}
                    </span>

                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="pb-4 pl-9 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Assignee
                          </label>
                          <Input
                            placeholder="Who is responsible?"
                            value={item.assignee}
                            onChange={(e) =>
                              updateItemField(idx, "assignee", e.target.value)
                            }
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) =>
                              updateItemField(idx, "dueDate", e.target.value)
                            }
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Notes
                        </label>
                        <textarea
                          value={item.notes}
                          onChange={(e) =>
                            updateItemField(idx, "notes", e.target.value)
                          }
                          placeholder="Add notes or details..."
                          className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {items.length === 0 && (
              <div className="px-4 py-10 text-center text-muted-foreground">
                No items in this checklist.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/pm/mobilization">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Checklists
          </Link>
        </Button>
        <div className="flex gap-2">
          {dirty && (
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
