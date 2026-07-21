"use client"
import * as React from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api/index"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MobStatus = "Not Started" | "In Progress" | "Complete"

interface MobChecklist {
  id: string
  name: string
  projectName: string
  templateName: string
  status: MobStatus
  progress: number // 0-100
  assignee: string
  dueDate: string
  totalItems: number
  completedItems: number
}

const statusColor: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Complete: "bg-green-50 text-green-700",
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETE: "bg-green-50 text-green-700",
}

const statusFilters: MobStatus[] = ["Not Started", "In Progress", "Complete"]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeStatus(raw: string): MobStatus {
  const lower = raw.toLowerCase().replace(/_/g, " ")
  if (lower.includes("complete") || lower.includes("done")) return "Complete"
  if (lower.includes("progress") || lower.includes("active")) return "In Progress"
  return "Not Started"
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MobilizationPage() {
  const [q, setQ] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<MobStatus | "All">("All")
  const [checklists, setChecklists] = React.useState<MobChecklist[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadChecklists()
  }, [])

  async function loadChecklists() {
    setLoading(true)
    try {
      const res = await api.mobilization.list()
      const data = res as any
      const items =
        data?.checklists ||
        data?.data?.checklists ||
        data?.mobilization ||
        data?.items ||
        data?.data ||
        []
      const mapped: MobChecklist[] = (Array.isArray(items) ? items : []).map((c: any) => {
        const allItems = c.items || c.checklistItems || []
        const total = allItems.length || c.totalItems || 0
        const completed =
          allItems.filter((i: any) => i.status === "complete" || i.status === "COMPLETE" || i.completed).length ||
          c.completedItems ||
          0
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0
        let status: MobStatus = "Not Started"
        if (c.status) {
          status = normalizeStatus(c.status)
        } else if (progress === 100) {
          status = "Complete"
        } else if (progress > 0) {
          status = "In Progress"
        }
        return {
          id: c.id,
          name: c.name || c.title || "",
          projectName: c.projectName || c.project?.name || "",
          templateName: c.templateName || c.template?.name || "",
          status,
          progress,
          assignee: c.assignee || c.assignedTo || "",
          dueDate: c.dueDate ? new Date(c.dueDate).toISOString().split("T")[0] : "",
          totalItems: total,
          completedItems: completed,
        }
      })
      setChecklists(mapped)
    } catch (err) {
      console.error("Failed to load mobilization checklists:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = checklists.filter((c) => {
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.projectName.toLowerCase().includes(q.toLowerCase()) ||
      c.assignee.toLowerCase().includes(q.toLowerCase())
    const matchesStatus = statusFilter === "All" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const notStartedCount = checklists.filter((c) => c.status === "Not Started").length
  const inProgressCount = checklists.filter((c) => c.status === "In Progress").length
  const completeCount = checklists.filter((c) => c.status === "Complete").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mobilization Checklists</h1>
          <p className="text-muted-foreground">Track site setup, utilities, permits, and safety readiness</p>
        </div>
        <Button asChild>
          <Link href="/pm/mobilization/new">
            <Plus className="mr-2 h-4 w-4" />
            New Checklist
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading mobilization checklists...</span>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{notStartedCount}</div>
                  <div className="text-sm text-muted-foreground">Not Started</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="rounded-full bg-blue-50 p-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{inProgressCount}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="rounded-full bg-green-50 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{completeCount}</div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search checklists, projects, or assignees..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={statusFilter === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("All")}
              >
                All
              </Button>
              {statusFilters.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Checklist table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Checklist Name</th>
                      <th className="px-4 py-3 text-left font-medium">Project</th>
                      <th className="px-4 py-3 text-left font-medium">Template</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Progress</th>
                      <th className="px-4 py-3 text-left font-medium">Assignee</th>
                      <th className="px-4 py-3 text-left font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cl) => (
                      <tr key={cl.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                        <td className="px-4 py-3">
                          <Link href={`/pm/mobilization/${cl.id}`} className="font-medium text-blue-600 hover:underline">
                            {cl.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{cl.projectName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{cl.templateName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusColor[cl.status] || "bg-gray-100 text-gray-700"
                            )}
                          >
                            {cl.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  cl.progress === 100
                                    ? "bg-green-500"
                                    : cl.progress > 0
                                      ? "bg-blue-500"
                                      : "bg-gray-300"
                                )}
                                style={{ width: `${cl.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10">
                              {cl.completedItems}/{cl.totalItems}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{cl.assignee || "\u2014"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{cl.dueDate || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="mx-auto h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">
                {q || statusFilter !== "All"
                  ? "No checklists match your filters"
                  : "No mobilization checklists yet"}
              </p>
              <p className="text-sm">
                {q || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Create one from a template to get started."}
              </p>
              {!q && statusFilter === "All" && (
                <Button asChild className="mt-4">
                  <Link href="/pm/mobilization/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Checklist
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

