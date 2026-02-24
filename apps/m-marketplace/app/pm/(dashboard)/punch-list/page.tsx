"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Search,
  User,
  Wrench,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { usePunchList } from "@pm/hooks/usePunchList"

type PunchStatus = "open" | "in-progress" | "completed" | "verified"
type PunchPriority = "low" | "medium" | "high"

interface PunchItem {
  id: string
  number: string
  title: string
  location: string
  trade: string
  assignee: string
  status: PunchStatus
  priority: PunchPriority
  photoCount: number
  createdDate: string
  dueDate: string
  description: string
}

const STATUS_STYLES: Record<PunchStatus, string> = {
  open: "bg-red-100 text-red-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
}

const STATUS_LABELS: Record<PunchStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  completed: "Completed",
  verified: "Verified",
}

const PRIORITY_STYLES: Record<PunchPriority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
}

export default function PunchListPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [tradeFilter, setTradeFilter] = React.useState<string>("all")
  const [locationFilter, setLocationFilter] = React.useState<string>("all")

  const { data, isLoading } = usePunchList({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  })
  const items: PunchItem[] = data?.items ?? []

  const TRADES = React.useMemo(() => [...new Set(items.map((i) => i.trade))].sort(), [items])
  const LOCATIONS = React.useMemo(() => [...new Set(items.map((i) => i.location.split(" - ")[0]))].sort(), [items])

  const filtered = React.useMemo(() => {
    return items.filter((item) => {
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false
      if (tradeFilter !== "all" && item.trade !== tradeFilter) return false
      if (locationFilter !== "all" && !item.location.startsWith(locationFilter)) return false
      return true
    })
  }, [items, priorityFilter, tradeFilter, locationFilter])

  const stats = React.useMemo(() => {
    const now = new Date()
    return {
      total: items.length,
      open: items.filter((i) => i.status === "open").length,
      inProgress: items.filter((i) => i.status === "in-progress").length,
      completed: items.filter((i) => i.status === "completed" || i.status === "verified").length,
      overdue: items.filter(
        (i) => new Date(i.dueDate) < now && i.status !== "completed" && i.status !== "verified"
      ).length,
    }
  }, [items])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Punch List</h1>
          <p className="text-gray-500 mt-1">Track and resolve punch list items</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Items", value: stats.total, icon: Circle, color: "text-blue-600 bg-blue-50" },
          { label: "Open", value: stats.open, icon: AlertCircle, color: "text-red-600 bg-red-50" },
          { label: "In Progress", value: stats.inProgress, icon: Loader2, color: "text-yellow-600 bg-yellow-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Overdue", value: stats.overdue, icon: Clock, color: "text-orange-600 bg-orange-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by ID, title, location, trade, or assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm bg-white"
              >
                <option value="all">All Statuses</option>
                {(Object.keys(STATUS_LABELS) as PunchStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm bg-white"
              >
                <option value="all">All Trades</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm bg-white"
              >
                <option value="all">All Locations</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Link key={item.id} href={`/pm/punch-list/${item.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-blue-600">{item.number}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_STYLES[item.priority])}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                    </span>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[item.status])}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.title}</h3>

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wrench size={12} />
                    <span>{item.trade}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>{item.assignee}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    {item.photoCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera size={12} />
                        {item.photoCount}
                      </span>
                    )}
                    <span>
                      Created{" "}
                      {new Date(item.createdDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <span
                    className={cn(
                      new Date(item.dueDate) < new Date() &&
                        item.status !== "completed" &&
                        item.status !== "verified"
                        ? "text-red-500 font-medium"
                        : ""
                    )}
                  >
                    Due{" "}
                    {new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Circle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No punch list items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

