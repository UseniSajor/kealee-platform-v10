'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@kealee/auth/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FolderKanban,
  Loader2,
  Clock,
  Paintbrush,
  CheckCircle,
  ShoppingCart,
  Gavel,
  FileSignature,
  MapPin,
  Ruler,
  Calendar,
  DollarSign,
} from 'lucide-react'

interface PreConDetail {
  id: string
  name: string
  category: string
  description: string
  phase: string
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  squareFootage: number | null
  rooms: number | null
  floors: number | null
  features: string[]
  complexity: string
  designPackageTier: string
  suggestedRetailPrice: number | null
  contractAmount: number | null
  createdAt: string
  updatedAt: string
  designConcepts?: any[]
  bids?: any[]
  phaseHistory?: any[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const phaseSteps = [
  { key: 'INTAKE', label: 'Intake', icon: Clock },
  { key: 'DESIGN', label: 'Design', icon: Paintbrush },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle },
  { key: 'MARKETPLACE', label: 'Marketplace', icon: ShoppingCart },
  { key: 'AWARDED', label: 'Awarded', icon: Gavel },
  { key: 'CONTRACT', label: 'Contract', icon: FileSignature },
  { key: 'COMPLETED', label: 'Complete', icon: CheckCircle },
]

function getPhaseStep(phase: string): number {
  const mapping: Record<string, number> = {
    INTAKE: 0,
    DESIGN_IN_PROGRESS: 1,
    DESIGN_REVIEW: 1,
    DESIGN_APPROVED: 2,
    SRP_GENERATED: 3,
    MARKETPLACE_READY: 3,
    BIDDING_OPEN: 3,
    AWARDED: 4,
    CONTRACT_PENDING: 5,
    CONTRACT_RATIFIED: 5,
    COMPLETED: 6,
  }
  return mapping[phase] ?? 0
}

const phaseMessages: Record<string, string> = {
  INTAKE: 'Your project has been submitted. Pay the design package fee to start generating concepts.',
  DESIGN_IN_PROGRESS: 'Our AI and design team are creating concept options for your project.',
  DESIGN_REVIEW: 'Design concepts are ready for your review. Select your preferred concept to proceed.',
  DESIGN_APPROVED: 'Your concept is approved. A Suggested Retail Price (SRP) will be generated next.',
  SRP_GENERATED: 'Your project has a recommended price. Open the marketplace to receive contractor bids.',
  MARKETPLACE_READY: 'Your project is ready for the marketplace. Verified contractors will submit bids.',
  BIDDING_OPEN: 'Contractors are submitting bids. Review and award your preferred contractor.',
  AWARDED: 'A contractor has been selected. The contract is being prepared for signing.',
  CONTRACT_PENDING: 'The contract is pending signatures from both parties.',
  CONTRACT_RATIFIED: 'The contract is signed! Your project is ready to begin construction.',
  COMPLETED: 'Pre-construction is complete. Your project is now in the construction phase.',
}

const categoryLabels: Record<string, string> = {
  KITCHEN: 'Kitchen Remodel',
  BATHROOM: 'Bathroom Remodel',
  ADDITION: 'Home Addition',
  NEW_CONSTRUCTION: 'New Construction',
  RENOVATION: 'General Renovation',
  EXTERIOR: 'Exterior Work',
  OTHER: 'Other',
}

export default function ProjectDetailPage() {
  const { profile, loading: authLoading } = useProfile()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<PreConDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push(`/auth/login?redirect=/dashboard/projects/${projectId}`)
      return
    }
    if (profile && projectId) fetchProject()
  }, [profile, authLoading, projectId, router])

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_URL}/precon/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${profile?.access_token || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProject(data.precon)
      } else if (res.status === 404) {
        setNotFound(true)
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-sky-600" size={32} />
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderKanban className="text-gray-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-500 mb-6">This project doesn&apos;t exist or you don&apos;t have access.</p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700"
        >
          <ArrowLeft size={16} /> Back to projects
        </Link>
      </div>
    )
  }

  const currentStep = getPhaseStep(project.phase)
  const location = [project.city, project.state].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={16} /> Back to projects
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {categoryLabels[project.category] || project.category} &middot;{' '}
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          {project.suggestedRetailPrice && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Suggested Price</p>
              <p className="text-2xl font-black text-gray-900">
                ${project.suggestedRetailPrice.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Phase progress tracker */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Project Progress</h2>
        <div className="relative">
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-sky-500 transition-all duration-500"
            style={{ width: `${(currentStep / (phaseSteps.length - 1)) * (100 - 10)}%` }}
          />

          <div className="relative flex justify-between">
            {phaseSteps.map((step, i) => {
              const StepIcon = step.icon
              const isComplete = i <= currentStep
              const isCurrent = i === currentStep
              return (
                <div key={step.key} className="flex flex-col items-center w-20">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      isComplete
                        ? isCurrent
                          ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                          : 'bg-sky-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <StepIcon size={18} />
                  </div>
                  <span
                    className={`text-xs font-medium mt-2 text-center ${
                      isComplete ? 'text-sky-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status message */}
        <div className="mt-8 p-4 rounded-xl bg-sky-50 border border-sky-200">
          <p className="text-sm text-sky-800">
            {phaseMessages[project.phase] || 'Your project is in progress.'}
          </p>
        </div>
      </div>

      {/* Project details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Project Details</h2>
        <p className="text-sm text-gray-600 mb-4">{project.description}</p>

        <dl className="grid sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <FolderKanban size={14} /> Category
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {categoryLabels[project.category] || project.category}
            </dd>
          </div>
          {project.squareFootage && (
            <div>
              <dt className="text-sm text-gray-500 flex items-center gap-2">
                <Ruler size={14} /> Square Footage
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {project.squareFootage.toLocaleString()} sq ft
              </dd>
            </div>
          )}
          {location && (
            <div>
              <dt className="text-sm text-gray-500 flex items-center gap-2">
                <MapPin size={14} /> Location
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {project.address ? `${project.address}, ` : ''}{location} {project.zipCode || ''}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar size={14} /> Created
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </dd>
          </div>
          {project.contractAmount && (
            <div>
              <dt className="text-sm text-gray-500 flex items-center gap-2">
                <DollarSign size={14} /> Contract Amount
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                ${Number(project.contractAmount).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Design concepts */}
      {project.designConcepts && project.designConcepts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Design Concepts ({project.designConcepts.length})
          </h2>
          <div className="space-y-3">
            {project.designConcepts.map((concept: any) => (
              <div
                key={concept.id}
                className={`p-4 rounded-xl border ${
                  concept.isSelected
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{concept.name}</h3>
                    {concept.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{concept.description}</p>
                    )}
                  </div>
                  {concept.isSelected && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold">
                      <CheckCircle size={12} /> Selected
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  {concept.estimatedCost && (
                    <span>Est. ${Number(concept.estimatedCost).toLocaleString()}</span>
                  )}
                  {concept.estimatedTimeline && (
                    <span>{concept.estimatedTimeline} days</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bids */}
      {project.bids && project.bids.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Contractor Bids ({project.bids.length})
          </h2>
          <div className="space-y-3">
            {project.bids.map((bid: any) => (
              <div
                key={bid.id}
                className={`p-4 rounded-xl border ${
                  bid.isAwarded
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {bid.contractorProfile?.businessName || 'Contractor'}
                    </h3>
                    {bid.contractorProfile?.rating && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Rating: {bid.contractorProfile.rating}/5
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${Number(bid.bidAmount).toLocaleString()}
                    </p>
                    {bid.isAwarded && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <CheckCircle size={12} /> Awarded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase history */}
      {project.phaseHistory && project.phaseHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Timeline</h2>
          <div className="space-y-3">
            {project.phaseHistory.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-sky-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{entry.notes}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.occurredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">
          Questions about your project? Call us at{' '}
          <a href="tel:+13015758777" className="text-sky-600 font-semibold hover:underline">
            (301) 575-8777
          </a>{' '}
          or email{' '}
          <a href="mailto:support@kealee.com" className="text-sky-600 font-semibold hover:underline">
            support@kealee.com
          </a>
        </p>
      </div>
    </div>
  )
}
