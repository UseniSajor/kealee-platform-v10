import Link from 'next/link'

export default function ProductSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; product?: string }
}) {
  const product = searchParams.product ?? ''

  const PRODUCT_MESSAGES: Record<string, { title: string; next: string; timeline: string }> = {
    'ai-design':           { title: 'AI Design Report ordered', next: 'Upload your project photos in your dashboard to start generation.', timeline: 'Delivered within 24 hours' },
    'permit-package':      { title: 'Permit Package ordered', next: 'A permit specialist will contact you within 1 business day to gather your documents.', timeline: 'Filing within 3–5 business days' },
    'cost-estimate':       { title: 'Cost Estimate ordered', next: 'Submit your project scope and any existing drawings in your dashboard.', timeline: 'Delivered within 3–5 business days' },
    'adu-bundle':          { title: 'ADU Bundle ordered', next: 'We\'ll start your lot eligibility check immediately. Expect a concept floor plan within 48 hours.', timeline: 'Concept in 48 hrs · Permit filing within 5 days' },
    'pm-advisory':         { title: 'PM Advisory ordered', next: 'A project manager will contact you within 1 business day to sync on your project schedule.', timeline: 'Kick-off call within 1–2 business days' },
    'certified-estimate':  { title: 'Certified Cost Estimate ordered', next: 'Submit your project documents and any existing drawings in your dashboard.', timeline: 'Delivered within 5–7 business days' },
    'historic-renovation': { title: 'Historic Renovation order received', next: 'A preservation specialist will review your property designation and contact you within 2 business days.', timeline: 'Initial assessment within 2 business days' },
    'water-mitigation':    { title: 'Water Mitigation Assessment ordered', next: 'Submit photos of the affected areas and your property address in your dashboard.', timeline: 'Assessment delivered within 48 hours' },
    'basement':            { title: 'Basement Concept Report ordered', next: 'Upload photos of your basement space in your dashboard to start generation.', timeline: 'Delivered within 24 hours' },
  }

  const msg = PRODUCT_MESSAGES[product] ?? {
    title: 'Order confirmed',
    next: 'We\'ll be in touch shortly with next steps.',
    timeline: 'Within 1–2 business days',
  }

  return (
    <main style={{ fontFamily: 'var(--font-dm, DM Sans, sans-serif)', color: 'var(--ink)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        {/* Check icon */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FFF4', border: '2px solid #3A7D52', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#3A7D52" strokeWidth="2.5" style={{ width: 32, height: 32 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
          {msg.title}
        </h1>
        <p style={{ fontSize: 16, color: '#3D4040', lineHeight: 1.75, marginBottom: 8 }}>
          {msg.next}
        </p>
        <p style={{ fontSize: 14, color: '#6B7070', marginBottom: 36 }}>
          ⏱ {msg.timeline}
        </p>

        {/* Confirmation note */}
        <div style={{ background: '#F8F9F9', border: '1px solid #E2E1DC', borderRadius: 12, padding: '20px 24px', marginBottom: 36, textAlign: 'left' }}>
          <p style={{ fontSize: 14, color: '#3D4040', lineHeight: 1.7, margin: 0 }}>
            A confirmation email has been sent to your inbox. If you don&apos;t see it within a few minutes, check your spam folder or contact us at <a href="mailto:support@kealee.com" style={{ color: '#C8521A', textDecoration: 'none' }}>support@kealee.com</a>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A1C1B', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            View your dashboard →
          </Link>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #E2E1DC', color: '#1A1C1B', padding: '12px 24px', borderRadius: 8, fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
