"use client"

export const dynamic = 'force-dynamic';

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowUpDown, Check, Download, RefreshCw, Trash2, UserRoundPen } from "lucide-react"
import { toast } from "sonner"

import { api, type TaskFilters } from "@/lib/api-client"
import { Badge } from "@/components/badge"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import type { PMTask } from "@/lib/types"

type StatusFilter = "all" | PMTask["status"]
type PriorityFilter = "all" | PMTask["priority"]
type SortKey = "dueAsc" | "dueDesc" | "priority" | "createdAsc" | "createdDesc"

function parseDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function priorityRank(p: PMTask["priority"]) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2
}

function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => {
    const needs = /[",\n]/.test(v)
    const escaped = v.replaceAll('"', '""')
    return needs ? `"${escaped}"` : escaped
  }
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ]
  return lines.join("\n")
}

export default function WorkQueuePage() {
  const qc = useQueryClient()
  const [now, setNow] = React.useState<number | null>(null)

  // Controls
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [priority, setPriority] = React.useState<PriorityFilter>("all")
  const [assignee, setAssignee] = React.useState<string>("all")
  const [sort, setSort] = React.useState<SortKey>("dueAsc")

  // Bulk selection + actions
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const [bulkAssignee, setBulkAssignee] = React.useState("")
  const [overrideAssignedTo, setOverrideAssignedTo] = React.useState<Record<string, string>>({})

  // Pagination
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  // Real-time WebSocket
  const [wsStatus, setWsStatus] = React.useState<"disabled" | "connecting" | "connected" | "error">("disabled")

  React.useEffect(() => {
    setNow(Date.now())
  }, [])

  // Build filters for API
  const filters: TaskFilters = React.useMemo(() => {
    const f: TaskFilters = {
      page,
      pageSize,
    }

    if (status !== "all") f.status = status
    if (priority !== "all") f.priority = priority
    if (assignee !== "all") f.assignedTo = assignee
    if (search.trim()) f.search = search.trim()

    // Map sort to API format
    if (sort === "dueAsc") {
      f.sortBy = "dueDate"
      f.sortOrder = "asc"
    } else if (sort === "dueDesc") {
      f.sortBy = "dueDate"
      f.sortOrder = "desc"
    } else if (sort === "priority") {
      f.sortBy = "priority"
      f.sortOrder = "desc"
    } else if (sort === "createdAsc") {
      f.sortBy = "createdAt"
      f.sortOrder = "asc"
    } else if (sort === "createdDesc") {
      f.sortBy = "createdAt"
      f.sortOrder = "desc"
    }

    return f
  }, [page, pageSize, status, priority, assignee, search, sort])

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["pm-tasks", filters],
    queryFn: () => api.getMyTasks(filters),
  })

  const tasks = React.useMemo(() => {
    const raw = (data?.tasks ?? []) as PMTask[]
    return raw.map((t) => (overrideAssignedTo[t.id] ? { ...t, assignedTo: overrideAssignedTo[t.id]! } : t))
  }, [data?.tasks, overrideAssignedTo])

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const assignees = React.useMemo(() => {
    const s = new Set<string>()
    for (const t of tasks) {
      if (t.assignedTo) s.add(t.assignedTo)
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [tasks])

  const complete = useMutation({
    mutationFn: (taskId: string) => api.completeTask(taskId, { completedAt: new Date().toISOString() }),
    onSuccess: async (_data, taskId) => {
      toast.success("Task completed")
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
      await qc.invalidateQueries({ queryKey: ["pm-task", taskId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete task")
    },
  })

  const bulkAssign = useMutation({
    mutationFn: (data: { taskIds: string[]; newAssigneeId: string }) => api.bulkAssignTasks(data),
    onSuccess: async (result) => {
      toast.success(`Reassigned ${result.updated} tasks`)
      setSelected(new Set())
      setBulkAssignee("")
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reassign tasks")
    },
  })

  const bulkComplete = useMutation({
    mutationFn: (taskIds: string[]) => api.bulkCompleteTasks(taskIds),
    onSuccess: async (result) => {
      toast.success(`Completed ${result.updated} tasks`)
      setSelected(new Set())
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete tasks")
    },
  })

  // WebSocket connection for real-time updates
  React.useEffect(() => {
    const url = process.env.NEXT_PUBLIC_PM_WS_URL
    if (!url) {
      setWsStatus("disabled")
      return
    }

    let ws: WebSocket | null = null
    let cancelled = false
    let reconnectTimeout: NodeJS.Timeout

    function connect() {
      if (cancelled) return

      try {
        setWsStatus("connecting")
        ws = new WebSocket(url)

        ws.onopen = () => {
          if (cancelled) return
          setWsStatus("connected")
          // Subscribe to task updates
          ws?.send(JSON.stringify({ type: "subscribe", channel: "pm_tasks" }))
        }

        ws.onmessage = async (event) => {
          if (cancelled) return
          try {
            const msg = JSON.parse(String(event.data)) as { type?: string; event?: string }
            if (msg.type === "pm_tasks_updated" || msg.type === "pm_tasks_changed" || msg.event === "task_updated") {
              await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
              toast.info("Tasks updated")
            }
          } catch {
            // ignore non-JSON messages
          }
        }

        ws.onerror = () => {
          if (cancelled) return
          setWsStatus("error")
        }

        ws.onclose = () => {
          if (cancelled) return
          setWsStatus("error")
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000)
        }
      } catch {
        setWsStatus("error")
      }
    }

    connect()

    return () => {
      cancelled = true
      clearTimeout(reconnectTimeout)
      try {
        ws?.close()
      } catch {
        // ignore
      }
    }
  }, [qc])

  React.useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1)
  }, [search, status, priority, assignee, sort])

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllOnPage() {
    const ids = tasks.map((t) => t.id)
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  async function handleBulkReassign() {
    const ids = Array.from(selected)
    if (!ids.length || !bulkAssignee.trim()) {
      toast.error("Please select tasks and enter an assignee")
      return
    }
    await bulkAssign.mutateAsync({ taskIds: ids, newAssigneeId: bulkAssignee.trim() })
  }

  async function handleBulkMarkComplete() {
    const ids = Array.from(selected)
    if (!ids.length) return
    await bulkComplete.mutateAsync(ids)
  }

  function exportCsv() {
    const rows = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignee: t.assignedTo || "",
      dueDate: t.dueDate ?? "",
      createdAt: t.createdAt ?? "",
    }))

    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `work-queue-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Queue</h1>
          <p className="text-neutral-600 mt-1">
            Search, filter, and manage tasks. Live updates:{" "}
            <span
              className={cn(
                "font-medium",
                wsStatus === "connected"
                  ? "text-emerald-700"
                  : wsStatus === "disabled"
                    ? "text-neutral-600"
                    : wsStatus === "error"
                      ? "text-red-700"
                      : "text-amber-700"
              )}
            >
              {wsStatus}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!tasks.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title/description…"
                className="sm:w-80"
              />

              <div className="flex flex-wrap gap-2">
                <select
                  className="h-9 rounded-md border bg-white px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  aria-label="Filter by status"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  className="h-9 rounded-md border bg-white px-3 text-sm"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityFilter)}
                  aria-label="Filter by priority"
                >
                  <option value="all">All priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  className="h-9 rounded-md border bg-white px-3 text-sm"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  aria-label="Filter by assignee"
                >
                  <option value="all">All assignees</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSort((s) => (s === "dueAsc" ? "dueDesc" : "dueAsc"))}
              >
                <ArrowUpDown className="h-4 w-4" />
                Due
              </Button>
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort tasks"
              >
                <option value="dueAsc">Due (soonest)</option>
                <option value="dueDesc">Due (latest)</option>
                <option value="priority">Priority</option>
                <option value="createdAsc">Created (oldest)</option>
                <option value="createdDesc">Created (newest)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between rounded-lg border bg-neutral-50 px-3 py-2">
            <div className="text-sm text-neutral-700">
              <span className="font-medium">{selected.size}</span> selected •{" "}
              <span className="text-neutral-600">{total}</span> total tasks
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkComplete}
                disabled={!selected.size || bulkComplete.isPending}
              >
                <Check className="h-4 w-4" />
                Mark complete
              </Button>

              <div className="flex items-center gap-2">
                <Input
                  value={bulkAssignee}
                  onChange={(e) => setBulkAssignee(e.target.value)}
                  placeholder="PM ID to assign…"
                  className="h-9 w-48"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkReassign}
                  disabled={!selected.size || !bulkAssignee.trim() || bulkAssign.isPending}
                >
                  <UserRoundPen className="h-4 w-4" />
                  Reassign
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isFetching && !data ? (
        <div className="text-center py-10 text-neutral-600">Loading tasks...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    <input
                      type="checkbox"
                      checked={tasks.length > 0 && tasks.every((t) => selected.has(t.id))}
                      onChange={toggleSelectAllOnPage}
                      aria-label="Select all tasks on this page"
                    />
                  </th>
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Priority</th>
                  <th className="text-left font-medium px-4 py-3">Due date</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Assignee</th>
                  <th className="text-left font-medium px-4 py-3">Created</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length ? (
                  tasks.map((t) => {
                    const due = parseDate(t.dueDate)
                    const created = parseDate(t.createdAt)
                    const isOverdue = Boolean(due && now !== null && due.getTime() < now && t.status !== "completed")

                    return (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(t.id)}
                            onChange={() => toggleSelected(t.id)}
                            aria-label={`Select task ${t.title}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{t.title}</div>
                          {t.description ? (
                            <div className="text-xs text-neutral-600 line-clamp-1 mt-0.5">{t.description}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge priority={t.priority} />
                        </td>
                        <td className={cn("px-4 py-3", isOverdue && "text-red-700 font-medium")}>
                          {due ? format(due, "MMM dd, yyyy") : <span className="text-neutral-500">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs rounded-full border px-2 py-1 bg-neutral-50 text-neutral-700">
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{t.assignedTo || "—"}</td>
                        <td className="px-4 py-3 text-neutral-700">
                          {created ? format(created, "MMM dd, yyyy") : <span className="text-neutral-500">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => complete.mutate(t.id)}
                              disabled={complete.isPending || t.status === "completed"}
                            >
                              <Check className="h-4 w-4" />
                              {t.status === "completed" ? "Done" : "Complete"}
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/work-queue/${t.id}`}>Edit</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                      No tasks match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-600">
              Showing <span className="font-medium text-neutral-900">{total ? (page - 1) * pageSize + 1 : 0}</span>–
              <span className="font-medium text-neutral-900">{Math.min(page * pageSize, total)}</span> of{" "}
              <span className="font-medium text-neutral-900">{total}</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                aria-label="Rows per page"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                First
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </Button>
              <div className="text-sm text-neutral-700 whitespace-nowrap">
                Page <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                Last
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
