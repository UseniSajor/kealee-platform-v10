'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, MapPin, Shield, Clock, Zap, CheckCircle2,
  ArrowRight, FileCheck, Users, TrendingUp, ChevronRight,
  Star, Play, Sparkles, Map, Search, FileText, Check, AlertCircle, Loader2
} from 'lucide-react'

// Import pricing authority constants from the platform source
import {
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_BATH_PRICE,
  CONCEPT_WHOLE_HOME_PRICE,
  PERMIT_BASIC_PRICE,
  PERMIT_STANDARD_PRICE,
  DESIGN_ESTIMATE_PERMIT_BUNDLE,
  startingAt,
  formatPrice
} from '@/lib/marketing/pricing'

export default function DesignPermitCampaignPage() {
  const router = useRouter()
  
  // Lead Form State (Property Intelligence Engine Hook)
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [scopeDetails, setScopeDetails] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  // Handle Lead Submission to Property Intelligence Engine
  async function handlePropertyCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!address || !email || !name || !projectType) {
      setErrorMsg('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      // Capture lead in the platform database using existing intake API
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: 'design-permit-campaign',
          clientName: name,
          contactEmail: email,
          projectAddress: address,
          budgetRange: 'Not specified',
          formData: {
            projectType,
            scopeDetails,
            funnelStage: 'lead',
            marketingSource: 'property-intelligence-engine',
            campaign: 'design_permit_2026',
            utm_source: 'landing',
            utm_medium: 'campaign',
            utm_campaign: 'design_permit_2026',
          },
        }),
      })

      if (!res.ok) throw new Error('Intake failed')
      
      setSubmitSuccess(true)
      // Redirect or show success
      setTimeout(() => {
        // Option to direct user to start a product concept or thank you page
        router.push(`/got-you?source=property-intelligence&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&status=qualified`)
      }, 2000)
      
    } catch (err: any) {
      setErrorMsg('Failed to process property check. Please try again or contact support.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* ── 1. HERO SECTION WITH VIDEO BACKGROUND ────────────────────────────────── */}
      <div className="relative pt-24 pb-32 px-6 overflow-hidden bg-slate-950 border-b border-slate-900 min-h-[85vh] flex items-center">
        {/* Background video overlay loop */}
        <div className="absolute inset-0 z-0 opacity-40">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/media/campaigns/design-permit/video/hero.mp4" type="video/mp4" />
          </video>
          {/* Dark gradient to ensure contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        </div>

        <div className="mx-auto max-w-[1200px] w-full relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2ABFBF]/20 border border-[#2ABFBF]/40 px-3.5 py-1 text-xs font-bold text-[#2ABFBF] uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" /> DMV Preconstruction Suite
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-tight tracking-tight">
                See your renovation before you build it.<br />
                <span className="text-[#2ABFBF]">Then get it permitted.</span>
              </h1>
              
              <p className="text-slate-300 text-lg sm:text-xl max-w-xl leading-relaxed">
                Kealee gives DMV homeowners design concepts, real cost direction, and permit filing support before construction starts.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex -space-x-1.5">
                  {['bg-[#2ABFBF]', 'bg-[#E8793A]', 'bg-blue-400', 'bg-purple-500'].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white`}>
                      {['H','K','L','T'][i]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span><span className="text-white font-semibold">4.9/5</span> rating from DMV homeowners and contractors</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/products?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=hero_design"
                  className="flex items-center gap-2 bg-[#E8793A] hover:bg-[#c8521a] text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-orange-950/45 text-base"
                >
                  Start Design Concept
                </Link>
                <Link
                  href="/permits?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=hero_permit"
                  className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-6 py-4 rounded-xl transition text-sm"
                >
                  Start Permit
                </Link>
              </div>
            </div>

            {/* Right Column: Mini Stats card */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full max-w-[420px] bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6 text-left">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <MapPin className="text-[#2ABFBF] w-5 h-5" /> DMV Service Footprint
                </h3>
                <p className="text-xs text-slate-400">
                  We review setback codes, zoning layers, and coordinate direct filings across all regional municipalities.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'DC', desc: 'DOB filing' },
                    { label: 'Fairfax Co.', desc: 'LDS submission' },
                    { label: 'Montgomery Co.', desc: 'DPS filing' },
                    { label: 'Arlington Co.', desc: 'Permit Arlington' }
                  ].map((loc) => (
                    <div key={loc.label} className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                      <p className="font-bold text-white text-sm">{loc.label}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{loc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. PRODUCT CARDS SECTION ────────────────────────────────────────────── */}
      <div className="py-20 lg:py-28 px-6 bg-slate-50/50">
        <div className="mx-auto max-w-[1200px]">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8793A]">Modular Support</span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900 sm:text-4xl">Design it. Permit it. Build it.</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Work with Kealee step-by-step. Select design concepts, permit filing, or combine them for a seamless preconstruction plan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Card 1: design concept */}
            <div className="flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition duration-300">
              <div className="relative h-64">
                <img
                  src="/media/campaigns/design-permit/images/design.jpg"
                  alt="design concept Workspace"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-[#E8793A] text-white text-xs font-bold px-3.5 py-1 uppercase tracking-wider">
                  Phase 1: Design Concept
                </span>
              </div>
              
              <div className="p-8 flex-1 flex flex-col text-left space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-2xl text-slate-900 mb-2">design concept</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Translate your goals into visual, contractor-ready options in days. Avoid expensive redesign fees.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">What is included:</p>
                  {[
                    '3 custom concept layout options',
                    'Dynamic cost range estimation & budget basis',
                    'Contractor-ready scope & structural notes',
                    'FAR, setback & property zoning guidelines'
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Starting from</p>
                    <p className="text-xl font-extrabold text-[#E8793A]">{formatPrice(CONCEPT_KITCHEN_PRICE)}</p>
                  </div>
                  <Link
                    href="/products?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=card_design"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#E8793A] hover:gap-2 transition-all"
                  >
                    Select Design Path <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Permit Filing Service */}
            <div className="flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition duration-300">
              <div className="relative h-64">
                <img
                  src="/media/campaigns/design-permit/images/permit.jpg"
                  alt="Permit Submission Review Scene"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-[#2ABFBF] text-white text-xs font-bold px-3.5 py-1 uppercase tracking-wider">
                  Phase 2: Permit Filing
                </span>
              </div>
              
              <div className="p-8 flex-1 flex flex-col text-left space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-2xl text-slate-900 mb-2">Permit Filing &amp; Compliance</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Skip the endless DMV municipal lines and office review delays. We compile, submit, and manage the feedback cycles.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">What is included:</p>
                  {[
                    'Permit path assessment for local county requirements',
                    'Full document compilation & formal submission',
                    'Agency comment-cycle response coordination',
                    'Covers DC DOB, Fairfax LDS, Montgomery DPS, and more'
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-[#2ABFBF] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Starting from</p>
                    <p className="text-xl font-extrabold text-[#2ABFBF]">{formatPrice(PERMIT_BASIC_PRICE)}</p>
                  </div>
                  <Link
                    href="/permits?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=card_permit"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#2ABFBF] hover:gap-2 transition-all"
                  >
                    Select Permit Path <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Connected Bundle callout */}
          <div className="mt-12 rounded-3xl bg-slate-900 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-slate-800 text-left">
            <div className="space-y-1.5 max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2ABFBF]">Full-Stack Preconstruction</span>
              <h4 className="font-display font-extrabold text-xl">Combined Design + Estimate + Permit Bundle</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect your concept layouts, material cost estimates, and permit path review in one continuous record to avoid coordination errors.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Special Campaign Price</p>
                <p className="text-2xl font-extrabold text-white">{formatPrice(DESIGN_ESTIMATE_PERMIT_BUNDLE)}</p>
              </div>
              <Link
                href="/products?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=bundle_cta"
                className="bg-[#E8793A] hover:bg-[#c8521a] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition"
              >
                Order Preconstruction Bundle
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. WORKFLOW SECTION ──────────────────────────────────────────────────── */}
      <div className="py-20 lg:py-28 px-6 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-[1200px]">
          
          <div className="text-center mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2ABFBF]">How It Works</span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900">Your DMV Project Journey</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Project Details',
                desc: 'Provide your address, dimensions, and local photos. Our systems scan parcel records.'
              },
              {
                step: '02',
                title: 'Receive Concept & Scope',
                desc: 'Review 3 concept layouts, finish tiers, structural notes, and quantities estimation.'
              },
              {
                step: '03',
                title: 'File Permits Coherently',
                desc: 'We compile all submittals and manage municipal commentary for DC, MD, or VA.'
              },
              {
                step: '04',
                title: 'GC Bidding & Execution',
                desc: 'Receive bids against your concept cost baseline and coordinate verified GCs.'
              }
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col text-left space-y-3 relative group">
                <div className="w-12 h-12 rounded-2xl bg-[#2ABFBF]/10 border border-[#2ABFBF]/20 flex items-center justify-center shadow-inner">
                  <span className="font-display font-black text-[#2ABFBF] text-lg">{step}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base pt-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── 4. TRUST & PROOF SECTION ─────────────────────────────────────────────── */}
      <div className="py-16 px-6 bg-slate-900 text-white border-t border-slate-950">
        <div className="mx-auto max-w-[1200px] grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Permits Filed' },
            { value: '5–7 Days', label: 'Preparation Time' },
            { value: '98%', label: 'First-Pass Approval' },
            { value: 'DC · MD · VA', label: 'Regional Focus' }
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1 bg-slate-950/30 p-6 rounded-2xl border border-white/5">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#2ABFBF] tracking-tight">{value}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. PROPERTY INTELLIGENCE ENGINE LEAD CAPTURE FORM ───────────────────── */}
      <div id="property-check" className="py-20 lg:py-28 px-6 bg-slate-50 border-t border-slate-100 relative">
        <div className="mx-auto max-w-[800px]">
          
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8793A]">Free Assessment</span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900">Run a Property &amp; Zoning Check</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Our Property Intelligence Engine scans county GIS overlays, setbacks, and local parcel data to recommend the correct permit path and concept feasibility.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-left">
            {submitSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="font-display font-extrabold text-2xl text-slate-900">Zoning Check Initiated!</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  We are querying the county databases for {address}. We will email your initial setback &amp; zoning guidelines to {email} within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePropertyCheck} className="space-y-6">
                
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700">{errorMsg}</p>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E8793A] focus:border-transparent transition shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah@example.com"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E8793A] focus:border-transparent transition shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    DMV Property Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 1420 N Court House Rd, Arlington, VA 22201"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E8793A] focus:border-transparent transition shadow-sm"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Project Type *
                    </label>
                    <select
                      required
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E8793A] focus:border-transparent transition shadow-sm"
                    >
                      <option value="">Select an option</option>
                      <option value="kitchen">Kitchen Remodel</option>
                      <option value="bathroom">Bathroom Remodel</option>
                      <option value="whole-home">Whole Home Renovation</option>
                      <option value="addition">Home Addition</option>
                      <option value="adu">ADU / In-Law Suite</option>
                      <option value="commercial">Commercial Build-Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Brief Scope (Optional)
                    </label>
                    <input
                      type="text"
                      value={scopeDetails}
                      onChange={(e) => setScopeDetails(e.target.value)}
                      placeholder="e.g. Remove load bearing wall, add island"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E8793A] focus:border-transparent transition shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Querying Parcel Records...
                    </>
                  ) : (
                    <>
                      Run Property Check <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* ── 6. AUDIENCE BLOCKS SECTION ───────────────────────────────────────────── */}
      <div className="py-20 lg:py-28 px-6 bg-white border-t border-slate-100 text-left">
        <div className="mx-auto max-w-[1200px]">
          
          <div className="text-center mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8793A]">Designed for You</span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900">Customized by Project Class</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Kitchen & Bath Renovations',
                desc: 'Layout concepts, plumbing fixtures, cabinet placements, electrical load checks, and simple residential permits.',
                color: '#E8793A'
              },
              {
                title: 'Additions & ADU Conversion',
                desc: 'Setback review, Floor Area Ratio checks, structural PE coordination, foundation plans, and complex zoning variances.',
                color: '#2ABFBF'
              },
              {
                title: 'Whole-Home Renovations',
                desc: 'Complete architectural concept plans, multi-trade mechanical packages, and building permits for full gut remodels.',
                color: '#7C3AED'
              },
              {
                title: 'Commercial Build-outs',
                desc: 'Retail, cafe, office, and restaurant tenant improvements requiring health, fire, ADA, and occupancy permits.',
                color: '#1A2B4A'
              }
            ].map((aud) => (
              <div key={aud.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:-translate-y-1 transition duration-300 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-2.5 h-10 rounded-full mb-4" style={{ backgroundColor: aud.color }} />
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">{aud.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{aud.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── 7. FINAL CTA ─────────────────────────────────────────────────────────── */}
      <div className="py-20 px-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-t border-slate-950 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Start Your Project Today</h2>
          <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
            Begin with a customized design concept report or launch your permit path review. One connected workflow.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/products?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=footer_design"
              className="bg-[#E8793A] hover:bg-[#c8521a] text-white font-bold px-8 py-4 rounded-xl transition text-base whitespace-nowrap"
            >
              Start with Design
            </Link>
            <Link
              href="/permits?utm_source=landing&utm_medium=campaign&utm_campaign=design_permit_2026&utm_content=footer_permit"
              className="bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition text-base whitespace-nowrap"
            >
              Start with Permit
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
