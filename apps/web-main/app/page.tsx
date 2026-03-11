'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, Building2, Shield, Zap, BarChart3, Users, FileText,
  Bot, MapPin, DollarSign, Boxes, Wrench, Landmark,
  CheckCircle, Star, ChevronRight, Layers, Brain, Globe,
  TrendingUp, Lock, Eye, Cpu, Hammer, TreePine, Home,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

const STATS = [
  { value: '364+', label: 'Data Models' },
  { value: '7', label: 'Operating Systems' },
  { value: '13', label: 'AI KeaBots' },
  { value: '12', label: 'Lifecycle Phases' },
]

// Seeded project types with recommended Digital Twin tiers
const PROJECT_TYPES = [
  { name: 'Renovation / Remodel', tier: 'L1', desc: 'Kitchen, bath, and whole-home remodels', icon: Wrench },
  { name: 'Home Addition', tier: 'L2', desc: 'Bump-outs, second stories, ADUs', icon: Building2 },
  { name: 'New Home Construction', tier: 'L2', desc: 'Ground-up single-family builds', icon: Building2 },
  { name: 'Commercial Build-Out', tier: 'L2', desc: 'Office, retail, and restaurant fit-ups', icon: Boxes },
  { name: 'Multifamily Development', tier: 'L3', desc: 'Duplexes to apartment complexes', icon: Users },
  { name: 'Mixed-Use Development', tier: 'L3', desc: 'Combined residential + commercial', icon: Globe },
]

// Seeded milestone payment schedule (7 milestones)
const PAYMENT_MILESTONES = [
  { name: 'Deposit', pct: 10 },
  { name: 'Foundation', pct: 15 },
  { name: 'Framing', pct: 20 },
  { name: 'MEP Rough-In', pct: 15 },
  { name: 'Drywall & Insulation', pct: 15 },
  { name: 'Finish Work', pct: 15 },
  { name: 'Final Completion', pct: 10 },
]

const OS_MODULES = [
  {
    icon: TreePine,
    title: 'OS-Land',
    subtitle: 'Land Intelligence',
    description: 'Parcel intake, zoning analysis, environmental assessments, and development readiness scoring.',
    features: ['Parcel database & scoring', 'Zoning analysis with AI', 'Site assessments', 'Comparable sales data'],
    color: '#38A169',
  },
  {
    icon: TrendingUp,
    title: 'OS-Feas',
    subtitle: 'Feasibility Analysis',
    description: 'Run pro formas, model scenarios, analyze returns, and make go/no-go decisions with confidence.',
    features: ['Scenario modeling', 'Pro forma generation', 'Sensitivity analysis', 'AI-powered insights'],
    color: '#2ABFBF',
  },
  {
    icon: Landmark,
    title: 'OS-Dev',
    subtitle: 'Development Finance',
    description: 'Capital stack management, draw tracking, investor reporting, and entitlement tracking.',
    features: ['Capital stack builder', 'Draw schedule management', 'Investor reports', 'Entitlement tracking'],
    color: '#E8793A',
  },
  {
    icon: Building2,
    title: 'OS-PM',
    subtitle: 'Project Management',
    description: 'Full construction oversight with scheduling, RFIs, inspections, change orders, and closeout.',
    features: ['Schedule management', 'RFI tracking', 'Inspection coordination', 'Change order workflows'],
    color: '#1A2B4A',
  },
  {
    icon: DollarSign,
    title: 'OS-Pay',
    subtitle: 'Payments & Escrow',
    description: 'Milestone-based payments, escrow accounts, reconciliation, and draw disbursement.',
    features: ['Escrow protection', 'Milestone payments', 'Lien waiver tracking', 'Reconciliation reports'],
    color: '#38A169',
  },
  {
    icon: Wrench,
    title: 'OS-Ops',
    subtitle: 'Operations',
    description: 'Post-construction turnover, warranty management, and maintenance work order tracking.',
    features: ['Turnover checklists', 'Warranty tracking', 'Maintenance schedules', 'Work order management'],
    color: '#2ABFBF',
  },
  {
    icon: Users,
    title: 'Marketplace',
    subtitle: 'Contractor Network',
    description: 'Vetted contractor marketplace with bidding, credential verification, and reputation scoring.',
    features: ['Licensed & insured pros', 'Automated bid matching', 'Reputation scoring', 'Capacity tracking'],
    color: '#E8793A',
  },
]

const KEABOTS = [
  { name: 'KeaBot Command', desc: 'Master orchestrator — routes queries to the right specialist bot', icon: Cpu },
  { name: 'KeaBot Owner', desc: 'Your personal project advisor for budgets, timelines, and decisions', icon: Eye },
  { name: 'KeaBot GC', desc: 'Contractor ops: bids, sub coordination, compliance, crew scheduling', icon: Hammer },
  { name: 'KeaBot Construction', desc: 'Execution tracking: progress, inspections, weather impact, daily logs', icon: Building2 },
  { name: 'KeaBot Land', desc: 'Parcel research, zoning lookups, development readiness analysis', icon: TreePine },
  { name: 'KeaBot Feasibility', desc: 'Scenario analysis, pro forma generation, market comparisons', icon: TrendingUp },
  { name: 'KeaBot Finance', desc: 'Capital stack optimization, draw management, HUD alignment', icon: DollarSign },
  { name: 'KeaBot Developer', desc: 'Portfolio analytics, investor reports, distribution waterfall', icon: Landmark },
  { name: 'KeaBot Permit', desc: 'Permit navigation, jurisdiction rules, document preparation', icon: FileText },
  { name: 'KeaBot Estimate', desc: 'AI cost estimation from plans with line-item breakdowns', icon: Zap },
  { name: 'KeaBot Payments', desc: 'Payment coordination, escrow monitoring, reconciliation', icon: Lock },
  { name: 'KeaBot Marketplace', desc: 'Contractor matchmaking, bid analysis, trade recommendations', icon: Users },
  { name: 'KeaBot Operations', desc: 'Warranty claims, maintenance scheduling, turnover tracking', icon: Wrench },
]

// Full 12-phase lifecycle from seed data
const LIFECYCLE_PHASES = [
  { number: 1, key: 'IDEA', title: 'Idea', description: 'Project conception and scope definition' },
  { number: 2, key: 'LAND', title: 'Land', description: 'Site ID, zoning analysis, due diligence' },
  { number: 3, key: 'FEASIBILITY', title: 'Feasibility', description: 'Pro forma, market analysis, go/no-go' },
  { number: 4, key: 'DESIGN', title: 'Design', description: 'Schematic → DD → construction docs' },
  { number: 5, key: 'PERMITS', title: 'Permits', description: 'Applications, plan review, approvals' },
  { number: 6, key: 'PRECON', title: 'Pre-Construction', description: 'Bidding, contracts, escrow, scheduling' },
  { number: 7, key: 'CONSTRUCTION', title: 'Construction', description: 'Milestones, daily logs, RFIs, COs' },
  { number: 8, key: 'INSPECTIONS', title: 'Inspections', description: 'Code inspections, QA, punch lists' },
  { number: 9, key: 'PAYMENTS', title: 'Payments', description: 'Escrow releases, draws, lien waivers' },
  { number: 10, key: 'CLOSEOUT', title: 'Closeout', description: 'Final inspection, CO, warranty handover' },
  { number: 11, key: 'OPERATIONS', title: 'Operations', description: 'Warranty tracking, maintenance, service' },
  { number: 12, key: 'ARCHIVE', title: 'Archive', description: 'Read-only twin, historical analytics' },
]

const TESTIMONIALS = [
  {
    name: 'Jennifer Adams',
    role: 'Homeowner, Bethesda MD',
    quote: 'Kealee gave me complete visibility into my kitchen remodel. I tracked every milestone and payment from my phone. The AI assistant answered my questions instantly.',
    rating: 5,
    project: 'Kitchen Remodel',
  },
  {
    name: 'Mike Rodriguez',
    role: 'GC, Summit Construction',
    quote: 'The lead pipeline and bid management tools have transformed how we find and win projects. The KeaBot GC handles our compliance tracking automatically.',
    rating: 5,
    project: 'Commercial Build-Out',
  },
  {
    name: 'Sarah Chen',
    role: 'Developer, Greenfield Capital',
    quote: 'Portfolio analytics, investor reporting, and feasibility modeling in one platform. The Digital Twin gives our investors real-time confidence in every project.',
    rating: 5,
    project: 'Multi-Family Development',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 lg:py-24" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium" style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}>
              <Layers className="h-4 w-4" /> Full Lifecycle Construction Platform
            </span>
          </motion.div>

          <motion.h1
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[56px] font-display"
          >
            From Land to Closeout —{' '}
            <span style={{ color: '#E8793A' }}>One Intelligent Platform</span>
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 lg:text-xl"
          >
            7 operating systems. 13 AI assistants. 12 lifecycle phases. Digital twins for every project.
            Kealee manages the entire development lifecycle — from first idea to long-term operations.
          </motion.p>

          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link href="/contact" className="btn-primary">
              Start Your Project <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/features" className="btn-outline-white">
              Explore the Platform
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400"
          >
            {['Licensed & Insured', 'Escrow Protected', 'AI-Powered', 'DC-Baltimore Corridor'].map((item, i) => (
              <span key={item} className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" style={{ color: '#2ABFBF' }} />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mb-2 text-3xl font-bold sm:text-4xl lg:text-5xl font-display" style={{ color: '#1A2B4A' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 lg:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DDTS Section */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label">Digital Development Twin System</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              Every Project Gets a Digital Twin
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              The DDTS creates a living digital representation of your project from day one.
              Real-time health scoring, automated KPI tracking, and event-driven intelligence across every phase.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Boxes, title: 'Live Project Twin', desc: 'L1/L2/L3 tiers adapt to project complexity — from kitchen remodels to multi-family developments.' },
              { icon: BarChart3, title: 'Health Scoring', desc: 'Real-time health metrics aggregate schedule, budget, quality, and risk into a single project health score.' },
              { icon: Brain, title: 'AI Event Intelligence', desc: 'Every action emits events. The twin learns patterns, predicts issues, and recommends optimizations.' },
              { icon: Eye, title: 'Point-in-Time Snapshots', desc: 'Capture and compare project state at any moment. Perfect for investor reports and audit trails.' },
              { icon: Layers, title: 'Module Orchestration', desc: 'The twin knows which OS modules are active and coordinates data flow between them.' },
              { icon: Globe, title: 'KPI Dashboard', desc: 'Custom thresholds and alerts for budget variance, schedule slippage, quality metrics, and more.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl bg-white p-6"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                  <item.icon className="h-6 w-6" style={{ color: '#2ABFBF' }} />
                </div>
                <h3 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 OS Modules */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label">Platform Operating Systems</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              7 Integrated Operating Systems
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Each OS owns its domain data, enforces business rules, and serves as the system of record.
              Together they cover the entire construction development lifecycle.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {OS_MODULES.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden rounded-xl bg-white"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
              >
                <div className="h-1" style={{ backgroundColor: mod.color }} />
                <div className="p-6">
                  <div className="mb-4 flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${mod.color}15` }}
                    >
                      <mod.icon className="h-6 w-6" style={{ color: mod.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>
                        {mod.title}
                      </h3>
                      <p className="text-sm text-gray-500">{mod.subtitle}</p>
                    </div>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-600">{mod.description}</p>
                  <ul className="space-y-2">
                    {mod.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: mod.color }} />
                        <span className="text-sm text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 12-Phase Lifecycle */}
      <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#2ABFBF' }}>
              Full Lifecycle
            </span>
            <h2 className="mt-3 text-3xl font-bold text-white font-display sm:text-4xl">
              12 Lifecycle Phases — Idea to Archive
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Every project moves through 12 defined phases. Kealee tracks, automates, and reports on each one with dedicated OS modules and AI assistants.
            </p>
          </div>

          {/* Desktop grid — 2 rows of 6 */}
          <div className="mt-16 hidden md:block">
            <div className="grid grid-cols-6 gap-4">
              {LIFECYCLE_PHASES.map((phase, i) => (
                <motion.div
                  key={phase.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="relative text-center"
                >
                  <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white font-display"
                    style={{ backgroundColor: i < 6 ? '#E8793A' : '#2ABFBF' }}
                  >
                    {phase.number}
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-white">{phase.title}</h4>
                  <p className="text-xs text-gray-400">{phase.description}</p>
                </motion.div>
              ))}
            </div>
            {/* Connector line */}
            <div className="mx-auto mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>Pre-Development</span>
              <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)', maxWidth: 200 }} />
              <span>Construction</span>
              <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)', maxWidth: 200 }} />
              <span>Post-Construction</span>
            </div>
          </div>

          {/* Mobile vertical steps */}
          <div className="mt-12 space-y-4 md:hidden">
            {LIFECYCLE_PHASES.map((phase, i) => (
              <motion.div
                key={phase.key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white font-display"
                    style={{ backgroundColor: i < 6 ? '#E8793A' : '#2ABFBF' }}
                  >
                    {phase.number}
                  </div>
                  {i < LIFECYCLE_PHASES.length - 1 && (
                    <div className="mt-1 flex-1" style={{ width: 2, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  )}
                </div>
                <div className="pb-3">
                  <h4 className="text-sm font-bold text-white">{phase.title}</h4>
                  <p className="text-xs text-gray-400">{phase.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Types */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label">Project Types</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              6 Project Types — Kitchen to High-Rise
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Each project type comes pre-configured with the right Digital Twin tier, OS modules, and KeaBot assistants.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECT_TYPES.map((pt, i) => (
              <motion.div
                key={pt.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(26,43,74,0.08)' }}>
                  <pt.icon className="h-5 w-5" style={{ color: '#1A2B4A' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{pt.name}</h4>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: pt.tier === 'L3' ? 'rgba(232,121,58,0.15)' : pt.tier === 'L2' ? 'rgba(42,191,191,0.15)' : 'rgba(56,161,105,0.15)',
                        color: pt.tier === 'L3' ? '#E8793A' : pt.tier === 'L2' ? '#2ABFBF' : '#38A169',
                      }}
                    >
                      Twin {pt.tier}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{pt.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Milestone Schedule */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="section-label">Milestone Payments</span>
              <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                7-Milestone Payment Schedule
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Every payment is tied to a construction milestone. Funds are held in escrow and only released when work is verified — protecting both owners and contractors.
              </p>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" style={{ color: '#2ABFBF' }} /> Escrow Protected
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4" style={{ color: '#38A169' }} /> Lien Waiver Required
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              {/* Visual payment bar */}
              <div className="mb-6 flex h-8 overflow-hidden rounded-lg">
                {PAYMENT_MILESTONES.map((m, i) => {
                  const colors = ['#1A2B4A', '#2ABFBF', '#E8793A', '#38A169', '#1A2B4A', '#2ABFBF', '#E8793A']
                  return (
                    <div
                      key={m.name}
                      className="flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${m.pct}%`, backgroundColor: colors[i] }}
                      title={`${m.name} — ${m.pct}%`}
                    >
                      {m.pct}%
                    </div>
                  )
                })}
              </div>
              <div className="space-y-3">
                {PAYMENT_MILESTONES.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#1A2B4A' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{m.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#E8793A' }}>{m.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13 KeaBots */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label">AI-Powered Automation</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              13 KeaBot AI Assistants
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Every domain has a dedicated AI assistant. KeaBots orchestrate tasks, answer questions, and automate workflows — powered by Claude AI.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {KEABOTS.map((bot, i) => (
              <motion.div
                key={bot.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-teal hover:shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                  <bot.icon className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{bot.name}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{bot.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">What People Are Saying</span>
            <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Trusted by Builders Across the Corridor
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-xl bg-white p-6"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
              >
                {/* Quote decoration */}
                <div className="absolute right-4 top-4 select-none text-6xl font-serif leading-none" style={{ color: 'rgba(42,191,191,0.1)' }}>
                  &ldquo;
                </div>

                {/* Rating */}
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4"
                      fill={j < t.rating ? '#E8793A' : 'transparent'}
                      stroke={j < t.rating ? '#E8793A' : '#CBD5E0'}
                    />
                  ))}
                </div>

                <blockquote className="relative z-10 mb-6 text-sm leading-relaxed text-gray-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: '#1A2B4A' }}
                  >
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                    <div className="mt-0.5 text-xs" style={{ color: '#2ABFBF' }}>{t.project}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Housing Act Alignment */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="section-label">Policy Alignment</span>
              <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                Built for the Affordable Housing Future
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Kealee's platform aligns with key Housing Act provisions to reduce regulatory barriers,
                speed approvals, and strengthen housing finance — from land acquisition through delivery.
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: '#E8793A' }}
              >
                Learn about our mission <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Reduce Barriers', desc: 'AI zoning analysis and pattern book compliance streamline regulatory review' },
                { title: 'Speed Approvals', desc: 'Automated permit tracking and digital submissions cut weeks from timelines' },
                { title: 'Strengthen Finance', desc: 'HUD eligibility checks, capital stack builder, and draw tracking' },
                { title: 'Local Capacity', desc: 'Municipal dashboards, apprenticeship tracking, and workforce analytics' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <h3 className="text-base font-bold" style={{ color: '#1A2B4A' }}>{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Split CTA */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 lg:p-12" style={{ backgroundColor: '#1A2B4A' }}>
          <h3 className="text-2xl font-bold text-white font-display lg:text-3xl">Project Owners</h3>
          <p className="mt-2 text-sm text-gray-300">
            Track your build, manage payments, and get AI-powered insights — all in one place.
          </p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: '#E8793A' }}>
            Start Your Project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="p-8 lg:p-12" style={{ backgroundColor: '#2ABFBF' }}>
          <h3 className="text-2xl font-bold text-white font-display lg:text-3xl">Contractors</h3>
          <p className="mt-2 text-sm text-white/80">
            Join the marketplace, manage bids, and grow your business with AI-powered tools.
          </p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-white px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10">
            Join the Network <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
