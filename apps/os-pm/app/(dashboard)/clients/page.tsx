"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Download, Plus, Upload } from "lucide-react"

import { api } from "@/lib/api-client"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import type { PMClient } from "@/lib/types"

type StatusFilter = "all" | PMClient["status"]

function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => {
    const needs = /[",\n]/.test(v)
    const escaped = v.replaceAll('"', '""')
    return needs ? `"${escaped}"` : escaped
  }
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))]
  return lines.join("\n")
}

export default function ClientsPage() {
  const { data } = useQuery({
    queryKey: ["pm-clients"],
    queryFn: () => api.getMyClients(),
  })

  const clients = (data?.clients ?? []) as PMClient[]
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [importNote, setImportNote] = React.useState<string>("")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients.filter((c) => {
      if (status !== "all" && c.status !== status) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
      )
    })
  }, [clients, search, status])

  function exportContacts() {
    const rows = filtered.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      status: c.status,
      totalProjects: String(c.activeProjects ?? 0),
    }))

    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File) {
    // Placeholder import: we don't persist yet; just report basic parsing.
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    setImportNote(
      `Imported ${Math.max(0, lines.length - 1)} contacts from ${file.name} (placeholder — not saved yet).`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-neutral-600 mt-1">Manage your client contacts and their projects.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportContacts} disabled={!filtered.length}>
            <Download className="h-4 w-4" />
            Export contacts
          </Button>

          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4" />
              Import contacts
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleImport(f)
                  e.currentTarget.value = ""
                }}
              />
            </label>
          </Button>

          <Button size="sm" onClick={() => alert("Add new client (placeholder)")}>
            <Plus className="h-4 w-4" />
            Add new client
          </Button>
        </div>
      </div>

      {importNote ? (
        <div className="rounded-lg border bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">{importNote}</div>
      ) : null}

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Directory</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="sm:w-80"
            />
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Filter by status"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="text-sm text-neutral-600">
                {filtered.length} / {clients.length}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Phone</th>
                  <th className="text-left font-medium px-4 py-3">Total projects</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{c.name}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{c.email}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.activeProjects ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs rounded-full border px-2 py-1",
                            c.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200"
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/clients/${c.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">
                      No clients match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

