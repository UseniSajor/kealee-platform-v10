'use client'

import { motion } from 'framer-motion'
import {
  Shield, Zap, BarChart3, Users, FileText,
  TrendingUp, Lock, Eye, Hammer, Brain, Layers,
  CheckCircle, ArrowRight, Clock, Target, Package,
  CreditCard, Gauge, Activity, Cpu, TreePine
} from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

const PHASES_DETAIL = [
  {
    id: 'design',
    icon: Brain,
    color: '#2ABFBF',
    title: 'Phase 1: design concepts',
    subtitle: 'design Capture & Brief',
    description: 'Transform your construction ideas into visual and analytical clarity. Generate realistic design renders, evaluate local zoning rules, and establish cost bounds in days.',
    features: [
      'Interactive 3D Design Studio (Pascal Integration)',
      'powered by AI tools photorealistic renders and material palettes',
      'Local zoning & permit path research reports',
      'Site capture dimensions and floor plan layouts',
      'Lender-ready Concept Package PDF downloads',
      'Seamless transition from parcel or space selection to design files',
    ],
  },
  {
    id: 'estimate',
    icon: BarChart3,
    color: '#E8793A',
    title: 'Phase 2: Cost Estimating',
    subtitle: 'RSMeans Regional Validation',
    description: 'Protect your budget from early-stage overruns. Get accurate, line-item material and labor estimates matched directly to your concept designs.',
    features: [
      'Trade-by-trade breakdown (carpentry, plumbing, electrical, etc.)',
      'RSMeans regional data validation for Bethesda, DMV, and local markets',
      'Material quantity takeoffs with standard and premium tier options',
      'Reconciliation checks to highlight potential budget deviations',
      'Investor-ready Certified Estimates for construction loans',
      'Editable digital budget sheet to model custom material choices',
    ],
  },
  {
    id: 'permit',
    icon: FileText,
    color: '#805AD5',
    title: 'Phase 3: Permit Filing',
    subtitle: 'Filing Prep & Agency Tracking',
    description: 'Skip the municipal bureaucracy. Our platform manages permit drawings, jurisdiction checklists, and county submittals under one unified workflow.',
    features: [
      'Site plan preparation and code compliance reviews',
      'Architectural and structural engineering stamp coordination (PE stamp)',
      'Pre-compiled application checklist preparation for county agencies',
      'Direct filing and status tracking with building departments',
      'Zoning board of appeals and HOA variance coordination',
      'Response logs and correction tracking for quick agency approval',
    ],
  },
  {
    id: 'build',
    icon: Hammer,
    color: '#38A169',
    title: 'Phase 4: Build & Manage',
    subtitle: 'General Contractor Matching & Workspaces',
    description: 'Connect with the right builders and manage milestones securely. Secure your project funds in escrow and track daily construction logs through closeout.',
    features: [
      'General contractor matching matched to your scope and budget',
      'Escrow accounts with milestone-based payout structures (OS-Pay)',
      'Lien waiver collection before payment disbursements',
      'Daily site logs, progress reports, and milestone photos',
      'Structured project turnover checklists (warranties, manuals)',
      'Closeout document vault (as-builts, warranties, systems records)',
    ],
  },
]

const PORTAL_FEATURES = [
  {
    id: 'owner',
    title: 'Owner Portal',
    description: 'Complete project visibility for homeowners and project owners.',
    icon: Eye,
    color: '#2ABFBF',
    highlights: ['Real-time project dashboard', 'Payment tracking & approvals', 'Project history & documents', 'design insights', 'Document library', 'Inspection status'],
  },
  {
    id: 'contractor',
    title: 'Contractor Portal',
    description: 'Business management tools for general contractors and builders.',
    icon: Hammer,
    color: '#E8793A',
    highlights: ['Lead matching & bid management', 'Compliance tracking', 'Milestone invoicing', 'AI bid assistant', 'Contractor credentials vault', 'Operational metrics'],
  },
]

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#2ABFBF' }}>
            Platform Features
          </span>
          <h1
            className="mt-3 text-4xl font-black font-display sm:text-5xl text-slate-900 tracking-tight"
          >
            End-to-End Build Coordination
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed"
          >
            A unified workflow tracking your project from first idea to final construction closeout. Centered around 4 primary stages and 2 dedicated portals.
          </p>
        </div>
      </section>

      {/* 4 Phases Detail */}
      {PHASES_DETAIL.map((section, sectionIndex) => (
        <section
          key={section.id}
          id={section.id}
          className="py-20 border-b border-slate-100"
          style={{ backgroundColor: sectionIndex % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div {...fadeInUp} className={sectionIndex % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${section.color}15` }}
                  >
                    <section.icon className="h-6 w-6" style={{ color: section.color }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-display sm:text-3xl text-slate-900">
                      {section.title}
                    </h2>
                    <p className="text-sm font-semibold" style={{ color: section.color }}>{section.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-base leading-relaxed text-slate-600">{section.description}</p>
                <Link
                  href="/concept"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-80"
                  style={{ color: section.color }}
                >
                  Start this phase <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div {...fadeInUp} className={sectionIndex % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Key Capabilities</h3>
                  <ul className="space-y-3">
                    {section.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: section.color }} />
                        <span className="text-sm text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* Digital Project Twin (DDTS) Section */}
      <section id="twin" className="py-20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2ABFBF] bg-[#2ABFBF]/10 px-3 py-1 rounded-full">
              Core Infrastructure
            </span>
            <h2 className="mt-6 text-3xl font-black font-display sm:text-4xl text-white tracking-tight">
              Digital Project Twin
            </h2>
            <p className="mt-4 text-lg text-slate-300 leading-relaxed">
              Every project gets a living digital record from day one. The twin tracks all updates, files, and progress to keep your project on schedule and on budget.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Package, title: 'Flexible Tracking', desc: 'Standard tracking for home renovations, and advanced analytics for larger construction projects.' },
              { icon: Activity, title: 'Project Health Monitoring', desc: 'Real-time scoring across schedule, budget, and quality to identify issues before they delay construction.' },
              { icon: Brain, title: 'Smart Activity Log', desc: 'Automated updates for every project milestone, permit submission, and payment event.' },
              { icon: Eye, title: 'Progress Snapshots', desc: 'Saved history logs for review, insurance, and reporting. Easily compare snapshots to see what changed.' },
              { icon: Gauge, title: 'Budget & Schedule Alerts', desc: 'Automatic notifications if your project budget or timeline deviates from the original plan.' },
              { icon: Layers, title: '4-Phase Project Journey', desc: 'Seamlessly guides your project from first design concept, cost planning, permits, and active build, through completion.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl p-6 transition-all duration-300 hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.15)' }}>
                  <item.icon className="h-6 w-6" style={{ color: '#2ABFBF' }} />
                </div>
                <h3 className="text-lg font-bold text-white font-display">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">
              Role-Based Portals
            </span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl text-slate-900">
              Dedicated Portals for Every User
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Surfaces the right data, tools, and project workspaces for its target user — nothing more, nothing less.
            </p>
          </div>

          <div className="mt-16 max-w-4xl mx-auto grid gap-8 sm:grid-cols-2">
            {PORTAL_FEATURES.map((portal, i) => (
              <motion.div
                key={portal.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="h-1" style={{ backgroundColor: portal.color }} />
                <div className="p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${portal.color}15` }}
                    >
                      <portal.icon className="h-5 w-5" style={{ color: portal.color }} />
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900">{portal.title}</h3>
                  </div>
                  <p className="mb-6 text-sm text-slate-500">{portal.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {portal.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: portal.color }} />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black font-display text-slate-900 tracking-tight">
            Ready to Transform Your Project?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            See how Kealee's unified end-to-end design-build workflow keeps construction simple, transparent, and on-schedule.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link 
              href="/concept" 
              className="w-full sm:w-auto rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 text-sm transition-all hover:shadow-md text-center"
            >
              Start Design Concept
            </Link>
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-8 text-sm transition-all text-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
