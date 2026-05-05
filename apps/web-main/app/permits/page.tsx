'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, MapPin, Shield, Clock, Zap, CheckCircle2,
  ArrowRight, FileCheck, Users, TrendingUp, ChevronRight,
  Loader2, Check, Lock, AlertCircle, Phone,
  Home, Wind, Utensils, HardHat, ShoppingBag, Briefcase, Paintbrush, Droplets, Star,
} from 'lucide-react'
import { SERVICE_PRICING, PERMIT_SUBMISSION_MULTIPLIERS } from '@kealee/shared/pricing'

// ── Data ─────────────────────────────────────────────────────────────────────

const JURISDICTIONS = [
  { code: 'dc_dob',                  abbr: 'DC',   name: 'Washington DC',     agency: 'Dept. of Buildings',              color: 'bg-red-100 text-red-700' },
  { code: 'pg_county_dps',           abbr: 'PG',   name: "Prince George's Co.", agency: 'Dept. of Permitting Services',  color: 'bg-blue-100 text-blue-700' },
  { code: 'montgomery_county_deid',  abbr: 'MoCo', name: 'Montgomery County',  agency: 'Dept. of Environmental Protection', color: 'bg-green-100 text-green-700' },
  { code: 'arlington_county_pzm',    abbr: 'ARL',  name: 'Arlington County',   agency: 'Planning & Zoning Mgmt',         color: 'bg-purple-100 text-purple-700' },
  { code: 'alexandria_dna',          abbr: 'ALX',  name: 'Alexandria City',    agency: 'Dept. of Neighborhood Assets',   color: 'bg-amber-100 text-amber-700' },
  { code: 'fairfax_county_zea',      abbr: 'FFX',  name: 'Fairfax County',     agency: 'Zoning Evaluation Agency',       color: 'bg-sky-100 text-sky-700' },
  { code: 'baltimore_dop',           abbr: 'BAL',  name: 'Baltimore City',     agency: 'Dept. of Permits',               color: 'bg-orange-100 text-orange-700' },
]

const PROJECT_TYPES = [
  { value: 'renovation',       label: 'Renovation / Remodel' },
  { value: 'addition',         label: 'Home Addition' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'hvac',             label: 'HVAC System' },
  { value: 'electrical',       label: 'Electrical Work' },
  { value: 'plumbing',         label: 'Plumbing Work' },
  { value: 'commercial_ti',    label: 'Commercial Tenant Improvement' },
  { value: 'commercial_food',  label: 'Restaurant / Food Service' },
  { value: 'other',            label: 'Other' },
]

const PERMIT_RECOMMENDATION: Record<string, string> = {
  renovation:       'simple_permit',
  addition:         'complex_permit',
  new_construction: 'complex_permit',
  hvac:             'simple_permit',
  electrical:       'simple_permit',
  plumbing:         'simple_permit',
  commercial_ti:    'complex_permit',
  commercial_food:  'expedited',
  other:            'simple_permit',
}

const TIER_SHORT_LABELS: Record<string, string> = {
  document_assembly: 'Self-Submit Kit',
  simple_permit:     'Filed & Tracked',
  complex_permit:    'Multi-Permit Package',
  expedited:         '5-Day Rush',
}

// ── Permit service cards — 20 types: 13 residential + 7 commercial ─────────

interface PermitServiceCard {
  key: string
  label: string
  icon: React.ElementType
  permits: number
  projectType: string
  tier: string
  desc: string
  commercial?: boolean
}

const PERMIT_SERVICE_CARDS: PermitServiceCard[] = [
  // ── Residential (13) ──
  { key: 'kitchen',         label: 'Kitchen Remodel',              icon: Utensils,    permits: 4,  projectType: 'renovation',       tier: 'simple_permit',     desc: 'Cabinetry, island, plumbing & electrical — one coordinated permit package.' },
  { key: 'bathroom',        label: 'Bathroom Remodel',             icon: Droplets,    permits: 3,  projectType: 'renovation',       tier: 'simple_permit',     desc: 'Plumbing, tile, electrical, and ventilation permits for all bath sizes.' },
  { key: 'home-addition',   label: 'Home Addition',                icon: Home,        permits: 6,  projectType: 'addition',         tier: 'complex_permit',    desc: 'Structural, MEP, and zoning permits — includes setback and impervious coverage review.' },
  { key: 'deck-patio',      label: 'Deck & Patio',                 icon: Home,        permits: 2,  projectType: 'addition',         tier: 'simple_permit',     desc: 'Structural and occupancy permits for decks, patios, pergolas, and covered outdoor rooms.' },
  { key: 'interior-reno',   label: 'Interior Renovation',          icon: Paintbrush,  permits: 2,  projectType: 'renovation',       tier: 'simple_permit',     desc: 'Wall removal, flooring, and lighting permits for full-floor interior renovations.' },
  { key: 'exterior-facade', label: 'Exterior Facade',              icon: Home,        permits: 2,  projectType: 'renovation',       tier: 'simple_permit',     desc: 'Siding, window replacement, and roofline permits with historic district handling.' },
  { key: 'whole-house',     label: 'Whole House Renovation',       icon: Building2,   permits: 8,  projectType: 'renovation',       tier: 'complex_permit',    desc: 'Coordinated multi-permit package covering structural, MEP, and exterior for full renos.' },
  { key: 'hvac',            label: 'HVAC / Mechanical',            icon: Wind,        permits: 2,  projectType: 'hvac',             tier: 'simple_permit',     desc: 'Heating, cooling, and ventilation permits for new installs, replacements, and upgrades.' },
  { key: 'electrical',      label: 'Electrical Upgrade',           icon: Zap,         permits: 1,  projectType: 'electrical',       tier: 'document_assembly', desc: 'Panel upgrades, EV chargers, service upgrades, and whole-home rewiring permits.' },
  { key: 'plumbing',        label: 'Plumbing Work',                icon: Droplets,    permits: 1,  projectType: 'plumbing',         tier: 'document_assembly', desc: 'Water, sewer, gas line, and irrigation permits for residential plumbing work.' },
  { key: 'new-home',        label: 'New Home Construction',        icon: HardHat,     permits: 12, projectType: 'new_construction', tier: 'expedited',         desc: 'Full permit coordination from foundation through certificate of occupancy.' },
  { key: 'adu',             label: 'ADU / In-Law Suite',           icon: Home,        permits: 5,  projectType: 'addition',         tier: 'complex_permit',    desc: 'Accessory dwelling permits — garage conversions, basement suites, and backyard cottages.' },
  { key: 'roof',            label: 'Roof Replacement',             icon: Home,        permits: 1,  projectType: 'renovation',       tier: 'document_assembly', desc: 'Roofing, skylights, and solar panel permits for residential and light commercial buildings.' },
  // ── Commercial & Retail (7) ──
  { key: 'commercial-ti',   label: 'Commercial Tenant Improvement', icon: Building2,   permits: 5,  projectType: 'commercial_ti',    tier: 'complex_permit',    desc: 'Full TI permit package for retail, office, and mixed-use tenant build-outs.', commercial: true },
  { key: 'retail-buildout', label: 'Retail Build-Out',              icon: ShoppingBag, permits: 5,  projectType: 'commercial_ti',    tier: 'complex_permit',    desc: 'Storefront, signage, interior partition, and occupancy permits for retail spaces.', commercial: true },
  { key: 'restaurant',      label: 'Restaurant / Food Service',     icon: Utensils,    permits: 7,  projectType: 'commercial_food',  tier: 'expedited',         desc: 'Health, fire, mechanical, and CO permits for restaurant and cafe build-outs.', commercial: true },
  { key: 'office-reno',     label: 'Office Renovation',             icon: Briefcase,   permits: 3,  projectType: 'commercial_ti',    tier: 'simple_permit',     desc: 'Partition walls, MEP, egress, ADA compliance, and fire suppression permits.', commercial: true },
  { key: 'multifamily',     label: 'Multi-Family / Condo',          icon: Building2,   permits: 10, projectType: 'new_construction', tier: 'expedited',         desc: 'Complex multi-unit residential permits across all trades and occupancy classes.', commercial: true },
  { key: 'medical-office',  label: 'Medical / Dental Office',       icon: Briefcase,   permits: 6,  projectType: 'commercial_ti',    tier: 'complex_permit',    desc: 'Healthcare facility permits — HVAC, plumbing, gas, ADA, and NFPA compliance.', commercial: true },
  { key: 'warehouse',       label: 'Warehouse / Industrial',        icon: Building2,   permits: 4,  projectType: 'commercial_ti',    tier: 'complex_permit',    desc: 'Industrial occupancy, fire suppression, loading dock access, and ADA permits.', commercial: true },
]

const TIMELINE_OPTS = [
  { value: 'asap',     label: 'ASAP — within 1–2 weeks' },
  { value: 'month',    label: 'Within 1 month' },
  { value: 'flexible', label: 'Flexible timeline' },
]

const SUBMISSION_METHODS = {
  SELF:           { label: 'Self Submission',         sub: 'We prep everything — you submit',           price: '-20%', icon: Shield },
  ASSISTED:       { label: 'Guided Submission',       sub: 'We walk you through every step',            price: 'Standard', icon: Zap },
  KEALEE_MANAGED: { label: 'Full-Service Submission', sub: 'Kealee files, tracks & resolves comments',  price: '+30%', icon: FileCheck },
}

// ──────────────────────────────────────────────────────────────────────────────

function buildTiers() {
  const p = SERVICE_PRICING.permits
  return [
    { code: 'document_assembly', name: p.document_assembly.name,   price: Math.round(p.document_assembly.amount / 100),   features: p.document_assembly.features,   accent: 'from-slate-700 to-slate-900' },
    { code: 'simple_permit',     name: p.simple_permit.name,       price: Math.round(p.simple_permit.amount / 100),       features: p.simple_permit.features,       accent: 'from-green-700 to-green-900',  badge: 'Most Common' },
    { code: 'complex_permit',    name: p.complex_permit.name,      price: Math.round(p.complex_permit.amount / 100),      features: p.complex_permit.features,      accent: 'from-[#1A2B4A] to-[#0f1c30]' },
    { code: 'expedited',         name: p.expedited.name,           price: Math.round(p.expedited.amount / 100),           features: p.expedited.features,           accent: 'from-[#E8724B] to-[#c75c35]', badge: 'Rush Service' },
  ]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{children}</label>
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none"
    >
      {children}
    </select>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PermitsPage() {
  const router = useRouter()
  const [step, setStep] = useState<'hero' | 'select' | 'intake' | 'checkout'>('hero')
  const [formData, setFormData] = useState({
    jurisdictionCode: '',
    tierCode: '',
    projectType: '',
    projectAddress: '',
    clientName: '',
    contactEmail: '',
    contactPhone: '',
    timeline: '',
    submissionMethod: 'ASSISTED' as 'SELF' | 'ASSISTED' | 'KEALEE_MANAGED',
    estimatedValuation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tiers = buildTiers()
  const selectedJurisdiction = JURISDICTIONS.find(j => j.code === formData.jurisdictionCode)
  const selectedTier = tiers.find(t => t.code === formData.tierCode)

  const finalPrice = selectedTier
    ? Math.round(selectedTier.price * (PERMIT_SUBMISSION_MULTIPLIERS[formData.submissionMethod] ?? 1))
    : 0

  // Fire-and-forget soft capture — called before the checkout API
  function softCapture() {
    if (!formData.contactEmail) return
    fetch('/api/intake/soft-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:   formData.contactEmail,
        name:    formData.clientName || null,
        phone:   formData.contactPhone || null,
        service: formData.tierCode || 'permit',
        source:  'permits',
      }),
    }).catch(() => {})
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    softCapture() // capture before any API call
    try {
      const res = await fetch('/api/v1/permits/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdictionCode: formData.jurisdictionCode,
          projectType: formData.projectType,
          projectAddress: formData.projectAddress,
          clientName: formData.clientName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          timelineGoal: formData.timeline,
          submissionMethod: formData.submissionMethod,
          estimatedValuation: formData.estimatedValuation ? parseInt(formData.estimatedValuation) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create permit intake')
      const { intakeId } = await res.json()
      router.push(`/permits/checkout?intakeId=${intakeId}&tier=${formData.tierCode}&price=${finalPrice * 100}&submissionMethod=${formData.submissionMethod}`)
    } catch {
      // Non-recoverable — redirect to soft landing so no user hits a dead end
      const params = new URLSearchParams({
        source:  'permits',
        service: formData.tierCode || 'permit',
        email:   formData.contactEmail,
        name:    formData.clientName,
      })
      router.push(`/got-you?${params.toString()}`)
    }
  }

  // ── HERO / LANDING ──────────────────────────────────────────────────────────
  if (step === 'hero') {
    return (
      <div className="min-h-screen bg-white">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1A2B4A] via-[#1f3560] to-[#0f1c30] pt-20 pb-28 px-4 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

          <div className="mx-auto max-w-5xl relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs font-bold text-green-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> DMV Permit Specialists
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
              Stop losing weeks<br />
              <span className="text-green-400">to permit delays.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mb-6 leading-relaxed">
              Kealee handles every form, every agency, every comment cycle — across DC, Maryland, and Virginia.
              We know every jurisdiction. We file, track, and get you approved.
            </p>
            <div className="flex items-center gap-2 mb-10">
              <div className="flex -space-x-1.5">
                {['bg-green-400', 'bg-blue-400', 'bg-amber-400', 'bg-purple-400'].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#1A2B4A] flex items-center justify-center text-[10px] font-black text-white`}>
                    {['H','K','L','T'][i]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span><span className="text-white font-semibold">4.9/5</span> from 200+ clients — homeowners, contractors, and developers</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-2xl mb-12">
              {[
                { value: '500+',  label: 'Permits filed' },
                { value: '5–7',   label: 'Day turnaround' },
                { value: '98%',   label: 'First-pass approval' },
                { value: '7',     label: 'Jurisdictions' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-7 py-3.5 rounded-xl transition shadow-lg shadow-green-900/40 text-base"
              >
                Start My Permit <ArrowRight className="w-5 h-5" />
              </button>
              <a href="#how-it-works" className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-6 py-3.5 rounded-xl transition text-sm">
                How it works
              </a>
            </div>
          </div>
        </div>

        {/* Jurisdiction strip */}
        <div className="bg-slate-900 py-5 px-4 overflow-x-auto">
          <div className="mx-auto max-w-5xl flex items-center gap-3 min-w-max">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2 whitespace-nowrap">We file in:</p>
            {JURISDICTIONS.map(j => (
              <span key={j.code} className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 whitespace-nowrap">
                <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${j.color}`}>{j.abbr.slice(0, 2)}</span>
                <span className="text-xs text-slate-300 font-medium">{j.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Every Project, Every Permit ─────────────────────────────── */}
        <div className="py-20 px-4 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">All Project Types</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Every project. Every permit.</h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                Click any project type below to start your permit application. We&apos;ll match you with the right package and file with the correct agency.
              </p>
            </div>

            {/* Residential permits */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3">Residential</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PERMIT_SERVICE_CARDS.filter(c => !c.commercial).map((card) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={card.key}
                      className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-green-300 cursor-pointer transition-all duration-200"
                      onClick={() => { setFormData(f => ({ ...f, projectType: card.projectType, tierCode: card.tier })); setStep('intake') }}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                          <Icon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{card.label}</h3>
                          <p className="text-[11px] text-slate-400">{card.permits} permit{card.permits !== 1 ? 's' : ''} · <span className="text-green-600 font-semibold">{TIER_SHORT_LABELS[card.tier]}</span></p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{card.desc}</p>
                      <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 group-hover:bg-green-500 text-slate-500 group-hover:text-white text-xs font-bold py-2.5 transition-all duration-200 border border-slate-200 group-hover:border-green-500">
                        Start Permit <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Commercial permits */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3">Commercial &amp; Retail</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PERMIT_SERVICE_CARDS.filter(c => c.commercial).map((card) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={card.key}
                      className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-blue-400 cursor-pointer transition-all duration-200"
                      onClick={() => { setFormData(f => ({ ...f, projectType: card.projectType, tierCode: card.tier })); setStep('intake') }}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{card.label}</h3>
                          <p className="text-[11px] text-slate-400">{card.permits} permit{card.permits !== 1 ? 's' : ''} · <span className="text-blue-600 font-semibold">{TIER_SHORT_LABELS[card.tier]}</span></p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{card.desc}</p>
                      <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 group-hover:bg-blue-600 text-slate-500 group-hover:text-white text-xs font-bold py-2.5 transition-all duration-200 border border-slate-200 group-hover:border-blue-600">
                        Start Permit <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Risk reversal */}
            <div className="mt-10 rounded-2xl bg-green-50 border border-green-200 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-0.5">Kealee Approval Guarantee</p>
                <p className="text-sm text-slate-600">If your permit application is rejected due to a preparation error on our part, we refile at no additional charge. That&apos;s our commitment to getting you approved.</p>
              </div>
              <button
                onClick={() => setStep('select')}
                className="shrink-0 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm whitespace-nowrap"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="py-20 px-4 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Simple Process</p>
              <h2 className="text-3xl font-bold text-slate-900">From intake to approval in 3 steps</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: '01', icon: FileCheck, title: 'Choose Your Service', body: 'Select your jurisdiction and permit package. Self-submit, guided, or fully managed — your choice.' },
                { n: '02', icon: Users,     title: 'We Prepare Everything', body: 'Our specialists assemble your complete application, drawings, and supporting documents within 5–7 days.' },
                { n: '03', icon: TrendingUp, title: 'Filed & Tracked',     body: 'We submit, monitor status, and respond to agency comments. You get real-time updates until approval.' },
              ].map(({ n, icon: Icon, title, body }) => (
                <div key={n} className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300 mb-1">{n}</p>
                    <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service tiers */}
        <div className="py-20 px-4 bg-slate-50 border-t border-slate-100">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Service Packages</p>
              <h2 className="text-3xl font-bold text-slate-900">Choose the right level of support</h2>
              <p className="text-slate-500 mt-2 text-sm">All packages include licensed professional review</p>
            </div>
            {/* Project type selector */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-slate-700 mb-3">What&apos;s your project type?</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map(pt => (
                  <button
                    key={pt.value}
                    onClick={() => setFormData(f => ({ ...f, projectType: pt.value, tierCode: PERMIT_RECOMMENDATION[pt.value] }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      formData.projectType === pt.value
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-slate-300 text-slate-600 hover:border-green-500'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tiers.map((tier) => {
                const isRecommended = formData.projectType !== '' && PERMIT_RECOMMENDATION[formData.projectType] === tier.code
                return (
                <div
                  key={tier.code}
                  className="relative flex flex-col rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => { setFormData(f => ({ ...f, tierCode: tier.code })); setStep('intake') }}
                >
                  {isRecommended && (
                    <span className="absolute top-3 left-3 rounded-full bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 z-10 border border-green-200">
                      Recommended
                    </span>
                  )}
                  {tier.badge && (
                    <span className="absolute top-3 right-3 rounded-full bg-green-500 text-white text-[10px] font-bold px-2.5 py-0.5 z-10">
                      {tier.badge}
                    </span>
                  )}
                  <div className={`bg-gradient-to-br ${tier.accent} px-5 pt-6 pb-5`}>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{tier.name}</p>
                    <p className="text-white/70 text-sm">Price confirmed after intake</p>
                  </div>
                  <div className="flex-1 px-5 py-4 space-y-2">
                    {tier.features.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" strokeWidth={3} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 border-t border-slate-100">
                    <button className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition">
                      Get Started <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Trust section */}
        <div className="py-16 px-4 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield,     title: 'Licensed Professionals',   body: 'Every application reviewed and certified by licensed permit expediters with 10+ years DMV experience.' },
              { icon: Clock,      title: '5–7 Day Turnaround',       body: 'Complete applications assembled in 5–7 business days. Expedited rush service available for urgent projects.' },
              { icon: Phone,      title: 'Agency Coordination',      body: 'We handle all agency correspondence, RFI responses, and inspection coordination on your behalf.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-[#1A2B4A] to-[#0f1c30] py-16 px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get your permit filed?</h2>
          <p className="text-slate-400 mb-8 text-sm">Most applications submitted within 5–7 business days.</p>
          <button
            onClick={() => setStep('select')}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-base"
          >
            Start My Permit <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // ── FORM FLOW ───────────────────────────────────────────────────────────────
  const STEP_LABELS = ['Jurisdiction & Package', 'Project Details', 'Review & Pay']
  const stepIndex   = step === 'select' ? 0 : step === 'intake' ? 1 : 2

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Form header */}
      <div className="bg-gradient-to-r from-[#1A2B4A] to-[#243d68] py-10 px-4">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => setStep('hero')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-5 transition">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to overview
          </button>
          <h1 className="text-2xl font-bold text-white mb-1">Permit Application</h1>
          <p className="text-slate-400 text-sm">Complete in 3 steps — most clients finish in under 5 minutes</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-16 z-40">
        <div className="mx-auto max-w-3xl flex items-center gap-0">
          {STEP_LABELS.map((label, i) => {
            const done   = stepIndex > i
            const active = stepIndex === i
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    done ? 'bg-green-500 text-white' : active ? 'bg-[#1A2B4A] text-white ring-4 ring-slate-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-[#1A2B4A]' : done ? 'text-green-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`h-0.5 flex-1 mx-3 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* ── STEP 1: Jurisdiction + Tier ──────────────────────────────── */}
        {step === 'select' && (
          <div className="space-y-8">

            {/* Jurisdiction */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-1">Select your jurisdiction</h2>
              <p className="text-sm text-slate-500 mb-5">Where is the project located?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {JURISDICTIONS.map(j => {
                  const sel = formData.jurisdictionCode === j.code
                  return (
                    <button
                      key={j.code}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, jurisdictionCode: j.code }))}
                      className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                        sel ? 'border-green-500 bg-green-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full text-sm font-black flex items-center justify-center shrink-0 ${j.color}`}>
                        {j.abbr.length > 2 ? j.abbr.slice(0,2) : j.abbr}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${sel ? 'text-green-700' : 'text-slate-800'}`}>{j.name}</p>
                        <p className="text-xs text-slate-400 truncate">{j.agency}</p>
                      </div>
                      {sel && <Check className="w-4 h-4 text-green-500 ml-auto shrink-0" strokeWidth={3} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tier selection */}
            {formData.jurisdictionCode && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-bold text-slate-900 mb-1">Choose your service package</h2>
                <p className="text-sm text-slate-500 mb-5">Select the level of support you need.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {tiers.map(tier => {
                    const sel = formData.tierCode === tier.code
                    return (
                      <button
                        key={tier.code}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, tierCode: tier.code }))}
                        className={`relative flex flex-col rounded-xl overflow-hidden text-left transition-all ${
                          sel ? 'ring-2 ring-green-500 shadow-md' : 'border border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm'
                        }`}
                      >
                        {tier.badge && (
                          <span className="absolute top-3 right-3 rounded-full bg-green-500 text-white text-[10px] font-bold px-2 py-0.5">
                            {tier.badge}
                          </span>
                        )}
                        <div className={`bg-gradient-to-br ${tier.accent} px-5 py-4`}>
                          <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-0.5">{tier.name}</p>
                          <p className="text-white/70 text-sm">Price confirmed after intake</p>
                        </div>
                        <div className="px-5 py-4 bg-white space-y-1.5 flex-1">
                          {tier.features.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> {f}
                            </div>
                          ))}
                        </div>
                        <div className={`px-5 py-3 flex items-center justify-between border-t ${sel ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                          <span className={`text-xs font-semibold ${sel ? 'text-green-700' : 'text-slate-400'}`}>
                            {sel ? 'Selected' : 'Select'}
                          </span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sel ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                            {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {formData.jurisdictionCode && formData.tierCode && (
              <button
                type="button"
                onClick={() => setStep('intake')}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition shadow-md shadow-green-200 text-base"
              >
                Continue to Project Details <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: Intake form ──────────────────────────────────────── */}
        {step === 'intake' && (
          <form onSubmit={e => {
            e.preventDefault()
            if (!formData.jurisdictionCode) {
              setError('Please select a jurisdiction before continuing.')
              return
            }
            setError('')
            setStep('checkout')
          }} className="space-y-6">

            {/* Jurisdiction */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-1">Select your jurisdiction</h2>
              <p className="text-sm text-slate-500 mb-5">Where is the project located?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {JURISDICTIONS.map(j => {
                  const sel = formData.jurisdictionCode === j.code
                  return (
                    <button
                      key={j.code}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, jurisdictionCode: j.code }))}
                      className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                        sel ? 'border-green-500 bg-green-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full text-sm font-black flex items-center justify-center shrink-0 ${j.color}`}>
                        {j.abbr.length > 2 ? j.abbr.slice(0, 2) : j.abbr}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${sel ? 'text-green-700' : 'text-slate-800'}`}>{j.name}</p>
                        <p className="text-xs text-slate-400 truncate">{j.agency}</p>
                      </div>
                      {sel && <Check className="w-4 h-4 text-green-500 ml-auto shrink-0" strokeWidth={3} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900 mb-1">Your information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Full Name *</FieldLabel>
                  <Input required placeholder="Timothy Chamberlain" value={formData.clientName} onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Email *</FieldLabel>
                  <Input required type="email" placeholder="you@example.com" value={formData.contactEmail} onChange={e => setFormData(f => ({ ...f, contactEmail: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Phone (optional)</FieldLabel>
                  <Input type="tel" placeholder="(703) 555-0000" value={formData.contactPhone} onChange={e => setFormData(f => ({ ...f, contactPhone: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Project Address *</FieldLabel>
                  <Input required placeholder="2 Hickory St, Fort Washington, MD" value={formData.projectAddress} onChange={e => setFormData(f => ({ ...f, projectAddress: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Project details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-900 mb-1">Project details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Project Type *</FieldLabel>
                  <Select required value={formData.projectType} onChange={e => setFormData(f => ({ ...f, projectType: e.target.value }))}>
                    <option value="">Select type</option>
                    {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Estimated Project Value</FieldLabel>
                  <Input type="number" placeholder="$75,000" value={formData.estimatedValuation} onChange={e => setFormData(f => ({ ...f, estimatedValuation: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Timeline Goal</FieldLabel>
                  <Select value={formData.timeline} onChange={e => setFormData(f => ({ ...f, timeline: e.target.value }))}>
                    <option value="">Select timeline</option>
                    {TIMELINE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            {/* Submission method */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-1">Submission method</h2>
              <p className="text-sm text-slate-500 mb-5">How should Kealee handle the agency submission?</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {(Object.entries(SUBMISSION_METHODS) as [string, typeof SUBMISSION_METHODS['SELF']][]).map(([key, opt]) => {
                  const sel = formData.submissionMethod === key
                  const Icon = opt.icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, submissionMethod: key as any }))}
                      className={`flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                        sel ? 'border-green-500 bg-green-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${sel ? 'bg-green-100' : 'bg-slate-100'}`}>
                        <Icon className={`w-4 h-4 ${sel ? 'text-green-600' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-0.5">{opt.label}</p>
                      <p className="text-xs text-slate-500 mb-2 leading-snug">{opt.sub}</p>
                      <span className={`text-xs font-bold ${key === 'SELF' ? 'text-green-600' : key === 'KEALEE_MANAGED' ? 'text-amber-600' : 'text-slate-500'}`}>
                        {opt.price}
                      </span>
                    </button>
                  )
                })}
              </div>
              {formData.submissionMethod === 'KEALEE_MANAGED' && (
                <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Identity verification required for managed submission. You'll be guided through this after checkout.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('select')} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back
              </button>
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition shadow-md text-base">
                Review & Pay <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Checkout summary ─────────────────────────────────── */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Order Summary</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Jurisdiction', value: selectedJurisdiction?.name },
                  { label: 'Service Package', value: selectedTier?.name },
                  { label: 'Project Address', value: formData.projectAddress },
                  { label: 'Contact', value: `${formData.clientName} — ${formData.contactEmail}` },
                  { label: 'Submission Method', value: SUBMISSION_METHODS[formData.submissionMethod].label },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start px-6 py-3.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 text-right max-w-xs">{value}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <p className="font-bold text-slate-900">Total</p>
                <p className="text-2xl font-black text-green-700">${finalPrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 divide-x divide-slate-100">
              {[
                { icon: Lock,        label: 'SSL Encrypted',    sub: '256-bit secure' },
                { icon: Shield,      label: 'Stripe Payments',  sub: 'PCI compliant' },
                { icon: CheckCircle2,label: 'Expert Review',    sub: 'Licensed pros' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{label}</p>
                    <p className="text-[11px] text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-200 text-base"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                : <><Shield className="w-5 h-5" /> Pay ${finalPrice.toLocaleString()} — File My Permit</>}
            </button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep('intake')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition">
                <ArrowRight className="w-4 h-4 rotate-180" /> Edit details
              </button>
              <p className="text-xs text-slate-400">Redirects to Stripe — no card stored on Kealee</p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
