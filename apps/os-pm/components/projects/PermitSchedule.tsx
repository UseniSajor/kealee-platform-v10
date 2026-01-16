"use client"

import * as React from "react"
import { Calendar, CheckCircle2, FileUp, Mail, Phone, Plus, RefreshCw, XCircle } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

export type PermitStatus = "not_started" | "draft" | "submitted" | "in_review" | "approved" | "rejected" | "expired"

export type ProjectPermit = {
  id: string
  type: string
  jurisdiction: string
  status: PermitStatus
  submittedDate?: string // YYYY-MM-DD
  approvedDate?: string // YYYY-MM-DD
  expiresDate?: string // YYYY-MM-DD
}

export type InspectionResult = "pending" | "pass" | "fail"

export type InspectionChecklistItem = {
  id: string
  label: string
  checked: boolean
}

export type ScheduledInspection = {
  id: string
  type: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  jurisdiction: string
  inspector: {
    name: string
    phone?: string
    email?: string
  }
  result: InspectionResult
  notes?: string
  checklist: InspectionChecklistItem[]
}

export type PermitDocument = {
  id: string
  filename: string
  uploadedAt: string // ISO
  sizeBytes: number
  permitId?: string
}

export type PermitScheduleProps = {
  projectId?: string
  initialPermits?: ProjectPermit[]
  initialInspections?: ScheduledInspection[]
  initialDocuments?: PermitDocument[]
  className?: string
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate()
}

function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addMonths(d: Date, delta: number) {
  const next = new Date(d)
  next.setMonth(next.getMonth() + delta)
  return next
}

function statusPill(status: PermitStatus) {
  const cls =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "rejected"
        ? "bg-red-50 text-red-700 border-red-200"
        : status === "submitted" || status === "in_review"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : status === "expired"
            ? "bg-neutral-50 text-neutral-700 border-neutral-200"
            : "bg-sky-50 text-sky-700 border-sky-200"

  const label = status.replaceAll("_", " ")

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>
      {label}
    </span>
  )
}

export function PermitSchedule({
  projectId,
  initialPermits,
  initialInspections,
  initialDocuments,
  className,
}: PermitScheduleProps) {
  const today = React.useMemo(() => new Date(), [])
  const [month, setMonth] = React.useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = React.useState<string>(ymd(today))

  const [permits, setPermits] = React.useState<ProjectPermit[]>(
    initialPermits ?? [
      {
        id: "p1",
        type: "Building Permit",
        jurisdiction: "City of Austin",
        status: "in_review",
        submittedDate: "2026-01-10",
      },
      {
        id: "p2",
        type: "Electrical Permit",
        jurisdiction: "City of Austin",
        status: "submitted",
        submittedDate: "2026-01-14",
      },
      {
        id: "p3",
        type: "Plumbing Permit",
        jurisdiction: "City of Austin",
        status: "draft",
      },
    ]
  )

  const [inspections, setInspections] = React.useState<ScheduledInspection[]>(
    initialInspections ?? [
      {
        id: "i1",
        type: "Rough inspection",
        date: "2026-02-03",
        time: "10:00",
        jurisdiction: "City of Austin",
        inspector: { name: "Pat Nguyen", phone: "(512) 555-0182", email: "pat.nguyen@austin.gov" },
        result: "pending",
        checklist: [
          { id: "c1", label: "Plans posted on site", checked: true },
          { id: "c2", label: "Access ladders / safe entry", checked: false },
          { id: "c3", label: "Rough-in complete (MEP)", checked: false },
          { id: "c4", label: "Fasteners and blocking verified", checked: false },
        ],
      },
      {
        id: "i2",
        type: "Final inspection",
        date: "2026-02-18",
        time: "09:00",
        jurisdiction: "City of Austin",
        inspector: { name: "Sam Rivera", email: "sam.rivera@austin.gov" },
        result: "pending",
        checklist: [
          { id: "c1", label: "As-builts available", checked: false },
          { id: "c2", label: "Safety devices installed", checked: false },
          { id: "c3", label: "Punch list closed", checked: false },
        ],
      },
    ]
  )

  const [documents, setDocuments] = React.useState<PermitDocument[]>(
    initialDocuments ?? [
      { id: "d1", filename: "building-permit-submittal.pdf", uploadedAt: new Date().toISOString(), sizeBytes: 1_240_002, permitId: "p1" },
    ]
  )

  const [scheduleForm, setScheduleForm] = React.useState<{
    type: string
    date: string
    time: string
    jurisdiction: string
    inspectorName: string
    inspectorPhone: string
    inspectorEmail: string
  }>({
    type: "",
    date: selectedDay,
    time: "09:00",
    jurisdiction: permits[0]?.jurisdiction ?? "",
    inspectorName: "",
    inspectorPhone: "",
    inspectorEmail: "",
  })

  React.useEffect(() => {
    setScheduleForm((p) => ({ ...p, date: selectedDay }))
  }, [selectedDay])

  const monthCells = React.useMemo(() => {
    const y = month.getFullYear()
    const m0 = month.getMonth()
    const firstDow = new Date(y, m0, 1).getDay() // 0 Sun
    const dim = daysInMonth(y, m0)
    const prevDim = daysInMonth(y, m0 - 1)

    const cells: { date: string; inMonth: boolean }[] = []
    // leading
    for (let i = 0; i < firstDow; i++) {
      const dayNum = prevDim - (firstDow - 1 - i)
      const d = new Date(y, m0 - 1, dayNum)
      cells.push({ date: ymd(d), inMonth: false })
    }
    // current
    for (let day = 1; day <= dim; day++) {
      const d = new Date(y, m0, day)
      cells.push({ date: ymd(d), inMonth: true })
    }
    // trailing to complete weeks
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1]!
      const d = new Date(`${last.date}T00:00:00`)
      d.setDate(d.getDate() + 1)
      cells.push({ date: ymd(d), inMonth: false })
    }
    return cells
  }, [month])

  const inspectionsByDay = React.useMemo(() => {
    const map = new Map<string, ScheduledInspection[]>()
    for (const i of inspections) {
      const arr = map.get(i.date) ?? []
      arr.push(i)
      map.set(i.date, arr)
    }
    return map
  }, [inspections])

  const selectedInspections = inspectionsByDay.get(selectedDay) ?? []

  async function uploadPermitDocs(files: FileList | null, permitId?: string) {
    if (!files?.length) return
    const nowIso = new Date().toISOString()
    const next: PermitDocument[] = []
    for (const f of Array.from(files)) {
      next.push({ id: uid("doc"), filename: f.name, uploadedAt: nowIso, sizeBytes: f.size, permitId })
    }
    setDocuments((prev) => [...next, ...prev])
  }

  function scheduleInspection() {
    if (!scheduleForm.type.trim() || !scheduleForm.date) return
    const ins: ScheduledInspection = {
      id: uid("insp"),
      type: scheduleForm.type.trim(),
      date: scheduleForm.date,
      time: scheduleForm.time || undefined,
      jurisdiction: scheduleForm.jurisdiction || "—",
      inspector: {
        name: scheduleForm.inspectorName || "—",
        phone: scheduleForm.inspectorPhone || undefined,
        email: scheduleForm.inspectorEmail || undefined,
      },
      result: "pending",
      checklist: [
        { id: uid("c"), label: "Site access confirmed", checked: false },
        { id: uid("c"), label: "Plans available", checked: false },
        { id: uid("c"), label: "Work area safe/clear", checked: false },
      ],
    }
    setInspections((prev) => [...prev, ins].sort((a, b) => a.date.localeCompare(b.date)))
    setSelectedDay(scheduleForm.date)
    setScheduleForm((p) => ({ ...p, type: "" }))
  }

  function setInspectionResult(id: string, result: InspectionResult) {
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, result } : i)))
  }

  function toggleChecklist(inspectionId: string, itemId: string) {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== inspectionId) return i
        return {
          ...i,
          checklist: i.checklist.map((c) => (c.id === itemId ? { ...c, checked: !c.checked } : c)),
        }
      })
    )
  }

  async function checkPermitStatus() {
    // Placeholder for m-permits-inspections integration.
    // In a real implementation this would call an API and update per-permit statuses/dates.
    setPermits((prev) =>
      prev.map((p) => (p.status === "submitted" ? { ...p, status: "in_review" } : p))
    )
    alert("Checked permit status (placeholder). Wire to m-permits-inspections.")
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Permits & inspections</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Track permits, schedule inspections, and manage checklists (with m-permits-inspections integration placeholder).
          </p>
          {projectId ? <p className="text-xs text-neutral-500 mt-1">Project: {projectId}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void checkPermitStatus()}>
            <RefreshCw className="h-4 w-4" />
            Check permit status
          </Button>
          <Button size="sm" onClick={scheduleInspection}>
            <Plus className="h-4 w-4" />
            Schedule inspection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Inspections calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-900">
                  {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
                    Next
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs text-neutral-600">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="px-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthCells.map((c) => {
                  const count = inspectionsByDay.get(c.date)?.length ?? 0
                  const isSelected = c.date === selectedDay
                  const isToday = c.date === ymd(today)
                  return (
                    <button
                      key={c.date}
                      type="button"
                      onClick={() => setSelectedDay(c.date)}
                      className={cn(
                        "h-16 rounded-xl border bg-white p-2 text-left transition-colors",
                        c.inMonth ? "text-neutral-900" : "text-neutral-400",
                        isSelected ? "border-neutral-900 ring-1 ring-neutral-900/20" : "hover:bg-neutral-50",
                        isToday ? "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" : ""
                      )}
                      aria-label={`Select ${c.date}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-sm font-medium">{Number(c.date.slice(-2))}</div>
                        {count ? (
                          <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
                            {count}
                          </span>
                        ) : null}
                      </div>
                      {count ? <div className="mt-2 text-[10px] text-neutral-600">Inspections</div> : null}
                    </button>
                  )
                })}
              </div>

              <div className="rounded-xl border bg-neutral-50 p-4">
                <div className="text-sm font-medium text-neutral-900">Schedule new inspection</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Type</div>
                    <Input
                      value={scheduleForm.type}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, type: e.target.value }))}
                      placeholder="e.g. Rough inspection"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Date</div>
                    <Input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Time</div>
                    <Input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Jurisdiction</div>
                    <Input
                      value={scheduleForm.jurisdiction}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                      placeholder="Jurisdiction"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Inspector name</div>
                    <Input
                      value={scheduleForm.inspectorName}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, inspectorName: e.target.value }))}
                      placeholder="Inspector"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Inspector phone</div>
                    <Input
                      value={scheduleForm.inspectorPhone}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, inspectorPhone: e.target.value }))}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Inspector email</div>
                    <Input
                      value={scheduleForm.inspectorEmail}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, inspectorEmail: e.target.value }))}
                      placeholder="name@jurisdiction.gov"
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-neutral-600">
                  This schedules locally (placeholder). Wire to `m-permits-inspections` to create/confirm real inspections.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Inspections for {selectedDay}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {selectedInspections.length ? (
                selectedInspections.map((i) => (
                  <div key={i.id} className="rounded-xl border bg-white p-4 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900">{i.type}</div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {i.jurisdiction}
                          {i.time ? ` • ${i.time}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 rounded-md border bg-white px-3 text-sm"
                          value={i.result}
                          onChange={(e) => setInspectionResult(i.id, e.target.value as InspectionResult)}
                          aria-label="Inspection result"
                        >
                          <option value="pending">Pending</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                        {i.result === "pass" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-sm">
                            <CheckCircle2 className="h-4 w-4" /> Pass
                          </span>
                        ) : i.result === "fail" ? (
                          <span className="inline-flex items-center gap-1 text-red-700 text-sm">
                            <XCircle className="h-4 w-4" /> Fail
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-600">Pending</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-neutral-50 p-3">
                      <div className="text-sm font-medium text-neutral-900">Inspector contact</div>
                      <div className="mt-2 text-sm text-neutral-700">{i.inspector.name}</div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-neutral-600">
                        {i.inspector.phone ? (
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" /> {i.inspector.phone}
                          </span>
                        ) : null}
                        {i.inspector.email ? (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" /> {i.inspector.email}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-neutral-900">Inspection checklist</div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {i.checklist.map((c) => (
                          <label key={c.id} className="flex items-start gap-2 rounded-lg border bg-white px-3 py-2">
                            <input
                              type="checkbox"
                              checked={c.checked}
                              onChange={() => toggleChecklist(i.id, c.id)}
                              className="mt-0.5"
                            />
                            <span className="text-sm text-neutral-900">{c.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-neutral-600">
                        Placeholder checklist state. Wire to `m-permits-inspections` to persist per-inspection checklist completion.
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border bg-white p-6 text-sm text-neutral-600">
                  No inspections scheduled for this date.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Project permits</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[860px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Type</th>
                      <th className="text-left font-medium px-4 py-3">Jurisdiction</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-left font-medium px-4 py-3">Submitted</th>
                      <th className="text-left font-medium px-4 py-3">Approved</th>
                      <th className="text-left font-medium px-4 py-3">Expires</th>
                      <th className="text-right font-medium px-4 py-3">Docs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((p) => {
                      const docCount = documents.filter((d) => d.permitId === p.id).length
                      return (
                        <tr key={p.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="font-medium text-neutral-900">{p.type}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">ID: {p.id}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{p.jurisdiction}</td>
                          <td className="px-4 py-3">{statusPill(p.status)}</td>
                          <td className="px-4 py-3 text-neutral-700">{p.submittedDate ?? "—"}</td>
                          <td className="px-4 py-3 text-neutral-700">{p.approvedDate ?? "—"}</td>
                          <td className="px-4 py-3 text-neutral-700">{p.expiresDate ?? "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <label className="cursor-pointer">
                                  <FileUp className="h-4 w-4" />
                                  Upload
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      void uploadPermitDocs(e.target.files, p.id)
                                      e.currentTarget.value = ""
                                    }}
                                  />
                                </label>
                              </Button>
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-white text-neutral-700">
                                {docCount}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-neutral-600">
                Permit status checks are placeholder. Connect to `m-permits-inspections` for real jurisdiction lookups and webhooks.
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Permit documents</CardTitle>
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
                      void uploadPermitDocs(e.target.files)
                      e.currentTarget.value = ""
                    }}
                  />
                </label>
              </Button>

              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {documents.length ? (
                    documents.slice(0, 10).map((d) => (
                      <li key={d.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">{d.filename}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">
                              {(d.sizeBytes / 1024).toFixed(0)} KB • {new Date(d.uploadedAt).toLocaleString()}
                              {d.permitId ? ` • permit ${d.permitId}` : ""}
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
        </div>
      </div>
    </div>
  )
}

