'use client'

/**
 * /project/[id]/engagements — Owner Professional Engagement Hub
 *
 * Lists active professional engagements (architect, PM, engineer, legal)
 * and surfaces the engagement_creation revenue hook to set up managed
 * engagements via Kealee's professional network.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { RevenueHookModal, RevenueHookInline, type HookTier } from '@kealee/core-hooks'

interface Engagement {
  id: string
  professionalType: string
  professionalName: string
  status: string
  startDate?: string
}

const TYPE_LABELS: Record<string, string> = {
  ARCHITECT:        'Architect',
  ENGINEER:         'Engineer',
  PROJECT_MANAGER:  'Project Manager',
  LEGAL:            'Legal Counsel',
  FINANCIAL:        'Financial Advisor',
  INSPECTOR:        'Inspector',
}

const STATUS_COLORS: Record<string, React.CSSProperties> = {
  ACTIVE:   { backgroundColor: 'rgba(56,161,105,0.1)',   color: '#38A169' },
  PENDING:  { backgroundColor: 'rgba(232,121,58,0.1)',   color: '#E8793A' },
  COMPLETE: { backgroundColor: 'rgba(42,191,191,0.1)',   color: '#2ABFBF' },
  PAUSED:   { backgroundColor: 'rgba(160,174,192,0.1)',  color: '#9CA3AF' },
}

export default function ProjectEngagementsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [showHook, setShowHook] = useState(false)

  useEffect(() => {
    if (!projectId) return
    apiFetch<{ engagements: Engagement[] }>(`/projects/${projectId}/engagements`)
      .then(res => setEngagements(res.engagements ?? []))
      .catch(() => setEngagements([]))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleSelect = (_tier: HookTier) => {
    setShowHook(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href={`/project/${projectId}/pm`}
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to PM
          </Link>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Professional Engagements
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Architects, engineers, PMs, and advisors assigned to this project
          </p>
        </div>
        <button
          onClick={() => setShowHook(true)}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          <Plus className="h-4 w-4" />
          Add Professional
        </button>
      </div>

      {/* Engagement list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : engagements.length > 0 ? (
        <div className="space-y-3 mb-8">
          {engagements.map(eng => {
            const statusStyle = STATUS_COLORS[eng.status] ?? STATUS_COLORS.PENDING
            return (
              <div
                key={eng.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1A2B4A' }}>
                    {eng.professionalName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABELS[eng.professionalType] ?? eng.professionalType}
                    {eng.startDate && ` · Since ${new Date(eng.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={statusStyle}
                >
                  {eng.status}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
          <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No professionals engaged yet</p>
          <p className="mt-1 text-xs text-gray-400">Add an architect, PM, or other specialist to get started</p>
        </div>
      )}

      {/* engagement_creation revenue hook — inline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
            Managed Engagements via Kealee
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Kealee sources, vets, and manages professionals — so you don&apos;t have to
          </p>
        </div>
        <div className="p-6">
          <RevenueHookInline
            stage="engagement_creation"
            projectId={projectId}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* Modal for "Add Professional" button */}
      {showHook && (
        <RevenueHookModal
          stage="engagement_creation"
          projectId={projectId}
          onSelect={handleSelect}
          onDismiss={() => setShowHook(false)}
        />
      )}
    </div>
  )
}
