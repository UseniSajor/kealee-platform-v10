'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const TIER_DETAILS: Record<string, { label: string; price: string; next: string }> = {
  basic: {
    label: 'Basic',
    price: '$99–$299',
    next: 'Your permit checklist and code summary will be emailed within 24 hours.',
  },
  professional: {
    label: 'Professional',
    price: '$349',
    next: 'A permit specialist will contact you within 1 business day to begin filing.',
  },
  premium: {
    label: 'Premium',
    price: '$599',
    next: 'Your dedicated specialist will contact you within 4 hours to start expedited processing.',
  },
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') ?? 'professional'
  const projectId = searchParams.get('project')
  const detail = TIER_DETAILS[tier] ?? TIER_DETAILS.professional

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>

      {/* Check icon */}
      <div style={{ width: 72, height: 72, background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
        ✓
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 800, color: '#14532d', margin: '0 0 12px' }}>
        Application Submitted
      </h1>
      <p style={{ fontSize: 16, color: '#4b5563', margin: '0 0 40px', lineHeight: 1.6 }}>
        Your AI-generated permit roadmap is being created now and will be reviewed by a permit specialist before any filing takes place.
      </p>

      {/* Tier card */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.08)', padding: 28, marginBottom: 24, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{detail.label} Plan</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{detail.price}</span>
        </div>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{detail.next}</p>
      </div>

      {/* What happens next */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.08)', padding: 28, marginBottom: 32, textAlign: 'left' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>What happens next</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            'Your AI permit roadmap is generated immediately.',
            'A Kealee specialist reviews the roadmap for accuracy and completeness.',
            'We contact you to confirm details and collect any missing documents.',
            tier !== 'basic' ? 'We file the permit application with your local building department.' : 'You receive your checklist and submit the application yourself.',
            'We track review status and coordinate inspections on your behalf.',
          ].map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, fontSize: 14, color: '#374151' }}>
              <span style={{ width: 24, height: 24, flexShrink: 0, background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#16a34a' }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {projectId && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24 }}>
          Project reference: <code style={{ fontFamily: 'monospace' }}>{projectId}</code>
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link
          href="/permits-only"
          style={{ display: 'block', padding: '14px 24px', borderRadius: 12, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
        >
          Back to Permit Services
        </Link>
        <Link
          href="/"
          style={{ display: 'block', padding: '14px 24px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}

export default function PermitConfirmationPage() {
  return (
    <main style={{ background: '#f0fdf4', minHeight: '100vh', padding: '64px 24px' }}>
      <Suspense fallback={<div style={{ textAlign: 'center', color: '#6b7280' }}>Loading…</div>}>
        <ConfirmationContent />
      </Suspense>
    </main>
  )
}
