'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight, CheckCircle, CheckCircle2, Clock, DollarSign, Zap, Wrench, Droplets,
  Wind, Lightbulb, Download, Share2, ChevronDown, ChevronUp, Loader2, Video,
  ShieldCheck, AlertTriangle, MapPin, TrendingUp,
} from 'lucide-react'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

// ─── Render stubs (mirrors generate/route.ts — used for demo mode) ────────────
const RENDER_STUBS: Record<string, string[]> = {
  kitchen_remodel: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1920&q=80',
    'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1920&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80',
  ],
  bathroom_remodel: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752734-2a0cd0e0da49?w=1920&q=80',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1920&q=80',
    'https://images.unsplash.com/photo-1620626011761-996317702574?w=1920&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80',
  ],
  exterior_concept: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1920&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=80',
    'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=1920&q=80',
  ],
  garden_concept: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1920&q=80',
    'https://images.unsplash.com/photo-1558618047-f4e80c0d9e52?w=1920&q=80',
    'https://images.unsplash.com/photo-1463554050456-f2ed7d3fec09?w=1920&q=80',
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1920&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c349dc6?w=1920&q=80',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80',
  ],
}

function getStubRenders(projectPath: string, tier: number): string[] {
  const stubs = RENDER_STUBS[projectPath] ?? RENDER_STUBS.default
  const count = tier >= 3 ? stubs.length : tier === 2 ? 6 : 3
  return stubs.slice(0, count)
}

// ─── Sample Concept Data (demo / fallback) ────────────────────────────────────

const SAMPLE_CONCEPTS: Record<string, ConceptData> = {
  kitchen: {
    conceptId: 'concept_demo_001',
    projectType: 'Kitchen Renovation',
    projectPath: 'kitchen_remodel',
    scope: 'Complete kitchen renovation with island, new appliances, granite counters, updated lighting, and modern cabinetry.',
    budget: 75000,
    location: '20024 (Washington, DC)',
    estimatedCost: 70400,
    projectTimeline: '12–14 weeks',
    tier: 2,
    renderUrls: getStubRenders('kitchen_remodel', 2),
    designConcept: {
      style: 'Modern Contemporary',
      colorPalette: ['White cabinetry', 'Gray granite', 'Stainless steel', 'Warm wood accents'],
      keyFeatures: [
        'Large functional island with breakfast bar',
        'Premium appliance package',
        'Abundant storage and counter space',
        'Updated recessed and under-cabinet lighting',
        'Open layout connection to great room',
      ],
    },
    mepSystem: {
      electrical: 'Dedicated circuits for island outlets, LED recessed lighting, under-cabinet lighting, new breaker panel capacity',
      plumbing: 'Island sink connection, new water lines, drain lines, water filter system',
      hvac: 'Updated ventilation hood, ductwork modifications, adequate air circulation ensured',
      lighting: '12× 4W LED recessed, 20 ft under-cabinet strips, 3× island pendant lights, dimmer switches',
    },
    billOfMaterials: [
      { item: 'Custom Kitchen Cabinetry',   quantity: 1,   unit: 'set',   estimatedCost: 15000, description: 'Custom-built cabinetry, soft-close hinges, modern handles' },
      { item: 'Granite Countertops',        quantity: 85,  unit: 'sqft',  estimatedCost: 8500,  description: 'Premium granite, edge finishing, backsplash included' },
      { item: 'Stainless Steel Appliances', quantity: 5,   unit: 'units', estimatedCost: 12000, description: 'Refrigerator, range, oven, dishwasher, microwave' },
      { item: 'Island with Seating',        quantity: 1,   unit: 'unit',  estimatedCost: 8000,  description: 'Custom island, 4-seat bar, storage underneath' },
      { item: 'Plumbing Fixtures',          quantity: 2,   unit: 'units', estimatedCost: 3000,  description: 'Faucets, sinks, handles, fixtures' },
      { item: 'Electrical Work',            quantity: 120, unit: 'hours', estimatedCost: 5400,  description: 'Rewiring, panel upgrades, outlet installation' },
      { item: 'Labor — Installation',       quantity: 240, unit: 'hours', estimatedCost: 18000, description: 'Cabinet installation, countertop, appliances, finishing' },
    ],
    permitScope: {
      requiresPermit: true,
      permitTypes: ['Building Permit', 'Electrical Permit', 'Plumbing Permit'],
      estimatedPermitFee: 1200,
      estimatedProcessingDays: 30,
      requiresPE: false,
      notes: 'Building, electrical, and plumbing permits required for this scope in Washington DC. Apply through DLCP at permits.dc.gov. Incomplete applications are rejected — full drawings required at submittal.',
    },
    zoningNotes: 'R-4 residential zone. Kitchen remodel is permitted by right — no zoning variance required. Confirm with DCRA if island addition affects footprint.',
    buildabilityFlag: 'feasible' as const,
    readinessScore: 78,
    nextStep: '/intake/permit_path_only',
    nextStepLabel: 'Continue to Permit Planning',
  },
  bathroom: {
    conceptId: 'concept_demo_002',
    projectType: 'Master Bathroom Remodel',
    projectPath: 'bathroom_remodel',
    scope: 'Master bathroom remodel with new shower, soaking tub, heated floors, double vanity, and tile work.',
    budget: 35000,
    location: '22202 (Arlington, VA)',
    estimatedCost: 31000,
    projectTimeline: '8–10 weeks',
    tier: 1,
    renderUrls: getStubRenders('bathroom_remodel', 1),
    designConcept: {
      style: 'Spa-Inspired Modern',
      colorPalette: ['White marble tile', 'Brushed nickel', 'Warm grey', 'Soft white'],
      keyFeatures: [
        'Walk-in shower with frameless glass',
        'Freestanding soaking tub',
        'Heated radiant floor',
        'Double vanity with integrated storage',
        'Backlit mirror with ambient lighting',
      ],
    },
    mepSystem: {
      electrical: 'GFCI outlets, heated floor mat wiring, exhaust fan upgrade, lighting circuits',
      plumbing: 'New drain lines, water pressure balancing, soaking tub fill, overhead shower',
      hvac: 'Enhanced exhaust ventilation system, humidity control',
      lighting: 'Backlit vanity mirror, recessed ceiling lights, shower niche lighting',
    },
    billOfMaterials: [
      { item: 'Shower Enclosure & Tile', quantity: 80,  unit: 'sqft',  estimatedCost: 6000,  description: 'Large-format tile, frameless glass, niche' },
      { item: 'Soaking Tub',            quantity: 1,   unit: 'unit',  estimatedCost: 3500,  description: 'Freestanding acrylic soaking tub' },
      { item: 'Double Vanity',          quantity: 1,   unit: 'unit',  estimatedCost: 2500,  description: '72" double vanity, soft-close, undermount sinks' },
      { item: 'Heated Floor System',    quantity: 100, unit: 'sqft',  estimatedCost: 3000,  description: 'Electric radiant mat with smart thermostat' },
      { item: 'Fixtures & Fittings',    quantity: 1,   unit: 'set',   estimatedCost: 4000,  description: 'Brushed nickel faucets, shower system, towel bars' },
      { item: 'Labor',                  quantity: 200, unit: 'hours', estimatedCost: 12000, description: 'Tile work, plumbing, electrical, finishing' },
    ],
    permitScope: {
      requiresPermit: true,
      permitTypes: ['Building Permit', 'Plumbing Permit', 'Electrical Permit'],
      estimatedPermitFee: 750,
      estimatedProcessingDays: 21,
      requiresPE: false,
      notes: 'Permits required for plumbing and electrical work in Arlington, VA. Submit to Arlington County DES. Processing is typically 2–3 weeks for residential remodels.',
    },
    zoningNotes: 'R-5 residential zone. Bathroom remodel is permitted by right. No variance required.',
    buildabilityFlag: 'feasible' as const,
    readinessScore: 82,
    nextStep: '/intake/permit_path_only',
    nextStepLabel: 'Continue to Permit Planning',
  },
  garden: {
    conceptId: 'concept_demo_003',
    projectType: 'Garden / Landscape Design',
    projectPath: 'garden_concept',
    scope: 'Front yard landscape redesign with native plants, irrigation system, and hardscaping.',
    budget: 12000,
    location: '20745 (Prince George\'s County, MD)',
    estimatedCost: 11800,
    projectTimeline: '4–6 weeks',
    tier: 1,
    renderUrls: getStubRenders('garden_concept', 1),
    designConcept: {
      style: 'Native Naturalistic',
      colorPalette: ['Dogwood white', 'Coneflower purple', 'Black-eyed susan gold', 'Ornamental grass green'],
      keyFeatures: [
        'Native plant selection for low maintenance',
        'Smart drip irrigation system',
        'Paver walkway and stone borders',
        'Low-voltage LED path lighting',
        'Sustainable mulch beds',
      ],
    },
    mepSystem: {
      electrical: 'Low-voltage LED path lights, timer/smart controller for lighting',
      plumbing: 'Drip irrigation system, smart controller, pressure regulator, 200 ft of lines',
      hvac: 'N/A',
      lighting: 'Low-voltage LED path lights (12×), uplighting for accent plants',
    },
    billOfMaterials: [
      { item: 'Native Plants Package', quantity: 45,  unit: 'plants',   estimatedCost: 2700, description: 'Dogwood, coneflower, black-eyed susan, ornamental grasses' },
      { item: 'Hardscaping Materials', quantity: 150, unit: 'sqft',     estimatedCost: 3000, description: 'Paver walkway, stone borders, mulch beds' },
      { item: 'Irrigation System',     quantity: 1,   unit: 'system',   estimatedCost: 2500, description: 'Drip lines, smart controller, hoses, fittings' },
      { item: 'Lighting System',       quantity: 12,  unit: 'fixtures', estimatedCost: 1200, description: 'Low-voltage LED path lights, uplighting' },
      { item: 'Installation Labor',    quantity: 80,  unit: 'hours',    estimatedCost: 2400, description: 'Planting, hardscaping, irrigation installation' },
    ],
    permitScope: {
      requiresPermit: false,
      permitTypes: [],
      estimatedPermitFee: 0,
      estimatedProcessingDays: 0,
      requiresPE: false,
      notes: 'Landscape and irrigation work generally does not require a permit in PG County for residential properties. Confirm if any grading or impervious surface changes are planned.',
    },
    zoningNotes: 'R-R residential reserve zone. Native plant landscaping and irrigation are permitted by right. No variance required.',
    buildabilityFlag: 'feasible' as const,
    readinessScore: 92,
    nextStep: '/intake/contractor_match',
    nextStepLabel: 'Find a Landscaping Contractor',
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMItem {
  item: string
  quantity: number
  unit: string
  estimatedCost: number
  description: string
}

interface MEPSystem {
  electrical: string
  plumbing: string
  hvac: string
  lighting: string
}

interface PermitScope {
  requiresPermit: boolean
  permitTypes: string[]
  estimatedPermitFee: number
  estimatedProcessingDays: number
  requiresPE: boolean
  notes: string
}

interface ConceptData {
  conceptId: string
  projectType: string
  projectPath: string
  scope: string
  budget: number
  location: string
  estimatedCost: number
  projectTimeline: string
  tier: number
  renderUrls: string[]
  designConcept: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  mepSystem: MEPSystem
  billOfMaterials: BOMItem[]
  permitScope: PermitScope | null
  zoningNotes: string
  buildabilityFlag: 'feasible' | 'feasible-with-variance' | 'challenging'
  readinessScore: number
  nextStep: string
  nextStepLabel: string
}

// ─── MEP Section ──────────────────────────────────────────────────────────────

function MEPRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function conceptOutputToData(
  conceptOutput: Record<string, unknown>,
  intake: Record<string, unknown>,
  projectPath: string,
): ConceptData {
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const tier = typeof formData.tier === 'number' ? formData.tier : 1

  const dc = (conceptOutput.designConcept as Record<string, unknown>) ?? {}
  const mep = (conceptOutput.mepSystem as Record<string, unknown>) ?? {}
  const bom = (conceptOutput.billOfMaterials as BOMItem[]) ?? []

  // Use stored renderUrls if available, otherwise generate stubs
  const renderUrls = Array.isArray(conceptOutput.renderUrls) && (conceptOutput.renderUrls as string[]).length > 0
    ? (conceptOutput.renderUrls as string[])
    : getStubRenders(projectPath, tier)

  return {
    conceptId: `concept_${(intake.id as string)?.slice(0, 8) ?? 'live'}`,
    projectType: deliverable?.label ?? projectPath,
    projectPath,
    scope: (conceptOutput.description as string) ?? (formData.description as string) ?? '',
    budget: typeof intake.budget_range === 'number' ? intake.budget_range : 0,
    location: (intake.project_address as string) ?? '',
    estimatedCost: (conceptOutput.estimatedCost as number) ?? 0,
    projectTimeline: (conceptOutput.projectTimeline as string) ?? deliverable?.deliveryDays ?? '4-6 weeks',
    tier,
    renderUrls,
    designConcept: {
      style: (dc.style as string) ?? 'Modern Contemporary',
      colorPalette: (dc.colorPalette as string[]) ?? [],
      keyFeatures: (dc.keyFeatures as string[]) ?? [],
    },
    mepSystem: {
      electrical: (mep.electrical as string) ?? '',
      plumbing: (mep.plumbing as string) ?? 'N/A',
      hvac: (mep.hvac as string) ?? 'N/A',
      lighting: (mep.lighting as string) ?? '',
    },
    billOfMaterials: bom,
    permitScope: conceptOutput.permitScope
      ? (conceptOutput.permitScope as PermitScope)
      : null,
    zoningNotes: (conceptOutput.zoningNotes as string) ?? '',
    buildabilityFlag: ((conceptOutput.buildabilityFlag as string) ?? 'feasible') as ConceptData['buildabilityFlag'],
    readinessScore: (conceptOutput.readinessScore as number) ?? 70,
    nextStep: deliverable?.nextStep?.href ?? '/intake/permit_path_only',
    nextStepLabel: deliverable?.nextStep?.label ?? 'Continue Your Project',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ConceptDeliverableContent() {
  const searchParams = useSearchParams()
  const intakeId = searchParams.get('intakeId')
  const projectPathParam = searchParams.get('projectPath')
  const conceptType = searchParams.get('type') || 'kitchen'

  const [data, setData] = useState<ConceptData | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'polling' | 'ready' | 'demo'>('loading')
  const [pollCount, setPollCount] = useState(0)
  const [showFullBOM, setShowFullBOM] = useState(false)

  const fetchAndSetData = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/intake?intakeId=${id}`)
      if (!res.ok) return false
      const intake = await res.json()

      const formData = (intake.form_data as Record<string, unknown>) ?? {}

      if (formData.conceptOutput && intake.status === 'concept_ready') {
        // Redirect to owner portal for authenticated access
        const portalUrl = process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? 'https://owner.kealee.com'
        window.location.href = `${portalUrl}/deliverables/${id}`
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (!intakeId) {
      // Demo mode
      const demo = SAMPLE_CONCEPTS[conceptType] ?? SAMPLE_CONCEPTS.kitchen
      setData(demo)
      setLoadStatus('demo')
      return
    }

    // Try to load real data
    fetchAndSetData(intakeId).then((found) => {
      if (!found) setLoadStatus('polling')
    })
  }, [intakeId, conceptType, fetchAndSetData])

  // Poll every 5s for up to 60s if not ready
  useEffect(() => {
    if (loadStatus !== 'polling' || !intakeId) return
    if (pollCount >= 12) {
      // After 60s max polling, fall back to demo
      const demo = SAMPLE_CONCEPTS[conceptType] ?? SAMPLE_CONCEPTS.kitchen
      setData(demo)
      setLoadStatus('demo')
      return
    }

    const timer = setTimeout(async () => {
      const found = await fetchAndSetData(intakeId)
      if (!found) setPollCount(c => c + 1)
    }, 5000)

    return () => clearTimeout(timer)
  }, [loadStatus, pollCount, intakeId, conceptType, fetchAndSetData])

  if (loadStatus === 'loading' || loadStatus === 'polling') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {loadStatus === 'polling' ? 'Generating Your Concept' : 'Preparing Your Package'}
          </h1>
          <p className="text-slate-600">
            {loadStatus === 'polling'
              ? `Still working on it… (check ${pollCount + 1}/12)`
              : 'Your concept is ready — redirecting to your owner portal…'}
          </p>
          <p className="text-slate-400 text-sm mt-2">You will be redirected automatically.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const displayedBOM = showFullBOM ? data.billOfMaterials : data.billOfMaterials.slice(0, 4)
  const totalBOM = data.billOfMaterials.reduce((sum, item) => sum + item.estimatedCost, 0)
  const withinBudget = data.budget > 0 ? data.estimatedCost <= data.budget : true
  const deliverable = SERVICE_DELIVERABLES[data.projectPath]
  const isDemo = loadStatus === 'demo'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: isDemo ? '#94A3B8' : '#2ABFBF' }}
                >
                  {isDemo ? 'Demo' : 'Concept Ready'}
                </span>
                <span className="text-xs text-gray-400">{data.conceptId}</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
                {data.projectType}
              </h1>
              <p className="mt-1 text-sm text-gray-500 max-w-xl">{data.scope}</p>
            </div>

            {data.estimatedCost > 0 && (
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400 mb-0.5">Estimated Cost</p>
                <p className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
                  ${data.estimatedCost.toLocaleString()}
                </p>
                {data.budget > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: withinBudget ? '#38A169' : '#E53E3E' }}>
                    {withinBudget
                      ? `$${(data.budget - data.estimatedCost).toLocaleString()} under budget`
                      : `$${(data.estimatedCost - data.budget).toLocaleString()} over budget`
                    }
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              {data.projectTimeline}
            </span>
            {data.budget > 0 && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Budget: ${data.budget.toLocaleString()}
              </span>
            )}
            {data.location && (
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-gray-400" />
                {data.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* ── Render Gallery ──────────────────────────────────────────────── */}
        {data.renderUrls.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
                Concept Renderings
              </h2>
              <span className="text-xs text-gray-400 font-medium">{data.renderUrls.length} render{data.renderUrls.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={`grid gap-3 ${data.renderUrls.length === 1 ? 'grid-cols-1' : data.renderUrls.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {data.renderUrls.map((url, i) => (
                <div key={i} className={`relative overflow-hidden rounded-xl bg-gray-100 ${i === 0 && data.renderUrls.length > 3 ? 'col-span-2 row-span-2' : ''}`}
                  style={{ aspectRatio: '16/9' }}>
                  <Image
                    src={url}
                    alt={`${data.projectType} concept render ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-white text-[10px] font-bold uppercase tracking-widest opacity-70">
                    Render {i + 1}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400 text-center">
              AI-curated concept images — final renders delivered in your package within 3–5 business days
            </p>
          </section>
        )}

        {/* ── Video Production Card (tier 2+) ─────────────────────────────── */}
        {data.tier >= 2 && (
          <section>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #E8724B 0%, #c75c35 100%)' }}>
              <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-base mb-1">
                    {data.tier >= 3 ? '4 Video Formats — In Production' : 'AI Transformation Video — In Production'}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {data.tier >= 3
                      ? 'Your 60s, 30s, 15s, and 10s AI transformation videos are being produced and will be delivered within your package window.'
                      : 'Your 60-second AI transformation video is being produced — estimated delivery within your package window.'}
                  </p>
                </div>
                <a
                  href="mailto:hello@kealee.com?subject=Video%20Status%20Inquiry"
                  className="shrink-0 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2.5 text-sm font-semibold text-white border border-white/20"
                >
                  Check status →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── What's Included ─────────────────────────────────────────────── */}
        {deliverable?.includes && deliverable.includes.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#2ABFBF' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>What's Included in Your Package</h2>
            </div>
            <div className="p-6">
              <ul className="grid sm:grid-cols-2 gap-2">
                {deliverable.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-teal-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Design Concept ──────────────────────────────────────────────── */}
        {data.designConcept.keyFeatures.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#E8793A' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Design Concept</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{data.designConcept.style}</span>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Features</p>
                <ul className="space-y-2">
                  {data.designConcept.keyFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {data.designConcept.colorPalette.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Color Palette</p>
                    <div className="flex flex-wrap gap-2">
                      {data.designConcept.colorPalette.map(c => (
                        <span
                          key={c}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2">Timeline</p>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-gray-900">{data.projectTimeline}</span>
                  <span className="text-gray-500 ml-2">estimated project duration</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── MEP Systems ─────────────────────────────────────────────────── */}
        {(data.mepSystem.electrical || data.mepSystem.plumbing || data.mepSystem.lighting) && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>MEP Systems Specification</h2>
            </div>
            <div className="px-6 py-2">
              <MEPRow icon={Zap}       label="Electrical" value={data.mepSystem.electrical} color="#E8793A" />
              <MEPRow icon={Droplets}  label="Plumbing"   value={data.mepSystem.plumbing}   color="#3B82F6" />
              <MEPRow icon={Wind}      label="HVAC"       value={data.mepSystem.hvac}        color="#2ABFBF" />
              <MEPRow icon={Lightbulb} label="Lighting"   value={data.mepSystem.lighting}    color="#F59E0B" />
            </div>
          </section>
        )}

        {/* ── Bill of Materials ───────────────────────────────────────────── */}
        {data.billOfMaterials.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#38A169' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Bill of Materials</h2>
              <span className="ml-auto text-xs text-gray-400">{data.billOfMaterials.length} line items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBOM.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{row.item}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{row.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        ${row.estimatedCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-700">Total Estimated Cost</td>
                    <td className="px-4 py-3 text-right text-base font-bold" style={{ color: '#1A2B4A' }}>
                      ${totalBOM.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {data.billOfMaterials.length > 4 && (
              <button
                onClick={() => setShowFullBOM(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 border-t border-gray-100 transition-colors"
              >
                {showFullBOM ? (
                  <><ChevronUp className="h-4 w-4" /> Show less</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> Show all {data.billOfMaterials.length} items</>
                )}
              </button>
            )}
          </section>
        )}

        {/* ── Permit & Zoning ─────────────────────────────────────────────── */}
        {(data.permitScope || data.zoningNotes) && (
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#6B46C1' }} />
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Permit &amp; Zoning Assessment</h2>
              {/* Readiness score badge */}
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: data.readinessScore >= 80 ? '#C6F6D5' : data.readinessScore >= 60 ? '#FEFCBF' : '#FED7D7',
                  color: data.readinessScore >= 80 ? '#276749' : data.readinessScore >= 60 ? '#744210' : '#9B2C2C',
                }}
              >
                {data.readinessScore}% Ready
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* Readiness bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Permit Readiness Score</p>
                  <p className="text-xs text-gray-500">{data.readinessScore}/100</p>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${data.readinessScore}%`,
                      backgroundColor: data.readinessScore >= 80 ? '#38A169' : data.readinessScore >= 60 ? '#D69E2E' : '#E53E3E',
                    }}
                  />
                </div>
              </div>

              {/* Buildability */}
              <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{
                borderColor: data.buildabilityFlag === 'feasible' ? '#C6F6D5' : data.buildabilityFlag === 'feasible-with-variance' ? '#FEFCBF' : '#FED7D7',
                backgroundColor: data.buildabilityFlag === 'feasible' ? '#F0FFF4' : data.buildabilityFlag === 'feasible-with-variance' ? '#FFFFF0' : '#FFF5F5',
              }}>
                {data.buildabilityFlag === 'feasible'
                  ? <TrendingUp className="h-5 w-5 shrink-0" style={{ color: '#38A169' }} />
                  : data.buildabilityFlag === 'feasible-with-variance'
                    ? <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: '#D69E2E' }} />
                    : <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: '#E53E3E' }} />}
                <div>
                  <p className="text-sm font-semibold" style={{
                    color: data.buildabilityFlag === 'feasible' ? '#276749' : data.buildabilityFlag === 'feasible-with-variance' ? '#744210' : '#9B2C2C',
                  }}>
                    {data.buildabilityFlag === 'feasible' ? 'Buildable — no special approvals needed'
                      : data.buildabilityFlag === 'feasible-with-variance' ? 'Feasible with zoning variance'
                      : 'Challenging — additional review required'}
                  </p>
                </div>
              </div>

              {/* Permit types */}
              {data.permitScope && (
                <div>
                  {data.permitScope.requiresPermit ? (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Required Permits</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {data.permitScope.permitTypes.map(pt => (
                          <span key={pt} className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-800">
                            <ShieldCheck className="h-3 w-3" />
                            {pt}
                          </span>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        {data.permitScope.estimatedPermitFee > 0 && (
                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-0.5">Estimated Permit Fee</p>
                            <p className="font-bold text-gray-900">${data.permitScope.estimatedPermitFee.toLocaleString()}</p>
                          </div>
                        )}
                        {data.permitScope.estimatedProcessingDays > 0 && (
                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-xs text-gray-400 mb-0.5">Est. Processing Time</p>
                            <p className="font-bold text-gray-900">{data.permitScope.estimatedProcessingDays} days</p>
                          </div>
                        )}
                      </div>
                      {data.permitScope.requiresPE && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">PE stamp required.</span> This project requires drawings stamped by a licensed Professional Engineer. See &ldquo;Get Permit-Ready Drawings&rdquo; below.
                          </p>
                        </div>
                      )}
                      {data.permitScope.notes && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{data.permitScope.notes}</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">No permit required</span> for this scope. {data.permitScope.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Zoning notes */}
              {data.zoningNotes && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Zoning Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{data.zoningNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Next Steps ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-bold mb-4" style={{ color: '#1A2B4A' }}>Continue Your Project</h2>
          <div className={`grid gap-3 ${(data.permitScope?.requiresPermit || data.permitScope?.requiresPE) ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
            <Link
              href={data.nextStep}
              className="flex flex-col rounded-xl p-4 text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Recommended</span>
              <span className="text-sm font-semibold mb-auto">{data.nextStepLabel}</span>
              <ArrowRight className="h-4 w-4 mt-3" />
            </Link>

            {/* Professional permit-ready drawings CTA — shown when permit required or PE stamp needed */}
            {(data.permitScope?.requiresPermit || data.permitScope?.requiresPE) && (
              <Link
                href={`/intake/professional_drawings${intakeId ? `?conceptId=${intakeId}` : ''}`}
                className="flex flex-col rounded-xl p-4 transition-all hover:shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6B46C120 0%, #6B46C108 100%)', border: '1px solid #6B46C130' }}
              >
                <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6B46C1' }}>
                  {data.permitScope?.requiresPE ? 'PE Required' : 'Permit Filing'}
                </span>
                <span className="text-sm font-semibold text-gray-900 mb-auto">
                  {data.permitScope?.requiresPE ? 'Get Permit-Ready Drawings' : 'File Your Permit'}
                </span>
                <span className="text-xs font-semibold mt-3" style={{ color: '#6B46C1' }}>From $1,499 →</span>
              </Link>
            )}

            <Link
              href="/intake/cost_estimate"
              className="flex flex-col rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Estimate</span>
              <span className="text-sm font-semibold text-gray-900 mb-auto">Get Detailed Cost Estimate</span>
              <span className="text-xs text-[#E8793A] mt-3 font-semibold">$595 →</span>
            </Link>
            <Link
              href="/intake/contractor_match"
              className="flex flex-col rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Find Help</span>
              <span className="text-sm font-semibold text-gray-900 mb-auto">Match with a Contractor</span>
              <span className="text-xs text-[#2ABFBF] mt-3 font-semibold">$199 →</span>
            </Link>
          </div>
        </section>

        {/* ── Download / Share ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 pb-8">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Download Concept PDF
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4" />
            Share with Contractor
          </button>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Wrench className="h-4 w-4" />
            Browse Contractors
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConceptDeliverablePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Loading Your Concept</h1>
          <p className="text-slate-600">Preparing your concept package...</p>
        </div>
      </div>
    }>
      <ConceptDeliverableContent />
    </Suspense>
  )
}
