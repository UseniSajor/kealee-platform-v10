"use client"

import * as React from "react"
import { Download, Loader2, Pause, Play, Plus, TimerReset } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api/index"

type TimeEntry = {
  id: string
  date: string // YYYY-MM-DD
  project: string
  task: string
  minutes: number
  billable: boolean
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

function fmtMinutes(min: number) {
  const m = Math.max(0, Math.floor(min))
  const h = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, "0")
  return `${h}:${mm}`
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

export default function TimeTrackingPage() {
  const [running, setRunning] = React.useState(false)
  const [startedAt, setStartedAt] = React.useState<number | null>(null)
  const [elapsedSec, setElapsedSec] = React.useState(0)
  const [timerProject, setTimerProject] = React.useState("")
  const [timerTask, setTimerTask] = React.useState("")
  const [timerBillable, setTimerBillable] = React.useState(true)

  const [entries, setEntries] = React.useState<TimeEntry[]>([])
  const [loading, setLoading] = React.useState(true)

  // Load existing time entries from the API
  React.useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    try {
      const res = await api.timeTracking.list()
      const data = res as any
      const items = data?.entries || data?.data?.entries || data?.timeEntries || data?.items || []
      const mapped: TimeEntry[] = items.map((e: any) => ({
        id: e.id,
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : "",
        project: e.projectName || e.project || "",
        task: e.taskName || e.task || e.description || "",
        minutes: e.minutes || (e.hours ? Math.round(e.hours * 60) : e.duration || 0),
        billable: e.billable ?? true,
      }))
      setEntries(mapped)
    } catch (err) {
      console.error("Failed to load time entries:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!running || startedAt === null) return
    const t = setInterval(() => {
      const now = Date.now()
      setElapsedSec(Math.max(0, Math.floor((now - startedAt) / 1000)))
    }, 500)
    return () => clearInterval(t)
  }, [running, startedAt])

  const totals = React.useMemo(() => {
    const totalMin = entries.reduce((s, e) => s + e.minutes, 0)
    const billableMin = entries.filter((e) => e.billable).reduce((s, e) => s + e.minutes, 0)
    return { totalMin, billableMin, nonBillableMin: totalMin - billableMin }
  }, [entries])

  function start() {
    if (running) return
    setStartedAt(Date.now() - elapsedSec * 1000)
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function reset() {
    setRunning(false)
    setStartedAt(null)
    setElapsedSec(0)
  }

  async function addManualEntry() {
    const newEntry: TimeEntry = {
      id: uid("te"),
      date: new Date().toISOString().slice(0, 10),
      project: timerProject.trim() || "Project",
      task: timerTask.trim() || "Work",
      minutes: 30,
      billable: timerBillable,
    }
    setEntries((prev) => [newEntry, ...prev])

    // Persist to backend
    try {
      await api.timeTracking.create({
        date: newEntry.date,
        projectName: newEntry.project,
        description: newEntry.task,
        minutes: newEntry.minutes,
        hours: newEntry.minutes / 60,
        billable: newEntry.billable,
      })
    } catch (err) {
      console.error("Failed to save time entry:", err)
    }
  }

  async function stopAndSave() {
    if (elapsedSec < 60) return
    const minutes = Math.round(elapsedSec / 60)
    const newEntry: TimeEntry = {
      id: uid("te"),
      date: new Date().toISOString().slice(0, 10),
      project: timerProject.trim() || "Project",
      task: timerTask.trim() || "Work",
      minutes,
      billable: timerBillable,
    }
    setEntries((prev) => [newEntry, ...prev])
    reset()

    // Persist to backend
    try {
      await api.timeTracking.create({
        date: newEntry.date,
        projectName: newEntry.project,
        description: newEntry.task,
        minutes: newEntry.minutes,
        hours: newEntry.minutes / 60,
        billable: newEntry.billable,
      })
    } catch (err) {
      console.error("Failed to save time entry:", err)
    }
  }

  async function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((x) => x.id !== id))
    try {
      await api.timeTracking.delete(id)
    } catch {
      // Entry may be local-only
    }
  }

  function exportPayroll() {
    const rows: Record<string, string>[] = entries.map((e) => ({
      date: e.date,
      project: e.project,
      task: e.task,
      minutes: String(e.minutes),
      hours: (e.minutes / 60).toFixed(2),
      billable: e.billable ? "yes" : "no",
    }))
    downloadText(toCsv(rows), `timesheet-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-neutral-600 mt-1">Timer + timesheets with billable hours and payroll export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportPayroll} disabled={!entries.length}>
            <Download className="h-4 w-4" />
            Export to payroll
          </Button>
          <Button size="sm" onClick={addManualEntry}>
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Timer / stopwatch</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Elapsed</div>
                <div className="mt-1 text-4xl font-bold tabular-nums">
                  {fmtMinutes(Math.floor(elapsedSec / 60))}
                  <span className="text-base text-neutral-500 ml-2">({elapsedSec}s)</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!running ? (
                    <Button size="sm" onClick={start}>
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  ) : (
                    <Button size="sm" onClick={pause}>
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={reset}>
                    <TimerReset className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={stopAndSave} disabled={elapsedSec < 60}>
                    Save entry
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Project</div>
                  <Input value={timerProject} onChange={(e) => setTimerProject(e.target.value)} placeholder="Project name" />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Task</div>
                  <Input value={timerTask} onChange={(e) => setTimerTask(e.target.value)} placeholder="Task description" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    id="billable"
                    type="checkbox"
                    checked={timerBillable}
                    onChange={(e) => setTimerBillable(e.target.checked)}
                  />
                  <label htmlFor="billable" className="text-sm text-neutral-900">
                    Billable
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Timesheet entries</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Loading time entries...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-white">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Date</th>
                        <th className="text-left font-medium px-4 py-3">Project</th>
                        <th className="text-left font-medium px-4 py-3">Task</th>
                        <th className="text-right font-medium px-4 py-3">Time</th>
                        <th className="text-left font-medium px-4 py-3">Billable</th>
                        <th className="text-right font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id} className="border-t">
                          <td className="px-4 py-3 text-neutral-700">{e.date}</td>
                          <td className="px-4 py-3 text-neutral-900 font-medium">{e.project}</td>
                          <td className="px-4 py-3 text-neutral-700">{e.task}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-900">{fmtMinutes(e.minutes)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                e.billable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-neutral-50 text-neutral-700 border-neutral-200"
                              )}
                            >
                              {e.billable ? "billable" : "non-billable"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteEntry(e.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!entries.length ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">
                            No entries yet. Start the timer or add a manual entry.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Billable hours</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Total</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{fmtMinutes(totals.totalMin)}</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Billable</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{fmtMinutes(totals.billableMin)}</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Non-billable</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{fmtMinutes(totals.nonBillableMin)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

