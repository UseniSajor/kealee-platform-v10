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
import { cn } from "@/lib/utils"

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

const MOCK_PUNCH_ITEMS: PunchItem[] = [
  {
    id: "1", number: "PI-001", title: "Drywall touch-up needed at seam",
    location: "Unit 302 - Kitchen", trade: "Drywall", assignee: "Mike Torres",
    status: "open", priority: "medium", photoCount: 3, createdDate: "2026-02-03", dueDate: "2026-02-14",
    description: "Visible seam joint cracking along the kitchen ceiling near the range hood area.",
  },
  {
    id: "2", number: "PI-002", title: "Outlet not working - east wall",
    location: "Unit 305 - Living Room", trade: "Electrical", assignee: "Spark Electric",
    status: "open", priority: "high", photoCount: 1, createdDate: "2026-02-04", dueDate: "2026-02-12",
    description: "Duplex outlet on east wall is completely dead. No power on either receptacle.",
  },
  {
    id: "3", number: "PI-003", title: "Paint scuff on hallway wall",
    location: "3rd Floor - Corridor", trade: "Paint", assignee: "ProCoat Painting",
    status: "in-progress", priority: "low", photoCount: 2, createdDate: "2026-02-01", dueDate: "2026-02-15",
    description: "Large scuff mark approximately 4 feet from floor level on north corridor wall.",
  },
  {
    id: "4", number: "PI-004", title: "Cabinet door alignment off",
    location: "Unit 401 - Kitchen", trade: "Carpentry", assignee: "Custom Cabinets LLC",
    status: "open", priority: "medium", photoCount: 4, createdDate: "2026-02-05", dueDate: "2026-02-18",
    description: "Upper cabinet doors on the south wall are misaligned. Gap is uneven - wider at top than bottom.",
  },
  {
    id: "5", number: "PI-005", title: "Grout missing between floor tiles",
    location: "Unit 302 - Bathroom", trade: "Tile", assignee: "Precision Tile Co",
    status: "in-progress", priority: "high", photoCount: 2, createdDate: "2026-01-30", dueDate: "2026-02-10",
    description: "Multiple grout lines missing in the master bathroom floor near the shower transition.",
  },
  {
    id: "6", number: "PI-006", title: "Door hardware loose on entry",
    location: "Unit 410 - Entry", trade: "Hardware", assignee: "Mike Torres",
    status: "completed", priority: "medium", photoCount: 1, createdDate: "2026-01-28", dueDate: "2026-02-08",
    description: "Lever handle on unit entry door is loose and wobbles. Screws need tightening or backing plate replaced.",
  },
  {
    id: "7", number: "PI-007", title: "HVAC register not flush with ceiling",
    location: "Unit 305 - Bedroom 2", trade: "HVAC", assignee: "Climate Control Co",
    status: "open", priority: "low", photoCount: 1, createdDate: "2026-02-06", dueDate: "2026-02-20",
    description: "Supply register in bedroom 2 is protruding about 1/4 inch below the ceiling plane.",
  },
  {
    id: "8", number: "PI-008", title: "Baseboard gap at corner joint",
    location: "Unit 401 - Living Room", trade: "Carpentry", assignee: "Custom Cabinets LLC",
    status: "verified", priority: "low", photoCount: 2, createdDate: "2026-01-25", dueDate: "2026-02-05",
    description: "Baseboard molding has visible gap at inside corner joint on west wall. Needs caulk and touch-up.",
  },
  {
    id: "9", number: "PI-009", title: "Slow drain in kitchen sink",
    location: "Unit 308 - Kitchen", trade: "Plumbing", assignee: "Valley Plumbing",
    status: "open", priority: "high", photoCount: 0, createdDate: "2026-02-07", dueDate: "2026-02-13",
    description: "Kitchen sink drains very slowly. Takes over 30 seconds for water to clear. Possible trap issue.",
  },
  {
    id: "10", number: "PI-010", title: "Window screen torn",
    location: "Unit 302 - Bedroom 1", trade: "Glazing", assignee: "ClearView Windows",
    status: "in-progress", priority: "low", photoCount: 1, createdDate: "2026-02-02", dueDate: "2026-02-16",
    description: "Screen on bedroom window has a 3-inch tear in lower right corner. Needs replacement screen.",
  },
  {
    id: "11", number: "PI-011", title: "Ceiling light fixture flickering",
    location: "Unit 410 - Dining Area", trade: "Electrical", assignee: "Spark Electric",
    status: "completed", priority: "medium", photoCount: 0, createdDate: "2026-02-01", dueDate: "2026-02-10",
    description: "Recessed LED light fixture in dining area flickers intermittently. May be faulty driver or loose connection.",
  },
  {
    id: "12", number: "PI-012", title: "Caulking gap around bathtub",
    location: "Unit 305 - Bathroom", trade: "Plumbing", assignee: "Valley Plumbing",
    status: "open", priority: "medium", photoCount: 3, createdDate: "2026-02-08", dueDate: "2026-02-19",
    description: "Caulking bead is missing along the left side of the bathtub where it meets the tile surround.",
  },
]

const TRADES = [...new Set(MOCK_PUNCH_ITEMS.map((i) => i.trade))].sort()
const LOCATIONS = [...new Set(MOCK_PUNCH_ITEMS.map((i) => i.location.split(" - ")[0]))].sort()

export default function PunchListPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [tradeFilter, setTradeFilter] = React.useState<string>("all")
  const [locationFilter, setLocationFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return MOCK_PUNCH_ITEMS.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false
      if (tradeFilter !== "all" && item.trade !== tradeFilter) return false
      if (locationFilter !== "all" && !item.location.startsWith(locationFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          item.number.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.trade.toLowerCase().includes(q) ||
          item.assignee.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, statusFilter, priorityFilter, tradeFilter, locationFilter])

  const stats = React.useMemo(() => {
    const now = new Date()
    return {
      total: MOCK_PUNCH_ITEMS.length,
      open: MOCK_PUNCH_ITEMS.filter((i) => i.status === "open").length,
      inProgress: MOCK_PUNCH_ITEMS.filter((i) => i.status === "in-progress").length,
      completed: MOCK_PUNCH_ITEMS.filter((i) => i.status === "completed" || i.status === "verified").length,
      overdue: MOCK_PUNCH_ITEMS.filter(
        (i) => new Date(i.dueDate) < now && i.status !== "completed" && i.status !== "verified"
      ).length,
    }
  }, [])

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
          <Link key={item.id} href={`/punch-list/${item.id}`}>
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
