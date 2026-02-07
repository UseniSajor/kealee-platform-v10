'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  DollarSign,
  FileText,
  Image,
  MessageSquare,
  FolderOpen,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { Card, Badge, Button, Skeleton, Modal } from '@kealee/ui'
import {
  getClientDecisions,
  getBudget,
  resolveDecision,
  type ClientDecision,
  type BudgetData,
  type ProjectInfo,
} from '../../lib/client-api'
import { supabase } from '../../lib/supabase'

// ---------------------------------------------------------------------------
// Circular Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 10,
}: {
  percent: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2563eb"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{percent}%</span>
        <span className="text-xs text-gray-500">complete</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Skeleton (loading state)
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="rounded" width="100%" height={180} />
      <Skeleton variant="rounded" width="100%" height={80} />
      <Skeleton variant="rounded" width="100%" height={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton variant="rounded" height={200} />
        <Skeleton variant="rounded" height={200} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ROW 1 — Project Status Hero
// ---------------------------------------------------------------------------

function ProjectHero({
  project,
  projects,
  onSwitch,
  percentComplete,
}: {
  project: ProjectInfo
  projects: ProjectInfo[]
  onSwitch: (id: string) => void
  percentComplete: number
}) {
  const [selectorOpen, setSelectorOpen] = useState(false)

  const statusLabel: Record<string, string> = {
    ACTIVE: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
    PLANNING: 'Planning',
    PRE_CONSTRUCTION: 'Pre-Construction',
  }

  const statusVariant: Record<string, 'primary' | 'success' | 'warning'> = {
    ACTIVE: 'primary',
    COMPLETED: 'success',
    ON_HOLD: 'warning',
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        <ProgressRing percent={percentComplete} />

        <div className="flex-1 text-center sm:text-left">
          {projects.length > 1 ? (
            <div className="relative mb-2 inline-block">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-blue-600"
              >
                {project.name}
                <ChevronDown className="h-5 w-5" />
              </button>
              {selectorOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[240px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSwitch(p.id)
                        setSelectorOpen(false)
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        p.id === project.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <h1 className="mb-2 text-2xl font-bold text-gray-900">{project.name}</h1>
          )}

          {project.description && (
            <p className="mb-3 text-sm text-gray-500">{project.description}</p>
          )}

          <Badge variant={statusVariant[project.status ?? ''] ?? 'default'} size="md">
            {statusLabel[project.status ?? ''] ?? project.status ?? 'Active'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ROW 2 — Action Required Banner
// ---------------------------------------------------------------------------

function ApprovalBanner({
  decisions,
  onApprove,
}: {
  decisions: ClientDecision[]
  onApprove: (id: string) => void
}) {
  if (decisions.length === 0) return null

  const pending = decisions.filter((d) => !d.decision)
  if (pending.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h2 className="text-base font-semibold text-amber-900">
          You have {pending.length} item{pending.length !== 1 ? 's' : ''} needing
          your approval
        </h2>
      </div>

      <div className="space-y-3">
        {pending.slice(0, 3).map((d) => (
          <ApprovalCard key={d.id} decision={d} onApprove={onApprove} />
        ))}
      </div>

      {pending.length > 3 && (
        <Link
          href="/approvals"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900"
        >
          View all {pending.length} approvals
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function ApprovalCard({
  decision,
  onApprove,
}: {
  decision: ClientDecision
  onApprove: (id: string) => void
}) {
  const ctx = decision.context as any

  if (decision.type === 'payment_release') {
    const amount = ctx?.amount
    const milestone = ctx?.milestoneName ?? 'Milestone'
    const passed = ctx?.inspectionPassed

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-gray-900">
            Release {amount ? `$${Number(amount).toLocaleString()}` : 'payment'} for{' '}
            {milestone}?
          </p>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span>{milestone}</span>
            {amount && <span className="font-medium text-gray-700">${Number(amount).toLocaleString()}</span>}
            {passed && (
              <span className="flex items-center gap-1 text-green-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Inspection passed
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/approvals#${decision.id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            View Details
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApprove(decision.id)}
          >
            Approve Payment
          </Button>
        </div>
      </div>
    )
  }

  // change_order or generic
  const costImpact = ctx?.costImpact
  const aiRec = ctx?.aiRecommendation

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-gray-900">{decision.title}</p>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
          {costImpact && (
            <span className={costImpact > 0 ? 'text-red-600' : 'text-green-600'}>
              {costImpact > 0 ? '+' : ''}${Number(costImpact).toLocaleString()}
            </span>
          )}
          {aiRec && <span className="truncate text-gray-400">AI: {aiRec}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onApprove(decision.id)}>
          Decline
        </Button>
        <Button variant="primary" size="sm" onClick={() => onApprove(decision.id)}>
          Approve
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ROW 3 — Project Timeline (shipping-tracker style)
// ---------------------------------------------------------------------------

function ProjectTimeline({ milestones }: { milestones: any[] }) {
  if (!milestones || milestones.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Project Timeline</h2>
        <p className="text-sm text-gray-500">No milestones set up yet.</p>
      </Card>
    )
  }

  const currentIdx = milestones.findIndex(
    (m) => m.status !== 'APPROVED' && m.status !== 'PAID',
  )

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">Project Timeline</h2>

      {/* Horizontal tracker */}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[600px] items-start">
          {milestones.map((m, i) => {
            const isCompleted = m.status === 'APPROVED' || m.status === 'PAID'
            const isCurrent = i === currentIdx
            const isUpcoming = !isCompleted && !isCurrent

            return (
              <div key={m.id} className="flex flex-1 items-start">
                {/* Step + connector */}
                <div className="flex w-full flex-col items-center">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          isCompleted || isCurrent ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-7 w-7 text-green-500" />
                      ) : isCurrent ? (
                        <CircleDot className="h-7 w-7 text-blue-600" />
                      ) : (
                        <Circle className="h-7 w-7 text-gray-300" />
                      )}
                    </div>
                    {i < milestones.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={`mt-2 text-center text-xs font-medium ${
                      isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
                    }`}
                  >
                    {m.name}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current milestone details */}
      {currentIdx >= 0 && (
        <div className="mt-5 rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            Currently: {milestones[currentIdx].name}
          </p>
          {milestones[currentIdx].description && (
            <p className="mt-1 text-sm text-blue-700">{milestones[currentIdx].description}</p>
          )}
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ROW 4 — Budget Overview (simple bar visualization)
// ---------------------------------------------------------------------------

function BudgetOverview({ budget }: { budget: BudgetData | null }) {
  if (!budget?.snapshot) {
    return (
      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Budget Overview</h2>
        <p className="text-sm text-gray-500">No budget data available yet.</p>
      </Card>
    )
  }

  const { totalBudget, totalActual, totalVariance } = budget.snapshot
  const remaining = totalBudget - totalActual
  const spentPercent = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">Budget Overview</h2>

      {/* Large numbers */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500">Total Budget</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">
            ${totalActual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500">Spent</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500">{remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              spentPercent > 90 ? 'bg-red-500' : spentPercent > 75 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${spentPercent}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">
          {spentPercent.toFixed(0)}% used
        </p>
      </div>

      {/* Alerts */}
      {budget.alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {budget.alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                a.severity === 'critical'
                  ? 'bg-red-50 text-red-700'
                  : a.severity === 'warning'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ROW 5 — Recent Updates (Activity Feed)
// ---------------------------------------------------------------------------

function RecentUpdates({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Recent Updates</h2>
        <p className="text-sm text-gray-500">No recent activity.</p>
      </Card>
    )
  }

  const iconMap: Record<string, typeof FileText> = {
    report: FileText,
    inspection: ShieldCheck,
    photo: Image,
    payment: DollarSign,
    default: Clock,
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Updates</h2>
      <ul className="space-y-3">
        {items.slice(0, 8).map((item, i) => {
          const Icon = iconMap[item.type] ?? iconMap.default
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Icon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{item.message}</p>
                <p className="text-xs text-gray-400">{item.timeAgo}</p>
              </div>
              {item.href && (
                <Link
                  href={item.href}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  View
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ROW 6 — Quick Actions
// ---------------------------------------------------------------------------

function QuickActions() {
  const actions = [
    { label: 'Message Team', href: '/projects', icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'View Documents', href: '/documents/upload', icon: FolderOpen, color: 'bg-purple-50 text-purple-600' },
    { label: 'View Photos', href: '/projects', icon: Image, color: 'bg-green-50 text-green-600' },
    { label: 'View Reports', href: '/reports', icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${a.color}`}>
            <a.icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-700">{a.label}</span>
        </Link>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Activity helpers
// ---------------------------------------------------------------------------

interface ActivityItem {
  type: 'report' | 'inspection' | 'photo' | 'payment' | 'default'
  message: string
  timeAgo: string
  href?: string
}

function buildActivityFeed(
  budget: BudgetData | null,
  decisions: ClientDecision[],
): ActivityItem[] {
  const items: ActivityItem[] = []

  // Resolved decisions → activity
  for (const d of decisions.filter((x) => x.decision)) {
    const ago = timeAgo(d.decidedAt ?? d.createdAt)
    if (d.type === 'payment_release') {
      const ctx = d.context as any
      items.push({
        type: 'payment',
        message: `Payment of $${Number(ctx?.amount ?? 0).toLocaleString()} released to contractor`,
        timeAgo: ago,
      })
    } else {
      items.push({
        type: 'default',
        message: `${d.title} — ${d.decision}`,
        timeAgo: ago,
      })
    }
  }

  // Budget transactions → activity
  if (budget?.transactions) {
    for (const t of budget.transactions.slice(0, 5)) {
      items.push({
        type: 'default',
        message: (t.payload as any)?.description ?? t.eventType,
        timeAgo: timeAgo(t.createdAt),
      })
    }
  }

  // Sort by most recent
  return items.slice(0, 10)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(dateStr).toLocaleDateString()
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ClientDashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<ClientDecision[]>([])
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Confirmation modal state
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0]

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Fetch project list
  useEffect(() => {
    if (!userId) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token
      fetch(`${API_URL}/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((data) => {
          const list = data.projects ?? []
          setProjects(list)
          if (list.length > 0) setActiveProjectId(list[0].id)
        })
        .catch(() => {
          // Use empty state
          setLoading(false)
        })
    })
  }, [userId])

  // Fetch project-scoped data when activeProjectId changes
  const fetchProjectData = useCallback(async () => {
    if (!activeProjectId || !userId) return
    setLoading(true)
    setError(null)

    try {
      const [decRes, budRes] = await Promise.allSettled([
        getClientDecisions(userId),
        getBudget(activeProjectId),
      ])

      if (decRes.status === 'fulfilled') setDecisions(decRes.value.decisions)
      if (budRes.status === 'fulfilled') setBudget(budRes.value)

      // Get milestones from the project detail endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const projRes = await fetch(`${API_URL}/projects/${activeProjectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => r.json())
      setMilestones(projRes.project?.milestones ?? projRes.milestones ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeProjectId, userId])

  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  // Handle quick approve from banner
  const handleApprove = (id: string) => {
    setConfirmId(id)
  }

  const confirmApproval = async () => {
    if (!confirmId) return
    setConfirming(true)
    try {
      await resolveDecision(confirmId, { decision: 'approved' })
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === confirmId ? { ...d, decision: 'approved', decidedAt: new Date().toISOString() } : d,
        ),
      )
      setToast({ message: 'Payment approved successfully!', type: 'success' })
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
    } finally {
      setConfirming(false)
      setConfirmId(null)
    }
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Activity feed
  const activityFeed = buildActivityFeed(budget, decisions)

  const percentComplete = activeProject?.percentComplete ?? budget?.snapshot?.percentComplete ?? 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading && projects.length === 0) {
    return <DashboardSkeleton />
  }

  if (projects.length === 0 && !loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">Welcome to Kealee</h2>
        <p className="mt-1 text-sm text-gray-500">You don't have any projects yet.</p>
        <Link href="/projects/new">
          <Button variant="primary" className="mt-4">
            Start Your First Project
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation modal */}
      <Modal isOpen={!!confirmId} onClose={() => setConfirmId(null)} title="Confirm Approval" size="sm">
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to approve this payment? The funds will be released to
          the contractor.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmId(null)}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={confirming} onClick={confirmApproval}>
            Yes, Approve
          </Button>
        </div>
      </Modal>

      {/* ROW 1 — Project Status Hero */}
      {activeProject && (
        <ProjectHero
          project={activeProject}
          projects={projects}
          onSwitch={setActiveProjectId}
          percentComplete={Number(percentComplete)}
        />
      )}

      {/* ROW 2 — Action Required Banner */}
      <ApprovalBanner decisions={decisions} onApprove={handleApprove} />

      {/* ROW 3 — Project Timeline */}
      <ProjectTimeline milestones={milestones} />

      {/* ROW 4 — Budget Overview */}
      <BudgetOverview budget={budget} />

      {/* ROW 5 — Recent Updates */}
      <RecentUpdates items={activityFeed} />

      {/* ROW 6 — Quick Actions */}
      <QuickActions />

      {error && (
        <p className="text-center text-xs text-red-500">
          Some data could not be loaded. Pull down to refresh.
        </p>
      )}
    </div>
  )
}
