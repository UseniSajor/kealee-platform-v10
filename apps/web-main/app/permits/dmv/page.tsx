import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Shield, Clock, ArrowRight, FileCheck, Users, TrendingUp,
  Check, Phone, Star, Building2, MapPin, Zap,
  Home, Wind, Utensils, HardHat, ShoppingBag, Briefcase, Paintbrush, Droplets,
} from 'lucide-react'

// ── SEO ───────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'DMV Permit Specialists | DC, Maryland & Virginia | Kealee',
  description:
    'Kealee files building permits in Washington DC, Montgomery County, Prince George\'s County, Arlington, Fairfax, Alexandria, and Baltimore. Licensed permit expediters with 10+ years of DMV experience.',
  keywords: [
    'DMV permit specialist', 'DC building permit', 'Montgomery County permit',
    'Fairfax permit expediter', 'Arlington permit filing', 'Maryland permit service',
    'Virginia permit expediter', 'DC DOB permit', 'Prince George\'s County permit',
    'Alexandria permit', 'Baltimore building permit', 'permit expediter DC',
  ],
  openGraph: {
    title: 'DMV Permit Specialists | Kealee',
    description: 'Licensed permit expediters filing in DC, Maryland, and Virginia. We know every jurisdiction — DC DOB, Montgomery DPS, Fairfax ZEA, PG DPS, and more.',
    url: 'https://kealee.com/permits/dmv',
  },
  alternates: { canonical: 'https://kealee.com/permits/dmv' },
}

// ── Jurisdiction data ─────────────────────────────────────────────────────────

const JURISDICTIONS = [
  {
    abbr: 'DC',
    name: 'Washington DC',
    agency: 'Dept. of Buildings (DOB)',
    timeline: '2–5 months (plan review)',
    color: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    notes: 'Residential permits: 3–6 weeks over-the-counter. Full plan review: 2–5 months. HPRB review required for historic properties.',
  },
  {
    abbr: 'MoCo',
    name: 'Montgomery County',
    agency: 'Dept. of Permitting Services (DPS)',
    timeline: '4–8 weeks',
    color: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    notes: 'Online ePlans submission. Residential addition review: 4–8 weeks. Expedited track available. HOA coordination required in many communities.',
  },
  {
    abbr: 'PG',
    name: "Prince George's Co.",
    agency: 'Dept. of Permitting Services (DPS)',
    timeline: '4–10 weeks',
    color: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    notes: 'Plan review 4–10 weeks depending on project complexity. Stormwater management review required for impervious surface changes.',
  },
  {
    abbr: 'FFX',
    name: 'Fairfax County',
    agency: 'Land Development Services (LDS)',
    timeline: '2–4 weeks',
    color: 'bg-sky-100 text-sky-700',
    border: 'border-sky-200',
    notes: 'One of the fastest jurisdictions in the DMV. Online Permit Portal. Minor residential permits often approved in 2 weeks. Comprehensive zoning ordinance.',
  },
  {
    abbr: 'ARL',
    name: 'Arlington County',
    agency: 'Planning & Zoning Management',
    timeline: '3–6 weeks',
    color: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
    notes: 'Dense urban environment with strict impervious surface rules. Form-Based Code applies to certain corridors. Historic district review in Maywood, Lyon Park, etc.',
  },
  {
    abbr: 'ALX',
    name: 'Alexandria City',
    agency: 'Dept. of Planning & Zoning',
    timeline: '3–8 weeks',
    color: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    notes: 'Strong historic district oversight (Old Town). BAR review required for historic properties. Relatively streamlined for non-historic residential projects.',
  },
  {
    abbr: 'BAL',
    name: 'Baltimore City',
    agency: 'Dept. of Housing & Community Dev.',
    timeline: '4–12 weeks',
    color: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
    notes: 'Online One-Stop Shop portal. Longer timelines for plan review. Significant backlog for complex projects. Rowhouse and attached-unit experience required.',
  },
]

const PERMIT_CARDS = [
  { key: 'kitchen',   label: 'Kitchen Remodel',        icon: Utensils,   permits: 4,  desc: 'Cabinetry, island, plumbing & electrical — one coordinated package across any DMV jurisdiction.' },
  { key: 'bathroom',  label: 'Bathroom Remodel',        icon: Droplets,   permits: 3,  desc: 'Plumbing, tile, electrical, and ventilation permits. In-place replacements often OTC.' },
  { key: 'addition',  label: 'Home Addition',           icon: Home,       permits: 6,  desc: 'Structural, MEP, zoning, setback, and impervious coverage review — full coordination.' },
  { key: 'adu',       label: 'ADU / In-Law Suite',      icon: Home,       permits: 5,  desc: 'By-right ADU permits: 4–8 weeks in most DMV jurisdictions. Variance projects: 3–6 months.' },
  { key: 'hvac',      label: 'HVAC / Mechanical',       icon: Wind,       permits: 2,  desc: 'Heating, cooling, and ventilation permits across all 7 jurisdictions.' },
  { key: 'electrical',label: 'Electrical Upgrade',      icon: Zap,        permits: 1,  desc: 'Panel upgrades, EV chargers, and service upgrades — expedited OTC in most DMV jurisdictions.' },
  { key: 'whole',     label: 'Whole House Renovation',  icon: Building2,  permits: 8,  desc: 'Multi-permit coordination across trades — structural, MEP, and exterior.' },
  { key: 'historic',  label: 'Historic Properties',     icon: Briefcase,  permits: 5,  desc: 'HPRB and local BAR review, Secretary of Interior standards, preservation compliance.' },
  { key: 'commercial',label: 'Commercial / Retail TI',  icon: ShoppingBag,permits: 5,  desc: 'Tenant improvements, restaurant build-outs, and office renovations in DC, MD, and VA.' },
  { key: 'deck',      label: 'Deck & Patio',            icon: Home,       permits: 2,  desc: 'Structural and occupancy permits. Decks over 30" from grade require permits in all DMV jurisdictions.' },
  { key: 'new-home',  label: 'New Construction',        icon: HardHat,    permits: 12, desc: 'Full permit coordination from foundation to certificate of occupancy in any DMV jurisdiction.' },
  { key: 'multifamily',label: 'Multi-Family',           icon: Building2,  permits: 10, desc: 'Complex multi-unit residential permits across all trades and occupancy classes.' },
]

const PROCESS_STEPS = [
  { n: '01', icon: FileCheck, title: 'Select your jurisdiction & package', body: 'Tell us your jurisdiction (DC, Montgomery, Fairfax, etc.) and project type. We confirm the exact permit path and fee schedule for your address.' },
  { n: '02', icon: Users,     title: 'We prepare your complete package', body: 'Drawings, supporting documents, agency-specific forms, and application checklists assembled within 5–7 business days by our DMV specialists.' },
  { n: '03', icon: TrendingUp,title: 'Filed, tracked & approved',         body: 'We submit to the correct agency (DOB, DPS, LDS, etc.), monitor status in each jurisdiction\'s portal, and respond to any comment letters until you\'re approved.' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DmvPermitsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1A2B4A] via-[#1f3560] to-[#0f1c30] pt-20 pb-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

        <div className="mx-auto max-w-5xl relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs font-bold text-green-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> DMV Permit Specialists
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white/70 uppercase tracking-widest">
              DC · Maryland · Virginia
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
            DMV permits, filed<br />
            <span className="text-green-400">by specialists who know every agency.</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-6 leading-relaxed">
            We know DC DOB, Montgomery DPS, Fairfax LDS, Prince George&apos;s DPS, Arlington PZM, Alexandria, and Baltimore inside and out.
            We file, track, and get you approved — every form, every agency, every comment cycle.
          </p>

          <div className="flex items-center gap-2 mb-10">
            <div className="flex -space-x-1.5">
              {['bg-green-400', 'bg-blue-400', 'bg-amber-400', 'bg-purple-400'].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#1A2B4A] flex items-center justify-center text-[10px] font-black text-white`}>
                  {['H', 'K', 'L', 'T'][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span><span className="text-white font-semibold">4.9/5</span> from 200+ DMV clients — homeowners, contractors, and developers</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-2xl mb-12">
            {[
              { value: '500+', label: 'Permits filed' },
              { value: '5–7',  label: 'Day turnaround' },
              { value: '98%',  label: 'First-pass approval' },
              { value: '7',    label: 'Jurisdictions' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/permits"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-7 py-3.5 rounded-xl transition shadow-lg shadow-green-900/40 text-base"
            >
              Start My DMV Permit <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#jurisdictions" className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-6 py-3.5 rounded-xl transition text-sm">
              View all jurisdictions
            </a>
          </div>
        </div>
      </div>

      {/* ── Jurisdiction strip ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 py-5 px-4 overflow-x-auto">
        <div className="mx-auto max-w-5xl flex items-center gap-3 min-w-max">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2 whitespace-nowrap">We file in:</p>
          {JURISDICTIONS.map(j => (
            <a key={j.abbr} href="#jurisdictions" className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 px-3 py-1.5 whitespace-nowrap transition">
              <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${j.color}`}>
                {j.abbr.slice(0, 2)}
              </span>
              <span className="text-xs text-slate-300 font-medium">{j.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Jurisdiction cards ────────────────────────────────────────────── */}
      <div id="jurisdictions" className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">7 Jurisdictions</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Every DMV agency. One team.</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Each jurisdiction has its own portal, timeline, agency contacts, and comment patterns.
              Our specialists work each one daily — no learning curve, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {JURISDICTIONS.map(j => (
              <div key={j.abbr} className={`rounded-2xl border-2 ${j.border} bg-white p-6 hover:shadow-md transition-shadow`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full text-sm font-black flex items-center justify-center shrink-0 ${j.color}`}>
                    {j.abbr.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight">{j.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{j.agency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="text-xs font-semibold text-green-700">{j.timeline} typical turnaround</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{j.notes}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/permits"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-7 py-3.5 rounded-xl transition shadow-md text-base"
            >
              Start Your Permit Application <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Project types ─────────────────────────────────────────────────── */}
      <div className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">All Project Types</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Every DMV permit we file</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Residential, commercial, historic — we handle the full range across all 7 DMV jurisdictions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PERMIT_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.key}
                  href="/permits"
                  className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-green-300 transition-all duration-200"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{card.label}</h3>
                      <p className="text-[11px] text-slate-400">{card.permits} permit{card.permits !== 1 ? 's' : ''} typical</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{card.desc}</p>
                  <div className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 group-hover:bg-green-500 text-slate-500 group-hover:text-white text-xs font-bold py-2.5 transition-all duration-200 border border-slate-200 group-hover:border-green-500">
                    Start Permit <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <div className="py-20 px-4 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Simple Process</p>
            <h2 className="text-3xl font-bold text-slate-900">From intake to approval in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PROCESS_STEPS.map(({ n, icon: Icon, title, body }) => (
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

      {/* ── Jurisdiction timeline table ────────────────────────────────────── */}
      <div className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Permit Timelines</p>
            <h2 className="text-2xl font-bold text-slate-900">Current turnaround by jurisdiction</h2>
            <p className="text-slate-500 text-sm mt-2">Updated quarterly based on active submissions</p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">Jurisdiction</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">Agency</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">Typical Timeline</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hidden md:table-cell">Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Washington DC',       agency: 'DC DOB',             timeline: '3 wks – 5 mo',  portal: 'PermitDC' },
                  { name: 'Montgomery County',   agency: 'Montgomery DPS',     timeline: '4–8 weeks',     portal: 'ePlans' },
                  { name: "Prince George's Co.", agency: "PG DPS",             timeline: '4–10 weeks',    portal: 'Online Portal' },
                  { name: 'Fairfax County',      agency: 'Fairfax LDS',        timeline: '2–4 weeks',     portal: 'Permit Portal' },
                  { name: 'Arlington County',    agency: 'Arlington PZM',      timeline: '3–6 weeks',     portal: 'Arlington ePermit' },
                  { name: 'Alexandria City',     agency: 'Alexandria P&Z',     timeline: '3–8 weeks',     portal: 'Alexandria Online' },
                  { name: 'Baltimore City',      agency: 'Baltimore DHCD',     timeline: '4–12 weeks',    portal: 'One-Stop Shop' },
                ].map((row, i) => (
                  <tr key={row.name} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{row.agency}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> {row.timeline}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">{row.portal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <div className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Licensed Professionals',  body: 'Every application reviewed and certified by licensed permit expediters with 10+ years of DMV experience across all 7 jurisdictions.' },
            { icon: Clock,  title: '5–7 Day Turnaround',      body: 'Complete applications assembled in 5–7 business days. Rush service available for DC DOB expedited review and Fairfax fast-track.' },
            { icon: Phone,  title: 'Agency Coordination',     body: 'We handle all correspondence, RFI responses, and inspection coordination directly with DC DOB, Montgomery DPS, Fairfax LDS, and every other DMV agency.' },
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

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Common Questions</p>
            <h2 className="text-2xl font-bold text-slate-900">DMV permit FAQs</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'How long does DMV permitting take?', a: 'Fairfax residential permits: 2–4 weeks. Montgomery DPS residential: 4–8 weeks. DC DOB over-the-counter: 3–6 weeks. DC DOB full plan review: 2–5 months. We confirm current timelines for your specific project before filing.' },
              { q: 'What areas do you cover?', a: 'Washington DC (DOB), Montgomery County (DPS), Prince George\'s County (DPS), Fairfax County (LDS), Arlington County (PZM), Alexandria City, and Baltimore City. We have active agency relationships in all 7 jurisdictions.' },
              { q: 'Does a kitchen remodel require a permit in the DMV?', a: 'Cosmetic work (paint, hardware, appliance swap) typically does not. Moving walls, adding circuits, relocating plumbing, or structural changes require permits in every DMV jurisdiction.' },
              { q: 'Does a deck always need a permit in the DMV?', a: 'Decks over approximately 30 inches from grade require a permit in virtually all DMV jurisdictions. Ground-level patios typically do not. We confirm the specific threshold for your county.' },
              { q: 'Do all DMV jurisdictions allow ADUs?', a: 'All DMV jurisdictions allow some form of ADU, but rules vary significantly by county. Eligibility depends on lot size, setbacks, existing impervious coverage, and water/sewer capacity. We run the eligibility check as part of every ADU permit engagement.' },
              { q: 'How do I know if my property is in a historic district?', a: 'Many properties in DC, Annapolis, Alexandria, Frederick, and other DMV communities are in local or national historic districts without the owner\'s knowledge. We check this at the start of every engagement and route historic projects through HPRB or local BAR as required.' },
              { q: 'Which DMV jurisdictions offer expedited review?', a: 'Fairfax, Montgomery, and DC (for certain project types) have formal expedited review programs. We confirm availability and file for expedited track when timeline is critical.' },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl bg-white border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1A2B4A] to-[#0f1c30] py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to get your DMV permit filed?</h2>
        <p className="text-slate-400 mb-3 text-sm">Most applications submitted within 5–7 business days.</p>
        <p className="text-slate-500 mb-8 text-xs">DC DOB · Montgomery DPS · Fairfax LDS · Prince George&apos;s DPS · Arlington PZM · Alexandria · Baltimore</p>
        <Link
          href="/permits"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-base"
        >
          Start My Permit <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-6 text-xs text-slate-500">
          Not in the DMV?{' '}
          <Link href="/permits" className="text-green-400 hover:text-green-300 underline underline-offset-2">
            View all permit services →
          </Link>
        </p>
      </div>

    </div>
  )
}
