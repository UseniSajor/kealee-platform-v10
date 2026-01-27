'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PreConProject {
  id: string
  name: string
  phase: string
  category: string
  description: string
  suggestedRetailPrice?: number
  designPackageTier: string
  designPackagePaid: boolean
  city?: string
  state?: string
  squareFootage?: number
  createdAt: string
  updatedAt: string
  designConcepts?: any[]
  bids?: any[]
  platformFees?: any[]
}

interface DashboardData {
  totalProjects: number
  activeProjects: number
  phaseCounts: Record<string, number>
  pipeline: {
    intake: number
    design: number
    approved: number
    marketplace: number
    awarded: number
    completed: number
  }
  pendingFees: {
    count: number
    total: number
    items: any[]
  }
  recentProjects: PreConProject[]
}

const PHASE_CONFIG: Record<string, { label: string; color: string; bgColor: string; step: number }> = {
  INTAKE: { label: 'Intake', color: 'text-gray-600', bgColor: 'bg-gray-100', step: 1 },
  DESIGN_IN_PROGRESS: { label: 'Design In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100', step: 2 },
  DESIGN_REVIEW: { label: 'Design Review', color: 'text-blue-600', bgColor: 'bg-blue-100', step: 2 },
  DESIGN_APPROVED: { label: 'Design Approved', color: 'text-purple-600', bgColor: 'bg-purple-100', step: 3 },
  SRP_GENERATED: { label: 'Price Generated', color: 'text-indigo-600', bgColor: 'bg-indigo-100', step: 4 },
  MARKETPLACE_READY: { label: 'Marketplace Ready', color: 'text-orange-600', bgColor: 'bg-orange-100', step: 5 },
  BIDDING_OPEN: { label: 'Accepting Bids', color: 'text-orange-600', bgColor: 'bg-orange-100', step: 5 },
  AWARDED: { label: 'Contractor Awarded', color: 'text-green-600', bgColor: 'bg-green-100', step: 6 },
  CONTRACT_PENDING: { label: 'Contract Pending', color: 'text-green-600', bgColor: 'bg-green-100', step: 6 },
  CONTRACT_RATIFIED: { label: 'Contract Signed', color: 'text-emerald-600', bgColor: 'bg-emerald-100', step: 7 },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-200', step: 8 },
}

const DESIGN_PACKAGE_FEES = {
  BASIC: 199,
  STANDARD: 499,
  PREMIUM: 999,
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PreConListPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [projects, setProjects] = useState<PreConProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // In production, these would be real API calls
      // For now, using mock data structure
      const mockDashboard: DashboardData = {
        totalProjects: 0,
        activeProjects: 0,
        phaseCounts: {},
        pipeline: {
          intake: 0,
          design: 0,
          approved: 0,
          marketplace: 0,
          awarded: 0,
          completed: 0,
        },
        pendingFees: { count: 0, total: 0, items: [] },
        recentProjects: [],
      }
      setDashboard(mockDashboard)
      setProjects([])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => {
        if (filter === 'active') return !['COMPLETED'].includes(p.phase)
        if (filter === 'pending_payment') return p.phase === 'INTAKE' && !p.designPackagePaid
        return p.phase === filter
      })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Pre-Construction Projects</h1>
            </div>
            <Link
              href="/precon/new"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>New Project</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Overview */}
        {dashboard && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { key: 'intake', label: 'Intake', icon: '📝', color: 'bg-gray-500' },
                { key: 'design', label: 'Design', icon: '🎨', color: 'bg-blue-500' },
                { key: 'approved', label: 'Approved', icon: '✅', color: 'bg-purple-500' },
                { key: 'marketplace', label: 'Marketplace', icon: '🏪', color: 'bg-orange-500' },
                { key: 'awarded', label: 'Awarded', icon: '🏆', color: 'bg-green-500' },
                { key: 'completed', label: 'Completed', icon: '🎉', color: 'bg-emerald-600' },
              ].map((stage) => (
                <div
                  key={stage.key}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{stage.icon}</span>
                    <span className="text-sm font-medium text-gray-600">{stage.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.pipeline[stage.key as keyof typeof dashboard.pipeline]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Fees Alert */}
        {dashboard && dashboard.pendingFees.count > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-amber-800">Pending Design Package Fees</p>
                <p className="text-sm text-amber-700">
                  {dashboard.pendingFees.count} project{dashboard.pendingFees.count !== 1 ? 's' : ''} awaiting payment totaling{' '}
                  <strong>{formatCurrency(dashboard.pendingFees.total)}</strong>
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">
              Pay Now
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Projects' },
            { key: 'active', label: 'Active' },
            { key: 'pending_payment', label: 'Pending Payment' },
            { key: 'BIDDING_OPEN', label: 'Accepting Bids' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🏗️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">
              Start your construction journey by creating a new pre-construction project.
            </p>
            <Link
              href="/precon/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <span>+</span>
              <span>Create Your First Project</span>
            </Link>

            {/* Process Overview */}
            <div className="mt-12 text-left">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                How It Works
              </h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <h5 className="font-medium text-gray-900">Submit Project Request</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    Tell us about your project, and choose a design package tier.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <h5 className="font-medium text-gray-900">Review Design Concepts</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    Our team creates custom designs. Pick your favorite and approve it.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <h5 className="font-medium text-gray-900">Get Contractor Bids</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    Qualified contractors compete for your project. Choose the best fit.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-12 text-left">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Design Package Pricing
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(DESIGN_PACKAGE_FEES).map(([tier, price]) => (
                  <div
                    key={tier}
                    className={`border rounded-lg p-4 ${
                      tier === 'STANDARD' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    {tier === 'STANDARD' && (
                      <span className="text-xs font-semibold text-indigo-600 uppercase">Most Popular</span>
                    )}
                    <h5 className="font-semibold text-gray-900 mt-1">{tier}</h5>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(price)}</p>
                    <p className="text-xs text-gray-500 mt-1">One-time fee</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Platform commission (3.5% of contract value) is paid by the contractor, not you.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const phaseConfig = PHASE_CONFIG[project.phase] || PHASE_CONFIG.INTAKE
              const needsPayment = project.phase === 'INTAKE' && !project.designPackagePaid

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${phaseConfig.bgColor} ${phaseConfig.color}`}>
                            {phaseConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.category} • {project.city}, {project.state}
                          {project.squareFootage && ` • ${project.squareFootage.toLocaleString()} sq ft`}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{project.description}</p>
                      </div>

                      <div className="text-right ml-6">
                        {project.suggestedRetailPrice ? (
                          <>
                            <p className="text-sm text-gray-500">Estimated Price</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(project.suggestedRetailPrice)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Price pending</p>
                        )}
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="mt-4 flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full ${
                            step <= phaseConfig.step ? 'bg-indigo-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      {project.designConcepts && project.designConcepts.length > 0 && (
                        <span className="text-gray-600">
                          🎨 {project.designConcepts.length} design{project.designConcepts.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {project.bids && project.bids.length > 0 && (
                        <span className="text-gray-600">
                          📋 {project.bids.length} bid{project.bids.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-gray-500">Updated {formatDate(project.updatedAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      {needsPayment ? (
                        <button
                          onClick={() => router.push(`/precon/${project.id}?pay=true`)}
                          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600"
                        >
                          Pay Design Fee ({formatCurrency(DESIGN_PACKAGE_FEES[project.designPackageTier as keyof typeof DESIGN_PACKAGE_FEES])})
                        </button>
                      ) : (
                        <span className="text-sm text-green-600">✓ Design fee paid</span>
                      )}
                      <Link
                        href={`/precon/${project.id}`}
                        className="px-4 py-2 text-indigo-600 text-sm font-medium hover:bg-indigo-50 rounded-lg"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
