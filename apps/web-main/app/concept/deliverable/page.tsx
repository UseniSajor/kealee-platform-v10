'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight, CheckCircle, Clock, DollarSign, Zap, Wrench, Droplets,
  Wind, Lightbulb, Download, Share2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { VideoComparison } from '@/components/VideoComparison'

// ─── Sample Concept Data ───────────────────────────────────────────────────────
// In production this would be fetched from the API using conceptId from query params.

const SAMPLE_CONCEPTS: Record<string, ConceptData> = {
  kitchen: {
    conceptId: 'concept_demo_001',
    projectType: 'Kitchen Renovation',
    scope: 'Complete kitchen renovation with island, new appliances, granite counters, updated lighting, and modern cabinetry.',
    budget: 75000,
    location: '20024 (Washington, DC)',
    estimatedCost: 70400,
    projectTimeline: '12–14 weeks',
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
      { item: 'Custom Kitchen Cabinetry',  quantity: 1,   unit: 'set',   estimatedCost: 15000, description: 'Custom-built cabinetry, soft-close hinges, modern handles' },
      { item: 'Granite Countertops',       quantity: 85,  unit: 'sqft',  estimatedCost: 8500,  description: 'Premium granite, edge finishing, backsplash included' },
      { item: 'Stainless Steel Appliances',quantity: 5,   unit: 'units', estimatedCost: 12000, description: 'Refrigerator, range, oven, dishwasher, microwave' },
      { item: 'Island with Seating',       quantity: 1,   unit: 'unit',  estimatedCost: 8000,  description: 'Custom island, 4-seat bar, storage underneath' },
      { item: 'Plumbing Fixtures',         quantity: 2,   unit: 'units', estimatedCost: 3000,  description: 'Faucets, sinks, handles, fixtures' },
      { item: 'Electrical Work',           quantity: 120, unit: 'hours', estimatedCost: 5400,  description: 'Rewiring, panel upgrades, outlet installation' },
      { item: 'Labor — Installation',      quantity: 240, unit: 'hours', estimatedCost: 18000, description: 'Cabinet installation, countertop, appliances, finishing' },
    ],
    nextStep: '/intake/permit_path_only',
    nextStepLabel: 'Continue to Permit Planning',
  },
  bathroom: {
    conceptId: 'concept_demo_002',
    projectType: 'Master Bathroom Remodel',
    scope: 'Master bathroom remodel with new shower, soaking tub, heated floors, double vanity, and tile work.',
    budget: 35000,
    location: '22202 (Arlington, VA)',
    estimatedCost: 31000,
    projectTimeline: '8–10 weeks',
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
      { item: 'Shower Enclosure & Tile',  quantity: 80,  unit: 'sqft',  estimatedCost: 6000,  description: 'Large-format tile, frameless glass, niche' },
      { item: 'Soaking Tub',             quantity: 1,   unit: 'unit',  estimatedCost: 3500,  description: 'Freestanding acrylic soaking tub' },
      { item: 'Double Vanity',           quantity: 1,   unit: 'unit',  estimatedCost: 2500,  description: '72" double vanity, soft-close, undermount sinks' },
      { item: 'Heated Floor System',     quantity: 100, unit: 'sqft',  estimatedCost: 3000,  description: 'Electric radiant mat with smart thermostat' },
      { item: 'Fixtures & Fittings',     quantity: 1,   unit: 'set',   estimatedCost: 4000,  description: 'Brushed nickel faucets, shower system, towel bars' },
      { item: 'Labor',                   quantity: 200, unit: 'hours', estimatedCost: 12000, description: 'Tile work, plumbing, electrical, finishing' },
    ],
    nextStep: '/intake/permit_path_only',
    nextStepLabel: 'Continue to Permit Planning',
  },
  garden: {
    conceptId: 'concept_demo_003',
    projectType: 'Garden / Landscape Design',
    scope: 'Front yard landscape redesign with native plants, irrigation system, and hardscaping.',
    budget: 12000,
    location: '20745 (Prince George\'s County, MD)',
    estimatedCost: 11800,
    projectTimeline: '4–6 weeks',
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
      { item: 'Native Plants Package', quantity: 45,  unit: 'plants',  estimatedCost: 2700, description: 'Dogwood, coneflower, black-eyed susan, ornamental grasses' },
      { item: 'Hardscaping Materials', quantity: 150, unit: 'sqft',    estimatedCost: 3000, description: 'Paver walkway, stone borders, mulch beds' },
      { item: 'Irrigation System',     quantity: 1,   unit: 'system',  estimatedCost: 2500, description: 'Drip lines, smart controller, hoses, fittings' },
      { item: 'Lighting System',       quantity: 12,  unit: 'fixtures',estimatedCost: 1200, description: 'Low-voltage LED path lights, uplighting' },
      { item: 'Installation Labor',    quantity: 80,  unit: 'hours',   estimatedCost: 2400, description: 'Planting, hardscaping, irrigation installation' },
    ],
    nextStep: '/intake/contractor_match',
    nextStepLabel: 'Find a Landscaping Contractor',
  },
}

// ─── Types ─────────────────────────────────────────────────────────────────────

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

interface ConceptData {
  conceptId: string
  projectType: string
  scope: string
  budget: number
  location: string
  estimatedCost: number
  projectTimeline: string
  designConcept: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  mepSystem: MEPSystem
  billOfMaterials: BOMItem[]
  nextStep: string
  nextStepLabel: string
}

// ─── MEP Section ───────────────────────────────────────────────────────────────

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ConceptDeliverablePage() {
  const searchParams = useSearchParams()
  const conceptType = searchParams.get('type') || 'kitchen'
  const data = SAMPLE_CONCEPTS[conceptType] || SAMPLE_CONCEPTS.kitchen

  const [showFullBOM, setShowFullBOM] = useState(false)
  const displayedBOM = showFullBOM ? data.billOfMaterials : data.billOfMaterials.slice(0, 4)

  const totalBOM = data.billOfMaterials.reduce((sum, item) => sum + item.estimatedCost, 0)
  const withinBudget = data.estimatedCost <= data.budget

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
                  style={{ backgroundColor: '#2ABFBF' }}
                >
                  Concept Ready
                </span>
                <span className="text-xs text-gray-400">{data.conceptId}</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
                {data.projectType}
              </h1>
              <p className="mt-1 text-sm text-gray-500 max-w-xl">{data.scope}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs text-gray-400 mb-0.5">Estimated Cost</p>
              <p className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
                ${data.estimatedCost.toLocaleString()}
              </p>
              <p className="text-xs mt-0.5" style={{ color: withinBudget ? '#38A169' : '#E53E3E' }}>
                {withinBudget
                  ? `$${(data.budget - data.estimatedCost).toLocaleString()} under budget`
                  : `$${(data.estimatedCost - data.budget).toLocaleString()} over budget`
                }
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              {data.projectTimeline}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-gray-400" />
              Budget: ${data.budget.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-gray-400" />
              {data.location}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* ── Video Comparison ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1A2B4A' }}>
            Before / After Concept Preview
          </h2>
          <VideoComparison
            projectType={conceptType}
            projectTitle={data.projectType}
            beforeVideoUrl=""
            afterVideoUrl=""
            duration={45}
          />
          <p className="mt-2 text-xs text-gray-400 text-center">
            AI-generated concept render — videos available after design package delivery
          </p>
        </section>

        {/* ── Design Concept ──────────────────────────────────────────────── */}
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2">Timeline</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <span className="font-semibold text-gray-900">{data.projectTimeline}</span>
                <span className="text-gray-500 ml-2">estimated project duration</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── MEP Systems ─────────────────────────────────────────────────── */}
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

        {/* ── Bill of Materials ───────────────────────────────────────────── */}
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

        {/* ── Next Steps ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-bold mb-4" style={{ color: '#1A2B4A' }}>Continue Your Project</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={data.nextStep}
              className="flex flex-col rounded-xl p-4 text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Recommended</span>
              <span className="text-sm font-semibold mb-auto">{data.nextStepLabel}</span>
              <ArrowRight className="h-4 w-4 mt-3" />
            </Link>
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
