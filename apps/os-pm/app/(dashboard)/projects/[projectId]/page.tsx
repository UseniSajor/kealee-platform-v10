"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Building2, Calendar, Camera, CheckCircle2, ClipboardList,
  DollarSign, FileText, HardHat, LayoutGrid, MessageSquare, TrendingUp,
  Users, AlertTriangle, Clock, Hammer, GitMerge, ListChecks, Plus
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"

type Tab = "overview" | "schedule" | "budget" | "documents" | "photos" | "rfis" | "submittals" | "coordination" | "punch-list" | "change-orders" | "daily-logs" | "safety" | "drawings" | "team"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "rfis", label: "RFIs", icon: MessageSquare },
  { id: "submittals", label: "Submittals", icon: ClipboardList },
  { id: "coordination", label: "Coordination", icon: GitMerge },
  { id: "punch-list", label: "Punch List", icon: CheckCircle2 },
  { id: "change-orders", label: "Change Orders", icon: DollarSign },
  { id: "daily-logs", label: "Daily Logs", icon: HardHat },
  { id: "safety", label: "Safety", icon: AlertTriangle },
  { id: "drawings", label: "Drawings", icon: FileText },
  { id: "team", label: "Team", icon: Users },
]

const PROJECT = {
  name: "Riverdale Mixed-Use Development",
  client: "Riverdale Partners LLC",
  address: "1200 River Road, Bethesda, MD 20814",
  status: "active",
  phase: "Rough-In",
  progress: 42,
  startDate: "2025-10-15",
  estimatedEnd: "2026-09-30",
  budget: 4250000,
  spent: 1785000,
  committed: 2890000,
  contractValue: 4250000,
  manager: "Alex Rivera",
  superintendent: "Mike Torres",
}

const MILESTONES = [
  { name: "Permitting Complete", date: "2025-11-20", status: "complete" },
  { name: "Foundation Complete", date: "2026-01-15", status: "complete" },
  { name: "Structural Steel", date: "2026-02-28", status: "in-progress" },
  { name: "Rough-In Complete", date: "2026-04-30", status: "upcoming" },
  { name: "Dry-In / Weathertight", date: "2026-06-15", status: "upcoming" },
  { name: "Substantial Completion", date: "2026-09-30", status: "upcoming" },
]

const RECENT_ACTIVITY = [
  { type: "rfi", text: "RFI-003 answered: Mechanical room clearance", time: "2 hours ago" },
  { type: "submittal", text: "SUB-005 approved: HVAC equipment submittals", time: "4 hours ago" },
  { type: "daily-log", text: "Daily log submitted: 18 crew on-site, framing Level 2", time: "6 hours ago" },
  { type: "change-order", text: "CO-004 pending approval: Added fire suppression zone", time: "1 day ago" },
  { type: "photo", text: "12 new photos uploaded: Structural steel Level 2", time: "1 day ago" },
  { type: "punch", text: "3 punch items resolved, 2 new items added", time: "2 days ago" },
]

const TEAM = [
  { name: "Alex Rivera", role: "Project Manager", company: "Kealee PM" },
  { name: "Mike Torres", role: "Superintendent", company: "Riverdale GC" },
  { name: "Sarah Chen", role: "Architect", company: "Chen Architecture" },
  { name: "James Wright", role: "Structural Engineer", company: "Wright Engineering" },
  { name: "Linda Park", role: "MEP Engineer", company: "Park MEP" },
  { name: "Jake Hernandez", role: "Framing Foreman", company: "Hernandez Framing" },
  { name: "Lisa Dunn", role: "Electrical", company: "Dunn Electric" },
  { name: "Tom Reyes", role: "Plumbing/HVAC", company: "Reyes Mechanical" },
]

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

export default function ProjectDetailPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = React.useState<Tab>("overview")

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{PROJECT.name}</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{PROJECT.client}</span>
            <span>{PROJECT.address}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-3.5 w-3.5" />{tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-lg font-bold">{PROJECT.progress}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted">
                <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${PROJECT.progress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Current Phase: {PROJECT.phase}</span>
                <span>Est. Completion: {PROJECT.estimatedEnd}</span>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Contract Value</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(PROJECT.contractValue)}</div>
              <div className="text-xs text-muted-foreground">Spent: {formatCurrency(PROJECT.spent)}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />Schedule</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">On Track</div>
              <div className="text-xs text-muted-foreground">{PROJECT.startDate} → {PROJECT.estimatedEnd}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><MessageSquare className="h-4 w-4" />Open RFIs</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">4</div>
              <div className="text-xs text-muted-foreground">1 critical, 2 this week</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Punch Items</div>
              <div className="text-2xl font-bold mt-1">8</div>
              <div className="text-xs text-muted-foreground">5 open, 3 in progress</div>
            </CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Milestones */}
            <Card>
              <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MILESTONES.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn(
                        "h-3 w-3 rounded-full shrink-0",
                        m.status === "complete" ? "bg-emerald-500" : m.status === "in-progress" ? "bg-blue-500 animate-pulse" : "bg-muted"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.date}</div>
                      </div>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                        m.status === "complete" ? "bg-emerald-50 text-emerald-700" : m.status === "in-progress" ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"
                      )}>
                        {m.status === "complete" ? "Complete" : m.status === "in-progress" ? "In Progress" : "Upcoming"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {RECENT_ACTIVITY.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{a.text}</div>
                        <div className="text-xs text-muted-foreground">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Summary */}
          <Card>
            <CardHeader><CardTitle className="text-base">Budget Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-sm text-muted-foreground">Contract Value</div>
                  <div className="text-lg font-bold">{formatCurrency(PROJECT.contractValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Committed</div>
                  <div className="text-lg font-bold">{formatCurrency(PROJECT.committed)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Spent to Date</div>
                  <div className="text-lg font-bold">{formatCurrency(PROJECT.spent)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(PROJECT.contractValue - PROJECT.spent)}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Budget Utilization</span>
                  <span>{Math.round((PROJECT.spent / PROJECT.contractValue) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${(PROJECT.spent / PROJECT.contractValue) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other Tabs - Redirect to dedicated pages */}
      {activeTab === "schedule" && (
        <Card><CardContent className="py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Project Schedule</h3>
          <p className="text-sm text-muted-foreground mb-4">View the full Gantt chart and milestone timeline</p>
          <Link href="/schedule"><Button>Open Schedule</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "budget" && (
        <Card><CardContent className="py-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Project Budget</h3>
          <p className="text-sm text-muted-foreground mb-4">Detailed cost tracking, committed costs, and forecasting</p>
          <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mb-6">
            <div className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">Contract</div><div className="text-lg font-bold">{formatCurrency(PROJECT.contractValue)}</div></div>
            <div className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">Spent</div><div className="text-lg font-bold">{formatCurrency(PROJECT.spent)}</div></div>
            <div className="border rounded-lg p-3"><div className="text-xs text-muted-foreground">Remaining</div><div className="text-lg font-bold text-emerald-600">{formatCurrency(PROJECT.contractValue - PROJECT.spent)}</div></div>
          </div>
        </CardContent></Card>
      )}

      {activeTab === "documents" && (
        <Card><CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Project Documents</h3>
          <p className="text-sm text-muted-foreground mb-4">Contracts, submittals, specs, and project files</p>
          <Link href="/documents"><Button>Open Documents</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "photos" && (
        <Card><CardContent className="py-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Project Photos</h3>
          <p className="text-sm text-muted-foreground mb-4">Progress photos, before/after, and daily documentation</p>
          <Link href="/photos"><Button>Open Photos</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "rfis" && (
        <Card><CardContent className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">RFIs</h3>
          <p className="text-sm text-muted-foreground mb-4">Track and respond to Requests for Information</p>
          <Link href="/rfis"><Button>Open RFIs</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "submittals" && (
        <Card><CardContent className="py-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Submittals</h3>
          <p className="text-sm text-muted-foreground mb-4">Review and approve material submittals and shop drawings</p>
          <Link href="/submittals"><Button>Open Submittals</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "coordination" && (
        <div className="space-y-6">
          {/* Open RFIs Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Open RFIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-4">
                <div className="text-3xl font-bold text-amber-600">4</div>
                <div className="text-sm text-muted-foreground">open RFIs for this project</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 border-l-4 border-l-green-500">
                  <div className="text-lg font-bold text-green-700">1</div>
                  <div className="text-xs text-muted-foreground">0-6 days</div>
                </div>
                <div className="border rounded-lg p-3 border-l-4 border-l-amber-500">
                  <div className="text-lg font-bold text-amber-700">2</div>
                  <div className="text-xs text-muted-foreground">7-14 days</div>
                </div>
                <div className="border rounded-lg p-3 border-l-4 border-l-red-500">
                  <div className="text-lg font-bold text-red-700">1</div>
                  <div className="text-xs text-muted-foreground">15+ days (Overdue)</div>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/rfis">
                  <Button variant="outline" size="sm">View All RFIs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Open Submittals Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Open Submittals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-4">
                <div className="text-3xl font-bold text-yellow-600">6</div>
                <div className="text-sm text-muted-foreground">pending/under review submittals</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 border-l-4 border-l-green-500">
                  <div className="text-lg font-bold text-green-700">3</div>
                  <div className="text-xs text-muted-foreground">0-6 days</div>
                </div>
                <div className="border rounded-lg p-3 border-l-4 border-l-amber-500">
                  <div className="text-lg font-bold text-amber-700">2</div>
                  <div className="text-xs text-muted-foreground">7-14 days</div>
                </div>
                <div className="border rounded-lg p-3 border-l-4 border-l-red-500">
                  <div className="text-lg font-bold text-red-700">1</div>
                  <div className="text-xs text-muted-foreground">15+ days (Overdue)</div>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/submittals">
                  <Button variant="outline" size="sm">View All Submittals</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Field Conflicts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Field Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No field conflicts reported</p>
                  <Link href="/field-conflicts/new">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      Report Conflict
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Mobilization Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Mobilization Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No mobilization checklists</p>
                  <Link href="/mobilization/new">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      Create Checklist
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "punch-list" && (
        <Card><CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Punch List</h3>
          <p className="text-sm text-muted-foreground mb-4">Track and resolve punch list items</p>
          <Link href="/punch-list"><Button>Open Punch List</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "change-orders" && (
        <Card><CardContent className="py-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Change Orders</h3>
          <p className="text-sm text-muted-foreground mb-4">Review and approve change orders with cost and schedule impact</p>
          <Link href="/change-orders"><Button>Open Change Orders</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "daily-logs" && (
        <Card><CardContent className="py-12 text-center">
          <HardHat className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Daily Logs</h3>
          <p className="text-sm text-muted-foreground mb-4">Daily field reports with crew, weather, and work progress</p>
          <Link href="/daily-logs"><Button>Open Daily Logs</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "safety" && (
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Safety</h3>
          <p className="text-sm text-muted-foreground mb-4">Incident reports, toolbox talks, and safety compliance</p>
          <Link href="/safety"><Button>Open Safety</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "drawings" && (
        <Card><CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-2">Drawings</h3>
          <p className="text-sm text-muted-foreground mb-4">Drawing sets, revisions, and markup tools</p>
          <Link href="/drawings"><Button>Open Drawings</Button></Link>
        </CardContent></Card>
      )}

      {activeTab === "team" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Project Team</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{member.company}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
