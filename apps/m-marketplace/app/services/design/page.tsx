'use client'

import { useState } from 'react'
import Link from 'next/link'
import './design.css'

const phases = [
  { id: 'design', label: 'Design' },
  { id: 'estimate', label: 'Estimate' },
  { id: 'permit', label: 'Permit' },
  { id: 'build', label: 'Build' },
  { id: 'closeout', label: 'Closeout' },
]

const phaseLinks: Record<string, string> = {
  design: '/services/design',
  estimate: '/services/estimation',
  permit: '/services/permits',
  build: '/services/ops',
  closeout: '/services/finance',
}

const workflowSteps = [
  {
    num: 1,
    circle: 'ai',
    tag: 'AI Generation',
    tagClass: 'tag-ai',
    title: 'Tell Us About Your Project',
    desc: 'Submit your property address, project type, square footage, budget, and style preferences. Our intake takes 5 minutes.',
    chips: ['Property Details', 'Project Type', 'Budget Range', 'Style Preferences'],
  },
  {
    num: 2,
    circle: 'ai',
    tag: 'AI Concept Engine',
    tagClass: 'tag-ai',
    title: 'AI Generates Your Concept Drawings',
    desc: 'Our AI — trained on 500,000+ construction drawings and local jurisdiction requirements — generates floor plan concepts, spatial layouts, and multiple variations within 48 hours.',
    chips: ['Floor Plan Concepts', 'Multiple Layouts', 'Spatial Analysis', '48-Hour Delivery'],
  },
  {
    num: 3,
    circle: 'arch',
    tag: 'Architect Review',
    tagClass: 'tag-arch',
    title: 'A Licensed Architect Reviews Every Drawing',
    desc: 'Every AI-generated concept is reviewed, refined, and approved by a licensed architect before you receive it. No exceptions, no shortcuts.',
    chips: ['Code Compliance Check', 'Design Refinements', 'Quality Assurance', 'Architect Approval'],
  },
  {
    num: 4,
    circle: '',
    tag: 'Project Owner',
    tagClass: 'tag-owner',
    title: 'You Review, Approve, or Request Changes',
    desc: 'Log into your Owner Dashboard to review concepts side by side. Leave feedback, request revisions, or approve the direction.',
    chips: ['Owner Dashboard', 'Side-by-Side Comparison', 'Revision Requests', 'Design Approval'],
  },
  {
    num: 5,
    circle: 'arch',
    tag: 'Architecture',
    tagClass: 'tag-arch',
    title: 'Upgrade to Full Architectural Drawing Set',
    desc: 'Once your concept is approved, upgrade to a full architectural package — permit-ready drawings, structural plans, MEP coordination, 4\u20138 weeks, 30% faster than traditional firms.',
    chips: ['Permit-Ready Drawings', 'Structural Plans', 'MEP Coordination', '4\u20138 Week Timeline'],
  },
  {
    num: 6,
    circle: 'arch',
    tag: 'Seamless Handoff',
    tagClass: 'tag-arch',
    title: 'Designs Flow Into Permits Automatically',
    desc: 'Approved drawings automatically populate your permit applications in the Kealee Permits module. No re-uploading, no re-entering data.',
    chips: ['Auto-Populated Permits', 'No Data Re-Entry', 'Connected to Estimate & Build'],
  },
]

const aiPackages = [
  {
    tier: 'STARTER',
    name: 'Concept Starter',
    price: '$99',
    priceNote: 'One-time \u00b7 48-hr delivery',
    featured: false,
    features: [
      '2 floor plan concept variations',
      'Basic spatial layout analysis',
      'Architect-reviewed output',
      '1 revision round',
      'PDF delivery',
      'Money-back guarantee',
    ],
  },
  {
    tier: 'STANDARD',
    name: 'Concept Standard',
    price: '$299',
    priceNote: 'One-time \u00b7 48-hr delivery',
    featured: false,
    features: [
      '4 floor plan concept variations',
      'Site analysis & zoning review',
      'Architect-reviewed output',
      '2 revision rounds',
      '3D massing concept',
      'Money-back guarantee',
    ],
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Concept Pro',
    price: '$599',
    priceNote: 'One-time \u00b7 48-hr delivery',
    featured: true,
    badge: 'MOST POPULAR',
    features: [
      '6 concept variations',
      'Full site & zoning analysis',
      'Architect-reviewed & annotated',
      '3 revision rounds',
      '3D concepts + exterior views',
      'Preliminary cost estimate',
      'Money-back guarantee',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Concept Enterprise',
    price: '$899',
    priceNote: 'One-time \u00b7 48-hr delivery',
    featured: false,
    features: [
      'Unlimited concept variations',
      'Multi-phase site analysis',
      'Senior architect lead review',
      'Unlimited revisions (30 days)',
      'Full 3D rendering package',
      'Detailed cost estimate',
      'Dedicated project coordinator',
    ],
  },
]

const archPackages = [
  {
    tier: 'PACKAGE A',
    name: 'Essential Plans',
    sub: 'Residential additions & projects under 1,500 sqft',
    price: '$2,500',
    priceNote: 'starting at',
    timeline: '4\u20135 Weeks',
    timelineCompare: 'vs. 8\u201310 weeks traditional',
    featured: false,
    features: [
      'Floor plans & elevations',
      'Site plan',
      'Permit-ready drawings',
      '2 revision rounds',
      'Architect\u2019s stamp',
      'Digital delivery',
    ],
  },
  {
    tier: 'PACKAGE B',
    name: 'Full Residential',
    sub: 'New homes, ADUs & major additions up to 3,000 sqft',
    price: '$7,500',
    priceNote: 'starting at',
    timeline: '5\u20136 Weeks',
    timelineCompare: 'vs. 10\u201314 weeks traditional',
    featured: true,
    badge: 'MOST REQUESTED',
    features: [
      'Full drawing set',
      'Structural coordination',
      'MEP rough-in plans',
      'Energy compliance docs',
      '3 revision rounds + 3D views',
      'Architect\u2019s stamp',
      'Permit submission support',
      'Dedicated project architect',
    ],
  },
  {
    tier: 'PACKAGE C',
    name: 'Commercial Light',
    sub: 'Tenant improvements, retail build-outs, office spaces',
    price: '$18,000',
    priceNote: 'starting at',
    timeline: '6\u20138 Weeks',
    timelineCompare: 'vs. 12\u201318 weeks traditional',
    featured: false,
    features: [
      'Commercial drawing set',
      'Structural & MEP full plans',
      'ADA compliance review',
      'Fire & life safety plans',
      'Unlimited revisions',
      'Permit & inspection support',
    ],
  },
  {
    tier: 'PACKAGE D',
    name: 'Full Commercial',
    sub: 'Ground-up commercial, mixed-use & complex projects',
    price: '$35,000',
    priceNote: 'starting at',
    timeline: '8\u201312 Weeks',
    timelineCompare: 'vs. 18\u201326 weeks traditional',
    featured: false,
    features: [
      'Full commercial drawing set',
      'All engineering coordination',
      'BIM model included',
      'Dedicated lead architect',
      '3D renderings included',
      'Full permit management',
    ],
  },
]

const ownerCards = [
  {
    icon: '\ud83d\udcf1',
    title: 'Real-Time Dashboard',
    desc: 'Track every drawing, revision, and approval from your phone or desktop. No email chains.',
  },
  {
    icon: '\ud83d\udd12',
    title: 'Escrow-Protected Payments',
    desc: 'Your funds are held in escrow and released only when you approve each milestone.',
  },
  {
    icon: '\ud83e\udd16',
    title: 'AI-Powered Speed',
    desc: '48-hour concept delivery. Full architecture 30% faster than traditional firms.',
  },
  {
    icon: '\ud83c\udfe0',
    title: 'Licensed & Insured',
    desc: 'Every architect on our network is licensed, insured, and vetted by our team.',
  },
  {
    icon: '\ud83d\udce6',
    title: 'Seamless Handoff',
    desc: 'Approved designs auto-populate your permit applications and cost estimates.',
  },
  {
    icon: '\ud83d\udcb0',
    title: 'Money-Back Guarantee',
    desc: 'Not satisfied with your AI concept? Full refund, no questions asked.',
  },
]

export default function DesignPage() {
  const [activePkgTab, setActivePkgTab] = useState<'ai' | 'arch'>('ai')

  return (
    <div>
      {/* ── PHASE TABS ── */}
      <nav className="phase-bar">
        {phases.map((p) => (
          <Link
            key={p.id}
            href={phaseLinks[p.id]}
            className={`phase-tab ${p.id === 'design' ? 'active' : ''}`}
          >
            <span className="phase-dot" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* ── HERO ── */}
      <section className="design-hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          AI-POWERED &middot; LICENSED ARCHITECT REVIEW
        </div>
        <div className="hero-layout">
          <div>
            <h1>
              Your Project Starts<br />
              with the Right <em>Design</em>
            </h1>
            <p className="hero-sub">
              From a rough idea to stamped architectural drawings &mdash; Kealee&apos;s AI generates
              concepts in 48 hours, and our licensed architects certify every drawing before it
              leaves our hands.
            </p>
            <div className="hero-actions">
              <Link href="/get-started" className="btn-gold">
                Start with AI Concept &mdash; $99
              </Link>
              <button
                className="btn-outline-white"
                onClick={() => setActivePkgTab('arch')}
              >
                View Architecture Packages
              </button>
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-grid">
              <div className="hero-stat">
                <div className="hero-stat-num">48h</div>
                <div className="hero-stat-label">Concept delivery with money-back guarantee</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-num">30%</div>
                <div className="hero-stat-label">Faster than traditional design firms</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-num">500K+</div>
                <div className="hero-stat-label">Drawings in our AI training database</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-num">94%</div>
                <div className="hero-stat-label">First-submission accuracy rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="dg-section" style={{ background: 'var(--cream)' }}>
        <div className="section-label">How It Works</div>
        <h2 className="section-title">
          Your Design Journey,<br />Step by Step
        </h2>
        <p className="section-sub">
          From your first idea to permit-ready drawings &mdash; here&apos;s exactly how Kealee
          moves your project forward.
        </p>

        <div className="workflow">
          {workflowSteps.map((step) => (
            <div className="workflow-step" key={step.num}>
              <div className="workflow-num">
                <div className={`step-circle ${step.circle}`}>{step.num}</div>
              </div>
              <div className="workflow-content">
                <div className={`workflow-phase-tag ${step.tagClass}`}>{step.tag}</div>
                <div className="workflow-title">{step.title}</div>
                <div className="workflow-desc">{step.desc}</div>
                <div className="workflow-chips">
                  {step.chips.map((c) => (
                    <span className="chip" key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="trust-icon">{'\u26a1'}</div>
          <div className="trust-title">AI Does the Heavy Lifting</div>
          <div className="trust-desc">
            Our AI analyzes your requirements, local zoning, and 500,000+ comparable drawings to
            generate accurate, jurisdiction-aware concepts faster than any manual process.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="trust-icon">{'\ud83c\udfdb'}</div>
          <div className="trust-title">Licensed Architects Make the Call</div>
          <div className="trust-desc">
            Every drawing is reviewed and approved by a licensed architect before delivery. AI
            accelerates the process &mdash; architects ensure it&apos;s right. No exceptions.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="trust-icon">{'\ud83d\udd11'}</div>
          <div className="trust-title">You Approve Every Step</div>
          <div className="trust-desc">
            Your dashboard gives you real-time visibility into every drawing and revision. You
            approve the design before it moves to permits.
          </div>
        </div>
      </div>

      {/* ── PACKAGES ── */}
      <section className="packages-bg">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Choose Your Design Path</h2>
        <p className="section-sub">
          Start with an AI concept to validate your vision, then upgrade to full architectural
          services when you&apos;re ready to build.
        </p>

        <div className="packages-tabs">
          <button
            className={`pkg-tab ${activePkgTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActivePkgTab('ai')}
          >
            AI Concept Generation
          </button>
          <button
            className={`pkg-tab ${activePkgTab === 'arch' ? 'active' : ''}`}
            onClick={() => setActivePkgTab('arch')}
          >
            Architecture Packages
          </button>
        </div>

        {/* AI Concept Packages */}
        {activePkgTab === 'ai' && (
          <div className="pkg-grid">
            {aiPackages.map((pkg) => (
              <div className={`pkg-card ${pkg.featured ? 'featured' : ''}`} key={pkg.tier}>
                {pkg.badge && <div className="pkg-badge">{pkg.badge}</div>}
                <div className="pkg-tier">{pkg.tier}</div>
                <div className="pkg-name">{pkg.name}</div>
                <div className="pkg-price">{pkg.price}</div>
                <div className="pkg-price-note">{pkg.priceNote}</div>
                <div className="pkg-divider" />
                <ul className="pkg-features">
                  {pkg.features.map((f) => (
                    <li key={f}>
                      <span className="pkg-check">{'\u2713'}</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/get-started"
                  className={`btn-pkg ${pkg.featured ? 'btn-pkg-gold' : 'btn-pkg-outline'}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Architecture Packages */}
        {activePkgTab === 'arch' && (
          <div className="arch-grid">
            {archPackages.map((pkg) => (
              <div className={`arch-card ${pkg.featured ? 'featured' : ''}`} key={pkg.tier}>
                <div className="arch-card-header">
                  {pkg.badge && <div className="arch-card-badge">{pkg.badge}</div>}
                  <div className="arch-tier">{pkg.tier}</div>
                  <div className="arch-name">{pkg.name}</div>
                  <div className="arch-sub">{pkg.sub}</div>
                  <div className="arch-price-row">
                    <span className="arch-price">{pkg.price}</span>
                    <span className="arch-price-note">{pkg.priceNote}</span>
                  </div>
                </div>
                <div className="arch-card-body">
                  <div className="arch-timeline">
                    {'\u23f1'}&ensp;<strong>{pkg.timeline}</strong>&ensp;{pkg.timelineCompare}
                  </div>
                  <ul className="arch-features">
                    {pkg.features.map((f) => (
                      <li key={f}>
                        <span className="arch-check">{'\u2713'}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/get-started" className="btn-arch">
                    Start {pkg.tier}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PROFESSIONAL REVIEW ── */}
      <section className="review-section">
        <div className="review-grid">
          <div>
            <div className="section-label">Quality Assurance</div>
            <h2 className="section-title">
              Every Drawing Is<br />Professionally Reviewed
            </h2>
            <p className="section-sub" style={{ marginBottom: 32 }}>
              AI generates the concepts. A licensed architect reviews, refines, and approves every
              drawing before it reaches you. This is the Kealee standard &mdash; no exceptions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cred-chip">
                <span className="cred-dot" /> Licensed in DC, MD & VA
              </div>
              <div className="cred-chip">
                <span className="cred-dot" /> E&O Insurance Required
              </div>
              <div className="cred-chip">
                <span className="cred-dot" /> 10+ Years Experience Average
              </div>
            </div>
          </div>
          <div className="review-visual">
            <div className="review-flow-step">
              <div className="review-flow-icon icon-ai">{'\ud83e\udd16'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4, fontSize: 15 }}>
                  AI Generates Concepts
                </div>
                <div style={{ fontSize: 13, color: 'var(--dg-gray-500)', lineHeight: 1.5 }}>
                  Trained on 500K+ construction drawings, our AI produces floor plans, elevations,
                  and spatial layouts in under 48 hours.
                </div>
              </div>
            </div>
            <div className="review-flow-step">
              <div className="review-flow-icon icon-stamp">{'\ud83c\udfe0'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4, fontSize: 15 }}>
                  Architect Reviews & Refines
                </div>
                <div style={{ fontSize: 13, color: 'var(--dg-gray-500)', lineHeight: 1.5 }}>
                  A licensed architect checks code compliance, refines spatial relationships, and
                  annotates the drawings with professional notes.
                </div>
              </div>
            </div>
            <div className="review-flow-step">
              <div className="review-flow-icon icon-owner">{'\u2705'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4, fontSize: 15 }}>
                  You Receive & Approve
                </div>
                <div style={{ fontSize: 13, color: 'var(--dg-gray-500)', lineHeight: 1.5 }}>
                  Review concepts in your dashboard, request changes, or approve the direction.
                  Your call, every time.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OWNER EXPERIENCE ── */}
      <section className="dg-section">
        <div className="section-label">The Owner Experience</div>
        <h2 className="section-title">
          Built for Project Owners<br />Who Expect More
        </h2>
        <p className="section-sub">
          Kealee isn&apos;t just a design service &mdash; it&apos;s a platform that gives you
          visibility, control, and confidence at every step.
        </p>
        <div className="owner-grid">
          {ownerCards.map((card) => (
            <div className="owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--dg-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to See What Your<br />
            <span style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>
              Project Could Look Like?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Start with a $99 AI concept. 48-hour delivery. Money-back if you&apos;re not satisfied.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/get-started" className="btn-gold">
              Get My AI Concept &mdash; From $99
            </Link>
            <Link href="/contact" className="btn-outline-white">
              Talk to an Architect
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            All concepts reviewed and approved by a licensed architect before delivery.
          </p>
        </div>
      </section>
    </div>
  )
}
