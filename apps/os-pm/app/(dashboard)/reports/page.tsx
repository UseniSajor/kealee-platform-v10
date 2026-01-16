"use client"

import * as React from "react"
import { CalendarClock, Download, FileText, Plus, Wand2 } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type ReportTemplate = {
  id: string
  name: string
  description: string
  sections: string[]
}

type ScheduledReport = {
  id: string
  name: string
  templateId: string
  frequency: "daily" | "weekly" | "monthly"
  recipients: string
  nextRun: string
  active: boolean
}

type ReportRun = {
  id: string
  name: string
  createdAt: string
  status: "completed" | "failed" | "running"
  template: string
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
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

function downloadText(text: string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const templates: ReportTemplate[] = React.useMemo(
    () => [
      {
        id: "t-weekly",
        name: "Weekly progress report",
        description: "Status, milestones, budget variance, permits, and photos summary.",
        sections: ["Executive summary", "Schedule", "Budget", "Permits", "Photos", "Risks & blockers"],
      },
      {
        id: "t-closeout",
        name: "Closeout package",
        description: "Final inspections, sign-offs, and punch list completion.",
        sections: ["Final inspections", "As-builts", "Warranties", "Punch list", "Client sign-off"],
      },
      {
        id: "t-finance",
        name: "Budget & escrow report",
        description: "Budget breakdown and escrow release history (placeholder).",
        sections: ["Budget summary", "Variance drivers", "Forecast", "Escrow releases"],
      },
    ],
    []
  )

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>(templates[0]!.id)
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0]!

  const [customName, setCustomName] = React.useState("Custom report")
  const [customSections, setCustomSections] = React.useState<string>("Overview\nTimeline\nBudget\nPermits\nDocuments\nPhotos\nContractors\nActivity")
  const [builderNote, setBuilderNote] = React.useState<string>("")

  const [schedules, setSchedules] = React.useState<ScheduledReport[]>([
    {
      id: "s1",
      name: "Weekly progress (PM team)",
      templateId: "t-weekly",
      frequency: "weekly",
      recipients: "pm@company.com, ops@company.com",
      nextRun: "2026-01-19 08:00",
      active: true,
    },
  ])

  const [history, setHistory] = React.useState<ReportRun[]>([
    { id: "r1", name: "Weekly progress report", createdAt: "2026-01-12 08:02", status: "completed", template: "Weekly progress report" },
    { id: "r2", name: "Budget & escrow report", createdAt: "2026-01-10 16:11", status: "completed", template: "Budget & escrow report" },
    { id: "r3", name: "Weekly progress report", createdAt: "2026-01-05 08:01", status: "failed", template: "Weekly progress report" },
  ])

  function runTemplateNow() {
    const run: ReportRun = {
      id: uid("run"),
      name: selectedTemplate.name,
      createdAt: new Date().toLocaleString(),
      status: "completed",
      template: selectedTemplate.name,
    }
    setHistory((prev) => [run, ...prev])
    setBuilderNote("Generated report (placeholder). Hook to backend report worker + storage.")
  }

  function addSchedule() {
    const next: ScheduledReport = {
      id: uid("sched"),
      name: `${selectedTemplate.name} schedule`,
      templateId: selectedTemplate.id,
      frequency: "weekly",
      recipients: "client@company.com",
      nextRun: "2026-01-19 08:00",
      active: true,
    }
    setSchedules((prev) => [next, ...prev])
  }

  function toggleSchedule(id: string) {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)))
  }

  function exportHistoryCsv() {
    const rows: Record<string, string>[] = history.map((h) => ({
      id: h.id,
      name: h.name,
      createdAt: h.createdAt,
      status: h.status,
      template: h.template,
    }))
    downloadText(toCsv(rows), `report-history-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-neutral-600 mt-1">Generate and schedule reports (UI + placeholders for automation/export).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportHistoryCsv} disabled={!history.length}>
            <Download className="h-4 w-4" />
            Export history
          </Button>
          <Button size="sm" onClick={runTemplateNow}>
            <Wand2 className="h-4 w-4" />
            Generate now
          </Button>
        </div>
      </div>

      {builderNote ? (
        <div className="rounded-lg border bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{builderNote}</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Report generator (templates)</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-neutral-700">Template</div>
                  <select
                    className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-sm text-neutral-600">{selectedTemplate.description}</div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm font-medium text-neutral-900">Included sections</div>
                  <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-neutral-700">
                    {selectedTemplate.sections.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => alert("Preview report (placeholder)")}>
                  <FileText className="h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert("Export PDF (placeholder)")}>
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={addSchedule}>
                  <CalendarClock className="h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Custom report builder</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Report name</div>
                  <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Report name" />
                </div>
                <div className="text-sm text-neutral-600 md:pt-6">
                  Placeholder builder: define sections and filters. Later: drag-and-drop sections + field selection.
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-neutral-700 mb-1">Sections (one per line)</div>
                <textarea
                  className="min-h-[140px] w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  value={customSections}
                  onChange={(e) => setCustomSections(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const sections = customSections
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                    const run: ReportRun = {
                      id: uid("run"),
                      name: customName.trim() || "Custom report",
                      createdAt: new Date().toLocaleString(),
                      status: "completed",
                      template: `Custom (${sections.length} sections)`,
                    }
                    setHistory((prev) => [run, ...prev])
                    setBuilderNote("Generated custom report (placeholder).")
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Generate custom
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert("Save builder template (placeholder)")}>
                  Save template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Report history</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[820px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Report</th>
                      <th className="text-left font-medium px-4 py-3">Template</th>
                      <th className="text-left font-medium px-4 py-3">Created</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-right font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{h.name}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{h.template}</td>
                        <td className="px-4 py-3 text-neutral-700">{h.createdAt}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              h.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : h.status === "failed"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => alert("Open report (placeholder)")}>
                              Open
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alert("Download report (placeholder)")}>
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!history.length ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-neutral-600">
                          No reports generated yet.
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
              <CardTitle className="text-base">Automated reports</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="text-sm text-neutral-600">
                Schedule recurring reports for clients and internal teams (placeholder).
              </div>
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {schedules.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900">{s.name}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {s.frequency} • next: {s.nextRun}
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5 truncate">to: {s.recipients}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleSchedule(s.id)}>
                            {s.active ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {!schedules.length ? (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No schedules yet.</li>
                  ) : null}
                </ul>
              </div>
              <div className="text-xs text-neutral-600">
                Later: run via worker/cron, store outputs, email recipients, and log run results.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

