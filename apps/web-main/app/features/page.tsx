'use client'

import { motion } from 'framer-motion'
import {
  Building2, Shield, Zap, BarChart3, Users, FileText, Bot,
  MapPin, DollarSign, Boxes, Wrench, Landmark, TreePine,
  TrendingUp, Lock, Eye, Cpu, Hammer, Brain, Layers, Globe,
  CheckCircle, ArrowRight, Clock, Target, Briefcase, Search,
  Bell, CreditCard, Gauge, Activity,
} from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

const OS_DETAIL_SECTIONS = [
  {
    id: 'land',
    icon: TreePine,
    color: '#38A169',
    title: 'OS-Land',
    subtitle: 'Land Intelligence System',
    description: 'Comprehensive parcel management from intake through acquisition. AI-powered zoning analysis, environmental assessments, and development readiness scoring give you confidence before you commit.',
    features: [
      'Parcel database with location, characteristics, and ownership tracking',
      'AI zoning analysis — density, height, FAR, setbacks, permitted uses',
      'Environmental, geotechnical, survey, and title assessments',
      'Comparable sales data and market analysis',
      'Offer management with due diligence tracking',
      'One-click conversion from parcel to project (creates Digital Twin)',
    ],
  },
  {
    id: 'feasibility',
    icon: TrendingUp,
    color: '#2ABFBF',
    title: 'OS-Feas',
    subtitle: 'Feasibility Analysis Engine',
    description: 'Model scenarios, generate pro formas, and make data-driven go/no-go decisions. AI analyzes market conditions, cost assumptions, and revenue projections to validate your investment thesis.',
    features: [
      'Multi-scenario modeling with unit mix, cost, and revenue variations',
      'Pro forma generation with IRR, cash-on-cash, and equity multiple',
      'Cost assumption management with categorized sources',
      'Revenue modeling by unit type with escalation factors',
      'Comparable project benchmarking',
      'AI-powered sensitivity analysis and risk assessment',
    ],
  },
  {
    id: 'dev',
    icon: Landmark,
    color: '#E8793A',
    title: 'OS-Dev',
    subtitle: 'Development Finance Platform',
    description: 'Build capital stacks, track draws, generate investor reports, and manage entitlements. Full development finance lifecycle from funding through stabilization.',
    features: [
      'Capital stack builder with senior debt, mezzanine, and equity layers',
      'Individual funding source tracking with terms and covenants',
      'Draw schedule management with inspection and lien waiver requirements',
      'Monthly/quarterly investor reports with distribution tracking',
      'Entitlement tracking — rezoning, variance, conditional use permits',
      'HUD eligibility assessment for affordable housing programs',
    ],
  },
  {
    id: 'pm',
    icon: Building2,
    color: '#1A2B4A',
    title: 'OS-PM',
    subtitle: 'Project Management Hub',
    description: 'Full construction oversight with scheduling, scoping, RFIs, inspections, change orders, and project closeout. The proven OS from v10, now enhanced with DDTS integration.',
    features: [
      'Schedule management with milestones, dependencies, and critical path',
      'Scope management with line-item detail and approval workflows',
      'RFI tracking with contractor assignments and response management',
      'Inspection scheduling and coordination with jurisdiction tracking',
      'Change order workflows with cost impact and approval chains',
      'Project closeout with punch lists, warranties, and as-built documents',
    ],
  },
  {
    id: 'payments',
    icon: DollarSign,
    color: '#38A169',
    title: 'OS-Pay',
    subtitle: 'Payments & Escrow Engine',
    description: 'Secure milestone-based payments with escrow protection. Stripe-powered processing, lien waiver management, and reconciliation reporting keep every dollar tracked and transparent.',
    features: [
      'Escrow accounts with milestone-based release conditions',
      'Reusable payment schedule templates for common project types',
      'Automatic lien waiver collection before payment release',
      'Reconciliation snapshots with discrepancy detection',
      'Draw disbursement coordination with lender requirements',
      'Complete payment audit trail for compliance and reporting',
    ],
  },
  {
    id: 'ops',
    icon: Wrench,
    color: '#2ABFBF',
    title: 'OS-Ops',
    subtitle: 'Operations & Maintenance',
    description: 'Post-construction lifecycle management. Structured turnover checklists, warranty tracking, and maintenance work orders ensure buildings perform long after construction ends.',
    features: [
      'Categorized turnover checklists (documents, keys, training, systems)',
      'Warranty registration and claim management with vendor tracking',
      'Recurring maintenance schedules with assignment and notification',
      'Priority-based work order management with cost tracking',
      'Vendor performance tracking for ongoing maintenance relationships',
      'Building performance analytics and lifecycle cost analysis',
    ],
  },
  {
    id: 'marketplace',
    icon: Users,
    color: '#E8793A',
    title: 'Marketplace',
    subtitle: 'Contractor Network',
    description: 'Vetted contractor marketplace with automated bid matching, credential verification, and reputation scoring. Connects project owners with the right professionals for every trade.',
    features: [
      'Contractor profiles with license, insurance, and certification verification',
      'AI-powered bid matching based on specialty, location, and capacity',
      'Reputation scoring from project history and peer reviews',
      'Bid management with comparison tools and negotiation tracking',
      'Capacity and availability tracking for workforce planning',
      'Sub-contractor coordination and compliance management',
    ],
  },
]

const PORTAL_FEATURES = [
  {
    id: 'owner',
    title: 'Owner Portal',
    description: 'Complete project visibility for homeowners and property owners.',
    icon: Eye,
    color: '#1A2B4A',
    highlights: ['Real-time project dashboard', 'Payment tracking & approvals', 'Digital twin access', 'AI assistant (KeaBot Owner)', 'Document library', 'Inspection status'],
  },
  {
    id: 'contractor',
    title: 'Contractor Portal',
    description: 'Business management tools for general contractors and subs.',
    icon: Hammer,
    color: '#E8793A',
    highlights: ['Lead pipeline & bid management', 'Credential management', 'Schedule & crew tracking', 'Invoice submission', 'AI assistant (KeaBot GC)', 'Performance analytics'],
  },
  {
    id: 'developer',
    title: 'Developer Portal',
    description: 'Portfolio-level tools for real estate developers and investors.',
    icon: Landmark,
    color: '#2ABFBF',
    highlights: ['Portfolio dashboard', 'Land pipeline tracking', 'Feasibility studies', 'Capital stack management', 'Investor reporting', 'AI insights (KeaBot Developer)'],
  },
  {
    id: 'command',
    title: 'Command Center',
    description: 'Administrative dashboard for platform operators and PMs.',
    icon: Cpu,
    color: '#38A169',
    highlights: ['Multi-project overview', 'User & role management', 'System health monitoring', 'AI bot administration', 'Analytics & reporting', 'Integration management'],
  },
]

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span {...fadeInUp} className="section-label">
            Platform Features
          </motion.span>
          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-4xl font-bold font-display sm:text-5xl"
            style={{ color: '#1A2B4A' }}
          >
            Built for Every Role in Construction
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            7 operating systems, 13 AI assistants, 12 lifecycle phases, and 4 role-based portals —
            designed for homeowners, contractors, developers, and construction professionals.
          </motion.p>
        </div>
      </section>

      {/* OS Modules Detail */}
      {OS_DETAIL_SECTIONS.map((section, sectionIndex) => (
        <section
          key={section.id}
          id={section.id}
          className="py-20"
          style={{ backgroundColor: sectionIndex % 2 === 0 ? '#FFFFFF' : '#F7FAFC' }}
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
                    <h2 className="text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
                      {section.title}
                    </h2>
                    <p className="text-sm" style={{ color: section.color }}>{section.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-base leading-relaxed text-gray-600">{section.description}</p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: section.color }}
                >
                  Request a demo <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div {...fadeInUp} className={sectionIndex % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Key Capabilities</h3>
                  <ul className="space-y-3">
                    {section.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: section.color }} />
                        <span className="text-sm text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* DDTS Section */}
      <section id="ddts" className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#2ABFBF' }}>
              Core Infrastructure
            </span>
            <h2 className="mt-3 text-3xl font-bold text-white font-display sm:text-4xl">
              Digital Development Twin System (DDTS)
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Every project gets a living digital twin from day one. The DDTS is the nervous system that connects all operating systems and provides real-time project intelligence.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Boxes, title: 'L1/L2/L3 Tiers', desc: 'L1: 3 KPIs for renovations. L2: 6 KPIs + health scoring for new builds. L3: 10 KPIs + predictive analytics for complex developments.' },
              { icon: Activity, title: 'Health Scoring', desc: 'Aggregate score across schedule, budget, quality, and risk. L2+ twins compute real-time health with configurable warning/critical thresholds.' },
              { icon: Brain, title: 'Event Intelligence', desc: 'Every OS action emits TwinEvents. 27 integration hooks track project, permit, estimation, payment, schedule, and marketplace events.' },
              { icon: Eye, title: 'State Snapshots', desc: 'Point-in-time captures for investor reports, audits, and trend analysis. Compare any two snapshots to see what changed.' },
              { icon: Gauge, title: 'KPI Thresholds', desc: '19 pre-configured KPI defaults across 3 tiers. Custom warning (±10%) and critical (±20%) thresholds for each metric.' },
              { icon: Layers, title: '12-Phase Lifecycle', desc: 'Tracks projects through all 12 phases: Idea → Land → Feasibility → Design → Permits → Pre-Con → Construction → Inspections → Payments → Closeout → Ops → Archive.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl p-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.15)' }}>
                  <item.icon className="h-6 w-6" style={{ color: '#2ABFBF' }} />
                </div>
                <h3 className="text-lg font-bold text-white font-display">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* KeaBots */}
      <section id="keabots" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label">AI Automation Layer</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              13 Specialized AI Assistants
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              KeaBots are thin orchestrators that call OS service APIs — they assist and automate but never replace the system of record. Powered by Claude AI.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Cpu, name: 'KeaBot Command', desc: 'Master orchestrator that routes queries to the right specialist and manages handoffs between bots.' },
              { icon: Eye, name: 'KeaBot Owner', desc: 'Personal project advisor for budgets, timelines, milestone decisions, and progress updates.' },
              { icon: Hammer, name: 'KeaBot GC', desc: 'Contractor business operations: bid prep, sub coordination, compliance tracking, crew scheduling.' },
              { icon: Building2, name: 'KeaBot Construction', desc: 'Execution state: progress tracking, schedule dependencies, inspection readiness, daily log summaries.' },
              { icon: TreePine, name: 'KeaBot Land', desc: 'Parcel research, zoning lookups, environmental screening, and development readiness analysis.' },
              { icon: TrendingUp, name: 'KeaBot Feasibility', desc: 'Scenario analysis, pro forma generation, market comparisons, and sensitivity modeling.' },
              { icon: DollarSign, name: 'KeaBot Finance', desc: 'Capital stack optimization, draw management, HUD alignment, and debt service calculations.' },
              { icon: Landmark, name: 'KeaBot Developer', desc: 'Portfolio analytics, investor report drafting, distribution waterfall analysis, and IRR projections.' },
              { icon: FileText, name: 'KeaBot Permit', desc: 'Permit navigation, jurisdiction-specific rules, document checklist preparation, and status tracking.' },
              { icon: Zap, name: 'KeaBot Estimate', desc: 'AI cost estimation from plans with RSMeans integration, assembly costing, and line-item breakdowns.' },
              { icon: Lock, name: 'KeaBot Payments', desc: 'Payment coordination, escrow health monitoring, reconciliation alerts, and disbursement scheduling.' },
              { icon: Users, name: 'KeaBot Marketplace', desc: 'Contractor matchmaking, bid analysis, trade recommendations, and capacity availability checks.' },
              { icon: Wrench, name: 'KeaBot Operations', desc: 'Warranty claim coordination, maintenance scheduling, turnover tracking, and vendor management.' },
            ].map((bot, i) => (
              <motion.div
                key={bot.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-teal hover:shadow-md"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                  <bot.icon className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{bot.name}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{bot.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label">Role-Based Portals</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              Dedicated Portals for Every User
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Each portal surfaces the right data, tools, and AI assistants for its target user — nothing more, nothing less.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {PORTAL_FEATURES.map((portal, i) => (
              <motion.div
                key={portal.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="overflow-hidden rounded-xl bg-white"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
              >
                <div className="h-1" style={{ backgroundColor: portal.color }} />
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${portal.color}15` }}
                    >
                      <portal.icon className="h-5 w-5" style={{ color: portal.color }} />
                    </div>
                    <h3 className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>{portal.title}</h3>
                  </div>
                  <p className="mb-4 text-sm text-gray-600">{portal.description}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {portal.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
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
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Ready to Transform Your Projects?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            See how Kealee's 7 operating systems, 13 AI assistants, and 12 lifecycle phases can streamline your next development project.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="btn-primary">
              Request a Demo <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/pricing" className="btn-outline-navy">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
