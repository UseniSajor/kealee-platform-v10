"use client"

import * as React from "react"
import { Download, Printer } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@pm/lib/utils"

export type TimelineTask = {
  id: string
  name: string
  start: string // ISO date (YYYY-MM-DD)
  end: string // ISO date (YYYY-MM-DD)
  baselineStart?: string // ISO date
  baselineEnd?: string // ISO date
  dependencies?: string[] // ids that must finish before this starts
  isMilestone?: boolean
}

export type TimelineViewProps = {
  title?: string
  tasks: TimelineTask[]
  onTasksChange?: (tasks: TimelineTask[]) => void
  className?: string
}

type DragMode = "move" | "resize-left" | "resize-right"
type DragState = {
  mode: DragMode
  taskId: string
  pointerStartX: number
  startDay0: number
  endDay0: number
  svgLeft: number
  svgWidth: number
  totalDays: number
}

function parseIsoDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function toIsoDate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDaysIso(iso: string, days: number) {
  const d = parseIsoDate(iso)
  if (!d) return iso
  d.setUTCDate(d.getUTCDate() + days)
  return toIsoDate(d)
}

function diffDays(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function normalizeRange(tasks: TimelineTask[]) {
  let min: Date | null = null
  let max: Date | null = null

  for (const t of tasks) {
    const s = parseIsoDate(t.start)
    const e = parseIsoDate(t.end)
    const bs = t.baselineStart ? parseIsoDate(t.baselineStart) : null
    const be = t.baselineEnd ? parseIsoDate(t.baselineEnd) : null
    for (const d of [s, e, bs, be]) {
      if (!d) continue
      if (!min || d.getTime() < min.getTime()) min = d
      if (!max || d.getTime() > max.getTime()) max = d
    }
  }

  const now = new Date()
  if (!min) min = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (!max) max = new Date(min.getTime() + 21 * 24 * 60 * 60 * 1000)

  // Pad by a week on each side for readability.
  min = new Date(min.getTime())
  max = new Date(max.getTime())
  min.setUTCDate(min.getUTCDate() - 7)
  max.setUTCDate(max.getUTCDate() + 7)

  return { min, max }
}

function calcCriticalPath(taskList: TimelineTask[]) {
  // Critical Path Method approximation based on durations and dependencies only.
  const tasks = taskList.map((t) => {
    const s = parseIsoDate(t.start)
    const e = parseIsoDate(t.end)
    const duration = s && e ? Math.max(0, diffDays(s, e) || (t.isMilestone ? 0 : 1)) : 1
    return { ...t, _duration: duration }
  })

  const byId = new Map(tasks.map((t) => [t.id, t]))
  const preds = new Map<string, string[]>()
  const succs = new Map<string, string[]>()
  const indeg = new Map<string, number>()

  for (const t of tasks) {
    const p = (t.dependencies ?? []).filter((id) => byId.has(id) && id !== t.id)
    preds.set(t.id, p)
    indeg.set(t.id, p.length)
    for (const dep of p) {
      const arr = succs.get(dep) ?? []
      arr.push(t.id)
      succs.set(dep, arr)
    }
  }

  const queue: string[] = []
  for (const [id, d] of indeg.entries()) {
    if (d === 0) queue.push(id)
  }

  const topo: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    topo.push(id)
    for (const s of succs.get(id) ?? []) {
      const next = (indeg.get(s) ?? 0) - 1
      indeg.set(s, next)
      if (next === 0) queue.push(s)
    }
  }

  // If cycles exist, fall back to input order.
  const order = topo.length === tasks.length ? topo : tasks.map((t) => t.id)

  const ES = new Map<string, number>()
  const EF = new Map<string, number>()
  for (const id of order) {
    const p = preds.get(id) ?? []
    const es = p.length ? Math.max(...p.map((pid) => EF.get(pid) ?? 0)) : 0
    ES.set(id, es)
    EF.set(id, es + (byId.get(id)?._duration ?? 1))
  }
  const projectDuration = Math.max(0, ...order.map((id) => EF.get(id) ?? 0))

  const LF = new Map<string, number>()
  const LS = new Map<string, number>()
  for (const id of [...order].reverse()) {
    const s = succs.get(id) ?? []
    const lf = s.length ? Math.min(...s.map((sid) => LS.get(sid) ?? projectDuration)) : projectDuration
    LF.set(id, lf)
    LS.set(id, lf - (byId.get(id)?._duration ?? 1))
  }

  const critical = new Set<string>()
  for (const id of order) {
    const slack = (LS.get(id) ?? 0) - (ES.get(id) ?? 0)
    if (slack === 0) critical.add(id)
  }
  return critical
}

export function TimelineView({ title = "Project timeline", tasks, onTasksChange, className }: TimelineViewProps) {
  const [local, setLocal] = React.useState<TimelineTask[]>(tasks)
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)

  React.useEffect(() => {
    setLocal(tasks)
  }, [tasks])

  const { min, max } = React.useMemo(() => normalizeRange(local), [local])
  const totalDays = React.useMemo(() => Math.max(1, diffDays(min, max)), [min, max])
  const critical = React.useMemo(() => calcCriticalPath(local), [local])

  const rowH = 44
  const leftW = 320
  const topH = 40
  const chartW = 980
  const chartH = topH + rowH * local.length

  const weeks = React.useMemo(() => {
    // tick every 7 days
    const ticks: { day: number; label: string }[] = []
    for (let d = 0; d <= totalDays; d += 7) {
      const dt = new Date(min.getTime())
      dt.setUTCDate(dt.getUTCDate() + d)
      const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
      const dd = String(dt.getUTCDate()).padStart(2, "0")
      ticks.push({ day: d, label: `${mm}/${dd}` })
    }
    return ticks
  }, [min, totalDays])

  function dayToX(day: number) {
    return (day / totalDays) * chartW
  }

  function isoToDay(iso: string) {
    const d = parseIsoDate(iso)
    if (!d) return 0
    return clamp(diffDays(min, d), 0, totalDays)
  }

  function updateTask(taskId: string, patch: Partial<TimelineTask>) {
    setLocal((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
      onTasksChange?.(next)
      return next
    })
  }

  function beginDrag(e: React.PointerEvent, taskId: string, mode: DragMode) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const t = local.find((x) => x.id === taskId)
    if (!t) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({
      mode,
      taskId,
      pointerStartX: e.clientX,
      startDay0: isoToDay(t.start),
      endDay0: isoToDay(t.end),
      svgLeft: rect.left,
      svgWidth: rect.width,
      totalDays,
    })
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return
    const dx = e.clientX - drag.pointerStartX
    const dayDelta = Math.round((dx / Math.max(1, drag.svgWidth)) * drag.totalDays)
    const t = local.find((x) => x.id === drag.taskId)
    if (!t) return

    const origStart = drag.startDay0
    const origEnd = Math.max(origStart, drag.endDay0)
    const minLen = t.isMilestone ? 0 : 1

    if (drag.mode === "move") {
      const newStartDay = clamp(origStart + dayDelta, 0, drag.totalDays)
      const newEndDay = clamp(origEnd + dayDelta, 0, drag.totalDays)
      const ds = newStartDay - origStart
      const de = newEndDay - origEnd
      if (ds !== 0 || de !== 0) updateTask(drag.taskId, { start: addDaysIso(t.start, ds), end: addDaysIso(t.end, de) })
      return
    }

    if (drag.mode === "resize-left") {
      const newStartDay = clamp(origStart + dayDelta, 0, origEnd)
      const ds = newStartDay - origStart
      const newLen = origEnd - newStartDay
      if (newLen >= minLen) updateTask(drag.taskId, { start: addDaysIso(t.start, ds) })
      return
    }

    if (drag.mode === "resize-right") {
      const newEndDay = clamp(origEnd + dayDelta, origStart, drag.totalDays)
      const newLen = newEndDay - origStart
      const de = newEndDay - origEnd
      if (newLen >= minLen) updateTask(drag.taskId, { end: addDaysIso(t.end, de) })
      return
    }
  }

  function endDrag(e: React.PointerEvent) {
    if (!drag) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    setDrag(null)
  }

  function exportSvg() {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const xml = new XMLSerializer().serializeToString(clone)
    downloadBlob(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }), `timeline-${new Date().toISOString().slice(0, 10)}.svg`)
  }

  async function exportPng() {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const xml = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    try {
      const img = new Image()
      img.decoding = "async"
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load SVG"))
      })
      img.src = url
      await loaded

      const canvas = document.createElement("canvas")
      const scale = 2
      canvas.width = chartW * scale
      canvas.height = chartH * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.scale(scale, scale)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, chartW, chartH)
      ctx.drawImage(img, 0, 0)

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
      if (blob) downloadBlob(blob, `timeline-${new Date().toISOString().slice(0, 10)}.png`)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  function printPdf() {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const xml = new XMLSerializer().serializeToString(clone)
    const w = window.open("", "_blank", "noopener,noreferrer")
    if (!w) return
    w.document.open()
    w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Timeline export</title>
    <style>
      body { margin: 0; padding: 24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
      .wrap { max-width: 1100px; margin: 0 auto; }
      svg { width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 12px; }
      @media print { body { padding: 0; } svg { border: 0; } }
    </style>
  </head>
  <body>
    <div class="wrap">${xml}</div>
    <script>setTimeout(() => window.print(), 50);</script>
  </body>
</html>`)
    w.document.close()
  }

  return (
    <Card className={cn("py-0", className)}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportSvg}>
              <Download className="h-4 w-4" />
              Export SVG
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportPng()}>
              <Download className="h-4 w-4" />
              Export image
            </Button>
            <Button variant="outline" size="sm" onClick={printPdf}>
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        </div>
        <div className="text-sm text-neutral-600">
          Drag a bar to reschedule. Use the small handles to resize. Critical path tasks are highlighted.
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid gap-0 rounded-xl border bg-white" style={{ gridTemplateColumns: `${leftW}px 1fr` }}>
              <div className="border-r bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">Task</div>
              <div className="bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">
                Timeline (weeks)
              </div>

              <div className="border-r">
                <ul>
                  {local.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-4"
                      style={{ height: rowH }}
                    >
                      <div className={cn("min-w-0", critical.has(t.id) ? "text-red-700" : "text-neutral-900")}>
                        <div className="text-sm font-medium truncate">{t.name}</div>
                        <div className="text-xs text-neutral-600 mt-0.5">
                          {t.start} → {t.end}
                        </div>
                      </div>
                      {t.isMilestone ? (
                        <span className="ml-auto text-[10px] rounded-full border px-2 py-1 text-neutral-700 bg-white">
                          Milestone
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <svg
                  ref={svgRef}
                  width={chartW}
                  height={chartH}
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="block"
                  role="img"
                  aria-label="Gantt chart"
                >
                  {/* header ticks */}
                  <g>
                    <rect x={0} y={0} width={chartW} height={topH} fill="#fafafa" />
                    {weeks.map((w) => {
                      const x = dayToX(w.day)
                      return (
                        <g key={w.day}>
                          <line x1={x} y1={0} x2={x} y2={chartH} stroke="#e5e7eb" strokeWidth={1} />
                          <text x={x + 4} y={24} fontSize={11} fill="#525252">
                            {w.label}
                          </text>
                        </g>
                      )
                    })}
                    <line x1={0} y1={topH} x2={chartW} y2={topH} stroke="#e5e7eb" strokeWidth={1} />
                  </g>

                  {/* dependencies */}
                  <g>
                    {local.flatMap((t, idx) => {
                      const deps = t.dependencies ?? []
                      if (!deps.length) return []
                      const y = topH + idx * rowH + rowH / 2
                      const sx = dayToX(isoToDay(t.start))
                      return deps.map((depId) => {
                        const pIndex = local.findIndex((x) => x.id === depId)
                        if (pIndex < 0) return null
                        const p = local[pIndex]
                        const px = dayToX(isoToDay(p.end))
                        const py = topH + pIndex * rowH + rowH / 2
                        const mid = (px + sx) / 2
                        const d = `M ${px} ${py} C ${mid} ${py}, ${mid} ${y}, ${sx} ${y}`
                        return (
                          <path
                            key={`${depId}->${t.id}`}
                            d={d}
                            fill="none"
                            stroke="#a3a3a3"
                            strokeWidth={1.5}
                            markerEnd="url(#arrow)"
                            opacity={0.9}
                          />
                        )
                      })
                    })}
                    <defs>
                      <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
                        <polygon points="0 0, 7 3.5, 0 7" fill="#a3a3a3" />
                      </marker>
                    </defs>
                  </g>

                  {/* rows */}
                  <g>
                    {local.map((t, idx) => {
                      const y0 = topH + idx * rowH
                      const yMid = y0 + rowH / 2
                      const startDay = isoToDay(t.start)
                      const endDay = Math.max(startDay, isoToDay(t.end))
                      const baseStartDay = t.baselineStart ? isoToDay(t.baselineStart) : startDay
                      const baseEndDay = t.baselineEnd ? Math.max(baseStartDay, isoToDay(t.baselineEnd)) : endDay

                      const x = dayToX(startDay)
                      const w = Math.max(1, dayToX(endDay) - dayToX(startDay))

                      const bx = dayToX(baseStartDay)
                      const bw = Math.max(1, dayToX(baseEndDay) - dayToX(baseStartDay))

                      const isCritical = critical.has(t.id)
                      const isMilestone = Boolean(t.isMilestone) || (t.start === t.end)

                      return (
                        <g key={t.id}>
                          <line x1={0} y1={y0 + rowH} x2={chartW} y2={y0 + rowH} stroke="#f5f5f5" />

                          {/* baseline */}
                          {!isMilestone ? (
                            <rect
                              x={bx}
                              y={yMid - 6}
                              width={bw}
                              height={8}
                              rx={4}
                              fill="#e5e7eb"
                              stroke="#d4d4d4"
                            />
                          ) : null}

                          {/* actual */}
                          {isMilestone ? (
                            <>
                              <rect
                                x={x - 5}
                                y={yMid - 5}
                                width={10}
                                height={10}
                                fill={isCritical ? "#dc2626" : "#111827"}
                                transform={`rotate(45 ${x} ${yMid})`}
                                rx={2}
                              />
                            </>
                          ) : (
                            <>
                              <rect
                                x={x}
                                y={yMid - 10}
                                width={w}
                                height={16}
                                rx={8}
                                fill={isCritical ? "#fee2e2" : "#111827"}
                                stroke={isCritical ? "#dc2626" : "#111827"}
                                strokeWidth={1}
                                style={{ cursor: "grab" }}
                                onPointerDown={(e) => beginDrag(e, t.id, "move")}
                              />

                              {/* resize handles */}
                              <rect
                                x={x - 4}
                                y={yMid - 10}
                                width={8}
                                height={16}
                                rx={4}
                                fill="#ffffff"
                                opacity={0.0001}
                                style={{ cursor: "ew-resize" }}
                                onPointerDown={(e) => beginDrag(e, t.id, "resize-left")}
                              />
                              <rect
                                x={x + w - 4}
                                y={yMid - 10}
                                width={8}
                                height={16}
                                rx={4}
                                fill="#ffffff"
                                opacity={0.0001}
                                style={{ cursor: "ew-resize" }}
                                onPointerDown={(e) => beginDrag(e, t.id, "resize-right")}
                              />
                            </>
                          )}
                        </g>
                      )
                    })}
                  </g>
                </svg>

                {drag ? (
                  <div className="pointer-events-none absolute right-3 top-3 rounded-md border bg-white px-3 py-2 text-xs text-neutral-700 shadow-sm">
                    Dragging…
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 text-xs text-neutral-600">
              <span className="font-medium text-neutral-900">Legend:</span>{" "}
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-6 rounded bg-neutral-900" /> Actual
                <span className="inline-block h-2 w-6 rounded bg-neutral-200 border" /> Baseline
                <span className="inline-block h-3 w-3 rotate-45 bg-red-600" /> Critical milestone
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

