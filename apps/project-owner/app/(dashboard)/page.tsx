'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FolderKanban, ArrowRight, Activity, AlertTriangle,
  Clock, FileText, ChevronRight, Package,
} from 'lucide-react'
import { listProjects, getProjectReadiness } from '@/lib/api/owner'
import type { Project, ReadinessStatus } from '@/lib/api/owner'
import { RevenueHookModal } from '@kealee/core-hooks'
import { CANONICAL_PRICE_CENTS, formatPriceFromCents } from '@kealee/core-rules'
import { BuildPathUpsell, type OwnedUpsellProduct } from '@/components/BuildPathUpsell'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

const healthColor = (score: number | null) => {
  if (!score) return '#9CA3AF'
  if (score >= 90) return '#38A169'
  if (score >= 70) return '#E8793A'
  return '#E53E3E'
}

function normalizePhase(phase: string | null): string {
  if (!phase) return 'IDEA'
  const upper = phase.toUpperCase()
  const aliases: Record<string, string> = {
    PERMITS:      'PERMIT',
    CONSTRUCTION: 'EXECUTION',
    CLOSEOUT:     'COMPLETION',
  }
  return aliases[upper] ?? upper
}

const phaseStyles: Record<string, string> = {
  CONSTRUCTION:    '#2ABFBF',
  CLOSEOUT:        '#38A169',
  PERMITS:         '#E8793A',
  IDEA:            '#64748B', // Slate
  DESIGN:          '#3182CE', // Blue
  ESTIMATE:        '#D97706', // Amber
  PERMIT:          '#E8793A', // Kealee Orange
  CONTRACTOR:      '#8B5CF6', // Purple
  EXECUTION:       '#2ABFBF', // Teal
  COMPLETION:      '#38A169', // Green
}

function FunnelProgressionCard({ project }: { project: Project }) {
  const normPhase = normalizePhase(project.lifecyclePhase)

  const funnelConfigs: Record<string, { title: string; desc: string; ctaText: string; ctaLink: string; bg: string; border: string }> = {
    IDEA: {
      title: 'Define Design Concept',
      desc: 'Transform your construction ideas into real drawings, renderings, and specifications.',
      ctaText: 'Start Design Concept',
      ctaLink: '/concepts',
      bg: 'bg-slate-50/50',
      border: 'border-slate-200/60',
    },
    DESIGN: {
      title: 'Request Cost Estimate',
      desc: 'Get an accurate, detailed bill of materials and construction cost estimation for your drawings.',
      ctaText: 'Get Cost Estimate',
      ctaLink: '/services',
      bg: 'bg-blue-50/40',
      border: 'border-blue-100',
    },
    ESTIMATE: {
      title: 'Prepare & File Permits',
      desc: 'Let Kealee handle permit applications, zoning checks, and municipal filing in your area.',
      ctaText: 'Handle Permits',
      ctaLink: '/services',
      bg: 'bg-amber-50/40',
      border: 'border-amber-100',
    },
    PERMIT: {
      title: 'Match Vetted Contractors',
      desc: 'Find and connect with qualified local contractors matched to your project size and category.',
      ctaText: 'Find Contractor',
      ctaLink: 'https://kealee.com/marketplace',
      bg: 'bg-orange-50/40',
      border: 'border-orange-100',
    },
    CONTRACTOR: {
      title: 'Launch Project Execution',
      desc: 'Finalize contractor matching, setup escrow payment, and begin on-site construction.',
      ctaText: 'Begin Construction',
      ctaLink: `/project/${project.id}`,
      bg: 'bg-violet-50/40',
      border: 'border-violet-100',
    },
    EXECUTION: {
      title: 'Monitor Construction Progress',
      desc: 'Track structural health, review daily logs, approve change orders, and view construction milestones.',
      ctaText: 'View Digital Twin',
      ctaLink: `/twin/${project.id}`,
      bg: 'bg-teal-50/40',
      border: 'border-teal-100',
    },
    COMPLETION: {
      title: 'Project Successfully Completed',
      desc: 'Your construction project is complete. View closeout documents, warranties, and project archives.',
      ctaText: 'Open Project Archive',
      ctaLink: `/project/${project.id}`,
      bg: 'bg-green-50/40',
      border: 'border-green-100',
    },
  }

  const config = funnelConfigs[normPhase] ?? funnelConfigs.IDEA

  return (
    <div className={`rounded-3xl border ${config.border} ${config.bg} p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 hover:shadow-md`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#E8793A] bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full">
            Funnel Progression
          </span>
          <span className="text-[11px] text-gray-500 font-semibold">Active Project: {project.name}</span>
        </div>
        <h3 className="text-base font-bold text-slate-900 mt-2">{config.title}</h3>
        <p className="text-xs text-slate-500 max-w-2xl">{config.desc}</p>
      </div>
      <Link
        href={config.ctaLink}
        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#E8793A] hover:bg-[#D45C33] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-orange-950/20 transition-all hover:scale-[1.02] text-center"
      >
        {config.ctaText}
      </Link>
    </div>
  )
}

const readinessStatusConfig: Record<ReadinessStatus, { bg: string; text: string }> = {
  NOT_STARTED:     { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' },
  IN_PROGRESS:     { bg: 'rgba(49,130,206,0.1)',  text: '#3182CE' },
  NEEDS_ATTENTION: { bg: 'rgba(234,179,8,0.12)',  text: '#92400E' },
  READY:           { bg: 'rgba(56,161,105,0.1)',  text: '#38A169' },
  OVERRIDDEN:      { bg: 'rgba(128,90,213,0.1)',  text: '#805AD5' },
}

const formatBudget = (amount: number | null) => {
  if (!amount) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  return `$${(amount / 1000).toFixed(0)}K`
}

// ── Project row card ──────────────────────────────────────────────────────────

function ProjectRow({
  project,
  readinessStatus,
}: {
  project: Project
  readinessStatus: ReadinessStatus | null
}) {
  const normPhase = normalizePhase(project.lifecyclePhase)
  const phaseColor = phaseStyles[normPhase] ?? '#64748B'
  const rs = readinessStatus ? readinessStatusConfig[readinessStatus] : null
  const progress = project.progressPct ?? 0

  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#E8724B]/30 hover:scale-[1.005]"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Phase indicator */}
        <div
          className="h-10 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: phaseColor }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h4 className="truncate text-base font-bold text-slate-900 group-hover:text-[#E8724B] transition-colors">
              {project.name}
            </h4>
            {project.lifecyclePhase && (
              <span
                className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                style={{ backgroundColor: `${phaseColor}15`, color: phaseColor }}
              >
                {normPhase}
              </span>
            )}
          </div>
          {/* Progress bar */}
          {progress > 0 && (
            <div className="mt-2.5 flex items-center gap-3 max-w-md">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: phaseColor }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-8 text-right shrink-0">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 border-slate-50 pt-3 sm:pt-0">
        {/* Budget */}
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget</p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">
            {formatBudget(project.totalBudget)}
          </p>
        </div>

        {/* Twin health */}
        {project.twinHealthScore !== null && (
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Health</p>
            <p className="text-sm font-extrabold mt-0.5" style={{ color: healthColor(project.twinHealthScore) }}>
              {project.twinHealthScore}%
            </p>
          </div>
        )}

        {/* Readiness badge */}
        {rs && (
          <span
            className="shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm border border-black/5"
            style={{ backgroundColor: rs.bg, color: rs.text }}
          >
            {readinessStatus!.replace(/_/g, ' ')}
          </span>
        )}

        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors shrink-0">
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#E8724B] transition-colors" />
        </div>
      </div>
    </Link>
  )
}

// ── Concept next-steps upsell panel ───────────────────────────────────────────

interface ReadyConceptDeliverable {
  id: string
  projectPath: string
  projectLabel: string
  uiStatus?: string
  conceptServicePrice?: number | null
  estimatedCostMin?: number | null
  estimatedCostMax?: number | null
  upsellSummary?: { label: string; priceLabel: string; savingsLabel: string | null } | null
}

function ConceptNextStepsPanel({
  deliverables,
  ownedProducts,
}: {
  deliverables: ReadyConceptDeliverable[]
  ownedProducts: OwnedUpsellProduct[]
}) {
  const ready = deliverables.filter((d) => d.uiStatus === 'ready' && d.upsellSummary)
  if (ready.length === 0) return null

  const featured = ready[0]

  return (
    <section className="mb-8 rounded-3xl border border-orange-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" style={{ color: '#E8793A' }} />
          <span className="text-sm font-semibold text-slate-900">
            Next steps — concept to build
          </span>
        </div>
        <Link href="/deliverables" className="text-xs font-semibold" style={{ color: '#2ABFBF' }}>
          All packages →
        </Link>
      </div>
      <div className="p-5">
        {ready.length > 1 && (
          <p className="text-xs text-gray-500 mb-4">
            {ready.length} concept packages ready — pricing below is for{' '}
            <span className="font-semibold text-gray-700">{featured.projectLabel}</span>.
          </p>
        )}
        <BuildPathUpsell
          variant="full"
          sourceProjectPath={featured.projectPath}
          fromIntakeId={featured.id}
          ownedProducts={ownedProducts}
          conceptServicePrice={featured.conceptServicePrice ?? undefined}
          constructionCostMin={featured.estimatedCostMin ?? undefined}
          constructionCostMax={featured.estimatedCostMax ?? undefined}
        />
      </div>
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OwnerDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [readinessMap, setReadinessMap] = useState<Record<string, ReadinessStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDesignModal, setShowDesignModal] = useState(false)
  const [showPermitHook, setShowPermitHook] = useState(false)
  const [conceptDeliverables, setConceptDeliverables] = useState<ReadyConceptDeliverable[]>([])
  const [ownedProducts, setOwnedProducts] = useState<OwnedUpsellProduct[]>([])

  useEffect(() => {
    fetch('/api/deliverables')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setConceptDeliverables(data.deliverables ?? [])
        setOwnedProducts(data.ownedProducts ?? [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { projects: ps } = await listProjects()
        if (!mounted) return
        setProjects(ps)

        // Load readiness for each project (fire-and-forget, no blocking)
        const map: Record<string, ReadinessStatus> = {}
        await Promise.all(
          ps.slice(0, 6).map(async p => {
            try {
              const { readiness } = await getProjectReadiness(p.id)
              if (mounted) map[p.id] = readiness.overallStatus
            } catch {
              // not all projects have readiness — ok
            }
          }),
        )
        if (mounted) setReadinessMap(map)
      } catch (err: any) {
        if (mounted) setError(err.message ?? 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Auto-show permit hook once per session when a project is in PERMIT phase
  useEffect(() => {
    if (!loading && projects.some(p => normalizePhase(p.lifecyclePhase) === 'PERMIT')) {
      const key = 'kea_permit_hook_shown'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        setShowPermitHook(true)
      }
    }
  }, [loading, projects])

  const activeProjects = projects.filter(p => p.status !== 'ARCHIVED')
  const totalBudget = projects.reduce((s, p) => s + (p.totalBudget ?? 0), 0)
  const avgHealth = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.twinHealthScore ?? 0), 0) / projects.length)
    : 0
  const needsAttention = Object.values(readinessMap).filter(s => s === 'NEEDS_ATTENTION').length

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-3xl px-8 py-7 text-white overflow-hidden relative shadow-lg bg-gradient-to-br from-slate-900 via-[#122440] to-slate-950 border border-white/5">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 50%, #2ABFBF, transparent 70%)' }} />
        <div className="relative">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2ABFBF] bg-[#2ABFBF]/10 px-2.5 py-1 rounded">
            Owner Portal
          </span>
          <h1 className="font-sans text-3xl font-extrabold text-white mt-3 tracking-tight">Owner Dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-400">Your personal design-build workspace for construction, design, and permits.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active Projects', value: activeProjects.length, color: '#2ABFBF', loading: loading },
          { label: 'Total Budget', value: formatBudget(totalBudget), color: '#E8724B', loading: loading },
          { label: 'Avg Twin Health', value: avgHealth > 0 ? `${avgHealth}%` : '—', color: healthColor(avgHealth), loading: loading },
          { label: 'Needs Attention', value: needsAttention, color: needsAttention > 0 ? '#E53E3E' : '#38A169', loading: loading }
        ].map((stat, idx) => (
          <div key={idx} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow transition relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: stat.color }} />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{stat.label}</p>
            {stat.loading ? (
              <Skeleton className="mt-2.5 h-8 w-16" />
            ) : (
              <p className="mt-2 text-2xl font-black font-sans tracking-tight" style={{ color: stat.color }}>
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <ConceptNextStepsPanel deliverables={conceptDeliverables} ownedProducts={ownedProducts} />

      {/* Funnel progression card */}
      {!loading && activeProjects.length > 0 && (
        <FunnelProgressionCard project={activeProjects[0]} />
      )}

      {/* Full Design Package card — always visible */}
      <div
        className="rounded-3xl overflow-hidden shadow-lg border border-[#2ABFBF]/10 bg-gradient-to-br from-slate-900 to-[#122440]"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6 px-8 py-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2ABFBF]/10" aria-hidden="true">
            <FileText className="h-5 w-5 text-[#2ABFBF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-bold text-white tracking-tight">Full Design Package</h3>
              <span className="rounded-full px-3 py-0.5 text-xs font-bold bg-[#E8793A]/10 text-[#E8793A] border border-[#E8793A]/20">
                Starting at {formatPriceFromCents(CANONICAL_PRICE_CENTS.professionalDesign)}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-400 max-w-xl leading-relaxed">
              Complete design documents — schematic through permit-ready drawing set. Vetted for local zoning compliance.
            </p>
            <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5">
              {['Schematic design', 'Design development', 'Permit-ready drawings', 'Structural details'].map(f => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[#2ABFBF] font-extrabold">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowDesignModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#E8793A] hover:bg-[#D45C33] px-6 py-3.5 text-sm font-bold text-white transition-all shadow-md shadow-orange-950/20 hover:scale-[1.02]"
          >
            Get full design <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Revenue Hook: permit_detected — shown when a project is in PERMIT phase */}
      {!loading && projects.some(p => normalizePhase(p.lifecyclePhase) === 'PERMIT') && showPermitHook && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8793A]/10"
            >
              <Clock className="h-5 w-5 text-[#E8793A]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Permits detected on your project
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Let Kealee handle permit filing, follow-ups, and approvals — saving weeks of back-and-forth.
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => setShowPermitHook(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
            <button
              onClick={() => setShowPermitHook(true)}
              className="rounded-lg bg-[#E8793A] hover:bg-[#D45C33] px-4 py-2 text-sm font-bold text-white shadow transition"
            >
              Handle permits
            </button>
          </div>
        </div>
      )}

      {/* Attention banner */}
      {!loading && needsAttention > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {needsAttention} project{needsAttention > 1 ? 's' : ''} need readiness attention
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Review the checklist to ensure construction can begin</p>
          </div>
          <Link href="/projects" className="text-xs font-bold text-amber-800 hover:underline shrink-0">
            Review →
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Projects panel */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[#E8793A]" />
            <span className="text-sm font-bold text-slate-900">My Projects</span>
          </div>
          <Link href="/projects" className="flex items-center gap-1 text-xs font-semibold text-[#2ABFBF] hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center">
              <FolderKanban className="mx-auto mb-3.5 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No projects listed yet</p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#E8793A] hover:bg-[#D45C33] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-100 transition"
              >
                Create First Project
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 8).map(p => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  readinessStatus={readinessMap[p.id] ?? null}
                />
              ))}
              {projects.length > 8 && (
                <Link
                  href="/projects"
                  className="block text-center py-2 text-xs font-bold text-[#2ABFBF] hover:underline"
                >
                  View {projects.length - 8} more projects →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Design modal — opened by Full Design Package card CTA */}
      {showDesignModal && (
        <RevenueHookModal
          stage="design_complete"
          autoOpen
          onSelect={() => setShowDesignModal(false)}
          onDismiss={() => setShowDesignModal(false)}
        />
      )}

      {/* Permit modal — only shown when a project is in PERMITS phase */}
      {showPermitHook && (
        <RevenueHookModal
          stage="permit_detected"
          autoOpen
          onSelect={() => setShowPermitHook(false)}
          onDismiss={() => setShowPermitHook(false)}
        />
      )}
    </div>
  )
}
