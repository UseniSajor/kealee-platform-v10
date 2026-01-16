"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowUpDown, Check, Download, RefreshCw, Trash2, UserRoundPen } from "lucide-react"

import { api } from "@/lib/api-client"
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
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(() => new Set())
  const [overrideAssignedTo, setOverrideAssignedTo] = React.useState<Record<string, string>>({})

  // Pagination
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Real-time (placeholder)
  const [wsStatus, setWsStatus] = React.useState<"disabled" | "connecting" | "connected" | "error">("disabled")

  React.useEffect(() => {
    setNow(Date.now())
  }, [])

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["pm-tasks"],
    queryFn: () => api.getMyTasks(),
  })

  const tasksRaw = React.useMemo(() => (data?.tasks ?? []) as PMTask[], [data?.tasks])
  const tasks = React.useMemo(() => {
    return tasksRaw
      .filter((t) => !deletedIds.has(t.id))
      .map((t) => (overrideAssignedTo[t.id] ? { ...t, assignedTo: overrideAssignedTo[t.id]! } : t))
  }, [tasksRaw, deletedIds, overrideAssignedTo])

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
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
      await qc.invalidateQueries({ queryKey: ["pm-task", taskId] })
    },
  })

  // Websocket placeholder: when NEXT_PUBLIC_PM_WS_URL is set, we connect and refresh on messages.
  React.useEffect(() => {
    const url = process.env.NEXT_PUBLIC_PM_WS_URL
    if (!url) {
      setWsStatus("disabled")
      return
    }

    let ws: WebSocket | null = null
    let cancelled = false

    try {
      setWsStatus("connecting")
      ws = new WebSocket(url)
      ws.onopen = () => {
        if (cancelled) return
        setWsStatus("connected")
      }
      ws.onmessage = async (event) => {
        if (cancelled) return
        try {
          const msg = JSON.parse(String(event.data)) as { type?: string }
          if (msg.type === "pm_tasks_updated" || msg.type === "pm_tasks_changed") {
            await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
          }
        } catch {
          // ignore non-JSON messages in placeholder mode
        }
      }
      ws.onerror = () => {
        if (cancelled) return
        setWsStatus("error")
      }
    } catch {
      setWsStatus("error")
    }

    return () => {
      cancelled = true
      try {
        ws?.close()
      } catch {
        // ignore
      }
    }
  }, [qc])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false
      if (priority !== "all" && t.priority !== priority) return false
      if (assignee !== "all" && t.assignedTo !== assignee) return false
      if (!q) return true
      return (t.title ?? "").toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
    })
  }, [tasks, search, status, priority, assignee])

  const sorted = React.useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority)

      if (sort === "createdAsc" || sort === "createdDesc") {
        const da = parseDate(a.createdAt)?.getTime() ?? 0
        const db = parseDate(b.createdAt)?.getTime() ?? 0
        return sort === "createdAsc" ? da - db : db - da
      }

      const da = parseDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY
      const db = parseDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY
      return sort === "dueAsc" ? da - db : db - da
    })
    return copy
  }, [filtered, sort])

  React.useEffect(() => {
    // Reset pagination when controls change
    setPage(1)
  }, [search, status, priority, assignee, sort])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const end = start + pageSize
  const pageItems = sorted.slice(start, end)

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllOnPage() {
    const ids = pageItems.map((t) => t.id)
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

  async function bulkMarkComplete() {
    const ids = Array.from(selected)
    if (!ids.length) return
    await Promise.all(ids.map((id) => complete.mutateAsync(id).catch(() => null)))
    setSelected(new Set())
  }

  function bulkReassignLocal() {
    const ids = Array.from(selected)
    if (!ids.length || !bulkAssignee.trim()) return
    const to = bulkAssignee.trim()
    setOverrideAssignedTo((prev) => {
      const next = { ...prev }
      for (const id of ids) next[id] = to
      return next
    })
    setSelected(new Set())
    setBulkAssignee("")
  }

  function bulkDeleteLocal() {
    const ids = Array.from(selected)
    if (!ids.length) return
    setDeletedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      return next
    })
    setSelected(new Set())
  }

  function exportCsv() {
    const rows = sorted.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignee: t.assignedTo,
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
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!sorted.length}>
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
              <span className="text-neutral-600">{total}</span> shown (filtered)
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={bulkMarkComplete}
                disabled={!selected.size || complete.isPending}
              >
                <Check className="h-4 w-4" />
                Mark complete
              </Button>

              <div className="flex items-center gap-2">
                <Input
                  value={bulkAssignee}
                  onChange={(e) => setBulkAssignee(e.target.value)}
                  placeholder="Reassign to… (placeholder)"
                  className="h-9 w-48"
                />
                <Button size="sm" variant="outline" onClick={bulkReassignLocal} disabled={!selected.size}>
                  <UserRoundPen className="h-4 w-4" />
                  Reassign
                </Button>
              </div>

              <Button size="sm" variant="destructive" onClick={bulkDeleteLocal} disabled={!selected.size}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[1050px] w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                <input
                  type="checkbox"
                  checked={pageItems.length > 0 && pageItems.every((t) => selected.has(t.id))}
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
            {pageItems.length ? (
              pageItems.map((t) => {
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
          Showing <span className="font-medium text-neutral-900">{total ? start + 1 : 0}</span>–
          <span className="font-medium text-neutral-900">{Math.min(end, total)}</span> of{" "}
          <span className="font-medium text-neutral-900">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border bg-white px-3 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage === 1}>
            First
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
            Prev
          </Button>
          <div className="text-sm text-neutral-700 whitespace-nowrap">
            Page <span className="font-medium">{safePage}</span> / <span className="font-medium">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
            Last
          </Button>
        </div>
      </div>
    </div>
  )
}

