"use client"

import * as React from "react"
import {
  DollarSign,
  Tag,
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
} from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category =
  | "Labor"
  | "Material"
  | "Equipment"
  | "Subcontract"
  | "Service"
  | "Assembly"
  | "Flat Rate"

type PriceBookItem = {
  id: string
  name: string
  sku: string
  category: Category
  unit: string
  unitPrice: number
  costPrice: number
  trade: string
  tags: string[]
  active: boolean
}

// ---------------------------------------------------------------------------
// Category badge colours
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<Category, string> = {
  Labor: "bg-blue-50 text-blue-700 border-blue-200",
  Material: "bg-purple-50 text-purple-700 border-purple-200",
  Equipment: "bg-amber-50 text-amber-700 border-amber-200",
  Subcontract: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Service: "bg-green-50 text-green-700 border-green-200",
  Assembly: "bg-orange-50 text-orange-700 border-orange-200",
  "Flat Rate": "bg-pink-50 text-pink-700 border-pink-200",
}

const CATEGORIES: Category[] = [
  "Labor",
  "Material",
  "Equipment",
  "Subcontract",
  "Service",
  "Assembly",
  "Flat Rate",
]

// ---------------------------------------------------------------------------
// Mock data (15-20 items)
// ---------------------------------------------------------------------------

const MOCK_ITEMS: PriceBookItem[] = [
  { id: "pb-01", name: "Electrician Labor", sku: "LBR-ELEC-001", category: "Labor", unit: "hr", unitPrice: 95.00, costPrice: 68.00, trade: "Electrical", tags: ["journeyman", "licensed"], active: true },
  { id: "pb-02", name: "Plumber Labor", sku: "LBR-PLMB-001", category: "Labor", unit: "hr", unitPrice: 105.00, costPrice: 75.00, trade: "Plumbing", tags: ["journeyman", "licensed"], active: true },
  { id: "pb-03", name: "General Labor", sku: "LBR-GEN-001", category: "Labor", unit: "hr", unitPrice: 55.00, costPrice: 38.00, trade: "General", tags: ["helper"], active: true },
  { id: "pb-04", name: "Carpenter Labor", sku: "LBR-CARP-001", category: "Labor", unit: "hr", unitPrice: 85.00, costPrice: 60.00, trade: "Carpentry", tags: ["journeyman"], active: true },
  { id: "pb-05", name: "Copper Pipe 3/4\"", sku: "MAT-PIPE-034", category: "Material", unit: "lf", unitPrice: 8.50, costPrice: 5.75, trade: "Plumbing", tags: ["copper", "supply"], active: true },
  { id: "pb-06", name: "Romex 12/2 Wire", sku: "MAT-WIRE-122", category: "Material", unit: "lf", unitPrice: 1.85, costPrice: 1.20, trade: "Electrical", tags: ["NM-B", "residential"], active: true },
  { id: "pb-07", name: "2x4 Lumber 8ft", sku: "MAT-LBR-248", category: "Material", unit: "ea", unitPrice: 7.25, costPrice: 4.90, trade: "Carpentry", tags: ["framing", "SPF"], active: true },
  { id: "pb-08", name: "Concrete 3000psi", sku: "MAT-CONC-300", category: "Material", unit: "cy", unitPrice: 185.00, costPrice: 140.00, trade: "Concrete", tags: ["ready-mix"], active: true },
  { id: "pb-09", name: "HVAC Ductwork", sku: "MAT-DUCT-001", category: "Material", unit: "lf", unitPrice: 22.50, costPrice: 15.00, trade: "HVAC", tags: ["galvanized", "rectangular"], active: true },
  { id: "pb-10", name: "Mini Excavator Rental", sku: "EQP-EXCV-001", category: "Equipment", unit: "day", unitPrice: 450.00, costPrice: 320.00, trade: "Sitework", tags: ["rental", "compact"], active: true },
  { id: "pb-11", name: "Concrete Pump", sku: "EQP-PUMP-001", category: "Equipment", unit: "day", unitPrice: 1200.00, costPrice: 850.00, trade: "Concrete", tags: ["rental", "boom"], active: true },
  { id: "pb-12", name: "Drywall Hanging & Finishing", sku: "SUB-DRYW-001", category: "Subcontract", unit: "sf", unitPrice: 3.25, costPrice: 2.40, trade: "Drywall", tags: ["level-4 finish"], active: true },
  { id: "pb-13", name: "Interior Painting", sku: "SVC-PINT-001", category: "Service", unit: "sf", unitPrice: 4.50, costPrice: 2.80, trade: "Painting", tags: ["2-coat", "latex"], active: true },
  { id: "pb-14", name: "Exterior Painting", sku: "SVC-PEXT-001", category: "Service", unit: "sf", unitPrice: 5.75, costPrice: 3.50, trade: "Painting", tags: ["2-coat", "acrylic"], active: false },
  { id: "pb-15", name: "Bathroom Rough-In Assembly", sku: "ASM-BATH-001", category: "Assembly", unit: "ea", unitPrice: 2850.00, costPrice: 2100.00, trade: "Plumbing", tags: ["rough-in", "residential"], active: true },
  { id: "pb-16", name: "Kitchen Sink Install", sku: "FLT-KSINK-001", category: "Flat Rate", unit: "ea", unitPrice: 475.00, costPrice: 310.00, trade: "Plumbing", tags: ["undermount", "residential"], active: true },
  { id: "pb-17", name: "Panel Upgrade 200A", sku: "FLT-PANEL-200", category: "Flat Rate", unit: "ea", unitPrice: 3200.00, costPrice: 2250.00, trade: "Electrical", tags: ["service upgrade"], active: true },
  { id: "pb-18", name: "Roofing - Asphalt Shingles", sku: "SVC-ROOF-001", category: "Service", unit: "sq", unitPrice: 425.00, costPrice: 290.00, trade: "Roofing", tags: ["architectural", "30-yr"], active: true },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`
}

function calcMarkup(unitPrice: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return ((unitPrice - costPrice) / costPrice) * 100
}

function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => {
    const needs = /[",\n]/.test(v)
    const escaped = v.replaceAll('"', '""')
    return needs ? `"${escaped}"` : escaped
  }
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PriceBookPage() {
  const [items, setItems] = React.useState<PriceBookItem[]>(MOCK_ITEMS)
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<"All" | Category>("All")
  const [tradeFilter, setTradeFilter] = React.useState<string>("All")
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all")

  // Unique trades from items
  const trades = React.useMemo(() => {
    const s = new Set<string>()
    for (const item of items) s.add(item.trade)
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [items])

  // Filtered items
  const filtered = React.useMemo(() => {
    let result = items

    // Search by name or SKU
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q)
      )
    }

    // Category
    if (categoryFilter !== "All") {
      result = result.filter((item) => item.category === categoryFilter)
    }

    // Trade
    if (tradeFilter !== "All") {
      result = result.filter((item) => item.trade === tradeFilter)
    }

    // Active / Inactive
    if (activeFilter === "active") {
      result = result.filter((item) => item.active)
    } else if (activeFilter === "inactive") {
      result = result.filter((item) => !item.active)
    }

    return result
  }, [items, search, categoryFilter, tradeFilter, activeFilter])

  // Stats
  const stats = React.useMemo(() => {
    const total = items.length
    const active = items.filter((i) => i.active).length
    const categories = new Set(items.map((i) => i.category)).size
    const markups = items.map((i) => calcMarkup(i.unitPrice, i.costPrice))
    const avgMarkup = markups.length
      ? markups.reduce((sum, m) => sum + m, 0) / markups.length
      : 0
    return { total, active, categories, avgMarkup }
  }, [items])

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function exportCsv() {
    const rows = filtered.map((item) => ({
      name: item.name,
      sku: item.sku,
      category: item.category,
      unit: item.unit,
      unitPrice: item.unitPrice.toFixed(2),
      costPrice: item.costPrice.toFixed(2),
      markupPct: calcMarkup(item.unitPrice, item.costPrice).toFixed(1),
      trade: item.trade,
      tags: item.tags.join("; "),
      active: item.active ? "Yes" : "No",
    }))
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `price-book-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Book</h1>
          <p className="text-neutral-600 mt-1">
            Manage your catalog of services, materials, and flat-rate pricing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-neutral-500" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Active Items</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-500" />
              <span className="text-2xl font-bold">{stats.categories}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Avg Markup %</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats.avgMarkup.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as "All" | Category)}
                aria-label="Filter by category"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                aria-label="Filter by trade"
              >
                <option value="All">All Trades</option>
                {trades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>

              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-600">
            Showing <span className="font-medium text-neutral-900">{filtered.length}</span> of{" "}
            <span className="font-medium text-neutral-900">{items.length}</span> items
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Name</th>
              <th className="text-left font-medium px-4 py-3">SKU</th>
              <th className="text-left font-medium px-4 py-3">Category</th>
              <th className="text-left font-medium px-4 py-3">Unit</th>
              <th className="text-right font-medium px-4 py-3">Unit Price</th>
              <th className="text-right font-medium px-4 py-3">Cost Price</th>
              <th className="text-right font-medium px-4 py-3">Markup %</th>
              <th className="text-left font-medium px-4 py-3">Trade</th>
              <th className="text-left font-medium px-4 py-3">Tags</th>
              <th className="text-left font-medium px-4 py-3">Active</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((item) => {
                const markup = calcMarkup(item.unitPrice, item.costPrice)
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-neutral-900">{item.name}</td>
                    <td className="px-4 py-3 text-neutral-600 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          CATEGORY_COLORS[item.category]
                        )}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{item.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-900 font-medium">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-600">
                      {formatPrice(item.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={cn(
                          "font-medium",
                          markup >= 40
                            ? "text-emerald-700"
                            : markup >= 25
                              ? "text-amber-700"
                              : "text-red-700"
                        )}
                      >
                        {markup.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{item.trade}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          item.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-50 text-neutral-500 border-neutral-200"
                        )}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-neutral-600">
                  No items match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
