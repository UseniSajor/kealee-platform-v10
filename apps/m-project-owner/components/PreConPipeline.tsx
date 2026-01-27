'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PipelineStats {
  intake: number
  design: number
  approved: number
  marketplace: number
  awarded: number
  completed: number
}

interface PreConProject {
  id: string
  name: string
  phase: string
  category: string
  suggestedRetailPrice?: number
  designPackageTier?: string
  createdAt: string
  updatedAt: string
  designConcepts?: { id: string; name: string; primaryImageUrl?: string }[]
  bids?: { id: string; bidAmount: number; contractorName?: string }[]
}

interface PreConPipelineProps {
  pipeline: PipelineStats
  recentProjects: PreConProject[]
  pendingFees?: {
    count: number
    total: number
  }
}

const PHASE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  INTAKE: { label: 'Intake', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  DESIGN_IN_PROGRESS: { label: 'Design', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  DESIGN_REVIEW: { label: 'Review', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  DESIGN_APPROVED: { label: 'Approved', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  SRP_GENERATED: { label: 'Priced', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  MARKETPLACE_READY: { label: 'Marketplace', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  BIDDING_OPEN: { label: 'Bidding', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  AWARDED: { label: 'Awarded', color: 'text-green-600', bgColor: 'bg-green-100' },
  CONTRACT_PENDING: { label: 'Contract', color: 'text-green-600', bgColor: 'bg-green-100' },
  CONTRACT_RATIFIED: { label: 'Ratified', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  COMPLETED: { label: 'Complete', color: 'text-emerald-700', bgColor: 'bg-emerald-200' },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function PreConPipeline({ pipeline, recentProjects, pendingFees }: PreConPipelineProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'recent'>('pipeline')

  const pipelineStages = [
    { key: 'intake', label: 'Intake', count: pipeline.intake, icon: '📝' },
    { key: 'design', label: 'Design', count: pipeline.design, icon: '🎨' },
    { key: 'approved', label: 'Approved', count: pipeline.approved, icon: '✅' },
    { key: 'marketplace', label: 'Marketplace', count: pipeline.marketplace, icon: '🏪' },
    { key: 'awarded', label: 'Awarded', count: pipeline.awarded, icon: '🏆' },
    { key: 'completed', label: 'Completed', count: pipeline.completed, icon: '🎉' },
  ]

  const totalActive = pipeline.intake + pipeline.design + pipeline.approved + pipeline.marketplace + pipeline.awarded

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pre-Construction Pipeline</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalActive} active project{totalActive !== 1 ? 's' : ''} in progress
            </p>
          </div>
          <Link
            href="/precon/new"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Project
          </Link>
        </div>

        {/* Pending Fees Alert */}
        {pendingFees && pendingFees.count > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            <span>⚠️</span>
            <span>
              {pendingFees.count} pending fee{pendingFees.count !== 1 ? 's' : ''} totaling{' '}
              <strong>{formatCurrency(pendingFees.total)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'pipeline'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pipeline View
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'recent'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Recent Projects
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'pipeline' ? (
          /* Pipeline Stages */
          <div className="space-y-3">
            {pipelineStages.map((stage, index) => (
              <div key={stage.key} className="relative">
                <div className="flex items-center gap-4">
                  {/* Stage Icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {stage.icon}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{stage.label}</span>
                      <span className="text-lg font-semibold text-gray-900">{stage.count}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0
                            ? 'bg-gray-400'
                            : index === 1
                            ? 'bg-blue-500'
                            : index === 2
                            ? 'bg-purple-500'
                            : index === 3
                            ? 'bg-orange-500'
                            : index === 4
                            ? 'bg-green-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${totalActive > 0 ? (stage.count / totalActive) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < pipelineStages.length - 1 && (
                  <div className="absolute left-5 top-10 w-px h-3 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Recent Projects List */
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No projects yet.</p>
                <Link href="/precon/new" className="text-indigo-600 hover:underline mt-2 inline-block">
                  Start your first project →
                </Link>
              </div>
            ) : (
              recentProjects.map((project) => {
                const phaseConfig = PHASE_CONFIG[project.phase] || PHASE_CONFIG.INTAKE
                return (
                  <Link
                    key={project.id}
                    href={`/precon/${project.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{project.category}</span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${phaseConfig.bgColor} ${phaseConfig.color}`}
                          >
                            {phaseConfig.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {project.suggestedRetailPrice && (
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(project.suggestedRetailPrice)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Updated {formatDate(project.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      {project.designConcepts && project.designConcepts.length > 0 && (
                        <span>🎨 {project.designConcepts.length} concept{project.designConcepts.length !== 1 ? 's' : ''}</span>
                      )}
                      {project.bids && project.bids.length > 0 && (
                        <span>📋 {project.bids.length} bid{project.bids.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <Link
          href="/precon"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View all pre-con projects →
        </Link>
      </div>
    </div>
  )
}

export default PreConPipeline
