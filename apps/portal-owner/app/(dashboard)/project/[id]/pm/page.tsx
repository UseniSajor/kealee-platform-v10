'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, CheckSquare, MessageSquare, Package,
  Search, FileText, BarChart3, ChevronRight, AlertCircle, Users
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { RevenueHookModal, type HookTier } from '@kealee/core-hooks'

// Owner PM view — read-heavy, no contractor-only actions

interface PMSummary {
  openRFIs: number
  pendingApprovals: number
  upcomingInspections: number
  activeMilestones: number
  budgetUtilization: number
  todayLogCount: number
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function OwnerPMPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<PMSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssignmentHook, setShowAssignmentHook] = useState(false)

  useEffect(() => {
    if (!projectId) return
    Promise.all([
      apiFetch<any>(`/pm/projects/${projectId}/rfis/stats`).catch(() => null),
      apiFetch<any>(`/pm/projects/${projectId}/milestones`).catch(() => null),
      apiFetch<any>(`/pm/projects/${projectId}/inspections/stats`).catch(() => null),
    ]).then(([rfis, milestones, inspections]) => {
      setSummary({
        openRFIs: rfis?.stats?.open ?? 0,
        pendingApprovals: milestones?.milestones?.filter((m: any) => m.status === 'SUBMITTED').length ?? 0,
        upcomingInspections: inspections?.stats?.pending ?? 0,
        activeMilestones: milestones?.milestones?.filter((m: any) => m.status === 'PENDING').length ?? 0,
        budgetUtilization: 0,
        todayLogCount: 0,
      })
    }).finally(() => setLoading(false))
  }, [projectId])

  const ownerBase = `/portal-owner/project/${projectId}`

  const MODULES = [
    { icon: <Calendar className="h-5 w-5" />, label: 'Schedule', sub: 'Tasks & timeline', href: `${ownerBase}/construction`, color: '#2ABFBF' },
    { icon: <CheckSquare className="h-5 w-5" />, label: 'Milestones', sub: 'Progress & approvals', href: `${ownerBase}/construction`, color: '#38A169' },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'RFIs', sub: 'Requests for information', href: `${ownerBase}/construction`, color: '#E8793A' },
    { icon: <Package className="h-5 w-5" />, label: 'Submittals', sub: 'Drawings & approvals', href: `${ownerBase}/construction`, color: '#1A2B4A' },
    { icon: <Search className="h-5 w-5" />, label: 'Inspections', sub: 'Code & quality checks', href: `${ownerBase}/construction`, color: '#2ABFBF' },
    { icon: <FileText className="h-5 w-5" />, label: 'Daily Logs', sub: 'Site activity', href: `${ownerBase}/construction`, color: '#38A169' },
    { icon: <AlertCircle className="h-5 w-5" />, label: 'Change Orders', sub: 'Scope changes', href: `${ownerBase}/construction`, color: '#E8793A' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Budget', sub: 'Cost tracking', href: `${ownerBase}/construction`, color: '#1A2B4A' },
    { icon: <Users className="h-5 w-5" />, label: 'Engagements', sub: 'Professionals & advisors', href: `${ownerBase}/engagements`, color: '#2ABFBF' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
          Project Management Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time visibility into your construction project
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label="Open RFIs" value={summary?.openRFIs ?? 0} color="#E8793A" />
          <SummaryCard label="Pending Approvals" value={summary?.pendingApprovals ?? 0} color="#2ABFBF" />
          <SummaryCard label="Inspections" value={summary?.upcomingInspections ?? 0} color="#38A169" />
          <SummaryCard label="Active Milestones" value={summary?.activeMilestones ?? 0} color="#1A2B4A" />
          <SummaryCard label="Budget Used" value={`${summary?.budgetUtilization ?? 0}%`} color="#E8793A" />
          <SummaryCard label="Today's Logs" value={summary?.todayLogCount ?? 0} color="#38A169" />
        </div>
      )}

      {/* contractor_assignment hook — show when project has active milestones or pending approvals */}
      {!loading && ((summary?.activeMilestones ?? 0) > 0 || (summary?.pendingApprovals ?? 0) > 0) && (
        <div
          className="mt-6 flex items-center justify-between rounded-xl px-5 py-4 cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0f1c32 100%)', border: '1px solid rgba(42,191,191,0.3)' }}
          onClick={() => setShowAssignmentHook(true)}
        >
          <div>
            <p className="text-sm font-semibold text-white">Assign a Professional to This Project</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Owner&apos;s rep, project manager, or oversight consultant — covered by Kealee
            </p>
          </div>
          <span className="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: '#E8793A' }}>
            Learn More →
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map(mod => (
          <Link
            key={mod.label}
            href={mod.href}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-teal-300 hover:shadow-sm"
          >
            <div
              className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
            >
              {mod.icon}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{mod.label}</p>
              <p className="text-xs text-gray-400">{mod.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {showAssignmentHook && (
        <RevenueHookModal
          stage="contractor_assignment"
          projectId={projectId}
          onSelect={(_tier: HookTier) => setShowAssignmentHook(false)}
          onDismiss={() => setShowAssignmentHook(false)}
        />
      )}
    </div>
  )
}
