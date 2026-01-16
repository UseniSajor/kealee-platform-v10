import Link from "next/link"
import {
  Activity,
  CalendarClock,
  CloudSun,
  FileCheck2,
  Gauge,
  HardHat,
  Sparkles,
  Wallet,
} from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"

type Metric = { label: string; value: string; helper?: string; icon: React.ComponentType<{ className?: string }> }

function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full rounded-full bg-neutral-100">
      <div className="h-2 rounded-full bg-neutral-900" style={{ width: `${safe}%` }} aria-hidden="true" />
      <span className="sr-only">{safe}%</span>
    </div>
  )
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  // Placeholder data (wire to real API when project endpoints are available).
  const projectName = `Project ${projectId}`
  const status: { label: "Active" | "At risk" | "On hold"; className: string } = {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }

  const timelineProgress = 62
  const budgetUsed = 48
  const permits: { label: string; detail: string; className: string } = {
    label: "In review",
    detail: "2 submitted • 1 approved",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  }

  const metrics: Metric[] = [
    { label: "Timeline progress", value: `${timelineProgress}%`, helper: "On track", icon: Gauge },
    { label: "Budget usage", value: `${budgetUsed}%`, helper: "Within plan", icon: Wallet },
    { label: "Permit status", value: permits.label, helper: permits.detail, icon: FileCheck2 },
  ]

  const activity = [
    { at: "Today", text: "Site photo set uploaded to Photos." },
    { at: "Yesterday", text: "Permit resubmission checklist updated." },
    { at: "2 days ago", text: "Contractor invoice received and routed for review." },
    { at: "4 days ago", text: "Schedule updated with revised framing start date." },
  ]

  const milestones = [
    { date: "Jan 18", name: "Finalized submittal package", owner: "PM" },
    { date: "Jan 22", name: "Framing start", owner: "GC" },
    { date: "Jan 29", name: "Rough inspection", owner: "Inspector" },
  ]

  const team = [
    { name: "Avery Johnson", role: "Project Manager" },
    { name: "Morgan Lee", role: "General Contractor" },
    { name: "Riley Chen", role: "Permit Coordinator" },
    { name: "Jordan Patel", role: "Field Supervisor" },
  ]

  const base = `/clients/${clientId}/projects/${projectId}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">Overview</h1>
          <p className="text-sm text-neutral-600 mt-1">
            {projectName} • Client {clientId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/timeline`}>
              <CalendarClock className="h-4 w-4" />
              View timeline
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/documents`}>
              <Sparkles className="h-4 w-4" />
              Upload doc
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Project status</CardTitle>
                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", status.className)}>
                  {status.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-neutral-600">{m.label}</div>
                        <div className="mt-1 text-lg font-semibold text-neutral-900">{m.value}</div>
                        {m.helper ? <div className="mt-1 text-xs text-neutral-600">{m.helper}</div> : null}
                      </div>
                      <div className="rounded-lg border bg-neutral-50 p-2 text-neutral-900">
                        <m.icon className="h-4 w-4" />
                      </div>
                    </div>
                    {m.label === "Timeline progress" ? <div className="mt-3"><ProgressBar value={timelineProgress} /></div> : null}
                    {m.label === "Budget usage" ? <div className="mt-3"><ProgressBar value={budgetUsed} /></div> : null}
                    {m.label === "Permit status" ? (
                      <div className="mt-3">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", permits.className)}>
                          {permits.label}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-neutral-900">Upcoming milestones</div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${base}/timeline`}>Open</Link>
                    </Button>
                  </div>
                  <div className="rounded-xl border bg-white">
                    <ul className="divide-y">
                      {milestones.map((m) => (
                        <li key={`${m.date}-${m.name}`} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-neutral-900 truncate">{m.name}</div>
                              <div className="text-sm text-neutral-600 mt-0.5">{m.owner}</div>
                            </div>
                            <div className="text-sm text-neutral-700 whitespace-nowrap">{m.date}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-neutral-900">Recent activity</div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${base}/activity`}>Open</Link>
                    </Button>
                  </div>
                  <div className="rounded-xl border bg-white">
                    <ul className="divide-y">
                      {activity.map((a) => (
                        <li key={`${a.at}-${a.text}`} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-lg border bg-neutral-50 p-2 text-neutral-900">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-500">{a.at}</div>
                              <div className="text-sm text-neutral-900 mt-0.5">{a.text}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Weather forecast</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
                <div className="rounded-lg border bg-sky-50 p-2 text-sky-700">
                  <CloudSun className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-neutral-900">API integration placeholder</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    Connect a weather provider (e.g. OpenWeather) once the project has a site address / coordinates.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { day: "Thu", hi: "72°", lo: "58°" },
                  { day: "Fri", hi: "70°", lo: "56°" },
                  { day: "Sat", hi: "68°", lo: "55°" },
                ].map((d) => (
                  <div key={d.day} className="rounded-xl border bg-white p-3">
                    <div className="text-sm font-medium text-neutral-900">{d.day}</div>
                    <div className="text-sm text-neutral-700 mt-1">{d.hi}</div>
                    <div className="text-xs text-neutral-500">{d.lo}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Team members</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {team.map((t) => (
                    <li key={t.name} className="px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full border bg-neutral-50 flex items-center justify-center text-sm font-medium text-neutral-900">
                        {initials(t.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900 truncate">{t.name}</div>
                        <div className="text-sm text-neutral-600">{t.role}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => {}}>
                <HardHat className="h-4 w-4" />
                Manage assignments (placeholder)
              </Button>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href={`${base}/permits`}>
                  <FileCheck2 className="h-4 w-4" />
                  Review permits
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href={`${base}/budget`}>
                  <Wallet className="h-4 w-4" />
                  Open budget
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href={`${base}/documents`}>
                  <Sparkles className="h-4 w-4" />
                  Upload documents
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

