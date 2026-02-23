"use client"

import * as React from "react"
import { Mail, Phone, Plus, Star, StarHalf } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"

type Contractor = {
  id: string
  name: string
  trade: string
  contact: { phone?: string; email?: string }
  rating: number // 0-5
  onTimePct: number
  qualityPct: number
  active: boolean
}

function stars(rating: number) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

export default function ProjectContractorsPage({
  params,
}: {
  params: { clientId: string; projectId: string }
}) {
  const { clientId, projectId } = params

  const [query, setQuery] = React.useState("")
  const [trade, setTrade] = React.useState<"All" | Contractor["trade"]>("All")

  const [contractors, setContractors] = React.useState<Contractor[]>([
    {
      id: "k1",
      name: "Morgan Lee Construction",
      trade: "General Contractor",
      contact: { phone: "(512) 555-0104", email: "gc@company.com" },
      rating: 4.5,
      onTimePct: 92,
      qualityPct: 88,
      active: true,
    },
    {
      id: "k2",
      name: "BrightWire Electric",
      trade: "Electrical",
      contact: { phone: "(512) 555-0177", email: "dispatch@brightwire.com" },
      rating: 4.0,
      onTimePct: 85,
      qualityPct: 90,
      active: true,
    },
    {
      id: "k3",
      name: "PipeRight Plumbing",
      trade: "Plumbing",
      contact: { phone: "(512) 555-0193" },
      rating: 3.5,
      onTimePct: 78,
      qualityPct: 82,
      active: false,
    },
  ])

  const trades = React.useMemo(() => {
    const set = new Set(contractors.map((c) => c.trade))
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))] as const
  }, [contractors])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return contractors.filter((c) => {
      if (trade !== "All" && c.trade !== trade) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || c.trade.toLowerCase().includes(q) || (c.contact.email ?? "").toLowerCase().includes(q)
    })
  }, [contractors, query, trade])

  function addContractor() {
    const c: Contractor = {
      id: uid("k"),
      name: "New contractor (placeholder)",
      trade: "Other",
      contact: { email: "contractor@company.com" },
      rating: 0,
      onTimePct: 0,
      qualityPct: 0,
      active: true,
    }
    setContractors((prev) => [c, ...prev])
  }

  function toggleActive(id: string) {
    setContractors((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)))
  }

  function setRating(id: string, rating: number) {
    setContractors((prev) => prev.map((c) => (c.id === id ? { ...c, rating } : c)))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contractors</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contractors…" className="sm:w-72" />
          <select
            className="h-9 rounded-md border bg-white px-3 text-sm"
            value={trade}
            onChange={(e) => setTrade(e.target.value as "All" | Contractor["trade"])}
            aria-label="Filter by trade"
          >
            {trades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={addContractor}>
            <Plus className="h-4 w-4" />
            Add contractor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Contractor directory</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[960px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Name</th>
                      <th className="text-left font-medium px-4 py-3">Trade</th>
                      <th className="text-left font-medium px-4 py-3">Contact</th>
                      <th className="text-left font-medium px-4 py-3">Rating</th>
                      <th className="text-right font-medium px-4 py-3">On-time</th>
                      <th className="text-right font-medium px-4 py-3">Quality</th>
                      <th className="text-right font-medium px-4 py-3">Status</th>
                      <th className="text-right font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const s = stars(c.rating)
                      return (
                        <tr key={c.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="font-medium text-neutral-900">{c.name}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">ID: {c.id}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{c.trade}</td>
                          <td className="px-4 py-3 text-neutral-700">
                            <div className="flex flex-col gap-1">
                              {c.contact.phone ? (
                                <span className="inline-flex items-center gap-2">
                                  <Phone className="h-4 w-4" /> {c.contact.phone}
                                </span>
                              ) : null}
                              {c.contact.email ? (
                                <span className="inline-flex items-center gap-2">
                                  <Mail className="h-4 w-4" /> {c.contact.email}
                                </span>
                              ) : null}
                              {!c.contact.phone && !c.contact.email ? "—" : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center">
                                {Array.from({ length: s.full }).map((_, i) => (
                                  <Star key={`f-${i}`} className="h-4 w-4 text-amber-500 fill-amber-500" />
                                ))}
                                {s.half ? <StarHalf className="h-4 w-4 text-amber-500 fill-amber-500" /> : null}
                                {Array.from({ length: s.empty }).map((_, i) => (
                                  <Star key={`e-${i}`} className="h-4 w-4 text-neutral-300" />
                                ))}
                              </div>
                              <select
                                className="h-8 rounded-md border bg-white px-2 text-sm"
                                value={String(c.rating)}
                                onChange={(e) => setRating(c.id, Number(e.target.value))}
                                aria-label="Set rating"
                              >
                                {[0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((r) => (
                                  <option key={r} value={String(r)}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{c.onTimePct}%</td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{c.qualityPct}%</td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                c.active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-neutral-50 text-neutral-700 border-neutral-200"
                              )}
                            >
                              {c.active ? "active" : "inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => alert("Open profile (placeholder)")}>
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => toggleActive(c.id)}>
                                {c.active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {!filtered.length ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                          No contractors match your filters.
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
              <CardTitle className="text-base">Performance snapshot</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Active contractors</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{contractors.filter((c) => c.active).length}</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Avg rating</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {(contractors.reduce((s, c) => s + c.rating, 0) / Math.max(1, contractors.length)).toFixed(1)}
                </div>
              </div>
              <div className="text-xs text-neutral-600">
                Placeholder: compute performance from inspections, punch list rework, on-time milestones, and budget adherence.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

