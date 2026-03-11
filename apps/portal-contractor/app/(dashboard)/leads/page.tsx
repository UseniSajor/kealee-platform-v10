'use client'

import { useState } from 'react'
import { Search, MapPin, DollarSign, Calendar, Star, ChevronRight, Cpu, Wrench, Activity } from 'lucide-react'

// ── Seed-aligned constants ──────────────────────────────────────────
const LIFECYCLE_PHASES = [
  { key: 'IDEA', name: 'Idea', order: 1 },
  { key: 'LAND', name: 'Land Acquisition & Analysis', order: 2 },
  { key: 'FEASIBILITY', name: 'Feasibility Study', order: 3 },
  { key: 'DESIGN', name: 'Design & Architecture', order: 4 },
  { key: 'PERMITS', name: 'Permitting & Entitlements', order: 5 },
  { key: 'PRECONSTRUCTION', name: 'Pre-Construction', order: 6 },
  { key: 'CONSTRUCTION', name: 'Construction', order: 7 },
  { key: 'INSPECTIONS', name: 'Inspections & QA', order: 8 },
] as const

const CSI_DIVISIONS = {
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics & Composites',
  '07': 'Thermal & Moisture Protection',
  '08': 'Doors & Windows',
  '09': 'Finishes',
  '22': 'Plumbing',
  '23': 'HVAC',
  '26': 'Electrical',
} as const

const MOCK_LEADS = [
  {
    id: '1',
    title: 'Whole-Home Renovation - Westlake Hills',
    projectType: 'Renovation / Remodel',
    projectTypeKey: 'RENOVATION',
    twinTier: 'L1' as const,
    location: 'Westlake Hills, TX',
    budget: '$120,000 - $165,000',
    posted: '2 hours ago',
    matchScore: 96,
    lifecyclePhase: 'PRECONSTRUCTION',
    ownerRole: 'Homeowner',
    csiTrades: ['06', '09', '22', '26'] as const,
    description: 'Full interior renovation of a 2,800 sq ft ranch home. Kitchen, 3 bathrooms, flooring throughout, and electrical panel upgrade. Plans in hand, permit-ready.',
  },
  {
    id: '2',
    title: 'Custom New Home - Dripping Springs',
    projectType: 'New Home Construction',
    projectTypeKey: 'NEW_HOME',
    twinTier: 'L2' as const,
    location: 'Dripping Springs, TX',
    budget: '$650,000 - $800,000',
    posted: '5 hours ago',
    matchScore: 91,
    lifecyclePhase: 'DESIGN',
    ownerRole: 'Homeowner',
    csiTrades: ['03', '05', '06', '07', '08', '09', '22', '23', '26'] as const,
    description: 'Ground-up 3,600 sq ft single-family residence on 2-acre lot. Hill Country modern style with standing-seam metal roof, ICF foundation, and full smart-home package.',
  },
  {
    id: '3',
    title: 'Second-Story Addition - Mueller',
    projectType: 'Home Addition',
    projectTypeKey: 'ADDITION',
    twinTier: 'L2' as const,
    location: 'Mueller, Austin TX',
    budget: '$280,000 - $340,000',
    posted: '1 day ago',
    matchScore: 88,
    lifecyclePhase: 'PERMITS',
    ownerRole: 'Homeowner',
    csiTrades: ['03', '05', '06', '07', '09', '22', '23', '26'] as const,
    description: '1,200 sq ft second-story addition over existing single-story. 2 bedrooms, full bath, laundry, and new HVAC system. Structural engineering complete.',
  },
  {
    id: '4',
    title: 'Office Build-Out - Domain',
    projectType: 'Commercial Build-Out',
    projectTypeKey: 'COMMERCIAL',
    twinTier: 'L2' as const,
    location: 'The Domain, Austin TX',
    budget: '$380,000 - $520,000',
    posted: '1 day ago',
    matchScore: 78,
    lifecyclePhase: 'PRECONSTRUCTION',
    ownerRole: 'Developer',
    csiTrades: ['05', '06', '08', '09', '22', '23', '26'] as const,
    description: '5,400 sq ft Class A office tenant improvement. Open plan with 4 conference rooms, server room, and break room. LEED Silver target. Architect drawings 90% CD.',
  },
  {
    id: '5',
    title: 'Kitchen & Bath Remodel - Cedar Park',
    projectType: 'Renovation / Remodel',
    projectTypeKey: 'RENOVATION',
    twinTier: 'L1' as const,
    location: 'Cedar Park, TX',
    budget: '$65,000 - $85,000',
    posted: '2 days ago',
    matchScore: 93,
    lifecyclePhase: 'PRECONSTRUCTION',
    ownerRole: 'Homeowner',
    csiTrades: ['06', '09', '22', '26'] as const,
    description: 'Kitchen gut-and-remodel (180 sq ft) plus primary bath renovation. Custom cabinets, quartz counters, heated tile floors, and full re-plumb.',
  },
  {
    id: '6',
    title: 'Garage Apartment ADU - East Austin',
    projectType: 'Home Addition',
    projectTypeKey: 'ADDITION',
    twinTier: 'L2' as const,
    location: 'East Austin, TX',
    budget: '$180,000 - $240,000',
    posted: '3 days ago',
    matchScore: 85,
    lifecyclePhase: 'DESIGN',
    ownerRole: 'Homeowner',
    csiTrades: ['03', '05', '06', '07', '08', '09', '22', '23', '26'] as const,
    description: '650 sq ft detached ADU above 2-car garage. Full kitchen, bathroom, living area, and covered patio. Separate utility meters required per COA code.',
  },
]

const twinTierLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  L1: { label: 'L1 Light', color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  L2: { label: 'L2 Standard', color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
  L3: { label: 'L3 Premium', color: '#7C3AED', bgColor: 'rgba(124,58,237,0.1)' },
}

const phaseColors: Record<string, { color: string; bgColor: string }> = {
  IDEA: { color: '#6B7280', bgColor: 'rgba(107,114,128,0.1)' },
  DESIGN: { color: '#7C3AED', bgColor: 'rgba(124,58,237,0.1)' },
  PERMITS: { color: '#92400E', bgColor: 'rgba(251,191,36,0.15)' },
  PRECONSTRUCTION: { color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  CONSTRUCTION: { color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const projectTypes = ['All', 'Renovation / Remodel', 'New Home Construction', 'Home Addition', 'Commercial Build-Out']
  const filtered = MOCK_LEADS.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || l.projectType === typeFilter
    return matchSearch && matchType
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Available Leads</h1>
        <p className="mt-1 text-sm text-gray-600">{MOCK_LEADS.length} new leads matching your profile across {projectTypes.length - 1} project types</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search leads by name, location, or trade..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
            onFocus={(e) => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
            onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {projectTypes.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: typeFilter === t ? 'rgba(42,191,191,0.1)' : '#F3F4F6',
                color: typeFilter === t ? '#2ABFBF' : '#4B5563',
              }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Lead Cards */}
      <div className="space-y-4">
        {filtered.map((lead) => {
          const phaseMeta = LIFECYCLE_PHASES.find(p => p.key === lead.lifecyclePhase)
          const pColor = phaseColors[lead.lifecyclePhase] || { color: '#6B7280', bgColor: 'rgba(107,114,128,0.1)' }
          const twinMeta = twinTierLabels[lead.twinTier]

          return (
            <div key={lead.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold" style={{ color: '#1A2B4A' }}>{lead.title}</h3>
                    <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}>{lead.projectType}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.location}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{lead.budget}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{lead.posted}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">from {lead.ownerRole}</span>
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(56,161,105,0.1)' }}>
                  <Star className="h-3.5 w-3.5" style={{ color: '#38A169' }} />
                  <span className="text-xs font-semibold" style={{ color: '#38A169' }}>{lead.matchScore}%</span>
                </div>
              </div>

              <p className="mb-3 text-sm text-gray-600">{lead.description}</p>

              {/* Twin Tier & Lifecycle Phase */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: twinMeta.bgColor, color: twinMeta.color }}>
                  <Cpu className="h-3 w-3" />
                  Twin: {twinMeta.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: pColor.bgColor, color: pColor.color }}>
                  <Activity className="h-3 w-3" />
                  {phaseMeta?.name || lead.lifecyclePhase}
                </span>
              </div>

              {/* CSI Trade Categories */}
              <div className="mb-4">
                <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500">
                  <Wrench className="h-3 w-3" />
                  Required CSI Trades
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.csiTrades.map((div) => (
                    <span key={div} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                      Div {div} - {CSI_DIVISIONS[div]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#E8793A' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C65A20')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E8793A')}
                >
                  Submit Bid
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
