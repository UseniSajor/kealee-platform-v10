'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, DollarSign, FileText,
  Upload, Calendar, Clock, Users, AlertCircle, Boxes,
  Hammer, Send,
} from 'lucide-react'

type Step = 'review' | 'pricing' | 'schedule' | 'team' | 'submit'

const STEPS: { id: Step; label: string }[] = [
  { id: 'review', label: 'Project Review' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'team', label: 'Team' },
  { id: 'submit', label: 'Submit' },
]

const PROJECT = {
  id: 'proj-001',
  name: 'Kitchen Remodel - Oak Lane',
  owner: 'Jennifer Adams',
  address: '38 Oak Lane, Silver Spring MD',
  type: 'Renovation',
  sqft: 320,
  budget: '75,000 - 95,000',
  twinTier: 'L1',
  scope: [
    'Demo existing kitchen (320 sqft)',
    'New cabinets, countertops, backsplash',
    'Electrical upgrades (lighting, outlets)',
    'Plumbing (new sink, dishwasher)',
    'Flooring (LVP throughout)',
    'Painting and trim',
  ],
  documents: [
    { name: 'Floor Plan.pdf', size: '2.4 MB' },
    { name: 'Kitchen Design.pdf', size: '5.1 MB' },
    { name: 'Material Selections.xlsx', size: '840 KB' },
  ],
  deadline: '2026-03-15',
}

const COST_SECTIONS = [
  { label: 'Demolition', defaultAmount: '' },
  { label: 'Cabinetry', defaultAmount: '' },
  { label: 'Countertops', defaultAmount: '' },
  { label: 'Electrical', defaultAmount: '' },
  { label: 'Plumbing', defaultAmount: '' },
  { label: 'Flooring', defaultAmount: '' },
  { label: 'Paint & Trim', defaultAmount: '' },
  { label: 'Permits & Fees', defaultAmount: '' },
]

export default function SubmitBidPage() {
  const [step, setStep] = useState<Step>('review')
  const [costs, setCosts] = useState<Record<string, string>>({})
  const [overhead, setOverhead] = useState('10')
  const [profit, setProfit] = useState('10')
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState('')
  const [crewSize, setCrewSize] = useState('')
  const [subs, setSubs] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentIdx = STEPS.findIndex(s => s.id === step)

  const directCost = Object.values(costs).reduce((sum, v) => sum + (parseFloat(v.replace(/,/g, '')) || 0), 0)
  const overheadAmt = directCost * (parseFloat(overhead) / 100)
  const profitAmt = (directCost + overheadAmt) * (parseFloat(profit) / 100)
  const totalBid = directCost + overheadAmt + profitAmt

  const nextStep = () => {
    if (currentIdx < STEPS.length - 1) setStep(STEPS[currentIdx + 1].id)
  }
  const prevStep = () => {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1].id)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 2000))
    window.location.href = '/bids'
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/bids" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to bids
      </Link>

      <h1 className="font-display mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Submit Bid</h1>
      <p className="mb-8 text-sm text-gray-500">{PROJECT.name} — Deadline: {new Date(PROJECT.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      {/* Step Progress */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor: i < currentIdx ? '#38A169' : i === currentIdx ? '#E8793A' : '#E5E7EB',
                  color: i <= currentIdx ? 'white' : '#9CA3AF',
                }}
              >
                {i < currentIdx ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1.5 text-xs font-medium" style={{ color: i <= currentIdx ? '#1A2B4A' : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-2 mt-[-18px] h-0.5 w-8 sm:w-16" style={{
                backgroundColor: i < currentIdx ? '#38A169' : '#E5E7EB',
              }} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 'review' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Project Review</h2>
            <p className="mb-6 text-sm text-gray-500">Review project details before preparing your bid</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Project Owner</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>{PROJECT.owner}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>{PROJECT.address}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Budget Range</p>
                <p className="font-medium" style={{ color: '#E8793A' }}>${PROJECT.budget}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Size / Type</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>{PROJECT.sqft} sqft {PROJECT.type}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium" style={{ color: '#1A2B4A' }}>Scope of Work</h3>
              <div className="space-y-2">
                {PROJECT.scope.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Hammer className="h-3.5 w-3.5" style={{ color: '#2ABFBF' }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-3 text-sm font-medium" style={{ color: '#1A2B4A' }}>Project Documents</h3>
              <div className="space-y-2">
                {PROJECT.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: '#E8793A' }} />
                      <span className="text-sm text-gray-700">{doc.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{doc.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: 'rgba(42,191,191,0.06)' }}>
              <Boxes className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#2ABFBF' }} />
              <p className="text-xs text-gray-600">
                This project has a <strong>{PROJECT.twinTier}</strong> Digital Twin. Your bid will be tracked through the twin&apos;s payment milestone system.
              </p>
            </div>
          </div>
        )}

        {step === 'pricing' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Cost Breakdown</h2>
            <p className="mb-6 text-sm text-gray-500">Enter your pricing by cost category</p>

            <div className="space-y-3">
              {COST_SECTIONS.map((section) => (
                <div key={section.label} className="flex items-center gap-4">
                  <label className="w-32 flex-shrink-0 text-sm text-gray-700">{section.label}</label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="text"
                      value={costs[section.label] || ''}
                      onChange={(e) => setCosts({ ...costs, [section.label]: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-4 text-right text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-gray-100" />

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="w-32 flex-shrink-0 text-sm text-gray-700">Overhead (%)</label>
                <input
                  type="text" value={overhead} onChange={(e) => setOverhead(e.target.value)}
                  className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-right text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                />
                <span className="text-sm text-gray-500">${overheadAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-32 flex-shrink-0 text-sm text-gray-700">Profit (%)</label>
                <input
                  type="text" value={profit} onChange={(e) => setProfit(e.target.value)}
                  className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-right text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                />
                <span className="text-sm text-gray-500">${profitAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: '#F7FAFC' }}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>Total Bid</span>
                <span className="font-display text-2xl font-bold" style={{ color: '#E8793A' }}>
                  ${totalBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Direct: ${directCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} +
                OH: ${overheadAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} +
                Profit: ${profitAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}

        {step === 'schedule' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Proposed Schedule</h2>
            <p className="mb-6 text-sm text-gray-500">When can you start and how long will it take?</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Proposed Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Estimated Duration (weeks)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 6"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes on Schedule</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any scheduling considerations, lead times, etc."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'team' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Team & Subcontractors</h2>
            <p className="mb-6 text-sm text-gray-500">Who will be working on this project?</p>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">Crew Size</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={crewSize} onChange={(e) => setCrewSize(e.target.value)} placeholder="e.g. 4"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">Subcontractors Needed</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {['Electrician', 'Plumber', 'HVAC', 'Tile Installer', 'Painter', 'Flooring'].map((trade) => (
                  <button
                    key={trade}
                    onClick={() => setSubs(prev => prev.includes(trade) ? prev.filter(s => s !== trade) : [...prev, trade])}
                    className="flex items-center gap-2 rounded-lg border-2 p-3 text-left text-sm transition-all"
                    style={{
                      borderColor: subs.includes(trade) ? '#2ABFBF' : '#E5E7EB',
                      backgroundColor: subs.includes(trade) ? 'rgba(42,191,191,0.04)' : 'white',
                    }}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded" style={{
                      backgroundColor: subs.includes(trade) ? '#2ABFBF' : '#E5E7EB',
                    }}>
                      {subs.includes(trade) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span style={{ color: subs.includes(trade) ? '#1A2B4A' : '#6B7280' }}>{trade}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'submit' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Review & Submit</h2>
            <p className="mb-6 text-sm text-gray-500">Confirm your bid details</p>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Project</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>{PROJECT.name}</p>
                <p className="text-xs text-gray-400">{PROJECT.address}</p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Bid Amount</p>
                <p className="font-display text-2xl font-bold" style={{ color: '#E8793A' }}>
                  ${totalBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400">
                  Direct ${directCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} |
                  OH {overhead}% |
                  Profit {profit}%
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 p-4">
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{startDate || 'TBD'}</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-4">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{duration ? `${duration} weeks` : 'TBD'}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Team</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>Crew of {crewSize || '—'}</p>
                {subs.length > 0 && <p className="text-xs text-gray-400">Subs: {subs.join(', ')}</p>}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: 'rgba(232,121,58,0.06)' }}>
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#E8793A' }} />
              <p className="text-xs text-gray-600">
                By submitting, your bid will be visible to the project owner. You&apos;ll be notified via KeaBot GC when the owner reviews your bid.
                All payments will be processed through Kealee&apos;s escrow system.
              </p>
            </div>
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

          {step === 'submit' ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#E8793A' }}>
              {submitting ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Bid</>
              )}
            </button>
          ) : (
            <button onClick={nextStep}
              className="flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#2ABFBF' }}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
