'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, CheckSquare, MessageSquare, Package,
  Search, FileText, AlertCircle, DollarSign, ChevronRight
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PMStats {
  openRFIs: number
  openSubmittals: number
  pendingInspections: number
  scheduledTasks: number
  openChangeOrders: number
  pendingMilestones: number
}

type PMTab = 'schedule' | 'milestones' | 'rfis' | 'submittals' | 'inspections' | 'daily-logs' | 'change-orders'

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: PMTab; label: string; icon: React.ReactNode; href: string }[] = [
  { id: 'schedule',      label: 'Schedule',       icon: <Calendar className="h-4 w-4" />,     href: 'schedule' },
  { id: 'milestones',    label: 'Milestones',     icon: <CheckSquare className="h-4 w-4" />,  href: 'milestones' },
  { id: 'rfis',          label: 'RFIs',           icon: <MessageSquare className="h-4 w-4" />, href: 'rfis' },
  { id: 'submittals',    label: 'Submittals',     icon: <Package className="h-4 w-4" />,      href: 'submittals' },
  { id: 'inspections',   label: 'Inspections',    icon: <Search className="h-4 w-4" />,       href: 'inspections' },
  { id: 'daily-logs',    label: 'Daily Logs',     icon: <FileText className="h-4 w-4" />,     href: 'field' },
  { id: 'change-orders', label: 'Change Orders',  icon: <AlertCircle className="h-4 w-4" />, href: 'budget' },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, href }: { label: string; value: number; color: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-teal-200 hover:shadow-sm"
    >
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-teal-400" />
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PMDashboardPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [stats, setStats] = useState<PMStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    Promise.all([
      apiFetch<{ stats: { open: number } }>(`/pm/projects/${projectId}/rfis/stats`).catch(() => ({ stats: { open: 0 } })),
      apiFetch<{ stats: { open: number } }>(`/pm/projects/${projectId}/submittals/stats`).catch(() => ({ stats: { open: 0 } })),
      apiFetch<{ stats: { pending: number } }>(`/pm/projects/${projectId}/inspections/stats`).catch(() => ({ stats: { pending: 0 } })),
    ]).then(([rfiRes, subRes, inspRes]) => {
      setStats({
        openRFIs: (rfiRes as any).stats?.open ?? 0,
        openSubmittals: (subRes as any).stats?.open ?? 0,
        pendingInspections: (inspRes as any).stats?.pending ?? 0,
        scheduledTasks: 0,
        openChangeOrders: 0,
        pendingMilestones: 0,
      })
    }).finally(() => setLoading(false))
  }, [projectId])

  const base = `/portal-contractor/project/${projectId}`

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
          Construction OS
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Project management — schedule, RFIs, submittals, inspections, logs
        </p>
      </div>

      {/* Quick stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Open RFIs" value={stats?.openRFIs ?? 0} color="#E8793A" href={`${base}/rfis`} />
          <StatCard label="Submittals" value={stats?.openSubmittals ?? 0} color="#2ABFBF" href={`${base}/submittals`} />
          <StatCard label="Inspections" value={stats?.pendingInspections ?? 0} color="#38A169" href={`${base}/inspections`} />
          <StatCard label="Tasks" value={stats?.scheduledTasks ?? 0} color="#1A2B4A" href={`${base}/schedule`} />
          <StatCard label="Change Orders" value={stats?.openChangeOrders ?? 0} color="#E8793A" href={`${base}/budget`} />
          <StatCard label="Milestones" value={stats?.pendingMilestones ?? 0} color="#2ABFBF" href={`${base}/field`} />
        </div>
      )}

      {/* Module nav grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TABS.map(tab => (
          <Link
            key={tab.id}
            href={`${base}/${tab.href}`}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-teal-300 hover:shadow-sm"
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors group-hover:opacity-90"
              style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
            >
              {tab.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{tab.label}</p>
              <p className="text-xs text-gray-400">View & manage</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-teal-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
