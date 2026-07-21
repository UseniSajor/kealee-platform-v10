'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@kealee/auth/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  Paintbrush,
  CheckCircle,
  ShoppingCart,
  Gavel,
  FileSignature,
} from 'lucide-react'

interface PreConProject {
  id: string
  name: string
  category: string
  phase: string
  description: string
  squareFootage: number | null
  suggestedRetailPrice: number | null
  createdAt: string
  updatedAt: string
  designConcepts?: { id: string; name: string; isSelected: boolean }[]
  bids?: { id: string; isAwarded: boolean }[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const phaseConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  INTAKE: { label: 'Intake', color: 'bg-gray-100 text-gray-700', icon: Clock },
  DESIGN_IN_PROGRESS: { label: 'Design in Progress', color: 'bg-blue-100 text-blue-700', icon: Paintbrush },
  DESIGN_REVIEW: { label: 'Design Review', color: 'bg-indigo-100 text-indigo-700', icon: Paintbrush },
  DESIGN_APPROVED: { label: 'Design Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  SRP_GENERATED: { label: 'Price Generated', color: 'bg-purple-100 text-purple-700', icon: ShoppingCart },
  MARKETPLACE_READY: { label: 'Marketplace Ready', color: 'bg-purple-100 text-purple-700', icon: ShoppingCart },
  BIDDING_OPEN: { label: 'Accepting Bids', color: 'bg-amber-100 text-amber-700', icon: Gavel },
  AWARDED: { label: 'Bid Awarded', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CONTRACT_PENDING: { label: 'Contract Pending', color: 'bg-orange-100 text-orange-700', icon: FileSignature },
  CONTRACT_RATIFIED: { label: 'Contract Signed', color: 'bg-green-100 text-green-700', icon: FileSignature },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

const categoryLabels: Record<string, string> = {
  KITCHEN: 'Kitchen',
  BATHROOM: 'Bathroom',
  ADDITION: 'Addition',
  NEW_CONSTRUCTION: 'New Construction',
  RENOVATION: 'Renovation',
  EXTERIOR: 'Exterior',
  OTHER: 'Other',
}

export default function ProjectsPage() {
  const { profile, loading: authLoading } = useProfile()
  const router = useRouter()
  const [projects, setProjects] = useState<PreConProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/dashboard/projects')
      return
    }
    if (profile) fetchProjects()
  }, [profile, authLoading, router])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/precon/projects`, {
        headers: { Authorization: `Bearer ${profile?.access_token || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-sky-600" size={32} />
      </div>
    )
  }

  const filtered = filter === 'all'
    ? projects
    : filter === 'active'
      ? projects.filter((p) => p.phase !== 'COMPLETED')
      : projects.filter((p) => p.phase === 'COMPLETED')

  const activeCount = projects.filter((p) => p.phase !== 'COMPLETED').length
  const completedCount = projects.filter((p) => p.phase === 'COMPLETED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your construction projects from concept to completion.
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition"
        >
          <Plus size={16} />
          New Project
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${projects.length})` },
          { key: 'active', label: `Active (${activeCount})` },
          { key: 'completed', label: `Completed (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === tab.key
                ? 'bg-sky-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="text-gray-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Start a new project to get AI-generated design concepts, contractor bids, and project management.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition"
          >
            <Plus size={16} /> Start a Project
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project) => {
            const phase = phaseConfig[project.phase] || phaseConfig.INTAKE
            const PhaseIcon = phase.icon
            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{project.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${phase.color}`}>
                        <PhaseIcon size={12} />
                        {phase.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{categoryLabels[project.category] || project.category}</span>
                      {project.squareFootage && (
                        <span>{project.squareFootage.toLocaleString()} sq ft</span>
                      )}
                      <span>
                        {new Date(project.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sky-600">
                    {project.suggestedRetailPrice && (
                      <span className="text-lg font-bold text-gray-900">
                        ${project.suggestedRetailPrice.toLocaleString()}
                      </span>
                    )}
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
