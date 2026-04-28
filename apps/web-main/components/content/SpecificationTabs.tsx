'use client'

import { useState } from 'react'
import type { Concept } from '@/lib/types'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'zoning', label: 'Zoning' },
  { id: 'permits', label: 'Permits' },
  { id: 'budget', label: 'Budget' },
  { id: 'mep', label: 'MEP' },
  { id: 'timeline', label: 'Timeline' },
]

interface Props {
  concept: Concept
  tier: 1 | 2 | 3
}

function OverviewTab({ concept }: { concept: Concept }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Service', value: concept.service },
          { label: 'Estimated Cost', value: concept.estimatedCost ? `$${concept.estimatedCost.toLocaleString()}` : 'Pending' },
          { label: 'Build Timeline', value: concept.timeline ?? 'Pending' },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
            <p className="text-base font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Project Scope</p>
        <p className="text-sm text-slate-700 leading-relaxed">{concept.scope}</p>
      </div>
    </div>
  )
}

function ZoningTab({ concept }: { concept: Concept }) {
  const analysis = concept.zoningAnalysis as any
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Jurisdiction</p>
        <p className="text-sm text-blue-900 font-semibold">{analysis?.jurisdiction ?? `ZIP: ${concept.location}`}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Zoning District', value: analysis?.zoningDistrict ?? 'Residential (R-1)' },
          { label: 'Max Coverage', value: analysis?.maxCoverage ?? '40%' },
          { label: 'Setbacks (Front/Side/Rear)', value: analysis?.setbacks ?? '25ft / 5ft / 20ft' },
          { label: 'Max Height', value: analysis?.maxHeight ?? '35 ft' },
        ].map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">{item.label}</p>
            <p className="text-sm font-bold text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>
      {analysis?.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-700 mb-1">Notes</p>
          <p className="text-sm text-amber-900">{analysis.notes}</p>
        </div>
      )}
    </div>
  )
}

function PermitsTab({ concept }: { concept: Concept }) {
  const permits = concept.permits ?? [
    { name: 'Building Permit', jurisdiction: 'Local', estimatedFee: 800, leadTime: '4–6 weeks', required: true },
    { name: 'Electrical Permit', jurisdiction: 'Local', estimatedFee: 150, leadTime: '2–3 weeks', required: true },
    { name: 'Plumbing Permit', jurisdiction: 'Local', estimatedFee: 150, leadTime: '2–3 weeks', required: true },
  ]
  const total = permits.reduce((s, p) => s + p.estimatedFee, 0)

  return (
    <div className="space-y-3">
      {permits.map((p, i) => (
        <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.required ? 'bg-[#E8724B]' : 'bg-slate-300'}`} />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-500">{p.jurisdiction} · Est. {p.leadTime}</p>
          </div>
          <p className="text-sm font-semibold text-slate-900 shrink-0">${p.estimatedFee.toLocaleString()}</p>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4 mt-2">
        <p className="text-sm font-bold text-white">Estimated Permit Fees</p>
        <p className="text-lg font-black text-[#E8724B]">${total.toLocaleString()}</p>
      </div>
    </div>
  )
}

function BudgetTab({ concept }: { concept: Concept }) {
  const estimated = concept.estimatedCost ?? 0
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Your Budget</p>
        <p className="text-3xl font-black text-slate-900">${concept.budget.toLocaleString()}</p>
      </div>
      {estimated > 0 && (
        <>
          <div className="bg-slate-50 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Kealee Estimate</p>
            <p className="text-3xl font-black text-[#E8724B]">${estimated.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-4 ${estimated <= concept.budget ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
            <p className={`text-sm font-semibold ${estimated <= concept.budget ? 'text-green-700' : 'text-amber-700'}`}>
              {estimated <= concept.budget
                ? `✓ Within budget by $${(concept.budget - estimated).toLocaleString()}`
                : `Exceeds budget by $${(estimated - concept.budget).toLocaleString()} — consider scope adjustments`}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function MEPTab({ concept }: { concept: Concept }) {
  const items = [
    { category: 'Electrical', icon: '⚡', items: ['200A service panel upgrade', 'LED recessed lighting', 'GFCI outlets at all wet locations', 'Smart switch wiring'] },
    { category: 'Plumbing', icon: '🔧', items: ['Shut-off valves at all fixtures', 'PEX supply lines', 'PVC drain/waste/vent', 'Pressure-reducing valve'] },
    { category: 'HVAC', icon: '❄️', items: ['Mini-split system (1.5 ton)', 'Fresh air ventilation', 'Range hood ductwork', 'Thermostat wiring'] },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {items.map((cat) => (
        <div key={cat.category} className="bg-slate-50 rounded-xl p-4">
          <p className="text-base font-bold text-slate-900 mb-3">{cat.icon} {cat.category}</p>
          <ul className="space-y-1.5">
            {cat.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-[#E8724B] mt-0.5 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TimelineTab({ concept }: { concept: Concept }) {
  const phases = [
    { n: 1, name: 'Design & Permits', weeks: '2–4 weeks', desc: 'Finalize drawings and submit permit applications' },
    { n: 2, name: 'Demo & Rough-In', weeks: '1–2 weeks', desc: 'Demolition and rough MEP work' },
    { n: 3, name: 'Construction', weeks: '4–8 weeks', desc: 'Framing, insulation, drywall, tile' },
    { n: 4, name: 'Finishes & Punch', weeks: '2–3 weeks', desc: 'Cabinets, fixtures, trim, paint, final inspections' },
  ]

  return (
    <div className="space-y-3">
      {phases.map((phase) => (
        <div key={phase.n} className="flex gap-4 bg-slate-50 rounded-xl p-4">
          <div className="w-8 h-8 rounded-full bg-[#1A2B4A] text-white text-sm font-bold flex items-center justify-center shrink-0">
            {phase.n}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-bold text-slate-900">{phase.name}</p>
              <span className="text-xs font-semibold text-[#E8724B] whitespace-nowrap">{phase.weeks}</span>
            </div>
            <p className="text-xs text-slate-500">{phase.desc}</p>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl bg-[#1A2B4A] p-4 mt-2">
        <p className="text-sm font-bold text-white">Total Timeline</p>
        <p className="text-base font-black text-[#E8724B]">{concept.timeline ?? '9–17 weeks'}</p>
      </div>
    </div>
  )
}

export function SpecificationTabs({ concept, tier }: Props) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Project Specifications</h2>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[#E8724B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab concept={concept} />}
        {activeTab === 'zoning' && <ZoningTab concept={concept} />}
        {activeTab === 'permits' && <PermitsTab concept={concept} />}
        {activeTab === 'budget' && <BudgetTab concept={concept} />}
        {activeTab === 'mep' && <MEPTab concept={concept} />}
        {activeTab === 'timeline' && <TimelineTab concept={concept} />}
      </div>
    </div>
  )
}
