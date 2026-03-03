'use client'

import Link from 'next/link'
import './pm.css'

const features = [
  { icon: '\ud83d\udcca', title: 'Milestone Tracking', desc: 'Track project phases with customizable milestones and automatic client notifications when work is complete.' },
  { icon: '\ud83d\udcf7', title: 'Progress Documentation', desc: 'Capture and organize site photos with date stamps and location tagging. Auto-generated client update reports.' },
  { icon: '\ud83d\udcb0', title: 'Payment Management', desc: 'Submit milestone completion requests and track payment status in real-time through escrow-backed workflows.' },
  { icon: '\ud83d\udc65', title: 'Sub Coordination', desc: 'Centralized communication hub for your crews, subs, and project stakeholders. Assignment tracking and notifications.' },
  { icon: '\ud83d\udcc5', title: 'Schedule Management', desc: 'Gantt charts, critical path tracking, and automated delay notifications. Keep every project on timeline.' },
  { icon: '\ud83d\udcc1', title: 'Document Control', desc: 'Secure storage for contracts, drawings, RFIs, and submittals with version control and permission management.' },
]

const modules = [
  { title: 'Contractor Dashboard', desc: 'Your command center for managing active projects, tracking payments, and coordinating with clients.', chips: ['Active Projects', 'Payment Status', 'Upcoming Milestones', 'Client Messages'] },
  { title: 'Project Execution', desc: 'Tools to manage project phases from groundbreaking to final walkthrough with complete documentation.', chips: ['Task Management', 'Payment Requests', 'RFI Submission', 'Change Order Tracking'] },
  { title: 'Weekly Reporting', desc: 'Automated weekly reports sent to clients with customizable templates. Professional client communication.', chips: ['Progress Summary', 'Issues & Risks', 'Next Week Lookahead', 'Photo Documentation'] },
  { title: 'Mobile App', desc: 'Full functionality on iOS and Android for on-site updates, photo capture, and instant communication.', chips: ['Offline Mode', 'Photo Capture', 'Push Notifications', 'Quick Updates'] },
]

const tiers = [
  {
    name: 'Essentials',
    price: '$99',
    period: '/mo',
    desc: 'For small teams getting started.',
    features: ['Up to 5 users', '3 active projects', 'Basic reporting', 'Email support', 'Mobile app'],
  },
  {
    name: 'Performance',
    price: '$199',
    period: '/mo',
    desc: 'For growing contractors.',
    featured: true,
    features: ['Up to 20 users', '10 active projects', 'Advanced analytics', 'All integrations', 'Priority support', 'Custom templates'],
  },
  {
    name: 'Scale',
    price: '$349',
    period: '/mo',
    desc: 'For established builders.',
    features: ['Up to 50 users', '20 active projects', 'Custom workflows', 'API access', 'Dedicated support', 'Advanced permissions'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations.',
    features: ['Unlimited users', 'Unlimited projects', 'SSO/SAML', 'Custom integrations', 'SLA guarantee', 'Account manager'],
  },
]

const integrations = ['QuickBooks', 'Procore', 'Google Drive', 'Dropbox', 'DocuSign', 'Slack', 'Microsoft Teams', 'Zapier']

export default function PMClient() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="pm2-hero">
        <div className="pm2-hero-badge">
          <span className="pm2-badge-dot" />
          FOR CONTRACTORS & BUILDERS &middot; 14-DAY FREE TRIAL
        </div>
        <div className="pm2-hero-layout">
          <div>
            <h1>
              Project Management<br />
              <em>Built to Build</em>
            </h1>
            <p className="pm2-hero-sub">
              Manage projects, coordinate subs, track milestones, and get paid faster &mdash;
              all on one platform built specifically for contractors. Escrow-backed payments included.
            </p>
            <div className="pm2-hero-actions">
              <Link href="/contact" className="pm2-btn-sky">
                Start Free Trial
              </Link>
              <Link href="/contact" className="pm2-btn-outline-white">
                Schedule Demo
              </Link>
            </div>
          </div>
          <div className="pm2-hero-stats">
            <div className="pm2-hero-stat-grid">
              <div className="pm2-hero-stat">
                <div className="pm2-hero-stat-num">14</div>
                <div className="pm2-hero-stat-label">Day free trial, no card required</div>
              </div>
              <div className="pm2-hero-stat">
                <div className="pm2-hero-stat-num">50+</div>
                <div className="pm2-hero-stat-label">Users per team supported</div>
              </div>
              <div className="pm2-hero-stat">
                <div className="pm2-hero-stat-num">100+</div>
                <div className="pm2-hero-stat-label">Integrations via Zapier</div>
              </div>
              <div className="pm2-hero-stat">
                <div className="pm2-hero-stat-num">$99</div>
                <div className="pm2-hero-stat-label">Starting price per month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="pm2-section" style={{ background: 'var(--pm2-cream)' }}>
        <div className="pm2-section-label">Core Features</div>
        <h2 className="pm2-section-title">
          Everything You Need<br />to Run Your Projects
        </h2>
        <p className="pm2-section-sub">
          From milestone tracking to document control &mdash; every tool a contractor needs
          to manage projects, communicate with clients, and get paid on time.
        </p>

        <div className="pm2-features-grid">
          {features.map((f) => (
            <div className="pm2-feature-card" key={f.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--pm2-navy)', marginBottom: 8 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--pm2-gray-500)' }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="pm2-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pm2-trust-icon">{'\ud83d\udcf1'}</div>
          <div className="pm2-trust-title">Mobile First</div>
          <div className="pm2-trust-desc">
            Full iOS and Android app with offline mode. Update milestones, capture photos,
            and communicate from the job site.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pm2-trust-icon">{'\ud83d\udd12'}</div>
          <div className="pm2-trust-title">Escrow Integrated</div>
          <div className="pm2-trust-desc">
            Milestone payments flow through Kealee Finance escrow. Request payment when
            work is done. Get paid when it is approved.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pm2-trust-icon">{'\ud83d\udd17'}</div>
          <div className="pm2-trust-title">Connected Platform</div>
          <div className="pm2-trust-desc">
            Your PM software connects to Kealee Design, Permits, and Finance. One platform
            for the entire project lifecycle.
          </div>
        </div>
      </div>

      {/* ── MODULES ── */}
      <section className="pm2-section">
        <div className="pm2-section-label">Platform Modules</div>
        <h2 className="pm2-section-title">
          Four Modules,<br />One Platform
        </h2>
        <p className="pm2-section-sub">
          Each module is designed for a specific part of project management. Together,
          they give you complete control over every active project.
        </p>

        <div className="pm2-modules-grid">
          {modules.map((m) => (
            <div className="pm2-module-card" key={m.title}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pm2-navy)', marginBottom: 10 }}>
                {m.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--pm2-gray-500)', marginBottom: 16 }}>
                {m.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {m.chips.map((c) => (
                  <span className="pm2-module-chip" key={c}>{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pm2-section" style={{ background: 'var(--pm2-cream)' }}>
        <div className="pm2-section-label">Pricing</div>
        <h2 className="pm2-section-title">Start Free, Scale Up</h2>
        <p className="pm2-section-sub">
          14-day free trial on any plan. No credit card required. Month-to-month billing.
        </p>

        <div className="pm2-pricing-grid">
          {tiers.map((tier) => (
            <div
              className={`pm2-pricing-card ${tier.featured ? 'featured' : ''}`}
              key={tier.name}
              style={{ position: 'relative' }}
            >
              {tier.featured && <div className="pm2-pricing-badge">MOST POPULAR</div>}
              <div style={{ fontSize: 18, fontWeight: 700, color: tier.featured ? 'white' : 'var(--pm2-navy)', marginBottom: 4 }}>
                {tier.name}
              </div>
              <div style={{ margin: '12px 0 4px' }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: tier.featured ? 'var(--pm2-sky-light)' : 'var(--pm2-navy)', fontFamily: 'monospace' }}>
                  {tier.price}
                </span>
                <span style={{ fontSize: 14, color: tier.featured ? 'rgba(255,255,255,0.6)' : 'var(--pm2-gray-500)' }}>
                  {tier.period}
                </span>
              </div>
              <div style={{ fontSize: 13, color: tier.featured ? 'rgba(255,255,255,0.7)' : 'var(--pm2-gray-500)', marginBottom: 16 }}>
                {tier.desc}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: tier.featured ? 'rgba(255,255,255,0.85)' : 'var(--pm2-gray-700)' }}>
                    <span style={{ color: tier.featured ? 'var(--pm2-sky-light)' : 'var(--pm2-sky)', fontWeight: 700, fontSize: 12 }}>{'\u2713'}</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                style={{
                  display: 'block', width: '100%', padding: 10, borderRadius: 10,
                  fontSize: 13, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
                  textDecoration: 'none', transition: 'all 0.2s', border: 'none',
                  background: tier.featured ? 'var(--pm2-sky)' : 'transparent',
                  color: tier.featured ? 'white' : 'var(--pm2-navy)',
                  ...(tier.featured ? {} : { border: '1.5px solid var(--pm2-navy)' }),
                }}
              >
                {tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="pm2-section">
        <div className="pm2-section-label">Integrations</div>
        <h2 className="pm2-section-title">Works With Your Tools</h2>
        <p className="pm2-section-sub">
          Connect with the tools you already use. Native integrations plus 100+ more via Zapier.
        </p>
        <div className="pm2-integrations">
          {integrations.map((i) => (
            <span className="pm2-integration-chip" key={i}>{i}</span>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--pm2-gray-500)' }}>
          Plus 100+ more via Zapier
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="pm2-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Streamline<br />
            <span style={{ color: 'var(--pm2-sky-light)', fontStyle: 'italic' }}>
              Your Projects?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Start your 14-day free trial today. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="pm2-btn-sky">
              Start Free Trial
            </Link>
            <Link href="/contact" className="pm2-btn-outline-white">
              Schedule Demo
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Mobile app included. Escrow-backed payments. 100+ integrations.
          </p>
        </div>
      </section>
    </div>
  )
}
