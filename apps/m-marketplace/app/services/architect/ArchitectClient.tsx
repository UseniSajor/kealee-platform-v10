'use client'

import Link from 'next/link'
import './architect.css'

const services = [
  {
    icon: '\ud83c\udfe0',
    title: 'Residential Design',
    desc: 'Kitchens, bathrooms, additions, ADUs, basement finishing, and whole-home renovations. Permit-ready drawings included.',
    tags: ['Kitchen Remodels', 'Bathroom Renovations', 'Additions', 'ADUs'],
  },
  {
    icon: '\ud83c\udfe2',
    title: 'Commercial Buildouts',
    desc: 'Office renovations, retail spaces, restaurant builds, and tenant improvements. ADA compliant, code-ready.',
    tags: ['Office', 'Retail', 'Restaurant', 'Tenant Improvement'],
  },
  {
    icon: '\ud83d\udcd0',
    title: 'As-Built Documentation',
    desc: 'Precise site measurements and existing condition drawings in AutoCAD. Essential before any renovation project.',
    tags: ['Site Surveys', 'Floor Plans', 'Elevations', 'CAD Files'],
  },
  {
    icon: '\ud83c\udfa8',
    title: '3D Visualization',
    desc: 'Photorealistic renderings and virtual walkthroughs so you can see your project before construction begins.',
    tags: ['Renderings', 'Walkthroughs', 'Material Boards', 'VR Ready'],
  },
  {
    icon: '\ud83d\udccb',
    title: 'Permit Drawings',
    desc: 'Complete permit-ready drawing sets that meet local jurisdiction requirements. Code compliance built in.',
    tags: ['Code Compliant', 'Jurisdiction Ready', 'Structural Notes', 'MEP Coordination'],
  },
  {
    icon: '\ud83d\udd27',
    title: 'Construction Administration',
    desc: 'Ongoing architect support during construction \u2014 RFI responses, site visits, and contractor coordination.',
    tags: ['RFI Support', 'Site Visits', 'Shop Drawings', 'Change Orders'],
  },
]

const process = [
  { num: 1, title: 'Free Consultation', desc: 'Discuss your project goals, budget, and timeline with a licensed architect. We match you with the right professional.' },
  { num: 2, title: 'Site Documentation', desc: 'We visit the site to measure and document existing conditions. As-built drawings created in AutoCAD.' },
  { num: 3, title: 'Concept Design', desc: 'Receive 2\u20134 initial design concepts based on your requirements. Review and select your preferred direction.' },
  { num: 4, title: 'Design Development', desc: 'Refine the chosen concept with detailed drawings, material selections, and specifications.' },
  { num: 5, title: 'Permit Drawings', desc: 'Prepare complete permit-ready drawings that meet all code requirements for your jurisdiction.' },
  { num: 6, title: 'Build Support', desc: 'Optional construction administration with RFI responses, site visits, and contractor coordination.' },
]

const packages = [
  {
    name: 'As-Built Only',
    price: 'From $499',
    desc: 'Existing conditions documentation for renovation projects.',
    turnaround: '3\u20135 business days',
    features: ['Site visit & measurements', 'Floor plans in AutoCAD', 'Elevations', 'CAD & PDF files delivered'],
  },
  {
    name: 'Design + Permit',
    price: 'From $1,999',
    desc: 'Complete design and permit-ready drawing package.',
    turnaround: '2\u20134 weeks',
    featured: true,
    features: ['Everything in As-Built', '2\u20134 concept designs', 'Design development', 'Permit drawings', 'Unlimited revisions', 'Permit submission support'],
  },
  {
    name: 'Full Service',
    price: 'From $4,999',
    desc: 'Design through construction with architect oversight.',
    turnaround: '4\u20138 weeks + CA',
    features: ['Everything in Design + Permit', '3D renderings', 'Construction documents', 'CA site visits', 'Contractor coordination', 'RFI management'],
  },
]

const projectTypes = [
  'Kitchen Remodels', 'Bathroom Renovations', 'Additions & Extensions', 'ADUs & Carriage Houses',
  'Basement Finishing', 'New Construction', 'Historic Renovations', 'Commercial Buildouts',
  'Restaurant Design', 'Office Renovations', 'Retail Spaces', 'Tenant Improvements',
]

const ownerCards = [
  { icon: '\u2705', title: 'Licensed Architects', desc: 'Every project is led by a licensed architect with verified credentials, E&O insurance, and local code expertise.' },
  { icon: '\u26a1', title: 'Fast Turnaround', desc: 'As-builts in 3\u20135 days. Design packages in 2\u20134 weeks. Rush service available for time-sensitive projects.' },
  { icon: '\ud83d\udd17', title: 'Connected to Engineering', desc: 'If your project needs structural, MEP, or civil \u2014 architecture coordinates directly with Kealee Engineering. One team.' },
  { icon: '\ud83d\udcb2', title: 'Fixed Pricing', desc: 'All quotes include revisions. No hourly billing that spirals. You know the cost before you start.' },
  { icon: '\ud83d\udce6', title: 'Seamless Permit Handoff', desc: 'Drawings auto-populate your permit applications in Kealee Permits. No re-uploading or reformatting.' },
  { icon: '\ud83c\udfaf', title: 'Unlimited Revisions', desc: 'Design + Permit and Full Service packages include unlimited revisions until you are satisfied with the design.' },
]

export default function ArchitectClient() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="arc-hero">
        <div className="arc-hero-badge">
          <span className="arc-badge-dot" />
          LICENSED ARCHITECTS &middot; PERMIT-READY DRAWINGS
        </div>
        <div className="arc-hero-layout">
          <div>
            <h1>
              Architecture That<br />
              Gets <em>Built</em>
            </h1>
            <p className="arc-hero-sub">
              Licensed architects for residential and commercial projects. From concept
              designs to permit-ready drawings and construction administration &mdash;
              with fixed pricing and unlimited revisions.
            </p>
            <div className="arc-hero-actions">
              <Link href="/contact" className="arc-btn-indigo">
                Schedule Consultation
              </Link>
              <Link href="/contact" className="arc-btn-outline-white">
                View Portfolio
              </Link>
            </div>
          </div>
          <div className="arc-hero-stats">
            <div className="arc-hero-stat-grid">
              <div className="arc-hero-stat">
                <div className="arc-hero-stat-num">500+</div>
                <div className="arc-hero-stat-label">Projects completed</div>
              </div>
              <div className="arc-hero-stat">
                <div className="arc-hero-stat-num">3 Days</div>
                <div className="arc-hero-stat-label">As-built turnaround</div>
              </div>
              <div className="arc-hero-stat">
                <div className="arc-hero-stat-num">12</div>
                <div className="arc-hero-stat-label">Jurisdictions covered</div>
              </div>
              <div className="arc-hero-stat">
                <div className="arc-hero-stat-num">\u221e</div>
                <div className="arc-hero-stat-label">Revisions included</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="arc-section" style={{ background: 'var(--arc-cream)' }}>
        <div className="arc-section-label">What We Offer</div>
        <h2 className="arc-section-title">
          Full-Service<br />Architecture
        </h2>
        <p className="arc-section-sub">
          From as-built measurements to construction administration &mdash; our licensed
          architects handle every phase of your project.
        </p>

        <div className="arc-services-grid">
          {services.map((s) => (
            <div className="arc-service-card" key={s.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--arc-navy)', marginBottom: 8 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--arc-gray-500)', marginBottom: 16 }}>
                {s.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {s.tags.map((t) => (
                  <span className="arc-type-chip" key={t} style={{ fontSize: 12, padding: '4px 12px' }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="arc-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="arc-trust-icon">{'\u2705'}</div>
          <div className="arc-trust-title">Licensed & Insured</div>
          <div className="arc-trust-desc">
            Every architect on our platform is a licensed professional with E&O insurance
            and verified credentials in your jurisdiction.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="arc-trust-icon">{'\ud83d\udd17'}</div>
          <div className="arc-trust-title">Integrated Platform</div>
          <div className="arc-trust-desc">
            Architecture connects directly with engineering, estimation, and permits.
            One coordinated team, no miscommunication.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="arc-trust-icon">{'\ud83d\udcc4'}</div>
          <div className="arc-trust-title">Permit-Ready</div>
          <div className="arc-trust-desc">
            Every drawing set is designed to meet local code requirements. Permit
            submission support included with Design + Permit and Full Service packages.
          </div>
        </div>
      </div>

      {/* ── PROCESS ── */}
      <section className="arc-section">
        <div className="arc-section-label">Our Process</div>
        <h2 className="arc-section-title">
          From Consultation<br />to Construction
        </h2>
        <p className="arc-section-sub">
          A clear, structured process that takes your project from initial consultation
          through permit-ready drawings and optional construction support.
        </p>

        <div className="arc-process-grid">
          {process.map((step) => (
            <div className="arc-process-card" key={step.num}>
              <div className="arc-process-num">{step.num}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--arc-navy)', marginBottom: 8 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--arc-gray-500)' }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROJECT TYPES ── */}
      <section className="arc-section" style={{ background: 'var(--arc-cream)' }}>
        <div className="arc-section-label">Project Types</div>
        <h2 className="arc-section-title">We Design It All</h2>
        <p className="arc-section-sub">
          Residential, commercial, renovations, new construction &mdash; our architects
          have experience across every project type.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {projectTypes.map((t) => (
            <span className="arc-type-chip" key={t}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="arc-section">
        <div className="arc-section-label">Pricing</div>
        <h2 className="arc-section-title">Fixed Pricing, No Surprises</h2>
        <p className="arc-section-sub">
          All packages include revisions. No hourly billing. You know the cost before you start.
        </p>

        <div className="arc-pricing-grid">
          {packages.map((pkg) => (
            <div
              className={`arc-pricing-card ${pkg.featured ? 'featured' : ''}`}
              key={pkg.name}
              style={{ position: 'relative' }}
            >
              {pkg.featured && <div className="arc-pricing-badge">MOST POPULAR</div>}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: pkg.featured ? 'var(--arc-indigo-light)' : 'var(--arc-indigo)', marginBottom: 10 }}>
                {pkg.turnaround}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: pkg.featured ? 'white' : 'var(--arc-navy)', marginBottom: 4 }}>
                {pkg.name}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: pkg.featured ? 'var(--arc-indigo-light)' : 'var(--arc-navy)', fontFamily: 'monospace', margin: '12px 0 8px' }}>
                {pkg.price}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: pkg.featured ? 'rgba(255,255,255,0.7)' : 'var(--arc-gray-500)', marginBottom: 16 }}>
                {pkg.desc}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {pkg.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: pkg.featured ? 'rgba(255,255,255,0.85)' : 'var(--arc-gray-700)' }}>
                    <span style={{ color: pkg.featured ? 'var(--arc-indigo-light)' : 'var(--arc-indigo)', fontWeight: 700 }}>{'\u2713'}</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                style={{
                  display: 'block', width: '100%', padding: 12, borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
                  textDecoration: 'none', transition: 'all 0.2s', border: 'none',
                  background: pkg.featured ? 'var(--arc-indigo)' : 'transparent',
                  color: pkg.featured ? 'white' : 'var(--arc-navy)',
                  ...(pkg.featured ? {} : { border: '1.5px solid var(--arc-navy)' }),
                }}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KEALEE ARCHITECTURE ── */}
      <section className="arc-section" style={{ background: 'var(--arc-cream)' }}>
        <div className="arc-section-label">Why Kealee Architecture</div>
        <h2 className="arc-section-title">
          Design That Moves<br />to Construction
        </h2>
        <p className="arc-section-sub">
          Kealee Architecture isn&apos;t a freelancer marketplace &mdash; it&apos;s a
          coordinated network of licensed architects who deliver permit-ready drawings
          that connect to your entire project.
        </p>
        <div className="arc-owner-grid">
          {ownerCards.map((card) => (
            <div className="arc-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--arc-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--arc-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="arc-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Design<br />
            <span style={{ color: 'var(--arc-indigo-light)', fontStyle: 'italic' }}>
              Your Project?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Schedule a free consultation with a licensed architect. Fixed pricing, unlimited revisions.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="arc-btn-indigo">
              Schedule Consultation
            </Link>
            <Link href="/contact" className="arc-btn-outline-white">
              View Packages
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Licensed architects. E&O insured. As-builts in as fast as 3 business days.
          </p>
        </div>
      </section>
    </div>
  )
}
