'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Phase configuration
const PHASES = [
  { key: 'INTAKE', label: 'Intake', step: 1 },
  { key: 'DESIGN_IN_PROGRESS', label: 'Design', step: 2 },
  { key: 'DESIGN_REVIEW', label: 'Review', step: 2 },
  { key: 'DESIGN_APPROVED', label: 'Approved', step: 3 },
  { key: 'SRP_GENERATED', label: 'Priced', step: 4 },
  { key: 'MARKETPLACE_READY', label: 'Marketplace', step: 5 },
  { key: 'BIDDING_OPEN', label: 'Bidding', step: 5 },
  { key: 'AWARDED', label: 'Awarded', step: 6 },
  { key: 'CONTRACT_PENDING', label: 'Contract', step: 7 },
  { key: 'CONTRACT_RATIFIED', label: 'Ratified', step: 8 },
  { key: 'COMPLETED', label: 'Complete', step: 9 },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PreConDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // In production, fetch project from API
    setLoading(false)
    // Placeholder project for demo
    setProject({
      id: projectId,
      name: 'Modern Kitchen Renovation',
      phase: 'DESIGN_REVIEW',
      category: 'KITCHEN',
      description: 'Complete kitchen renovation with modern finishes, new cabinets, countertops, and appliances.',
      city: 'Los Angeles',
      state: 'CA',
      squareFootage: 250,
      complexity: 'STANDARD',
      designPackageTier: 'STANDARD',
      designPackagePaid: true,
      suggestedRetailPrice: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      designConcepts: [],
      bids: [],
      platformFees: [],
    })
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <Link href="/precon" className="text-indigo-600 hover:underline mt-2 inline-block">
            ← Back to projects
          </Link>
        </div>
      </div>
    )
  }

  const currentPhase = PHASES.find(p => p.key === project.phase) || PHASES[0]
  const currentStep = currentPhase.step

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/precon" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500">{project.category} • {project.city}, {project.state}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {['Intake', 'Design', 'Pricing', 'Marketplace', 'Award', 'Contract', 'Complete'].map((label, index) => {
              const stepNum = index + 1
              const isCompleted = currentStep > stepNum
              const isCurrent = currentStep === stepNum

              return (
                <div key={label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : stepNum}
                    </div>
                    <span className={`text-xs mt-1 ${isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {index < 6 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex border-b">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'designs', label: 'Design Concepts' },
                  { key: 'bids', label: 'Contractor Bids' },
                  { key: 'timeline', label: 'Timeline' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-sm font-medium ${
                      activeTab === tab.key
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</h3>
                      <p className="mt-2 text-gray-900">{project.description}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Square Footage</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {project.squareFootage?.toLocaleString() || '—'} sq ft
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Complexity</p>
                        <p className="text-lg font-semibold text-gray-900">{project.complexity}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Design Package</p>
                        <p className="text-lg font-semibold text-gray-900">{project.designPackageTier}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(project.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'designs' && (
                  <div>
                    {project.designConcepts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">🎨</div>
                        <h3 className="text-lg font-semibold text-gray-900">Design concepts coming soon</h3>
                        <p className="text-gray-500 mt-2">
                          Our design team is working on custom concepts for your project.
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {project.designConcepts.map((concept: any) => (
                          <div
                            key={concept.id}
                            className={`border rounded-lg overflow-hidden ${
                              concept.isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
                            }`}
                          >
                            {concept.primaryImageUrl && (
                              <img src={concept.primaryImageUrl} alt={concept.name} className="w-full h-48 object-cover" />
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">{concept.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{concept.description}</p>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-900">
                                  {formatCurrency(concept.estimatedCost)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {concept.estimatedTimeline} days
                                </span>
                              </div>
                              {concept.isSelected && (
                                <div className="mt-3 text-sm text-green-600 font-medium">✓ Selected</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bids' && (
                  <div>
                    {project.bids.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-lg font-semibold text-gray-900">No bids yet</h3>
                        <p className="text-gray-500 mt-2">
                          {project.phase === 'BIDDING_OPEN'
                            ? 'Contractors are reviewing your project. Bids will appear here.'
                            : 'Bids will be available once your project enters the marketplace.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {project.bids.map((bid: any) => (
                          <div
                            key={bid.id}
                            className={`border rounded-lg p-4 ${
                              bid.isAwarded ? 'border-green-500 bg-green-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{bid.contractorName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-yellow-500">★</span>
                                  <span className="text-sm text-gray-600">{bid.contractorRating} ({bid.contractorReviews} reviews)</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(bid.bidAmount)}</p>
                                <p className="text-sm text-gray-500">{bid.proposedTimeline} days</p>
                              </div>
                            </div>
                            {bid.isAwarded && (
                              <div className="mt-3 text-sm text-green-600 font-medium">✓ Awarded</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="relative">
                      {project.phaseHistory?.map((history: any, index: number) => (
                        <div key={history.id} className="flex gap-4 pb-6">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            {index < (project.phaseHistory?.length || 0) - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{history.toPhase}</p>
                            <p className="text-sm text-gray-500">{formatDate(history.occurredAt)}</p>
                            {history.notes && (
                              <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500">Timeline will appear as your project progresses.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Current Status</h3>
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                  {currentStep <= 2 ? '🎨' : currentStep <= 4 ? '💰' : currentStep <= 6 ? '🏪' : '🎉'}
                </div>
                <div>
                  <p className="font-semibold text-indigo-900">{currentPhase.label}</p>
                  <p className="text-sm text-indigo-700">Step {currentStep} of 9</p>
                </div>
              </div>

              {/* Next Action */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Next Action</p>
                <p className="font-medium text-gray-900 mt-1">
                  {project.phase === 'INTAKE' && !project.designPackagePaid && 'Pay design package fee'}
                  {project.phase === 'DESIGN_IN_PROGRESS' && 'Wait for design concepts'}
                  {project.phase === 'DESIGN_REVIEW' && 'Review and select a design concept'}
                  {project.phase === 'DESIGN_APPROVED' && 'Generate suggested retail price'}
                  {project.phase === 'SRP_GENERATED' && 'Open marketplace for bids'}
                  {project.phase === 'BIDDING_OPEN' && 'Review contractor bids'}
                  {project.phase === 'AWARDED' && 'Finalize contract'}
                  {project.phase === 'CONTRACT_PENDING' && 'Sign contract'}
                  {project.phase === 'CONTRACT_RATIFIED' && 'Project ready to start!'}
                  {project.phase === 'COMPLETED' && 'Project complete'}
                </p>
              </div>
            </div>

            {/* Pricing */}
            {project.suggestedRetailPrice && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Estimated Price</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(project.suggestedRetailPrice)}
                </p>
                {project.srpBreakdown && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Labor</span>
                      <span className="text-gray-900">{formatCurrency(project.srpBreakdown.labor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Materials</span>
                      <span className="text-gray-900">{formatCurrency(project.srpBreakdown.materials)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contingency (10%)</span>
                      <span className="text-gray-900">{formatCurrency(project.srpBreakdown.contingency)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="font-bold text-gray-900">{formatCurrency(project.srpBreakdown.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fees */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Fees & Payments</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Design Package</p>
                    <p className="text-sm text-gray-500">{project.designPackageTier}</p>
                  </div>
                  <div className="text-right">
                    {project.designPackagePaid ? (
                      <span className="text-green-600 font-medium">✓ Paid</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Pending</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Additional Fees</p>
                    <p className="text-sm text-gray-500">Shown at checkout</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-sm">Transparent pricing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-indigo-100 mb-4">
                Our team is here to guide you through every step of the process.
              </p>
              <button className="w-full py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
