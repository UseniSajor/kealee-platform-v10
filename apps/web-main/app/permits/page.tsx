'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, MapPin, Shield, Clock, Zap, CheckCircle2,
  ArrowRight, FileCheck, Users, TrendingUp, ChevronRight,
  Loader2, Check, Lock, AlertCircle, Phone, Sparkles,
  Home, Wind, Utensils, HardHat, ShoppingBag, Briefcase, Paintbrush, Droplets, Star, Play
} from 'lucide-react'
import { SERVICE_PRICING, PERMIT_SUBMISSION_MULTIPLIERS } from '@kealee/shared/pricing'

// ── Data ─────────────────────────────────────────────────────────────────────

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
  photoUrl: string // Added photoUrl for relevant image card
  commercial?: boolean
}

const PERMIT_SERVICE_CARDS: PermitServiceCard[] = [
  // ── Residential (13) ──
  {
    key: 'kitchen',
    label: 'Kitchen Remodel',
    icon: Utensils,
    permits: 4,
    projectType: 'renovation',
    tier: 'simple_permit',
    desc: 'Cabinetry, island, plumbing & electrical — one coordinated permit package.',
    photoUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
  },
  {
    key: 'bathroom',
    label: 'Bathroom Remodel',
    icon: Droplets,
    permits: 3,
    projectType: 'renovation',
    tier: 'simple_permit',
    desc: 'Plumbing, tile, electrical, and ventilation permits for all bath sizes.',
    photoUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80',
  },
  {
    key: 'home-addition',
    label: 'Home Addition',
    icon: Home,
    permits: 6,
    projectType: 'addition',
    tier: 'complex_permit',
    desc: 'Structural, MEP, and zoning permits — includes setback and impervious coverage review.',
    photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
  },
  {
    key: 'deck-patio',
    label: 'Deck & Patio',
    icon: Home,
    permits: 2,
    projectType: 'addition',
    tier: 'simple_permit',
    desc: 'Structural and occupancy permits for decks, patios, pergolas, and covered outdoor rooms.',
    photoUrl: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=600&q=80',
  },
  {
    key: 'interior-reno',
    label: 'Interior Renovation',
    icon: Paintbrush,
    permits: 2,
    projectType: 'renovation',
    tier: 'simple_permit',
    desc: 'Wall removal, flooring, and lighting permits for full-floor interior renovations.',
    photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
  },
  {
    key: 'exterior-facade',
    label: 'Exterior Facade',
    icon: Home,
    permits: 2,
    projectType: 'renovation',
    tier: 'simple_permit',
    desc: 'Siding, window replacement, and roofline permits with historic district handling.',
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
  },
  {
    key: 'whole-house',
    label: 'Whole House Renovation',
    icon: Building2,
    permits: 8,
    projectType: 'renovation',
    tier: 'complex_permit',
    desc: 'Coordinated multi-permit package covering structural, MEP, and exterior for full renos.',
    photoUrl: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=600&q=80',
  },
  {
    key: 'hvac',
    label: 'HVAC / Mechanical',
    icon: Wind,
    permits: 2,
    projectType: 'hvac',
    tier: 'simple_permit',
    desc: 'Heating, cooling, and ventilation permits for new installs, replacements, and upgrades.',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
  },
  {
    key: 'electrical',
    label: 'Electrical Upgrade',
    icon: Zap,
    permits: 1,
    projectType: 'electrical',
    tier: 'document_assembly',
    desc: 'Panel upgrades, EV chargers, service upgrades, and whole-home rewiring permits.',
    photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  },
  {
    key: 'plumbing',
    label: 'Plumbing Work',
    icon: Droplets,
    permits: 1,
    projectType: 'plumbing',
    tier: 'document_assembly',
    desc: 'Water, sewer, gas line, and irrigation permits for residential plumbing work.',
    photoUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80',
  },
  {
    key: 'new-home',
    label: 'New Home Construction',
    icon: HardHat,
    permits: 12,
    projectType: 'new_construction',
    tier: 'expedited',
    desc: 'Full permit coordination from foundation through certificate of occupancy.',
    photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  },
  {
    key: 'adu',
    label: 'ADU / In-Law Suite',
    icon: Home,
    permits: 5,
    projectType: 'addition',
    tier: 'complex_permit',
    desc: 'Accessory dwelling permits — garage conversions, basement suites, and backyard cottages.',
    photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  },
  {
    key: 'roof',
    label: 'Roof Replacement',
    icon: Home,
    permits: 1,
    projectType: 'renovation',
    tier: 'document_assembly',
    desc: 'Roofing, skylights, and solar panel permits for residential and light commercial buildings.',
    photoUrl: 'https://images.unsplash.com/photo-1632759162444-1168f1f26f47?w=600&q=80',
  },
  // ── Commercial & Retail (7) ──
  {
    key: 'commercial-ti',
    label: 'Commercial Tenant Improvement',
    icon: Building2,
    permits: 5,
    projectType: 'commercial_ti',
    tier: 'complex_permit',
    desc: 'Full TI permit package for retail, office, and mixed-use tenant build-outs.',
    photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    commercial: true,
  },
  {
    key: 'retail-buildout',
    label: 'Retail Build-Out',
    icon: ShoppingBag,
    permits: 5,
    projectType: 'commercial_ti',
    tier: 'complex_permit',
    desc: 'Storefront, signage, interior partition, and occupancy permits for retail spaces.',
    photoUrl: 'https://images.unsplash.com/photo-1582037936069-1a4f5f34aa0c?w=600&q=80',
    commercial: true,
  },
  {
    key: 'restaurant',
    label: 'Restaurant / Food Service',
    icon: Utensils,
    permits: 7,
    projectType: 'commercial_food',
    tier: 'expedited',
    desc: 'Health, fire, mechanical, and CO permits for restaurant and cafe build-outs.',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    commercial: true,
  },
  {
    key: 'office-reno',
    label: 'Office Renovation',
    icon: Briefcase,
    permits: 3,
    projectType: 'commercial_ti',
    tier: 'simple_permit',
    desc: 'Partition walls, MEP, egress, ADA compliance, and fire suppression permits.',
    photoUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80',
    commercial: true,
  },
  {
    key: 'multifamily',
    label: 'Multi-Family / Condo',
    icon: Building2,
    permits: 10,
    projectType: 'new_construction',
    tier: 'expedited',
    desc: 'Complex multi-unit residential permits across all trades and occupancy classes.',
    photoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
    commercial: true,
  },
  {
    key: 'medical-office',
    label: 'Medical / Dental Office',
    icon: Briefcase,
    permits: 6,
    projectType: 'commercial_ti',
    tier: 'complex_permit',
    desc: 'Healthcare facility permits — HVAC, plumbing, gas, ADA, and NFPA compliance.',
    photoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    commercial: true,
  },
  {
    key: 'warehouse',
    label: 'Warehouse / Industrial',
    icon: Building2,
    permits: 4,
    projectType: 'commercial_ti',
    tier: 'complex_permit',
    desc: 'Industrial occupancy, fire suppression, loading dock access, and ADA permits.',
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
    commercial: true,
  },
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

function buildTiers() {
  const p = SERVICE_PRICING.permits
  return [
    { code: 'document_assembly', name: p.document_assembly.name,   price: Math.round(p.document_assembly.amount / 100),   features: p.document_assembly.features,   accent: 'from-slate-700 to-slate-900' },
    { code: 'simple_permit',     name: p.simple_permit.name,       price: Math.round(p.simple_permit.amount / 100),       features: p.simple_permit.features,       accent: 'from-[#2ABFBF]/90 to-[#0e7474]',  badge: 'Most Common' },
    { code: 'complex_permit',    name: p.complex_permit.name,      price: Math.round(p.complex_permit.amount / 100),      features: p.complex_permit.features,      accent: 'from-[#1A2B4A] to-[#0A1222]' },
    { code: 'expedited',         name: p.expedited.name,           price: Math.round(p.expedited.amount / 100),           features: p.expedited.features,           accent: 'from-[#E8724B] to-[#b3451a]', badge: 'Rush Service' },
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
      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF] focus:border-transparent transition shadow-sm"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF] focus:border-transparent transition appearance-none shadow-sm"
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
    zipCode: '',
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

  // Session storage persistence
  const [isPersistedDataLoaded, setIsPersistedDataLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('intake_form_permits')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }))
        }
        if (parsed.step) {
          setStep(parsed.step)
        }
      }
    } catch (e) {
      console.error('Failed to load persisted permits form:', e)
    } finally {
      setIsPersistedDataLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isPersistedDataLoaded) return
    try {
      sessionStorage.setItem(
        'intake_form_permits',
        JSON.stringify({ formData, step })
      )
    } catch (e) {
      console.error('Failed to persist permits form:', e)
    }
  }, [formData, step, isPersistedDataLoaded])

  const tiers = buildTiers()
  const selectedTier = tiers.find(t => t.code === formData.tierCode)

  const finalPrice = selectedTier
    ? Math.round(selectedTier.price * (PERMIT_SUBMISSION_MULTIPLIERS[formData.submissionMethod] ?? 1))
    : 0

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
    softCapture()
    try {
      const res = await fetch('/api/permits/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode: formData.zipCode,
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
      const params = new URLSearchParams({
        source:  'permits',
        service: formData.tierCode || 'permit',
        email:   formData.contactEmail,
        name:    formData.clientName,
        status:  'payment_failed',
      })
      router.push(`/got-you?${params.toString()}`)
    }
  }

  // ── HERO / LANDING ──────────────────────────────────────────────────────────
  if (step === 'hero') {
    return (
      <div className="min-h-screen bg-slate-50/50">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1A2B4A] via-[#111E36] to-[#0A1222] pt-20 pb-28 px-6 relative overflow-hidden border-b border-slate-900">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#2ABFBF] opacity-[0.08] blur-3xl pointer-events-none" />
          
          <div className="mx-auto max-w-[1200px] relative z-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              {/* Left Column */}
              <div className="lg:col-span-7 text-left space-y-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2ABFBF]/15 border border-[#2ABFBF]/30 px-3.5 py-1 text-xs font-bold text-[#2ABFBF] uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Licensed Permit Specialists
                  </span>
                </div>

                <h1 className="font-home-serif text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-tight tracking-tight">
                  Stop losing weeks<br />
                  <span className="text-[#2ABFBF]">to permit delays.</span>
                </h1>
                
                <p className="font-home-sans text-slate-300 text-lg max-w-xl leading-relaxed">
                  Kealee handles every form, every agency, and every comment cycle. We know permit requirements across the DMV. We file, track, and get you approved.
                </p>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex -space-x-1.5">
                    {['bg-[#2ABFBF]', 'bg-[#E8724B]', 'bg-blue-400', 'bg-purple-500'].map((c, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#1A2B4A] flex items-center justify-center text-[10px] font-black text-white`}>
                        {['H','K','L','T'][i]}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-home-sans">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span><span className="text-white font-semibold">4.9/5</span> from 200+ clients — homeowners, contractors, and developers</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-xl pt-4">
                  {[
                    { value: '500+',  label: 'Permits filed' },
                    { value: '5–7',   label: 'Day preparation' },
                    { value: '98%',   label: 'First-pass approval' },
                    { value: 'DMV',   label: 'Jurisdictions' },
                  ].map(({ value, label }) => (
                    <div key={label} className="border border-slate-800/80 bg-slate-950/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    onClick={() => setStep('select')}
                    className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#b3451a] text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-orange-950/45 text-base"
                  >
                    Start My Permit <ArrowRight className="w-5 h-5" />
                  </button>
                  <a href="#how-it-works" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-6 py-4 rounded-xl transition text-sm">
                    How it works
                  </a>
                </div>
              </div>

              {/* Right Column: Video Showcase Card */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="relative w-full aspect-[16/10] max-w-[480px] bg-slate-950 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 ring-8 ring-white/5">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/media/service-videos/home-permits-video.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Video Play Indicator */}
                  <div
                    className="absolute bottom-4 right-4 z-10 rounded-full bg-slate-950/60 p-2 backdrop-blur-sm border border-white/10"
                    aria-label="Video preview playing"
                  >
                    <Play className="h-3.5 w-3.5 fill-white text-white" aria-hidden />
                  </div>

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Subtitle badge */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-2 border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-[#2ABFBF] animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active Site Inspection</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Every Project, Every Permit ─────────────────────────────── */}
        <div className="py-20 lg:py-28 px-6 bg-slate-50/50">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8724B]">All Project Types</span>
              <h2 className="font-home-serif text-3xl font-bold text-slate-900 sm:text-4xl">Every project. Every permit.</h2>
              <p className="font-home-sans text-slate-500 max-w-xl mx-auto text-sm">
                Select your project type below to begin. We match your scope to the correct permit package and file with the appropriate local agency.
              </p>
            </div>

            {/* Residential Section */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">Residential Permits</span>
                <div className="h-px w-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {PERMIT_SERVICE_CARDS.filter(c => !c.commercial).map((card) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={card.key}
                      className="group relative rounded-3xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
                      onClick={() => { setFormData(f => ({ ...f, projectType: card.projectType, tierCode: card.tier })); setStep('intake') }}
                    >
                      {/* Photo Background */}
                      <img
                        src={card.photoUrl}
                        alt={card.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Readability Scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/10 group-hover:via-slate-950/50 transition-all duration-300" />

                      {/* Card Content */}
                      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10 text-left">
                        {/* Top corner: Icon badge */}
                        <div className="self-start w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                          <Icon className="w-4.5 h-4.5" />
                        </div>

                        {/* Bottom: Info */}
                        <div className="space-y-1">
                          <h3 className="font-home-serif font-bold text-white text-base leading-tight drop-shadow-sm">{card.label}</h3>
                          <p className="text-[10px] text-slate-300 font-medium tracking-wide">
                            {card.permits} permit{card.permits !== 1 ? 's' : ''} · <span className="text-[#2ABFBF] font-semibold">{TIER_SHORT_LABELS[card.tier]}</span>
                          </p>
                          <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-1">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Commercial Section */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">Commercial &amp; Retail</span>
                <div className="h-px w-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {PERMIT_SERVICE_CARDS.filter(c => c.commercial).map((card) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={card.key}
                      className="group relative rounded-3xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
                      onClick={() => { setFormData(f => ({ ...f, projectType: card.projectType, tierCode: card.tier })); setStep('intake') }}
                    >
                      {/* Photo Background */}
                      <img
                        src={card.photoUrl}
                        alt={card.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Readability Scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-black/10 group-hover:via-slate-950/50 transition-all duration-300" />

                      {/* Card Content */}
                      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10 text-left">
                        {/* Top corner: Icon badge */}
                        <div className="self-start w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                          <Icon className="w-4.5 h-4.5" />
                        </div>

                        {/* Bottom: Info */}
                        <div className="space-y-1">
                          <h3 className="font-home-serif font-bold text-white text-base leading-tight drop-shadow-sm">{card.label}</h3>
                          <p className="text-[10px] text-slate-300 font-medium tracking-wide">
                            {card.permits} permit{card.permits !== 1 ? 's' : ''} · <span className="text-blue-300 font-semibold">{TIER_SHORT_LABELS[card.tier]}</span>
                          </p>
                          <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-1">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Guarantee Section */}
            <div className="mt-16 rounded-3xl bg-emerald-500/5 border border-emerald-500/25 p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="text-left space-y-1">
                <p className="font-home-serif font-bold text-slate-900 text-lg">Kealee Approval Guarantee</p>
                <p className="font-home-sans text-sm text-slate-600 leading-relaxed">
                  If your permit application receives a rejection or code comment due to an error on our part, we coordinate the revisions and refile at no additional charge. We stay with you until approval.
                </p>
              </div>
              <button
                onClick={() => setStep('select')}
                className="shrink-0 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition text-sm whitespace-nowrap"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="py-20 lg:py-28 px-6 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2ABFBF]">Our Workflow</span>
              <h2 className="font-home-serif text-3xl font-bold text-slate-900">Intake to approval in 3 steps</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              {[
                { n: '01', icon: FileCheck, title: 'Choose Your Package', body: 'Enter your project details and choose a package. Decide between self-submission, guided files, or full agency management.' },
                { n: '02', icon: Users,     title: 'Specialist Preparation', body: 'Our experts assemble all application sheets, local codes, drawings, and supporting documents in 5–7 days.' },
                { n: '03', icon: TrendingUp, title: 'Filed & Monitored',     body: 'We submit to municipal offices, track comments, resolve municipal requests, and deliver your approved permit.' },
              ].map(({ n, icon: Icon, title, body }) => (
                <div key={n} className="flex gap-5 text-left">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#2ABFBF]/10 border border-[#2ABFBF]/20 flex items-center justify-center shadow-inner">
                      <Icon className="w-5 h-5 text-[#2ABFBF]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">{n}</p>
                    <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service tiers */}
        <div className="py-20 lg:py-28 px-6 bg-slate-50 border-t border-slate-100">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-12 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8724B]">Service Packages</span>
              <h2 className="font-home-serif text-3xl font-bold text-slate-900">Choose your support tier</h2>
              <p className="font-home-sans text-slate-500 text-sm">Every package features review by a licensed DMV specialist.</p>
            </div>
            
            {/* Project type selector */}
            <div className="mb-10 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3.5">Filter Packages by Project Type</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map(pt => (
                  <button
                    key={pt.value}
                    onClick={() => setFormData(f => ({ ...f, projectType: pt.value, tierCode: PERMIT_RECOMMENDATION[pt.value] }))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${
                      formData.projectType === pt.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-[#2ABFBF] hover:text-[#2ABFBF]'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Professional design prompt */}
            <div className="mb-10 rounded-3xl border border-blue-200 bg-blue-500/[0.03] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6 text-left shadow-sm">
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Need Permit-Ready Architectural Drawings?</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Residential structural additions and major commercial renovations require professional PE/architect stamps before local agencies accept plans. Kealee&apos;s <strong>Professional Design</strong> delivers complete stamped plan sets starting from <strong>$4,995</strong>.
                </p>
              </div>
              <a
                href="/intake/professional_drawings"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 transition shadow-md shadow-slate-950/15"
              >
                Order Stamped Plans <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier) => {
                const isRecommended = formData.projectType !== '' && PERMIT_RECOMMENDATION[formData.projectType] === tier.code
                return (
                  <div
                    key={tier.code}
                    className="relative flex flex-col rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    onClick={() => { setFormData(f => ({ ...f, tierCode: tier.code })); setStep('intake') }}
                  >
                    {isRecommended && (
                      <span className="absolute top-3 left-4 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 z-10 border border-emerald-200">
                        Recommended
                      </span>
                    )}
                    {tier.badge && (
                      <span className="absolute top-3 right-4 rounded-full bg-[#E8724B] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 z-10">
                        {tier.badge}
                      </span>
                    )}
                    <div className={`bg-gradient-to-br ${tier.accent} px-6 pt-10 pb-6 text-left`}>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{tier.name}</p>
                      <p className="text-white font-extrabold text-2xl tracking-tight">From ${tier.price.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 px-6 py-6 space-y-3 text-left">
                      {tier.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-5 border-t border-slate-100">
                      <button className="w-full flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-[#2ABFBF] transition-colors">
                        Select Package <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Trust section */}
        <div className="py-20 px-6 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-[1200px] grid md:grid-cols-3 gap-8 sm:gap-12">
            {[
              { icon: Shield,     title: 'Licensed Professionals',   body: 'Every application is verified and stamped by licensed permit expediters with over 10 years of DMV local agency experience.' },
              { icon: Clock,      title: '5–7 Day Preparation',      body: 'Your complete plan and form assembly is finalized within 5–7 business days, with optional 5-day rush services.' },
              { icon: Phone,      title: 'Comment Coordination',     body: 'We coordinate plan review commentary, municipal information requests, and inspector follow-up until your permit issues.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 text-left">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-[#1A2B4A] to-[#0A1222] py-20 px-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #2ABFBF 0%, transparent 60%)' }} />
          <div className="mx-auto max-w-3xl relative z-10 space-y-6">
            <h2 className="font-home-serif text-3xl font-bold text-white sm:text-4xl">Ready to file your permit?</h2>
            <p className="font-home-sans text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">Most packages are finalized and submitted to local agencies in 5–7 days.</p>
            <button
              onClick={() => setStep('select')}
              className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#b3451a] text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-sm uppercase tracking-wider"
            >
              Start My Permit <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-6 text-xs text-slate-500">
              Based in DC, Maryland, or Virginia?{' '}
              <Link href="/permits/dmv" className="text-[#2ABFBF] hover:text-[#1fa1a1] underline underline-offset-2 font-semibold">
                View DMV permit details →
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── FORM FLOW ───────────────────────────────────────────────────────────────
  const STEP_LABELS = ['Location & Package', 'Project Details', 'Review & Pay']
  const stepIndex   = step === 'select' ? 0 : step === 'intake' ? 1 : 2

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Form header */}
      <div className="bg-gradient-to-br from-[#1A2B4A] to-[#0A1222] py-12 px-6">
        <div className="mx-auto max-w-3xl text-left space-y-4">
          <button onClick={() => setStep('hero')} className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to overview
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-home-serif">Filing application</h1>
            <p className="text-slate-400 text-xs sm:text-sm font-home-sans">Complete this form to submit your application set. Filing begins immediately after checkout.</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-16 z-40 shadow-sm">
        <div className="mx-auto max-w-3xl flex items-center gap-0">
          {STEP_LABELS.map((label, i) => {
            const done   = stepIndex > i
            const active = stepIndex === i
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-[#1A2B4A] text-white ring-4 ring-slate-100 shadow-sm' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {done ? <Check className="w-4.5 h-4.5" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:block ${active ? 'text-[#1A2B4A]' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`h-0.5 flex-1 mx-3 rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: Jurisdiction + Tier ──────────────────────────────── */}
        {step === 'select' && (
          <div className="space-y-8 text-left">

            {/* ZIP Code */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="font-home-serif font-bold text-slate-900 text-lg mb-1">Project location</h2>
              <p className="font-home-sans text-xs sm:text-sm text-slate-500 mb-5">Enter the ZIP code where your project is located to verify local jurisdiction limits.</p>
              <div className="max-w-xs">
                <FieldLabel>ZIP Code *</FieldLabel>
                <Input
                  placeholder="e.g. 20745"
                  maxLength={5}
                  value={formData.zipCode}
                  onChange={e => setFormData(f => ({ ...f, zipCode: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
            </div>

            {/* Tier selection */}
            {formData.zipCode.length === 5 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="font-home-serif font-bold text-slate-900 text-lg mb-1">Choose your support tier</h2>
                <p className="font-home-sans text-xs sm:text-sm text-slate-500 mb-5">Select a service package matching your project&apos;s complexity.</p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {tiers.map(tier => {
                    const sel = formData.tierCode === tier.code
                    return (
                      <button
                        key={tier.code}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, tierCode: tier.code }))}
                        className={`relative flex flex-col rounded-3xl overflow-hidden text-left transition-all ${
                          sel ? 'ring-2 ring-[#2ABFBF] shadow-md' : 'border border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm'
                        }`}
                      >
                        {tier.badge && (
                          <span className="absolute top-3 right-4 rounded-full bg-[#E8724B] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                            {tier.badge}
                          </span>
                        )}
                        <div className={`bg-gradient-to-br ${tier.accent} px-5 py-5`}>
                          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">{tier.name}</p>
                          <p className="text-white font-extrabold text-xl tracking-tight">From ${tier.price.toLocaleString()}</p>
                        </div>
                        <div className="px-5 py-5 bg-white space-y-2 flex-1">
                          {tier.features.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} /> <span className="line-clamp-2">{f}</span>
                            </div>
                          ))}
                        </div>
                        <div className={`px-5 py-3.5 flex items-center justify-between border-t ${sel ? 'bg-teal-500/5 border-teal-100' : 'bg-slate-50 border-slate-100'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${sel ? 'text-teal-700' : 'text-slate-400'}`}>
                            {sel ? 'Selected' : 'Select'}
                          </span>
                          <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${sel ? 'border-[#2ABFBF] bg-[#2ABFBF]' : 'border-slate-300'}`}>
                            {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {formData.zipCode.length === 5 && formData.tierCode && (
              <button
                type="button"
                onClick={() => setStep('intake')}
                className="w-full flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#b3451a] text-white font-bold py-4 rounded-xl transition shadow-lg shadow-orange-950/15 text-sm uppercase tracking-wider"
              >
                Continue to Details <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: Intake form ──────────────────────────────────────── */}
        {step === 'intake' && (
          <form onSubmit={e => {
            e.preventDefault()
            if (!formData.zipCode || formData.zipCode.length < 5) {
              setError('Please enter a valid 5-digit ZIP code before continuing.')
              return
            }
            setError('')
            setStep('checkout')
          }} className="space-y-6 text-left">

            {/* ZIP Code */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="font-home-serif font-bold text-slate-900 text-lg mb-1">Project location</h2>
              <p className="font-home-sans text-xs sm:text-sm text-slate-500 mb-5">Enter the ZIP code where your project is located to verify local jurisdiction limits.</p>
              <div className="max-w-xs">
                <FieldLabel>ZIP Code *</FieldLabel>
                <Input
                  required
                  placeholder="e.g. 20745"
                  maxLength={5}
                  value={formData.zipCode}
                  onChange={e => setFormData(f => ({ ...f, zipCode: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              <h2 className="font-home-serif font-bold text-slate-900 text-lg mb-1">Your information</h2>
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
                  <Input type="tel" placeholder="(555) 555-0000" value={formData.contactPhone} onChange={e => setFormData(f => ({ ...f, contactPhone: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Project Address *</FieldLabel>
                  <Input required placeholder="123 Main St, Oxon Hill, MD 20745" value={formData.projectAddress} onChange={e => setFormData(f => ({ ...f, projectAddress: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Project details */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              <h2 className="font-home-serif font-bold text-slate-900 text-lg mb-1">Project details</h2>
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
                    <option value="">Select target</option>
                    {TIMELINE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep('select')} className="flex items-center justify-center gap-1.5 px-6 py-4 rounded-xl border border-slate-300 text-slate-500 hover:text-slate-700 transition font-bold text-xs uppercase tracking-wider bg-white">
                Back
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#b3451a] text-white font-bold py-4 rounded-xl transition shadow-lg shadow-orange-950/15 text-xs uppercase tracking-wider"
              >
                Review &amp; Pay <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Review & Checkout ────────────────────────────────── */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">

            {/* Submission method */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
              <h2 className="font-home-serif font-bold text-slate-900 text-lg mb-1">Choose filing method</h2>
              <p className="font-home-sans text-xs sm:text-sm text-slate-500 mb-6">Select how the permit package will be submitted to the local jurisdiction.</p>
              
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(SUBMISSION_METHODS).map(([key, item]) => {
                  const Icon = item.icon
                  const sel  = formData.submissionMethod === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, submissionMethod: key as 'SELF' | 'ASSISTED' | 'KEALEE_MANAGED' }))}
                      className={`flex flex-col p-5 rounded-2xl text-left border transition-all ${
                        sel ? 'ring-2 ring-[#2ABFBF] border-transparent bg-teal-500/[0.02] shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mb-3 shrink-0">
                        <Icon className={`w-4 h-4 ${sel ? 'text-[#2ABFBF]' : 'text-slate-500'}`} />
                      </div>
                      <p className="font-bold text-slate-900 text-xs mb-0.5">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mb-3 flex-1 leading-snug">{item.sub}</p>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${sel ? 'text-[#2ABFBF]' : 'text-slate-500'}`}>
                        {item.price}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="font-home-serif font-bold text-slate-900 text-lg">Order Summary</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Project ZIP', value: formData.zipCode },
                  { label: 'Service Package', value: selectedTier?.name },
                  { label: 'Project Address', value: formData.projectAddress },
                  { label: 'Contact', value: `${formData.clientName} — ${formData.contactEmail}` },
                  { label: 'Submission Method', value: SUBMISSION_METHODS[formData.submissionMethod].label },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start px-6 py-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-xs font-semibold text-slate-800 text-right max-w-xs">{value}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <p className="font-bold text-slate-900">Total Price</p>
                <p className="text-2xl font-black text-emerald-700">${finalPrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm grid grid-cols-3 divide-x divide-slate-100">
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
                    <p className="text-[10px] font-semibold text-slate-700 leading-snug">{label}</p>
                    <p className="text-[9px] text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition shadow-lg shadow-emerald-200 text-xs sm:text-sm uppercase tracking-wider"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                : <><Shield className="w-5 h-5" /> Pay ${finalPrice.toLocaleString()} — File My Permit</>}
            </button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep('intake')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition font-bold uppercase tracking-wider">
                <ArrowRight className="w-4 h-4 rotate-180" /> Edit details
              </button>
              <p className="text-[10px] text-slate-400">Redirects to Stripe — no payment cards stored on Kealee</p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
