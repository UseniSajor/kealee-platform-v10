import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Clock, Briefcase, Zap, Shield, Globe, Users, TrendingUp, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers at Kealee — Build the Future of Construction',
  description:
    'Join the team building the full-lifecycle construction platform. Open roles across engineering, AI, operations, permit services, design, and business development.',
}

// ── Open roles ────────────────────────────────────────────────────────────────
const OPEN_ROLES = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    badge: 'Hiring Now',
  },
  {
    title: 'AI / ML Engineer',
    team: 'AI Platform',
    location: 'Remote (US)',
    type: 'Full-time',
    badge: 'Hiring Now',
  },
  {
    title: 'Construction Project Manager',
    team: 'Operations',
    location: 'Washington, DC',
    type: 'Full-time',
    badge: 'Hiring Now',
  },
  {
    title: 'Senior Project Manager',
    team: 'Operations',
    location: 'DC / MD / VA',
    type: 'Full-time',
    badge: null,
  },
  {
    title: 'Construction Superintendent',
    team: 'Field Operations',
    location: 'DC / MD / VA',
    type: 'Full-time',
    badge: 'Hiring Now',
  },
  {
    title: 'Construction Estimator',
    team: 'Estimation',
    location: 'Remote (US) or DC Metro',
    type: 'Full-time',
    badge: 'Hiring Now',
  },
  {
    title: 'Senior Estimator',
    team: 'Estimation',
    location: 'Remote (US) or DC Metro',
    type: 'Full-time',
    badge: null,
  },
  {
    title: 'Product Specialist',
    team: 'Product',
    location: 'Remote (US)',
    type: 'Full-time',
    badge: 'Hiring Now',
  },
  {
    title: 'Product Designer',
    team: 'Product',
    location: 'Remote (US)',
    type: 'Full-time',
    badge: null,
  },
  {
    title: 'Permit Coordinator',
    team: 'Permit Services',
    location: 'DC / MD / VA',
    type: 'Full-time',
    badge: null,
  },
  {
    title: 'Business Development Manager',
    team: 'Growth',
    location: 'Washington, DC',
    type: 'Full-time',
    badge: null,
  },
  {
    title: 'Licensed Architect (Project Review)',
    team: 'Design Services',
    location: 'Remote (licensed DC/MD/VA)',
    type: 'Contract / Part-time',
    badge: null,
  },
  {
    title: 'Feasibility Analyst',
    team: 'Developer Services',
    location: 'Remote (US)',
    type: 'Full-time',
    badge: null,
  },
]

// ── Benefits ──────────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Equity from day one',
    body: 'Every full-time employee receives meaningful equity. You\'re building this company — you should own a piece of it.',
  },
  {
    icon: Globe,
    title: 'Remote-first culture',
    body: 'Most roles are fully remote across the US. We have a physical presence in the DC metro for field and operational work.',
  },
  {
    icon: Heart,
    title: 'Health, dental & vision',
    body: 'Comprehensive health coverage for you and your family. We pay 100% of the employee premium.',
  },
  {
    icon: Zap,
    title: 'Learning & development',
    body: '$2,500/year stipend for courses, certifications, conferences, and books. We want you to grow.',
  },
  {
    icon: Shield,
    title: '401(k) with match',
    body: 'Company-matched 401(k) to help you build long-term financial security.',
  },
  {
    icon: Users,
    title: 'Flexible time off',
    body: 'Unlimited PTO with a minimum two-week expectation. We trust you to do great work and rest when you need to.',
  },
]

// ── Values ────────────────────────────────────────────────────────────────────
const VALUES = [
  {
    title: 'Build what matters',
    body: 'Every line of code and every project we touch affects real homes, buildings, and communities. We take that seriously.',
  },
  {
    title: 'Ownership mentality',
    body: 'We move fast, own outcomes, and hold ourselves accountable at every stage. No hand-offs without follow-through.',
  },
  {
    title: 'Deep domain depth',
    body: 'We combine construction expertise with technology talent to solve problems pure-software shops cannot reach.',
  },
  {
    title: 'Transparent & direct',
    body: 'No politics. We say what we mean, share context freely, and respect each other\'s time and intelligence.',
  },
  {
    title: 'Long game thinking',
    body: 'Construction is a $2T industry with a decades-long transformation ahead. We\'re building infrastructure, not features.',
  },
  {
    title: 'Inclusive by default',
    body: 'The built environment serves everyone. Our team should reflect that. We actively recruit across backgrounds and experience levels.',
  },
]

// ── Teams ─────────────────────────────────────────────────────────────────────
const TEAMS = [
  {
    name: 'Engineering',
    description: 'TypeScript, Next.js, Fastify, Prisma, PostgreSQL, BullMQ, Docker, Railway. We build full-stack — from AI inference pipelines to real-time project dashboards.',
  },
  {
    name: 'AI Platform',
    description: 'KeaBots, Claude API, multi-turn tool-use agents, Digital Development Twin System (DDTS). We\'re building AI that understands the construction lifecycle, not just text.',
  },
  {
    name: 'Operations & Field',
    description: 'Project managers, superintendents, permit coordinators, and estimators. The engine that delivers the platform to real projects on real job sites.',
  },
  {
    name: 'Design & Product',
    description: 'UX, service design, visual design, and product strategy across 18 apps and 13 AI bots. Complex surfaces, high-stakes decisions, real users.',
  },
  {
    name: 'Growth & BD',
    description: 'Partnerships, enterprise sales, marketplace expansion, and developer/contractor acquisition across the DC-Baltimore corridor and beyond.',
  },
]

export default function CareersPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#F7FAFC] to-white py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#FFF3EC', color: '#E8793A' }}
          >
            We&apos;re Hiring
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: '#1A2B4A' }}>
            Build the future of<br />construction with us
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Kealee is the full-lifecycle construction platform — land acquisition to project
            closeout. Fourteen operating systems, thirteen AI assistants, and digital twins for
            every project. We&apos;re hiring builders, engineers, architects, and operators who
            want to reshape how the built environment works.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#open-roles"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              View Open Roles <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="mailto:careers@kealee.com"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
            >
              Send a general application
            </a>
          </div>
          {/* Quick stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-10 text-center">
            {[
              { value: '18', label: 'Products' },
              { value: '13', label: 'AI Assistants' },
              { value: 'DC · MD · VA', label: 'Primary Market' },
              { value: 'Series A', label: 'Stage' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{s.value}</p>
                <p className="mt-0.5 text-xs text-gray-400 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teams ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Our teams</h2>
          <p className="mb-8 text-sm text-gray-500 max-w-xl">
            We&apos;re organized around the disciplines that make Kealee work — technical, operational, and commercial.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAMS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
              >
                <p className="font-semibold" style={{ color: '#1A2B4A' }}>{t.name}</p>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold" style={{ color: '#1A2B4A' }}>How we work</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{v.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-16" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Benefits & perks</h2>
          <p className="mb-8 text-sm text-gray-500">We take care of the team that builds this platform.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex gap-4 rounded-2xl bg-white border border-gray-100 p-5">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#FFF3EC' }}
                >
                  <b.icon className="h-4 w-4" style={{ color: '#E8793A' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>{b.title}</p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open roles ────────────────────────────────────────────────────── */}
      <section id="open-roles" className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Open roles</h2>
          <p className="mb-8 text-sm text-gray-500">
            {OPEN_ROLES.length} positions currently open. Most roles are remote-friendly.
          </p>

          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {OPEN_ROLES.map((role) => (
              <a
                key={role.title}
                href={`mailto:careers@kealee.com?subject=Application: ${encodeURIComponent(role.title)}`}
                className="group flex flex-col gap-2 px-6 py-5 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className="font-semibold transition-colors group-hover:text-[#E8793A]"
                      style={{ color: '#1A2B4A' }}
                    >
                      {role.title}
                    </p>
                    {role.badge && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: '#FFF3EC', color: '#E8793A' }}
                      >
                        {role.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {role.team}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {role.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {role.type}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-400 group-hover:text-[#E8793A] transition-colors">
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </a>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="font-semibold" style={{ color: '#1A2B4A' }}>Don&apos;t see your role?</p>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;re always looking for exceptional people. Send us your resume and tell us how you&apos;d contribute.
            </p>
            <a
              href="mailto:careers@kealee.com"
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              careers@kealee.com <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
