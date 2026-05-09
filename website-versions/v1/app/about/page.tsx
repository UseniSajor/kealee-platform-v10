'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building2, Target, Heart, Zap, Shield, Globe, Users,
  ArrowRight, CheckCircle, Landmark, TreePine, TrendingUp,
  Scale, Home, Briefcase, GraduationCap,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

const VALUES = [
  { icon: Target, title: 'Transparency', description: 'Every dollar tracked, every milestone visible. Project owners deserve full visibility into their investment.', color: '#2ABFBF' },
  { icon: Heart, title: 'Trust', description: 'Escrow-protected payments, verified contractors, and honest communication. Trust is the foundation of great construction.', color: '#E8793A' },
  { icon: Zap, title: 'Innovation', description: 'AI-powered tools, digital twins, and smart automation. We bring technology to an industry that needs it most.', color: '#38A169' },
  { icon: Building2, title: 'Quality', description: 'From vetted contractors to inspection management, we never compromise on the quality of what gets built.', color: '#1A2B4A' },
]

const TEAM = [
  { name: 'Tim Chamberlain', role: 'Founder & CEO', bio: 'Construction industry veteran with 15+ years in project management, real estate development, and technology. Built Kealee to solve the problems he experienced firsthand.', initials: 'TC' },
  { name: 'Engineering', role: 'Product & Engineering', bio: 'Full-stack team building the platform that construction deserves — from AI assistants and digital twins to real-time monitoring and escrow payments.', initials: 'ENG' },
  { name: 'Operations', role: 'Client Success', bio: 'Dedicated project managers and client advisors with deep construction experience, ensuring every project succeeds on the platform.', initials: 'OPS' },
]

const HOUSING_ACT_PROVISIONS = [
  {
    icon: Scale,
    title: 'Reduce Regulatory Barriers',
    subtitle: 'Sec. 201-203',
    description: 'AI zoning analysis identifies permitted uses, density allowances, and code requirements automatically. Pattern book compliance checks reduce review cycles.',
    kealeeFeature: 'OS-Land AI zoning + OS-PM compliance engine',
  },
  {
    icon: Zap,
    title: 'Speed Housing Approvals',
    subtitle: 'Sec. 204-206',
    description: 'Automated permit tracking, digital submission workflows, and jurisdiction-specific checklists cut weeks from the approval timeline.',
    kealeeFeature: 'OS-PM permits + KeaBot Permit navigation',
  },
  {
    icon: Home,
    title: 'Reusable Design Workflows',
    subtitle: 'Sec. 207',
    description: 'Pattern book library with pre-approved plans enables rapid iteration. Design templates reduce architectural costs for affordable housing.',
    kealeeFeature: 'Existing design library + OS-Land integration',
  },
  {
    icon: Landmark,
    title: 'Stronger Housing Finance',
    subtitle: 'Sec. 208-209',
    description: 'HUD eligibility assessment, capital stack builder, draw tracking, and investor reporting aligned with affordable housing program requirements.',
    kealeeFeature: 'OS-Dev + OS-Feas + KeaBot Finance',
  },
  {
    icon: GraduationCap,
    title: 'Local Capacity Building',
    subtitle: 'Sec. 210',
    description: 'Municipal housing dashboards, workforce analytics, and apprenticeship tracking support local capacity development goals.',
    kealeeFeature: 'Analytics + Command Center',
  },
  {
    icon: TrendingUp,
    title: 'Land to Delivery Pipeline',
    subtitle: 'Sec. 211',
    description: 'Complete lifecycle from parcel acquisition through construction to operations. DDTS tracks every project from concept to certificate of occupancy.',
    kealeeFeature: 'Full DDTS lifecycle (all 7 OS modules)',
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span
            {...fadeInUp}
            className="text-[13px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: '#2ABFBF' }}
          >
            About Kealee
          </motion.span>
          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-4xl font-bold text-white font-display sm:text-5xl"
          >
            Building the Future of Construction
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-300"
          >
            Kealee was founded on a simple idea: construction project management should be transparent,
            efficient, and accessible to everyone — from homeowners to institutional developers.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div {...fadeInUp}>
              <span className="section-label">Our Story</span>
              <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                Built by Builders, for Builders
              </h2>
              <div className="mt-6 space-y-4 text-gray-600">
                <p>
                  Construction is a $1.4 trillion industry in the US alone, yet it remains one of the least
                  digitized sectors in the economy. Project owners struggle with opaque processes, contractors
                  manage bids on spreadsheets, and developers lack portfolio-level analytics.
                </p>
                <p>
                  After 15 years in construction management and real estate development, Tim Chamberlain
                  experienced these problems firsthand. Kealee was born from the conviction that AI-powered
                  tools, escrow-protected payments, and real-time digital twins could transform construction
                  for everyone.
                </p>
                <p>
                  Today, Kealee serves the DC-Baltimore corridor and beyond with 7 integrated operating systems,
                  13 AI assistants, and dedicated portals for every role in construction — from the homeowner
                  renovating a kitchen to the developer managing a $50M multi-family project.
                </p>
              </div>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.2 }}>
              {/* Stats box */}
              <div className="rounded-xl p-8" style={{ backgroundColor: '#F7FAFC' }}>
                <h3 className="mb-6 text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Platform by the Numbers</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: '7', label: 'Operating Systems' },
                    { value: '13', label: 'AI Assistants' },
                    { value: '364+', label: 'Data Models' },
                    { value: '7', label: 'User Roles' },
                    { value: '6', label: 'Project Types' },
                    { value: '12', label: 'Lifecycle Phases' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold font-display" style={{ color: '#E8793A' }}>{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Our Values</span>
            <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              What Drives Us
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${v.color}15` }}
                >
                  <v.icon className="h-7 w-7" style={{ color: v.color }} />
                </div>
                <h3 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>{v.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">The Team</span>
            <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Behind Kealee
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {TEAM.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl bg-white p-6 text-center"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
              >
                <div
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  {t.initials}
                </div>
                <h3 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>{t.name}</h3>
                <p className="text-sm" style={{ color: '#E8793A' }}>{t.role}</p>
                <p className="mt-3 text-sm text-gray-600">{t.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Housing Act Alignment */}
      <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#2ABFBF' }}>
              Policy Alignment
            </span>
            <h2 className="mt-3 text-3xl font-bold text-white font-display sm:text-4xl">
              Built for the Affordable Housing Future
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Kealee&apos;s platform aligns with key Housing Act provisions, providing the digital infrastructure
              needed to reduce barriers, speed approvals, and strengthen housing finance.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOUSING_ACT_PROVISIONS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl p-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(42,191,191,0.15)' }}>
                    <item.icon className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                  </div>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-gray-300">{item.description}</p>
                <div className="flex items-start gap-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#2ABFBF' }} />
                  <span className="text-xs" style={{ color: '#2ABFBF' }}>{item.kealeeFeature}</span>
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
            Join the Construction Revolution
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Whether you are building a home, managing a portfolio, or growing a contracting business — Kealee has the tools you need.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="btn-primary">
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/features" className="btn-outline-navy">
              Explore the Platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
