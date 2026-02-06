"use client"

import * as React from "react"
import {
  Home,
  Camera,
  FileText,
  MessageSquare,
  CreditCard,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  Percent,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Mock data — Johnson Kitchen Remodel
// ---------------------------------------------------------------------------

const PROJECT = {
  name: "Johnson Kitchen Remodel",
  client: "Sarah & Tom Johnson",
  address: "4821 Elm Creek Dr, Austin TX 78749",
  contractTotal: 87500,
  paidToDate: 43750,
  nextPaymentAmount: 13125,
  nextPaymentDue: new Date("2026-02-20"),
  progressPercent: 62,
  currentPhase: "Cabinetry & Countertops",
  startDate: new Date("2025-11-04"),
  estimatedEnd: new Date("2026-04-15"),
}

const RECENT_PHOTOS: { id: string; label: string; color: string; date: Date }[] = [
  { id: "p1", label: "Demo complete - north wall", color: "bg-amber-200", date: new Date("2026-01-28") },
  { id: "p2", label: "Rough plumbing inspection", color: "bg-sky-200", date: new Date("2026-01-30") },
  { id: "p3", label: "Electrical rough-in", color: "bg-emerald-200", date: new Date("2026-02-01") },
  { id: "p4", label: "Cabinet layout mock-up", color: "bg-violet-200", date: new Date("2026-02-04") },
]

const PENDING_APPROVALS: { id: string; type: "change_order" | "selection"; title: string; amount?: number; submittedAt: Date }[] = [
  { id: "a1", type: "change_order", title: "CO-03: Upgrade to quartz countertops", amount: 2800, submittedAt: new Date("2026-02-02") },
  { id: "a2", type: "selection", title: "Backsplash tile selection (3 options)", submittedAt: new Date("2026-02-03") },
  { id: "a3", type: "change_order", title: "CO-04: Add under-cabinet lighting", amount: 1150, submittedAt: new Date("2026-02-05") },
]

const UPCOMING_SCHEDULE: { id: string; title: string; date: Date; type: "milestone" | "inspection" }[] = [
  { id: "s1", title: "Cabinet delivery & install begins", date: new Date("2026-02-10"), type: "milestone" },
  { id: "s2", title: "Plumbing rough-in inspection", date: new Date("2026-02-14"), type: "inspection" },
  { id: "s3", title: "Countertop template", date: new Date("2026-02-21"), type: "milestone" },
]

const SHARED_DOCUMENTS: { id: string; name: string; sharedAt: Date }[] = [
  { id: "d1", name: "Signed Contract.pdf", sharedAt: new Date("2025-11-04") },
  { id: "d2", name: "Change Order CO-02 (approved).pdf", sharedAt: new Date("2026-01-15") },
  { id: "d3", name: "Selections Worksheet.xlsx", sharedAt: new Date("2026-01-22") },
  { id: "d4", name: "January Progress Report.pdf", sharedAt: new Date("2026-02-01") },
]

const MESSAGES = {
  unread: 3,
  latestFrom: "Sarah Johnson",
  latestText: "Thanks for the photos! Quick question - will the plumber be on site Thursday?",
  latestAt: new Date("2026-02-05T14:32:00"),
}

// ---------------------------------------------------------------------------
// Toggle helper (reusable within this page)
// ---------------------------------------------------------------------------

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-200 last:border-0">
      <div className="min-w-0 pr-4">
        <div className="font-medium text-neutral-900">{label}</div>
        <div className="text-sm text-neutral-600">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
          checked ? "bg-emerald-600" : "bg-neutral-300"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientPortalPage() {
  const [portalSettings, setPortalSettings] = React.useState({
    photoViewing: true,
    documentAccess: true,
    messaging: true,
    onlinePayments: false,
    changeOrderApproval: true,
    selectionApprovals: true,
  })

  function updateSetting(key: keyof typeof portalSettings, value: boolean) {
    setPortalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const remaining = PROJECT.contractTotal - PROJECT.paidToDate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Portal</h1>
          <p className="text-neutral-600 mt-1">
            Preview and manage what your clients see &mdash; progress, documents, selections, and payments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => alert("Open live client portal link (placeholder)")}>
            <Eye className="h-4 w-4" />
            Preview as client
          </Button>
        </div>
      </div>

      {/* Project selector bar */}
      <Card className="py-0">
        <CardContent className="py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-neutral-500" />
              <div>
                <div className="font-medium text-neutral-900">{PROJECT.name}</div>
                <div className="text-sm text-neutral-600">{PROJECT.client} &mdash; {PROJECT.address}</div>
              </div>
            </div>
            <div className="text-sm text-neutral-600">
              {format(PROJECT.startDate, "MMM d, yyyy")} &ndash; {format(PROJECT.estimatedEnd, "MMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Portal preview — what the client sees                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Project Progress */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4" /> Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {/* Circular indicator */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e5e5" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - PROJECT.progressPercent / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums">{PROJECT.progressPercent}%</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-sm text-neutral-600">Current phase</div>
                    <div className="font-medium text-neutral-900">{PROJECT.currentPhase}</div>
                  </div>
                  {/* Bar progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-600">Overall completion</span>
                      <span className="font-medium tabular-nums">{PROJECT.progressPercent}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${PROJECT.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
                    <span>Start: {format(PROJECT.startDate, "MMM d, yyyy")}</span>
                    <span>Est. completion: {format(PROJECT.estimatedEnd, "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Photos */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" /> Recent Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {RECENT_PHOTOS.map((photo) => (
                  <div key={photo.id} className="rounded-xl border bg-white overflow-hidden">
                    <div className={cn("aspect-square flex items-center justify-center", photo.color)}>
                      <Camera className="h-8 w-8 text-neutral-500/40" />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium text-neutral-900 truncate">{photo.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{format(photo.date, "MMM d, yyyy")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {PENDING_APPROVALS.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900">{item.title}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {item.type === "change_order" ? "Change Order" : "Selection"} &middot; Submitted {format(item.submittedAt, "MMM d, yyyy")}
                            {item.amount != null ? ` \u00b7 ${money(item.amount)}` : ""}
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-full border bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting
                        </span>
                      </div>
                    </li>
                  ))}
                  {!PENDING_APPROVALS.length ? (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No pending approvals.</li>
                  ) : null}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Upcoming Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {UPCOMING_SCHEDULE.map((event) => (
                    <li key={event.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              event.type === "inspection" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {event.type === "inspection" ? <Eye className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">{event.title}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">
                              {event.type === "inspection" ? "Inspection" : "Milestone"}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium tabular-nums text-neutral-700 whitespace-nowrap">
                          {format(event.date, "MMM d")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="rounded-xl border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Total contract</span>
                  <span className="font-medium tabular-nums">{money(PROJECT.contractTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Paid to date</span>
                  <span className="font-medium tabular-nums text-emerald-700">{money(PROJECT.paidToDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Remaining</span>
                  <span className="font-medium tabular-nums">{money(remaining)}</span>
                </div>
                {/* Mini progress bar */}
                <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(PROJECT.paidToDate / PROJECT.contractTotal) * 100}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Next payment due</div>
                <div className="mt-1 text-lg font-bold tabular-nums">{money(PROJECT.nextPaymentAmount)}</div>
                <div className="text-xs text-neutral-600 mt-1">{format(PROJECT.nextPaymentDue, "MMMM d, yyyy")}</div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="rounded-xl border bg-white">
                <ul className="divide-y">
                  {SHARED_DOCUMENTS.map((doc) => (
                    <li key={doc.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate text-sm">{doc.name}</div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">Shared {format(doc.sharedAt, "MMM d, yyyy")}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => alert(`Download ${doc.name} (placeholder)`)}>
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Unread messages</span>
                  <span className="inline-flex items-center rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white tabular-nums">
                    {MESSAGES.unread}
                  </span>
                </div>
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs text-neutral-500">{MESSAGES.latestFrom} &middot; {format(MESSAGES.latestAt, "MMM d, h:mm a")}</div>
                  <div className="text-sm text-neutral-900 mt-1">{MESSAGES.latestText}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => alert("Open message thread (placeholder)")}>
                <MessageSquare className="h-4 w-4" />
                Open conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Portal configuration / settings                                    */}
      {/* ------------------------------------------------------------------ */}

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Portal Settings</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-neutral-600 mb-4">
            Control which features are visible to your clients in their portal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <ToggleSetting
              label="Client photo viewing"
              description="Allow clients to browse site photos"
              checked={portalSettings.photoViewing}
              onChange={(v) => updateSetting("photoViewing", v)}
            />
            <ToggleSetting
              label="Client document access"
              description="Share documents such as contracts and reports"
              checked={portalSettings.documentAccess}
              onChange={(v) => updateSetting("documentAccess", v)}
            />
            <ToggleSetting
              label="Client messaging"
              description="Enable in-portal messaging between PM and client"
              checked={portalSettings.messaging}
              onChange={(v) => updateSetting("messaging", v)}
            />
            <ToggleSetting
              label="Online payments"
              description="Allow clients to submit payments through the portal"
              checked={portalSettings.onlinePayments}
              onChange={(v) => updateSetting("onlinePayments", v)}
            />
            <ToggleSetting
              label="Change order approval"
              description="Clients can review and approve change orders"
              checked={portalSettings.changeOrderApproval}
              onChange={(v) => updateSetting("changeOrderApproval", v)}
            />
            <ToggleSetting
              label="Selection approvals"
              description="Clients can review and approve material selections"
              checked={portalSettings.selectionApprovals}
              onChange={(v) => updateSetting("selectionApprovals", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
