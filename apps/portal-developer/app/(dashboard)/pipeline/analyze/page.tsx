'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, MapPin, BarChart3,
  Layers, TrendingUp, Building2, DollarSign, FileText,
  AlertCircle, Boxes, Target, Upload,
} from 'lucide-react'

type Step = 'parcel' | 'zoning' | 'feasibility' | 'capital' | 'decision'

const STEPS: { id: Step; label: string }[] = [
  { id: 'parcel', label: 'Parcel Data' },
  { id: 'zoning', label: 'Zoning Analysis' },
  { id: 'feasibility', label: 'Feasibility' },
  { id: 'capital', label: 'Capital Stack' },
  { id: 'decision', label: 'Decision' },
]

const ZONING_ANALYSIS = {
  zoneCode: 'R-60',
  zoneName: 'Residential — Single Family',
  maxDensity: '6 units/acre',
  maxHeight: '35 ft',
  maxFAR: 0.35,
  setbacks: { front: '25 ft', side: '8 ft', rear: '20 ft' },
  allowedUses: ['Single Family', 'Duplex (by-right)', 'ADU', 'Home Office'],
  overlays: ['Historic District Buffer', 'Tree Preservation'],
  parkingReq: '2 spaces per unit',
  score: 78,
}

const FEASIBILITY = {
  scenarios: [
    {
      name: 'Duplex (By-Right)',
      units: 2,
      sqft: 3200,
      totalCost: 620000,
      revenue: 890000,
      profit: 270000,
      roi: 43.5,
      irr: 28.2,
      timeline: '14 months',
      risk: 'Low',
    },
    {
      name: 'Single Family + ADU',
      units: 2,
      sqft: 2800,
      totalCost: 540000,
      revenue: 760000,
      profit: 220000,
      roi: 40.7,
      irr: 25.8,
      timeline: '12 months',
      risk: 'Low',
    },
    {
      name: 'Townhomes (Variance Needed)',
      units: 4,
      sqft: 5600,
      totalCost: 1180000,
      revenue: 1720000,
      profit: 540000,
      roi: 45.8,
      irr: 31.4,
      timeline: '20 months',
      risk: 'Medium',
    },
  ],
}

const CAPITAL_STACK = {
  totalCapital: 620000,
  senior: { label: 'Senior Debt', amount: 434000, pct: 70, rate: '7.25%', term: '18 months', color: '#1A2B4A' },
  mezz: { label: 'Mezzanine', amount: 93000, pct: 15, rate: '12%', term: '18 months', color: '#E8793A' },
  equity: { label: 'Developer Equity', amount: 93000, pct: 15, rate: 'IRR 28%', term: 'At exit', color: '#2ABFBF' },
}

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>('parcel')
  const [selectedScenario, setSelectedScenario] = useState(0)
  const [parcel, setParcel] = useState({ address: '', acreage: '', apn: '' })
  const [decision, setDecision] = useState<'go' | 'no-go' | null>(null)

  const currentIdx = STEPS.findIndex(s => s.id === step)

  const nextStep = () => {
    if (currentIdx < STEPS.length - 1) setStep(STEPS[currentIdx + 1].id)
  }
  const prevStep = () => {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1].id)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/pipeline" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to pipeline
      </Link>

      <h1 className="font-display mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Land Analysis</h1>
      <p className="mb-8 text-sm text-gray-500">OS-Land + OS-Feas: Parcel analysis, zoning, feasibility, and capital structuring</p>

      {/* Step Progress */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: i < currentIdx ? '#38A169' : i === currentIdx ? '#2ABFBF' : '#E5E7EB',
                  color: i <= currentIdx ? 'white' : '#9CA3AF',
                }}
              >
                {i < currentIdx ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1.5 text-[11px] font-medium" style={{ color: i <= currentIdx ? '#1A2B4A' : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1 mt-[-18px] h-0.5 w-8 sm:w-16" style={{
                backgroundColor: i < currentIdx ? '#38A169' : '#E5E7EB',
              }} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 'parcel' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Parcel Information</h2>
            <p className="mb-6 text-sm text-gray-500">Enter parcel details or upload a survey</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Property Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={parcel.address} onChange={(e) => setParcel({ ...parcel, address: e.target.value })}
                    placeholder="Enter address to auto-lookup parcel data"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Acreage</label>
                  <input type="text" value={parcel.acreage} onChange={(e) => setParcel({ ...parcel, acreage: e.target.value })}
                    placeholder="0.25"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">APN / Parcel Number</label>
                  <input type="text" value={parcel.apn} onChange={(e) => setParcel({ ...parcel, apn: e.target.value })}
                    placeholder="02-1234-5678"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties} />
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Upload survey, deed, or environmental report</p>
                <p className="text-xs text-gray-400">PDF, DWG, or image files</p>
              </div>
            </div>
          </div>
        )}

        {step === 'zoning' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>AI Zoning Analysis</h2>
            <p className="mb-6 text-sm text-gray-500">Powered by KeaBot Land — automated zoning analysis for this parcel</p>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                <Target className="h-7 w-7" style={{ color: '#2ABFBF' }} />
              </div>
              <div>
                <p className="font-display text-3xl font-bold" style={{ color: '#2ABFBF' }}>{ZONING_ANALYSIS.score}/100</p>
                <p className="text-xs text-gray-500">Development Readiness Score</p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Zone</p>
                <p className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>{ZONING_ANALYSIS.zoneCode}</p>
                <p className="text-xs text-gray-400">{ZONING_ANALYSIS.zoneName}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Max Density</p>
                <p className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>{ZONING_ANALYSIS.maxDensity}</p>
                <p className="text-xs text-gray-400">FAR: {ZONING_ANALYSIS.maxFAR}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Max Height</p>
                <p className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>{ZONING_ANALYSIS.maxHeight}</p>
                <p className="text-xs text-gray-400">Parking: {ZONING_ANALYSIS.parkingReq}</p>
              </div>
            </div>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium" style={{ color: '#1A2B4A' }}>Allowed Uses</h3>
                <div className="space-y-1.5">
                  {ZONING_ANALYSIS.allowedUses.map((use) => (
                    <div key={use} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-3.5 w-3.5" style={{ color: '#38A169' }} />
                      {use}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium" style={{ color: '#1A2B4A' }}>Setbacks</h3>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <div>Front: <strong>{ZONING_ANALYSIS.setbacks.front}</strong></div>
                  <div>Side: <strong>{ZONING_ANALYSIS.setbacks.side}</strong></div>
                  <div>Rear: <strong>{ZONING_ANALYSIS.setbacks.rear}</strong></div>
                </div>
                <h3 className="mb-1 mt-3 text-sm font-medium" style={{ color: '#1A2B4A' }}>Overlays</h3>
                <div className="space-y-1">
                  {ZONING_ANALYSIS.overlays.map((o) => (
                    <div key={o} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-3.5 w-3.5" style={{ color: '#E8793A' }} />
                      <span className="text-gray-700">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'feasibility' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Feasibility Scenarios</h2>
            <p className="mb-6 text-sm text-gray-500">AI-generated development scenarios ranked by ROI</p>

            <div className="space-y-4">
              {FEASIBILITY.scenarios.map((scenario, i) => (
                <button
                  key={scenario.name}
                  onClick={() => setSelectedScenario(i)}
                  className="w-full rounded-xl border-2 p-5 text-left transition-all"
                  style={{
                    borderColor: selectedScenario === i ? '#2ABFBF' : '#E5E7EB',
                    backgroundColor: selectedScenario === i ? 'rgba(42,191,191,0.04)' : 'white',
                  }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-semibold" style={{ color: '#1A2B4A' }}>{scenario.name}</h3>
                      <p className="text-xs text-gray-500">{scenario.units} units | {scenario.sqft.toLocaleString()} sqft | {scenario.timeline}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{
                      backgroundColor: scenario.risk === 'Low' ? 'rgba(56,161,105,0.1)' : 'rgba(232,121,58,0.1)',
                      color: scenario.risk === 'Low' ? '#38A169' : '#E8793A',
                    }}>
                      {scenario.risk} Risk
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Cost</p>
                      <p className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>${(scenario.totalCost / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="font-display text-lg font-bold" style={{ color: '#38A169' }}>${(scenario.revenue / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="font-display text-lg font-bold" style={{ color: '#E8793A' }}>${(scenario.profit / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ROI / IRR</p>
                      <p className="font-display text-lg font-bold" style={{ color: '#2ABFBF' }}>{scenario.roi}% / {scenario.irr}%</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'capital' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Capital Stack Builder</h2>
            <p className="mb-6 text-sm text-gray-500">Structure your financing for the selected scenario</p>

            <div className="mb-6 text-center">
              <p className="font-display text-3xl font-bold" style={{ color: '#1A2B4A' }}>${(CAPITAL_STACK.totalCapital / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Total Capital Required</p>
            </div>

            {/* Visual Stack */}
            <div className="mb-6 flex h-8 w-full overflow-hidden rounded-lg">
              <div style={{ width: `${CAPITAL_STACK.senior.pct}%`, backgroundColor: CAPITAL_STACK.senior.color }} />
              <div style={{ width: `${CAPITAL_STACK.mezz.pct}%`, backgroundColor: CAPITAL_STACK.mezz.color }} />
              <div style={{ width: `${CAPITAL_STACK.equity.pct}%`, backgroundColor: CAPITAL_STACK.equity.color }} />
            </div>

            <div className="space-y-4">
              {[CAPITAL_STACK.senior, CAPITAL_STACK.mezz, CAPITAL_STACK.equity].map((layer) => (
                <div key={layer.label} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: layer.color }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{layer.label}</p>
                      <p className="text-xs text-gray-400">{layer.rate} | {layer.term}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold" style={{ color: layer.color }}>${(layer.amount / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-400">{layer.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'decision' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Go / No-Go Decision</h2>
            <p className="mb-6 text-sm text-gray-500">Review the AI recommendation and make your decision</p>

            <div className="mb-6 rounded-xl p-5" style={{ backgroundColor: 'rgba(42,191,191,0.06)' }}>
              <div className="mb-3 flex items-center gap-2">
                <Boxes className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>KeaBot Feasibility Recommendation</span>
              </div>
              <p className="text-sm text-gray-700">
                Based on zoning analysis (score 78/100), the <strong>Duplex (By-Right)</strong> scenario offers the best risk-adjusted return.
                ROI of 43.5% with low permitting risk since duplex is a by-right use.
                Senior debt at 70% LTV is achievable with current market rates.
                <strong className="block mt-2" style={{ color: '#38A169' }}>Recommendation: GO</strong>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setDecision('go')}
                className="rounded-xl border-2 p-6 text-center transition-all"
                style={{
                  borderColor: decision === 'go' ? '#38A169' : '#E5E7EB',
                  backgroundColor: decision === 'go' ? 'rgba(56,161,105,0.06)' : 'white',
                }}
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{
                  backgroundColor: decision === 'go' ? 'rgba(56,161,105,0.15)' : '#F7FAFC',
                }}>
                  <TrendingUp className="h-7 w-7" style={{ color: decision === 'go' ? '#38A169' : '#9CA3AF' }} />
                </div>
                <p className="font-display text-xl font-bold" style={{ color: decision === 'go' ? '#38A169' : '#1A2B4A' }}>GO</p>
                <p className="mt-1 text-xs text-gray-500">Proceed to project creation & twin activation</p>
              </button>

              <button
                onClick={() => setDecision('no-go')}
                className="rounded-xl border-2 p-6 text-center transition-all"
                style={{
                  borderColor: decision === 'no-go' ? '#E53E3E' : '#E5E7EB',
                  backgroundColor: decision === 'no-go' ? 'rgba(229,62,62,0.06)' : 'white',
                }}
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{
                  backgroundColor: decision === 'no-go' ? 'rgba(229,62,62,0.15)' : '#F7FAFC',
                }}>
                  <AlertCircle className="h-7 w-7" style={{ color: decision === 'no-go' ? '#E53E3E' : '#9CA3AF' }} />
                </div>
                <p className="font-display text-xl font-bold" style={{ color: decision === 'no-go' ? '#E53E3E' : '#1A2B4A' }}>NO-GO</p>
                <p className="mt-1 text-xs text-gray-500">Archive analysis for future reference</p>
              </button>
            </div>

            {decision === 'go' && (
              <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: '#F7FAFC' }}>
                <p className="mb-2 text-sm font-medium" style={{ color: '#1A2B4A' }}>Next steps when you proceed:</p>
                <div className="space-y-1.5">
                  {[
                    'Digital Twin (L2) created for this development',
                    'OS-Dev capital stack module activated',
                    'KeaBot Developer begins lender outreach',
                    'Feasibility study archived as twin snapshot',
                    'Design team assignment initiated',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3 w-3" style={{ color: '#38A169' }} /> {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {currentIdx > 0 ? (
            <button onClick={prevStep}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : <div />}

          {step === 'decision' && decision === 'go' ? (
            <button className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: '#38A169' }}>
              <Layers className="h-4 w-4" /> Create Project & Activate Twin
            </button>
          ) : step !== 'decision' ? (
            <button onClick={nextStep}
              className="flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: '#2ABFBF' }}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
