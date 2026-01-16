"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Pencil, ArrowUpDown } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import type { PMTask } from "@/lib/types"
import { api } from "@/lib/api-client"
import { Badge } from "@/components/badge"

type SortKey = "dueAsc" | "dueDesc" | "priority" | "status"

function parseDue(dueDate?: string | null) {
  if (!dueDate) return null
  const d = new Date(dueDate)
  return Number.isNaN(d.getTime()) ? null : d
}

function priorityRank(p: PMTask["priority"]) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2
}

export function WorkQueueTable({ tasks }: { tasks: PMTask[] }) {
  const qc = useQueryClient()
  const [now, setNow] = React.useState<number | null>(null)
  const [q, setQ] = React.useState("")
  const [priority, setPriority] = React.useState<"all" | PMTask["priority"]>("all")
  const [status, setStatus] = React.useState<"all" | PMTask["status"]>("all")
  const [sort, setSort] = React.useState<SortKey>("dueAsc")

  React.useEffect(() => {
    setNow(Date.now())
  }, [])

  const complete = useMutation({
    mutationFn: (taskId: string) => api.completeTask(taskId, { completedAt: new Date().toISOString() }),
    onSuccess: async (_data, taskId) => {
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
      await qc.invalidateQueries({ queryKey: ["pm-task", taskId] })
    },
  })

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase()
    return tasks.filter((t) => {
      if (priority !== "all" && t.priority !== priority) return false
      if (status !== "all" && t.status !== status) return false
      if (!query) return true
      return (t.title ?? "").toLowerCase().includes(query) || (t.description ?? "").toLowerCase().includes(query)
    })
  }, [tasks, q, priority, status])

  const sorted = React.useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority)
      if (sort === "status") return a.status.localeCompare(b.status)

      const da = parseDue(a.dueDate)
      const db = parseDue(b.dueDate)
      const va = da ? da.getTime() : Number.POSITIVE_INFINITY
      const vb = db ? db.getTime() : Number.POSITIVE_INFINITY

      return sort === "dueAsc" ? va - vb : vb - va
    })
    return copy
  }, [filtered, sort])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter tasks…"
            className="sm:w-72"
          />

          <div className="flex gap-2">
            <select
              className="h-9 rounded-md border bg-white px-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "all" | PMTask["priority"])}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              className="h-9 rounded-md border bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | PMTask["status"])}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
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
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Title</th>
              <th className="text-left font-medium px-4 py-3">Priority</th>
              <th className="text-left font-medium px-4 py-3">Due date</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Assignee</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((t) => {
                const due = parseDue(t.dueDate)
                const isOverdue = Boolean(due && now !== null && due.getTime() < now && t.status !== "completed")

                return (
                  <tr key={t.id} className="border-t">
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
                          <Link href={`/work-queue/${t.id}`}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

