'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building2, Target, Heart, Zap, Shield, Globe, Users,
  ArrowRight, CheckCircle, Landmark, TreePine, TrendingUp,
  Scale, Home, Briefcase, GraduationCap
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
  { icon: Zap, title: 'Innovation', description: 'powered by AI tools tools, digital twins, and smart automation. We bring technology to an industry that needs it most.', color: '#38A169' },
  { icon: Building2, title: 'Quality', description: 'From vetted contractors to inspection management, we never compromise on the quality of what gets built.', color: '#1E293B' },
]

const TEAM = [
  { name: 'Engineering', role: 'Product & Engineering', bio: 'Full-stack team building the platform that construction deserves — from design studio integrations to real-time monitoring and escrow payments.', initials: 'ENG' },
  { name: 'Operations', role: 'Client Success', bio: 'Dedicated project managers and client advisors with deep construction experience, ensuring every project succeeds on the platform.', initials: 'OPS' },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span
            {...fadeInUp}
            className="text-xs font-bold uppercase tracking-[0.15em]"
            style={{ color: '#2ABFBF' }}
          >
            About Kealee
          </motion.span>
          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-4xl font-black font-display sm:text-5xl text-slate-900 tracking-tight"
          >
            Building the Future of Construction
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed"
          >
            Kealee was founded on a simple idea: construction project coordination should be transparent,
            efficient, and accessible to every project owner — from design concept to final build.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div {...fadeInUp}>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">Our Story</span>
              <h2 className="mt-3 text-3xl font-bold font-display text-slate-900">
                Built by Builders, for Project Owners
              </h2>
              <div className="mt-6 space-y-4 text-slate-600 leading-relaxed text-sm">
                <p>
                  Construction is a $1.4 trillion industry in the US alone, yet it remains one of the least
                  digitized sectors in the economy. Project owners struggle with opaque processes, contractors
                  manage bids on legacy spreadsheets, and budgets often run out of control.
                </p>
                <p>
                  With 25 years of combined experience in construction management and real estate development,
                  our founding team experienced these problems firsthand. Kealee was born from the conviction
                  that interactive design tools, validated cost estimates, permit filing, and real-time project
                  workspaces could transform construction for project owners — homeowners, developers, and
                  commercial owners alike.
                </p>
                <p>
                  Today, Kealee guides project owners through their build projects with 4 integrated lifecycle
                  stages and 2 dedicated portals. We coordinate design concepts, RSMeans cost planning, and permit
                  filing before contractor bidding, eliminating surprises and ensuring projects break ground with
                  certainty.
                </p>
              </div>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.2 }}>
              {/* Stats box */}
              <div className="rounded-2xl p-8 border border-slate-200" style={{ backgroundColor: '#F8FAFC' }}>
                <h3 className="mb-6 text-lg font-bold font-display text-slate-900">Platform by the Numbers</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: '4', label: 'Lifecycle Phases' },
                    { value: '4', label: 'Core Services' },
                    { value: '2', label: 'Dedicated Portals' },
                    { value: '100%', label: ' DMV Coverage' },
                    { value: '25+', label: 'Years Experience' },
                    { value: '0', label: 'Opaque Fees' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-black font-display text-orange-600">{stat.value}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 border-t border-b border-slate-200" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">Our Values</span>
            <h2 className="mt-3 text-3xl font-bold font-display text-slate-900">
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
                <h3 className="text-lg font-bold font-display text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed px-2">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">The Team</span>
            <h2 className="mt-3 text-3xl font-bold font-display text-slate-900">
              Behind Kealee
            </h2>
          </div>

          <div className="mt-16 max-w-3xl mx-auto grid gap-8 sm:grid-cols-2">
            {TEAM.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm"
              >
                <div
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-inner"
                  style={{ backgroundColor: '#1E293B' }}
                >
                  {t.initials}
                </div>
                <h3 className="text-lg font-bold font-display text-slate-900">{t.name}</h3>
                <p className="text-sm font-semibold" style={{ color: '#E8793A' }}>{t.role}</p>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">{t.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black font-display text-slate-900 tracking-tight">
            Build With Absolute Certainty
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Let Kealee coordinate your design concepts, cost estimates, and permit packages so you can build with confidence.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link 
              href="/concept" 
              className="w-full sm:w-auto rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 text-sm transition-all hover:shadow-md text-center"
            >
              Start Design Concept
            </Link>
            <Link 
              href="/features" 
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-8 text-sm transition-all text-center"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
