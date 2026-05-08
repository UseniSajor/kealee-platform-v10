'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight, CheckCircle2, Lock, Shield, DollarSign,
  HardHat, PenTool, FileCheck, Users, Zap, Building2,
  ClipboardList, Camera, AlertTriangle, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type BuildStage = 'none' | 'has_concept' | 'has_drawings' | 'has_permit'

// ── Journey config ────────────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  {
    n: '01',
    label: 'AI Design Concept',
    price: 'From $149',
    time: '3–5 days',
    stage: 'none' as BuildStage,
    icon: Zap,
    color: '#E8724B',
    href: '/intake/concept',
    cta: 'Get Your Concept',
    description: 'AI-generated renders, floor plan direction, itemised cost estimate, and permit scope brief. Your blueprint for everything that follows.',
  },
  {
    n: '02',
    label: 'Professional Drawings',
    price: 'From $2,499',
    time: '7–14 days',
    stage: 'has_concept' as BuildStage,
    icon: PenTool,
    color: '#6B46C1',
    href: '/intake/professional_drawings',
    cta: 'Get Permit-Ready Drawings',
    description: 'Licensed architect and PE assigned through the Kealee platform. Permit-ready drawing set stamped and delivered — required by every DMV jurisdiction before permit submission.',
  },
  {
    n: '03',
    label: 'Permit Filing',
    price: 'From $149',
    time: 'Jurisdiction-dependent',
    stage: 'has_drawings' as BuildStage,
    icon: FileCheck,
    color: '#16A34A',
    href: '/permits',
    cta: 'File My Permit',
    description: 'Kealee files your permit with the correct agency, responds to reviewer comments, and tracks approval — across DC, Maryland, and Virginia.',
  },
  {
    n: '04',
    label: 'Contractor Match',
    price: 'Free',
    time: '24–48 hrs',
    stage: 'has_permit' as BuildStage,
    icon: Users,
    color: '#0284C7',
    href: '/marketplace',
    cta: 'Get Matched',
    description: 'Kealee matches your project to 3 vetted, insured, licensed GCs on the platform — matched by project type, location, and scope. You receive bids, not a directory to browse.',
  },
  {
    n: '05',
    label: 'BUILD Management',
    price: 'From $950',
    time: 'Duration of build',
    stage: 'has_permit' as BuildStage,
    icon: Building2,
    color: '#1A2B4A',
    href: '/intake/pm_advisory',
    cta: 'Add Build Management',
    description: 'Kealee oversees every professional on your project — site visits, milestone verification, pay application review, and issue escalation. Your money never moves until the work is confirmed.',
  },
]

const PROJECT_TYPES = [
  { label: 'Kitchen Remodel',       range: '$25K – $120K',    weeks: '12–16 wks',  slug: 'kitchen' },
  { label: 'Bathroom Remodel',      range: '$10K – $60K',     weeks: '6–10 wks',   slug: 'bathroom' },
  { label: 'Home Addition',         range: '$80K – $400K',    weeks: '16–28 wks',  slug: 'addition' },
  { label: 'Whole House Reno',      range: '$150K – $800K',   weeks: '24–48 wks',  slug: 'whole-house' },
  { label: 'Deck & Patio',          range: '$12K – $60K',     weeks: '4–8 wks',    slug: 'deck' },
  { label: 'Exterior Facade',       range: '$15K – $80K',     weeks: '6–12 wks',   slug: 'facade' },
  { label: 'Interior Renovation',   range: '$20K – $150K',    weeks: '8–16 wks',   slug: 'interior' },
  { label: 'New Construction',      range: '$500K – $5M+',    weeks: '6–24+ mo',   slug: 'new-construction' },
]

const PLATFORM_PROFESSIONALS = [
  { icon: PenTool,       label: 'Licensed Architects', desc: 'Concept review, permit-ready drawings, design development' },
  { icon: HardHat,       label: 'PE / Structural Engineers', desc: 'Structural calculations, PE stamps, load-bearing assessments' },
  { icon: Building2,     label: 'General Contractors', desc: 'Licensed, insured GCs matched by project type and location' },
  { icon: Zap,           label: 'Specialty Trades', desc: 'Electrical, plumbing, HVAC, and MEP contractors on-platform' },
]

const BUILD_INCLUDES = [
  { icon: Camera,        label: 'Site visits with photo documentation', desc: 'Monthly or weekly inspections — every visit produces a written report.' },
  { icon: Shield,        label: 'Milestone verification before payment', desc: 'No money moves until your build manager confirms the work is done and done right.' },
  { icon: ClipboardList, label: 'Pay application review', desc: 'Every contractor draw request reviewed line by line for accuracy and completeness.' },
  { icon: AlertTriangle, label: 'Issue escalation and resolution', desc: 'Problems are documented, communicated formally, and resolved — you are never negotiating alone.' },
  { icon: DollarSign,    label: 'Change order review', desc: 'Every scope change reviewed for fair pricing before you sign.' },
  { icon: CheckCircle2,  label: 'Final punch list and closeout', desc: 'Final walk, deficiency log, and project documentation before any final payment releases.' },
]

// ── Stage selector config ─────────────────────────────────────────────────────

const STAGE_OPTIONS: { value: BuildStage; label: string; sub: string }[] = [
  { value: 'none',         label: 'Starting fresh',         sub: 'No concept, no plans yet' },
  { value: 'has_concept',  label: 'I have an AI concept',   sub: 'Need professional drawings' },
  { value: 'has_drawings', label: 'I have approved drawings', sub: 'Need a permit' },
  { value: 'has_permit',   label: 'I have an approved permit', sub: 'Ready for contractor and build' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageIndex(stage: BuildStage): number {
  return { none: 0, has_concept: 1, has_drawings: 2, has_permit: 3 }[stage]
}

function journeyStepComplete(stepStage: BuildStage, currentStage: BuildStage): boolean {
  return stageIndex(currentStage) > stageIndex(stepStage)
}

function journeyStepCurrent(stepStage: BuildStage, currentStage: BuildStage): boolean {
  return stepStage === currentStage
}

// ── Sub-components ────────────────────────────────────────────────────────────

function JourneyBar({ stage }: { stage: BuildStage }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = step.icon
            const complete = stageIndex(stage) > i
            const current  = stageIndex(stage) === i
            const locked   = stageIndex(stage) < i && !(step.n === '05' && stageIndex(stage) >= 3)
            const buildUnlocked = step.n === '05' && stageIndex(stage) >= 3

            return (
              <div key={step.n} className="flex items-center shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  complete        ? 'text-green-600' :
                  current         ? 'text-[#E8724B]' :
                  buildUnlocked   ? 'text-[#1A2B4A]' :
                  'text-slate-400'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    complete      ? 'bg-green-100 text-green-600' :
                    current       ? 'bg-orange-100 text-[#E8724B]' :
                    buildUnlocked ? 'bg-slate-900 text-white' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {complete ? <CheckCircle2 className="w-3.5 h-3.5" /> : locked ? <Lock className="w-3 h-3" /> : step.n}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold whitespace-nowrap leading-none">{step.label}</p>
                    <p className="text-[10px] whitespace-nowrap opacity-70 leading-none mt-0.5">{step.price}</p>
                  </div>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RecommendedPanel({ stage }: { stage: BuildStage }) {
  const idx = Math.min(stageIndex(stage), JOURNEY_STEPS.length - 1)
  const step = JOURNEY_STEPS[idx]
  const Icon = step.icon

  // Fire-and-forget assess call when CTA is clicked
  const recordAssessment = useCallback(() => {
    fetch('/api/build/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: 'general',
        hasConcept:    stageIndex(stage) >= 1,
        hasDrawings:   stageIndex(stage) >= 2,
        hasPermit:     stageIndex(stage) >= 3,
        hasContractor: false,
      }),
    }).catch(() => {/* fire and forget */})
  }, [stage])

  if (stage === 'has_permit') {
    // Show both contractor match AND build management
    return (
      <div className="grid md:grid-cols-2 gap-5 mt-6">
        {/* Contractor match */}
        <div className="rounded-2xl border-2 border-[#0284C7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-600">Step 04</p>
              <p className="font-black text-slate-900 text-lg leading-none">Contractor Match</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Kealee matches your project to <strong>3 vetted, licensed GCs on the platform</strong> — matched by project type, scope, and location. You receive bids. We review them. You never browse a directory.
          </p>
          <ul className="space-y-2 mb-5">
            {['Matched by project type and scope', '3 platform-vetted GCs invited to bid', 'Kealee reviews every bid for completeness', 'Bid comparison report delivered to you', 'Free — no fee until you start construction'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/marketplace"
            onClick={recordAssessment}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 text-sm transition"
          >
            Get Matched with Contractors <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Build management */}
        <div className="rounded-2xl border-2 border-[#1A2B4A] bg-[#1A2B4A] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Step 05</p>
              <p className="font-black text-white text-lg leading-none">BUILD Management</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-4 leading-relaxed">
            A Kealee build manager oversees every platform professional on your project. Site visits, milestone verification, and pay protection — your money never moves until the work is confirmed.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-white">$950</p>
              <p className="text-xs text-white/60">PM Advisory<br/>Monthly visits</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-white">$2,950</p>
              <p className="text-xs text-white/60">PM Oversight<br/>Weekly visits</p>
            </div>
          </div>
          <Link
            href="/intake/pm_advisory"
            onClick={recordAssessment}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold py-3 text-sm transition"
          >
            Add Build Management <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border-2 bg-white p-6 shadow-sm" style={{ borderColor: step.color }}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.color}15` }}>
          <Icon className="w-6 h-6" style={{ color: step.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: step.color }}>Your next step — {step.n}</p>
            <span className="rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5">{step.price}</span>
            <span className="rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5">{step.time}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{step.label}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{step.description}</p>
          <Link
            href={step.href}
            onClick={recordAssessment}
            className="inline-flex items-center gap-2 rounded-xl font-bold px-6 py-3 text-sm text-white transition"
            style={{ backgroundColor: step.color }}
          >
            {step.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BuildPageClient() {
  const [stage, setStage] = useState<BuildStage>('none')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="bg-[#1A2B4A] pt-20 pb-28 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[#E8724B] text-xs font-bold uppercase tracking-widest mb-4">
            The Complete Build Platform · DC · MD · VA
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
            Your project gets built here.
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-3 leading-relaxed">
            Kealee is not a contractor. We are the platform that coordinates every licensed professional — architect, engineer, GC, and specialty trade — from your first design concept through your final inspection.
          </p>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-10">
            Every professional on your project is vetted, licensed, insured, and onboarded to the Kealee platform. You never source or negotiate with professionals independently.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/intake/concept"
              className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-7 py-3.5 rounded-xl transition shadow-lg text-sm"
            >
              Start with AI Concept <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3.5 rounded-xl transition text-sm"
            >
              I already have plans →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Journey bar (sticky) ── */}
      <JourneyBar stage={stage} />

      {/* ── Platform professionals ── */}
      <div className="bg-slate-50 border-b border-slate-200 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-6">
            Every professional on your project is a Kealee platform member
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_PROFESSIONALS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-9 h-9 rounded-lg bg-[#1A2B4A]/8 flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-[#1A2B4A]" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">
            Platform professionals are background-checked, license-verified, and carry active insurance. Kealee does not allow unlicensed or uninsured professionals on any project.
          </p>
        </div>
      </div>

      {/* ── Where are you today? ── */}
      <div className="py-16 px-4" id="start">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Find Your Starting Point</p>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Where are you today?</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Most people start with no plans. That is completely normal — the AI concept is the right first step for almost every project.
            </p>
          </div>

          {/* Stage selector */}
          <div className="grid sm:grid-cols-2 gap-3">
            {STAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStage(opt.value)}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  stage === opt.value
                    ? 'border-[#E8724B] bg-orange-50 shadow-md shadow-orange-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition ${
                    stage === opt.value ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300'
                  }`}>
                    {stage === opt.value && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Recommended action panel */}
          <RecommendedPanel stage={stage} />

          {/* Note */}
          <p className="text-center text-xs text-slate-400 mt-4">
            No commitment required. Every step starts with a short intake form — you only pay when you&apos;re ready.
          </p>
        </div>
      </div>

      {/* ── What BUILD management includes ── */}
      <div className="bg-[#1A2B4A] py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[#E8724B] text-xs font-bold uppercase tracking-widest mb-2">Build Management</p>
            <h2 className="text-3xl font-black text-white mb-3">What Kealee does while your project is being built</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              You hired platform professionals. Kealee ensures they deliver what was agreed — on scope, on schedule, and within budget.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUILD_INCLUDES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="w-9 h-9 rounded-lg bg-[#E8724B]/15 flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-[#E8724B]" />
                </div>
                <p className="font-bold text-white text-sm mb-1">{label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PM Tiers ── */}
      <div className="py-16 px-4 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Build Management Plans</p>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Choose your oversight level</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Added after your permit is approved and your contractor is matched. Build management runs for the full duration of construction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* PM Advisory */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">PM Advisory</p>
              <p className="text-3xl font-black text-slate-900">$950</p>
              <p className="text-xs text-slate-500 mb-4">per project · monthly visits</p>
              <p className="text-sm text-slate-600 mb-5">Best for projects under $150K with a trusted GC on the platform.</p>
              <ul className="space-y-2 mb-6">
                {['Monthly site visits + photo report', 'Milestone verification before payment', 'Pay application review', 'Issue log + contractor communication', 'Final punch list and closeout'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Link href="/intake/pm_advisory" className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-bold py-2.5 text-sm transition">
                Add PM Advisory <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* PM Oversight */}
            <div className="bg-white rounded-2xl border-2 border-[#E8724B] p-6 shadow-lg shadow-orange-100 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8724B] text-white text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
              <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-1">PM Oversight</p>
              <p className="text-3xl font-black text-slate-900">$2,950</p>
              <p className="text-xs text-slate-500 mb-4">per project · weekly visits</p>
              <p className="text-sm text-slate-600 mb-5">Best for $150K–$500K projects or any complex multi-trade build.</p>
              <ul className="space-y-2 mb-6">
                {['Weekly site visits + schedule tracking', 'Full pay application review (line-by-line)', 'Proactive issue identification', 'Change order review + recommendation', 'Budget variance reporting', 'Final closeout documentation'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Link href="/intake/pm_oversight" className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold py-2.5 text-sm transition shadow-md shadow-orange-200">
                Add PM Oversight <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Owner's Rep */}
            <div className="bg-[#1A2B4A] rounded-2xl border border-[#1A2B4A] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Owner&apos;s Representative</p>
              <p className="text-3xl font-black text-white">Custom</p>
              <p className="text-xs text-white/50 mb-4">per project · continuous</p>
              <p className="text-sm text-white/70 mb-5">For $500K+ builds, new construction, or investors with multiple active projects.</p>
              <ul className="space-y-2 mb-6">
                {['Continuous availability', 'Architect + engineering team management', 'Full budget and schedule control', 'Dispute management and legal documentation', 'Lender draw reporting'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E8724B] shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 text-sm transition">
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contractor matching — how it works ── */}
      <div className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0284C7] mb-2">Contractor Matching</p>
              <h2 className="text-3xl font-black text-slate-900 mb-4">
                We match you.<br />You don&apos;t browse.
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Kealee does not operate a contractor directory. When your permit is approved, we match your specific project — scope, location, budget, and timeline — to 3 vetted GCs on the platform who are qualified and available for your job.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Every matched GC has been background-checked, license-verified, insured, and onboarded to the Kealee platform. You receive competitive bids from professionals we stand behind, not a list of strangers.
              </p>
              <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-6 py-3 text-sm transition">
                Learn About Matching <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { n: '01', title: 'We receive your permit approval', body: 'Once your permit is approved, Kealee initiates the matching process automatically. No action needed from you.' },
                { n: '02', title: 'We identify qualified platform GCs', body: 'Our matching algorithm screens platform GCs by license type, project history, location radius, capacity, and specialty trade requirements.' },
                { n: '03', title: '3 GCs receive your bid invitation', body: 'Matched GCs are invited to submit a bid. They receive your approved drawings, scope summary, and permit details.' },
                { n: '04', title: 'Kealee reviews every bid', body: 'We review each bid for completeness, accuracy, and fair pricing before it reaches you. You receive a comparison report, not raw bids.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm mb-1">{title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Project types ── */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Project Types</p>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Every project type. Every budget range.</h2>
            <p className="text-slate-500 text-sm">Construction cost ranges for DC, MD, and VA. Your AI concept includes a property-specific estimate.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PROJECT_TYPES.map(({ label, range, weeks, slug }) => (
              <Link
                key={slug}
                href={`/services/${slug}`}
                className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-[#E8724B] hover:shadow-sm transition-all"
              >
                <p className="font-bold text-slate-900 text-sm mb-2 group-hover:text-[#E8724B] transition-colors">{label}</p>
                <p className="text-sm font-black text-slate-700">{range}</p>
                <p className="text-xs text-slate-400 mt-1">{weeks} · typical</p>
                <p className="text-xs text-[#E8724B] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">View package →</p>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">
            Ranges reflect completed projects in the DMV area. Your concept report includes a property-specific estimate.
          </p>
        </div>
      </div>

      {/* ── Milestone payment protection ── */}
      <div className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Payment Protection</p>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Your contractor gets paid when the work is done.</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Kealee&apos;s milestone payment system means no contractor — even a platform professional — receives payment before the work is verified.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Milestones agreed upfront', body: 'Draw amounts and milestone definitions are agreed in writing before work begins. Your GC knows exactly what must be complete before any payment releases.' },
              { n: '02', title: 'Build manager verifies each milestone', body: 'Before any payment releases, your build manager visits the site, confirms the work matches approved scope and drawings, and issues a verification report.' },
              { n: '03', title: 'You approve. Then it releases.', body: 'You receive the verification report, review it, and approve the release. No payment moves without your explicit approval and Kealee\'s confirmation.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#E8724B]/10 text-[#E8724B] flex items-center justify-center text-lg font-black mx-auto mb-4">{n}</div>
                <p className="font-bold text-slate-900 mb-2">{title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="bg-[#1A2B4A] py-20 px-4 text-center">
        <p className="text-[#E8724B] text-xs font-bold uppercase tracking-widest mb-4">Start at Step 01</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Start with a concept.<br />End with a built project.
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-3 leading-relaxed">
          Every Kealee build starts with an AI concept. It takes 3 minutes to submit. You receive your design package, cost estimate, and permit scope in 3–5 days. That package is the foundation for everything that follows — drawings, permit, contractor match, and build.
        </p>
        <p className="text-slate-500 text-xs max-w-md mx-auto mb-10">
          You do not need plans, drawings, or a contractor to start. The platform walks you through every step.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/intake/concept"
            className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-base"
          >
            Get My AI Concept <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-7 py-4 rounded-xl transition text-sm"
          >
            I have plans — talk to us
          </Link>
        </div>
      </div>
    </div>
  )
}
