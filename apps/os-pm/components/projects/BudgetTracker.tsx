"use client"

import * as React from "react"
import { Download, FileUp, PiggyBank, Plus, Printer, Receipt, ShieldCheck, TrendingUp, TriangleAlert } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

export type BudgetCategory =
  | "Permits"
  | "Design"
  | "Materials"
  | "Labor"
  | "Subcontractors"
  | "Equipment"
  | "Fees"
  | "Contingency"
  | "Other"

export type BudgetItem = {
  id: string
  category: BudgetCategory
  description: string
  planned: number
  actual: number
  vendor?: string
  status?: "planned" | "committed" | "invoiced" | "paid"
  date?: string // ISO yyyy-mm-dd (optional)
}

export type CostDocument = {
  id: string
  filename: string
  uploadedAt: string // ISO
  sizeBytes: number
  itemId?: string
}

export type EscrowRelease = {
  id: string
  amount: number
  status: "requested" | "approved" | "released" | "rejected"
  requestedAt: string // ISO
  note?: string
}

export type BudgetTrackerProps = {
  projectId?: string
  initialItems?: BudgetItem[]
  initialDocs?: CostDocument[]
  initialEscrow?: {
    escrowBalance: number
    releases: EscrowRelease[]
  }
  className?: string
}

function formatMoney(n: number) {
  const v = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => {
    const needs = /[",\n]/.test(v)
    const escaped = v.replaceAll('"', '""')
    return needs ? `"${escaped}"` : escaped
  }
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n")
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeNumber(input: string) {
  const n = Number(input)
  return Number.isFinite(n) ? n : 0
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

function statusPill(status: BudgetItem["status"]) {
  if (!status) return null
  const cls =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "invoiced"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : status === "committed"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-neutral-50 text-neutral-700 border-neutral-200"
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", cls)}>{status}</span>
}

export function BudgetTracker({
  projectId,
  initialItems,
  initialDocs,
  initialEscrow,
  className,
}: BudgetTrackerProps) {
  const [items, setItems] = React.useState<BudgetItem[]>(
    initialItems ?? [
      {
        id: "b1",
        category: "Permits",
        description: "Building permit fees",
        planned: 7500,
        actual: 7800,
        vendor: "City",
        status: "paid",
        date: "2026-01-08",
      },
      {
        id: "b2",
        category: "Materials",
        description: "Framing lumber package",
        planned: 42000,
        actual: 0,
        vendor: "SupplyCo",
        status: "committed",
        date: "2026-01-14",
      },
      {
        id: "b3",
        category: "Labor",
        description: "Framing crew",
        planned: 28000,
        actual: 12000,
        vendor: "GC",
        status: "invoiced",
        date: "2026-01-20",
      },
      {
        id: "b4",
        category: "Contingency",
        description: "Owner contingency",
        planned: 15000,
        actual: 0,
        status: "planned",
      },
    ]
  )

  const [docs, setDocs] = React.useState<CostDocument[]>(
    initialDocs ?? [
      { id: "d1", filename: "permit-receipt.pdf", uploadedAt: new Date().toISOString(), sizeBytes: 248_992, itemId: "b1" },
    ]
  )

  const [escrow, setEscrow] = React.useState(
    initialEscrow ?? {
      escrowBalance: 120000,
      releases: [
        { id: "e1", amount: 18000, status: "released", requestedAt: "2026-01-12T14:00:00.000Z", note: "Initial permit + mobilization" },
        { id: "e2", amount: 12000, status: "approved", requestedAt: "2026-01-22T16:30:00.000Z", note: "Framing progress draw" },
      ] as EscrowRelease[],
    }
  )

  const [editId, setEditId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<BudgetItem | null>(null)

  const totals = React.useMemo(() => {
    const totalPlanned = items.reduce((s, i) => s + (i.planned ?? 0), 0)
    const totalActual = items.reduce((s, i) => s + (i.actual ?? 0), 0)
    const variance = totalActual - totalPlanned
    const remaining = Math.max(0, totalPlanned - totalActual)
    return { totalPlanned, totalActual, variance, remaining }
  }, [items])

  const breakdown = React.useMemo(() => {
    const map = new Map<BudgetCategory, { planned: number; actual: number }>()
    for (const i of items) {
      const prev = map.get(i.category) ?? { planned: 0, actual: 0 }
      map.set(i.category, { planned: prev.planned + i.planned, actual: prev.actual + i.actual })
    }
    const rows = [...map.entries()].map(([category, v]) => ({
      category,
      planned: v.planned,
      actual: v.actual,
      variance: v.actual - v.planned,
    }))
    rows.sort((a, b) => b.actual - a.actual)
    return rows
  }, [items])

  const forecast = React.useMemo(() => {
    // Simple placeholder forecast: actual to date + remaining planned + 10% risk factor when behind/over.
    const risk =
      totals.variance > 0 ? clamp(totals.variance / Math.max(1, totals.totalPlanned), 0, 0.25) : 0.05
    const eac = totals.totalActual + totals.remaining * (1 + risk)
    return { eac, riskPct: Math.round(risk * 100) }
  }, [totals])

  function startAdd() {
    const newItem: BudgetItem = {
      id: uid("b"),
      category: "Other",
      description: "",
      planned: 0,
      actual: 0,
      status: "planned",
      vendor: "",
      date: "",
    }
    setEditId(newItem.id)
    setDraft(newItem)
  }

  function startEdit(id: string) {
    const i = items.find((x) => x.id === id)
    if (!i) return
    setEditId(id)
    setDraft({ ...i })
  }

  function cancelEdit() {
    setEditId(null)
    setDraft(null)
  }

  function saveEdit() {
    if (!draft) return
    if (!draft.description.trim()) return
    setItems((prev) => {
      const exists = prev.some((x) => x.id === draft.id)
      if (!exists) return [draft, ...prev]
      return prev.map((x) => (x.id === draft.id ? draft : x))
    })
    setEditId(null)
    setDraft(null)
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id))
    setDocs((prev) => prev.filter((d) => d.itemId !== id))
    if (editId === id) cancelEdit()
  }

  async function uploadCostDocs(files: FileList | null, itemId?: string) {
    if (!files?.length) return
    const now = new Date().toISOString()
    const next: CostDocument[] = []
    for (const f of Array.from(files)) {
      next.push({ id: uid("doc"), filename: f.name, uploadedAt: now, sizeBytes: f.size, itemId })
    }
    setDocs((prev) => [...next, ...prev])
  }

  function exportBudgetCsv() {
    const rows = items.map((i) => ({
      id: i.id,
      category: i.category,
      description: i.description,
      vendor: i.vendor ?? "",
      status: i.status ?? "",
      date: i.date ?? "",
      planned: String(i.planned),
      actual: String(i.actual),
      variance: String(i.actual - i.planned),
    }))
    const csv = toCsv(rows)
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `budget-${projectId ?? "project"}-${new Date().toISOString().slice(0, 10)}.csv`
    )
  }

  function printReport() {
    window.print()
  }

  function requestEscrowRelease() {
    // Placeholder for m-finance-trust integration.
    const release: EscrowRelease = {
      id: uid("e"),
      amount: 5000,
      status: "requested",
      requestedAt: new Date().toISOString(),
      note: "Placeholder request (wire to m-finance-trust)",
    }
    setEscrow((prev) => ({ ...prev, releases: [release, ...prev.releases] }))
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Budget tracking</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Manage budget items, compare planned vs actual, and coordinate escrow releases (placeholder).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportBudgetCsv}>
            <Download className="h-4 w-4" />
            Export report
          </Button>
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
          <Button size="sm" onClick={startAdd} disabled={Boolean(editId)}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBank className="h-4 w-4" /> Total (planned)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">{formatMoney(totals.totalPlanned)}</div>
            <div className="text-sm text-neutral-600 mt-1">Approved budget baseline.</div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Spent (actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">{formatMoney(totals.totalActual)}</div>
            <div className="text-sm text-neutral-600 mt-1">Invoices and paid costs.</div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">{formatMoney(totals.remaining)}</div>
            <div className="text-sm text-neutral-600 mt-1">Planned minus actual.</div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TriangleAlert className="h-4 w-4" /> Variance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className={cn("text-2xl font-bold", totals.variance > 0 ? "text-red-700" : "text-emerald-700")}>
              {formatMoney(totals.variance)}
            </div>
            <div className="text-sm text-neutral-600 mt-1">Actual − planned (positive is over).</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Budget items</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {editId && draft ? (
                <div className="rounded-xl border bg-neutral-50 p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-medium text-neutral-700 mb-1">Category</div>
                      <select
                        className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value as BudgetCategory })}
                      >
                        {[
                          "Permits",
                          "Design",
                          "Materials",
                          "Labor",
                          "Subcontractors",
                          "Equipment",
                          "Fees",
                          "Contingency",
                          "Other",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700 mb-1">Status</div>
                      <select
                        className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                        value={draft.status ?? "planned"}
                        onChange={(e) => setDraft({ ...draft, status: e.target.value as BudgetItem["status"] })}
                      >
                        {["planned", "committed", "invoiced", "paid"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-medium text-neutral-700 mb-1">Description</div>
                      <Input
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        placeholder="e.g. Electrical rough-in"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700 mb-1">Vendor</div>
                      <Input
                        value={draft.vendor ?? ""}
                        onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
                        placeholder="Vendor / contractor"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700 mb-1">Date</div>
                      <Input
                        type="date"
                        value={draft.date ?? ""}
                        onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700 mb-1">Planned</div>
                      <Input
                        inputMode="decimal"
                        value={String(draft.planned)}
                        onChange={(e) => setDraft({ ...draft, planned: safeNumber(e.target.value) })}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700 mb-1">Actual</div>
                      <Input
                        inputMode="decimal"
                        value={String(draft.actual)}
                        onChange={(e) => setDraft({ ...draft, actual: safeNumber(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={!draft.description.trim()}>
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <FileUp className="h-4 w-4" />
                        Upload cost docs
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            void uploadCostDocs(e.target.files, draft.id)
                            e.currentTarget.value = ""
                          }}
                        />
                      </label>
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Category</th>
                      <th className="text-left font-medium px-4 py-3">Description</th>
                      <th className="text-left font-medium px-4 py-3">Vendor</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-right font-medium px-4 py-3">Planned</th>
                      <th className="text-right font-medium px-4 py-3">Actual</th>
                      <th className="text-right font-medium px-4 py-3">Variance</th>
                      <th className="text-right font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length ? (
                      items.map((i) => {
                        const v = i.actual - i.planned
                        return (
                          <tr key={i.id} className="border-t">
                            <td className="px-4 py-3 text-neutral-700">{i.category}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-neutral-900">{i.description}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                {i.date ? i.date : "—"}
                                {docs.some((d) => d.itemId === i.id) ? " • docs" : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-700">{i.vendor ?? "—"}</td>
                            <td className="px-4 py-3">{statusPill(i.status)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(i.planned)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(i.actual)}</td>
                            <td
                              className={cn(
                                "px-4 py-3 text-right tabular-nums",
                                v > 0 ? "text-red-700" : v < 0 ? "text-emerald-700" : "text-neutral-700"
                              )}
                            >
                              {formatMoney(v)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => startEdit(i.id)} disabled={Boolean(editId)}>
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => deleteItem(i.id)} disabled={Boolean(editId)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                          No budget items yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Budget breakdown by category</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[640px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Category</th>
                      <th className="text-right font-medium px-4 py-3">Planned</th>
                      <th className="text-right font-medium px-4 py-3">Actual</th>
                      <th className="text-right font-medium px-4 py-3">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((r) => (
                      <tr key={r.category} className="border-t">
                        <td className="px-4 py-3 text-neutral-900 font-medium">{r.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.planned)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.actual)}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right tabular-nums",
                            r.variance > 0 ? "text-red-700" : r.variance < 0 ? "text-emerald-700" : "text-neutral-700"
                          )}
                        >
                          {formatMoney(r.variance)}
                        </td>
                      </tr>
                    ))}
                    {!breakdown.length ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-neutral-600">
                          No data.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Variance analysis</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Planned vs actual variance</div>
                <div className="mt-1 text-xl font-semibold">{formatMoney(totals.variance)}</div>
                <div className="text-sm text-neutral-600 mt-1">
                  {totals.variance > 0 ? "Over budget drivers should be reviewed." : "Within budget based on actuals to date."}
                </div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Forecasted completion cost (EAC)</div>
                <div className="mt-1 text-xl font-semibold">{formatMoney(forecast.eac)}</div>
                <div className="text-sm text-neutral-600 mt-1">Risk factor: {forecast.riskPct}% (placeholder model)</div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Cost documents</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <FileUp className="h-4 w-4" />
                  Upload documents
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void uploadCostDocs(e.target.files)
                      e.currentTarget.value = ""
                    }}
                  />
                </label>
              </Button>
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {docs.length ? (
                    docs.slice(0, 8).map((d) => (
                      <li key={d.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">{d.filename}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">
                              {(d.sizeBytes / 1024).toFixed(0)} KB • {new Date(d.uploadedAt).toLocaleString()}
                              {d.itemId ? ` • item ${d.itemId}` : ""}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => alert("Open document (placeholder)")}>
                            View
                          </Button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No documents uploaded.</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Escrow releases (m-finance-trust)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Escrow balance</div>
                <div className="mt-1 text-xl font-semibold">{formatMoney(escrow.escrowBalance)}</div>
                <div className="text-xs text-neutral-600 mt-1">
                  Placeholder: wire this to `m-finance-trust` for real-time escrow + releases.
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="w-full" onClick={requestEscrowRelease}>
                  Request release (placeholder)
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => alert("Sync from finance (placeholder)")}>
                  Sync
                </Button>
              </div>

              <div className="rounded-xl border bg-white">
                <div className="px-4 py-3 text-sm font-medium text-neutral-900 border-b">Recent releases</div>
                <ul className="divide-y">
                  {escrow.releases.length ? (
                    escrow.releases.slice(0, 6).map((r) => (
                      <li key={r.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900">{formatMoney(r.amount)}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">
                              {new Date(r.requestedAt).toLocaleString()} • {r.status}
                              {r.note ? ` • ${r.note}` : ""}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => alert("Open release details (placeholder)")}>
                            Details
                          </Button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No releases yet.</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

