"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Tag,
} from "lucide-react"
import { useSelections } from "@/hooks/useSelections"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type SelectionStatus = "pending" | "selected" | "approved" | "ordered" | "installed"
type CategoryType = "Flooring" | "Countertops" | "Fixtures" | "Lighting" | "Appliances" | "Cabinets" | "Paint" | "Tile"

interface Selection {
  id: string
  category: CategoryType
  itemName: string
  selectedOption: string | null
  allowanceBudget: number
  selectedCost: number | null
  status: SelectionStatus
  dueDate: string
  project: string
  room: string
}

const STATUS_STYLES: Record<SelectionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  selected: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  ordered: "bg-purple-100 text-purple-800",
  installed: "bg-emerald-100 text-emerald-800",
}

const CATEGORY_COLORS: Record<CategoryType, string> = {
  Flooring: "bg-amber-100 text-amber-800",
  Countertops: "bg-stone-100 text-stone-800",
  Fixtures: "bg-cyan-100 text-cyan-800",
  Lighting: "bg-yellow-100 text-yellow-800",
  Appliances: "bg-slate-100 text-slate-800",
  Cabinets: "bg-orange-100 text-orange-800",
  Paint: "bg-pink-100 text-pink-800",
  Tile: "bg-indigo-100 text-indigo-800",
}

const CATEGORIES: ("All" | CategoryType)[] = ["All", "Flooring", "Countertops", "Fixtures", "Lighting", "Appliances", "Cabinets", "Paint", "Tile"]

function formatCurrency(n: number) {
  return "$" + n.toLocaleString()
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function SelectionsPage() {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<"All" | CategoryType>("All")

  const { data, isLoading } = useSelections({ category: activeCategory !== "All" ? activeCategory : undefined, search: search || undefined })
  const selections = data?.items ?? []

  if (isLoading) return (<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>)

  const filtered = selections

  const budgetSummary = (() => {
    const totalAllowance = selections.reduce((sum, s) => sum + s.allowanceBudget, 0)
    const totalSelected = selections.filter((s) => s.selectedCost !== null).reduce((sum, s) => sum + (s.selectedCost ?? 0), 0)
    const pendingBudget = selections.filter((s) => s.selectedCost === null).reduce((sum, s) => sum + s.allowanceBudget, 0)
    const variance = totalSelected - (totalAllowance - pendingBudget)
    return { totalAllowance, totalSelected, pendingBudget, variance }
  })()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Selections & Allowances</h1>
          <p className="text-gray-500 mt-1">Track material selections and allowance budgets</p>
        </div>
        <Button className="gap-2"><Plus size={16} />Add Selection</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Budget Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.totalAllowance)}</p>
              <p className="text-xs text-gray-500 mt-1">Total Allowance Budget</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(budgetSummary.totalSelected)}</p>
              <p className="text-xs text-gray-500 mt-1">Selected Cost (to date)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-700">{formatCurrency(budgetSummary.pendingBudget)}</p>
              <p className="text-xs text-gray-500 mt-1">Pending Selections</p>
            </div>
            <div className={cn("text-center p-3 rounded-lg", budgetSummary.variance > 0 ? "bg-red-50" : "bg-green-50")}>
              <p className={cn("text-2xl font-bold", budgetSummary.variance > 0 ? "text-red-700" : "text-green-700")}>
                {budgetSummary.variance > 0 ? "+" : ""}{formatCurrency(Math.abs(budgetSummary.variance))}
              </p>
              <p className="text-xs text-gray-500 mt-1">Variance (Selected Items)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search selections..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sel) => {
          const variance = sel.selectedCost !== null ? sel.selectedCost - sel.allowanceBudget : null
          return (
            <Link key={sel.id} href={`/selections/${sel.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CATEGORY_COLORS[sel.category])}>{sel.category}</span>
                      <h3 className="text-sm font-semibold text-gray-900 mt-2">{sel.itemName}</h3>
                      <p className="text-xs text-gray-500">{sel.room}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[sel.status])}>
                      {sel.status.charAt(0).toUpperCase() + sel.status.slice(1)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2.5 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Allowance:</span>
                      <span className="font-medium">{formatCurrency(sel.allowanceBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Selected:</span>
                      <span className="font-medium">{sel.selectedCost !== null ? formatCurrency(sel.selectedCost) : "---"}</span>
                    </div>
                    {variance !== null && (
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-gray-500">Variance:</span>
                        <span className={cn("font-medium flex items-center gap-0.5", variance > 0 ? "text-red-600" : variance < 0 ? "text-green-600" : "text-gray-600")}>
                          {variance > 0 ? <ArrowUp size={12} /> : variance < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                          {variance > 0 ? "+" : ""}{formatCurrency(Math.abs(variance))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{sel.selectedOption ?? "Pending Selection"}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />Due {formatDate(sel.dueDate)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
