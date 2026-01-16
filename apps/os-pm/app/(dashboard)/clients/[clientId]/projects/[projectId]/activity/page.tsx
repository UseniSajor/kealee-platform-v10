"use client"

import * as React from "react"
import { Filter, Search } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type ActivityType = "all" | "timeline" | "budget" | "permits" | "documents" | "photos" | "contractors" | "reports"

type ActivityItem = {
  id: string
  at: string
  type: Exclude<ActivityType, "all">
  actor: string
  message: string
}

export default function ProjectActivityPage({
  params,
}: {
  params: { clientId: string; projectId: string }
}) {
  const { clientId, projectId } = params

  const [type, setType] = React.useState<ActivityType>("all")
  const [actor, setActor] = React.useState<string>("all")
  const [query, setQuery] = React.useState<string>("")

  const items = React.useMemo<ActivityItem[]>(
    () => [
      { id: "a1", at: "2026-01-13 10:16", type: "permits", actor: "PM", message: "Updated permit status: submitted → in review." },
      { id: "a2", at: "2026-01-12 16:11", type: "budget", actor: "GC", message: "Invoice uploaded for framing crew ($12,000)." },
      { id: "a3", at: "2026-01-12 09:02", type: "timeline", actor: "PM", message: "Adjusted framing start date by +2 days." },
      { id: "a4", at: "2026-01-11 15:10", type: "photos", actor: "Field", message: "Uploaded 'Before - living room wall'." },
      { id: "a5", at: "2026-01-10 08:02", type: "reports", actor: "System", message: "Weekly progress report generated (scheduled)." },
      { id: "a6", at: "2026-01-09 09:22", type: "documents", actor: "PM", message: "Uploaded building permit submittal package." },
      { id: "a7", at: "2026-01-08 14:44", type: "contractors", actor: "PM", message: "Added BrightWire Electric to contractor directory." },
    ],
    []
  )

  const actors = React.useMemo(() => {
    const set = new Set(items.map((i) => i.actor))
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [items])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (type !== "all" && i.type !== type) return false
      if (actor !== "all" && i.actor !== actor) return false
      if (!q) return true
      return i.message.toLowerCase().includes(q) || i.actor.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
    })
  }, [items, type, actor, query])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activity…" className="pl-9 sm:w-72" />
          </div>
          <select
            className="h-9 rounded-md border bg-white px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="timeline">Timeline</option>
            <option value="budget">Budget</option>
            <option value="permits">Permits</option>
            <option value="documents">Documents</option>
            <option value="photos">Photos</option>
            <option value="contractors">Contractors</option>
            <option value="reports">Reports</option>
          </select>
          <select
            className="h-9 rounded-md border bg-white px-3 text-sm"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            aria-label="Filter by actor"
          >
            {actors.map((a) => (
              <option key={a} value={a}>
                {a === "all" ? "All actors" : a}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={() => alert("Advanced filters (placeholder)")}>
          <Filter className="h-4 w-4" />
          Advanced filters
        </Button>
      </div>

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Activity feed</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="rounded-xl border bg-white">
            <ul className="divide-y">
              {filtered.map((i) => (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-neutral-500">{i.at}</div>
                      <div className="mt-1 text-sm text-neutral-900">{i.message}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 font-medium",
                            i.type === "permits"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : i.type === "budget"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : i.type === "photos"
                                  ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                                  : i.type === "documents"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : i.type === "timeline"
                                      ? "bg-neutral-50 text-neutral-700 border-neutral-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {i.type}
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="font-medium text-neutral-900">{i.actor}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => alert("Open related item (placeholder)")}>
                      Open
                    </Button>
                  </div>
                </li>
              ))}
              {!filtered.length ? (
                <li className="px-4 py-10 text-center text-sm text-neutral-600">No activity matches your filters.</li>
              ) : null}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

