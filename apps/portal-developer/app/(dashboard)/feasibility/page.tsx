'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, TrendingUp, DollarSign, Building2, Calculator, Plus, ChevronRight, CheckCircle, XCircle, AlertTriangle, Layers } from 'lucide-react'

// ── v20 Seed: CSI Cost Categories ──────────────────────────
const CSI_DIVISIONS = [
  { division: '03', key: 'CSI_03_CONCRETE', name: 'Concrete' },
  { division: '04', key: 'CSI_04_MASONRY', name: 'Masonry' },
  { division: '05', key: 'CSI_05_METALS', name: 'Metals' },
  { division: '06', key: 'CSI_06_WOOD_PLASTICS', name: 'Wood, Plastics & Composites' },
  { division: '07', key: 'CSI_07_THERMAL_MOISTURE', name: 'Thermal & Moisture Protection' },
  { division: '08', key: 'CSI_08_DOORS_WINDOWS', name: 'Doors & Windows' },
  { division: '09', key: 'CSI_09_FINISHES', name: 'Finishes' },
  { division: '22', key: 'CSI_22_PLUMBING', name: 'Plumbing' },
  { division: '23', key: 'CSI_23_MECHANICAL', name: 'HVAC' },
  { division: '26', key: 'CSI_26_ELECTRICAL', name: 'Electrical' },
]

// ── v20 Seed: Project Types ────────────────────────────────
const PROJECT_TYPES: Record<string, { name: string; tier: string; modules: string[] }> = {
  MULTIFAMILY: { name: 'Multifamily Development', tier: 'L3', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  MIXED_USE: { name: 'Mixed-Use Development', tier: 'L3', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  COMMERCIAL: { name: 'Commercial Build-Out', tier: 'L2', modules: ['os-feas', 'os-dev', 'os-pm', 'os-pay', 'marketplace'] },
  NEW_HOME: { name: 'New Home Construction', tier: 'L2', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  ADDITION: { name: 'Home Addition', tier: 'L2', modules: ['os-dev', 'os-pm', 'os-pay', 'marketplace'] },
  RENOVATION: { name: 'Renovation / Remodel', tier: 'L1', modules: ['os-pm', 'os-pay', 'marketplace'] },
}


const statusColors: Record<string, string> = {
  Active: 'bg-blue-100 text-blue-700',
  Complete: 'bg-green-100 text-green-700',
  Draft: 'bg-gray-100 text-gray-700',
}

const decisionConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  GO: { label: 'GO', color: '#38A169', bg: 'bg-green-50', icon: CheckCircle },
  NO_GO: { label: 'NO-GO', color: '#E53E3E', bg: 'bg-red-50', icon: XCircle },
}

export default function FeasibilityPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [studies, setStudies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/v1/feasibility/studies`, {
          headers: {
            'Content-Type': 'application/json',
            ...(typeof window !== 'undefined' && localStorage.getItem('authToken') && {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            })
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = await response.json()
          const apiStudies = Array.isArray(data) ? data : data.studies || []
          if (apiStudies.length > 0) {
            setStudies(apiStudies)
            setIsLive(true)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch feasibility studies from API, using local data:', err)
        setIsLive(false)
      } finally {
        setLoading(false)
      }
    }

    fetchStudies()
  }, [])

  const totalPipeline = studies.reduce((s, st) => s + st.totalCost, 0)
  const goCount = studies.filter(s => s.decision === 'GO').length
  const noGoCount = studies.filter(s => s.decision === 'NO_GO').length
  const pendingCount = studies.filter(s => s.decision === null).length

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Feasibility Studies</h1>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                Live Data
              </span>
            )}
          </div>
          {studies.length === 0 && !loading ? (
            <p className="mt-1 text-sm text-amber-600">No feasibility studies yet. Create your first study to get started.</p>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              {studies.length} studies | ${(totalPipeline / 1000000).toFixed(0)}M pipeline | {goCount} GO | {noGoCount} NO-GO | {pendingCount} pending
            </p>
          )}
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
          <Plus className="h-4 w-4" />
          New Study
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <FlaskConical className="h-5 w-5" style={{ color: '#2ABFBF' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{studies.reduce((s, st) => s + st.scenarios.length, 0)}</p>
          <p className="text-xs text-gray-500">Total Scenarios</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <DollarSign className="h-5 w-5" style={{ color: '#38A169' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalPipeline / 1000000).toFixed(0)}M</p>
          <p className="text-xs text-gray-500">Total Pipeline TDC</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <CheckCircle className="h-5 w-5" style={{ color: '#38A169' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#38A169' }}>{goCount}</p>
          <p className="text-xs text-gray-500">GO Decisions</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Layers className="h-5 w-5" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#E8793A' }}>{CSI_DIVISIONS.length}</p>
          <p className="text-xs text-gray-500">CSI Divisions Tracked</p>
        </div>
      </div>

      {/* Studies */}
      <div className="space-y-6">
        {studies.map((study) => {
          const pt = PROJECT_TYPES[study.projectType]
          const isExpanded = expandedId === study.id
          const bestScenario = (study.scenarios as any[]).reduce((best: any, s: any) => s.irr > best.irr ? s : best, study.scenarios[0])

          return (
            <div key={study.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold" style={{ color: '#1A2B4A' }}>{study.parcel}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[study.status]}`}>{study.status}</span>
                    {study.decision && (
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: study.decision === 'GO' ? 'rgba(56,161,105,0.1)' : 'rgba(229,62,62,0.1)', color: study.decision === 'GO' ? '#38A169' : '#E53E3E' }}>
                        {study.decision === 'GO' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {study.decision === 'GO' ? 'GO' : 'NO-GO'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{pt.name} | {pt.tier} Twin | {study.scenarios.length} scenarios analyzed</p>
                </div>
                <button onClick={() => setExpandedId(isExpanded ? null : study.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  {isExpanded ? 'Collapse' : 'Expand'} <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Key Metrics (always visible) */}
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F7FAFC' }}>
                  <p className="text-xs text-gray-500">Total Development Cost</p>
                  <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>${(study.totalCost / 1000000).toFixed(2)}M</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F7FAFC' }}>
                  <p className="text-xs text-gray-500">Projected Revenue</p>
                  <p className="text-lg font-bold" style={{ color: '#38A169' }}>${(study.projectedRevenue / 1000000).toFixed(2)}M</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F7FAFC' }}>
                  <p className="text-xs text-gray-500">Best-Case IRR</p>
                  <p className="text-lg font-bold" style={{ color: '#2ABFBF' }}>{bestScenario.irr}%</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F7FAFC' }}>
                  <p className="text-xs text-gray-500">Equity Multiple</p>
                  <p className="text-lg font-bold" style={{ color: '#E8793A' }}>{bestScenario.equityMultiple}x</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#F7FAFC' }}>
                  <p className="text-xs text-gray-500">Yield on Cost</p>
                  <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{bestScenario.yieldOnCost}%</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Land</p>
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>${(study.landCost / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Hard Costs</p>
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>${(study.hardCost / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                  <Calculator className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Soft Costs</p>
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>${(study.softCost / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  {/* Scenario Comparison Table */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Scenario Comparison</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 font-medium text-gray-500">Scenario</th>
                            <th className="px-4 py-2 font-medium text-gray-500">Units</th>
                            <th className="px-4 py-2 font-medium text-gray-500">TDC</th>
                            <th className="px-4 py-2 font-medium text-gray-500">Revenue</th>
                            <th className="px-4 py-2 font-medium text-gray-500">IRR</th>
                            <th className="px-4 py-2 font-medium text-gray-500">EM</th>
                            <th className="px-4 py-2 font-medium text-gray-500">YoC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(study.scenarios as any[]).map((sc: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-4 py-2 font-medium" style={{ color: '#1A2B4A' }}>{sc.name}</td>
                              <td className="px-4 py-2 text-gray-600">{sc.units}</td>
                              <td className="px-4 py-2 text-gray-600">${(sc.totalCost / 1000000).toFixed(1)}M</td>
                              <td className="px-4 py-2 text-gray-600">${(sc.revenue / 1000000).toFixed(1)}M</td>
                              <td className="px-4 py-2 font-semibold" style={{ color: sc.irr >= 18 ? '#38A169' : sc.irr >= 12 ? '#E8793A' : '#E53E3E' }}>{sc.irr}%</td>
                              <td className="px-4 py-2 text-gray-600">{sc.equityMultiple}x</td>
                              <td className="px-4 py-2 text-gray-600">{sc.yieldOnCost}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CSI Hard Cost Breakdown */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>CSI Division Cost Breakdown</h4>
                    <div className="space-y-2">
                      {(study.csiBreakdown as any[]).map((csi: any) => (
                        <div key={csi.division} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-xs text-gray-500">Div {csi.division}</span>
                          <span className="w-36 shrink-0 text-xs font-medium text-gray-700">{csi.name}</span>
                          <div className="flex-1">
                            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full" style={{ width: `${csi.pct}%`, backgroundColor: '#2ABFBF' }} />
                            </div>
                          </div>
                          <span className="w-20 shrink-0 text-right text-xs font-medium" style={{ color: '#1A2B4A' }}>${(csi.cost / 1000000).toFixed(2)}M</span>
                          <span className="w-10 shrink-0 text-right text-xs text-gray-400">{csi.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro-Forma */}
                  <div>
                    <h4 className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Pro-Forma Assumptions</h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">{study.projectType === 'COMMERCIAL' ? 'NNN/SF/yr' : 'Avg Monthly Rent'}</p>
                        <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{study.projectType === 'COMMERCIAL' ? `$${study.proForma.monthlyRent}` : `$${study.proForma.monthlyRent.toLocaleString()}`}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Occupancy</p>
                        <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{study.proForma.occupancy}%</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Cap Rate</p>
                        <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{study.proForma.capRate}%</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Exit Value</p>
                        <p className="text-sm font-bold" style={{ color: '#38A169' }}>${(study.proForma.exitValue / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Hold Period</p>
                        <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{study.proForma.holdPeriod} mo</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
