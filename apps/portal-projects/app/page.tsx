import Link from 'next/link'

const WEB = process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'http://localhost:3000'

export default function PortalProjectsPage() {
  return (
    <main style={{ maxWidth: 560, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 26 }}>Kealee Projects Portal</h1>
      <p style={{ color: '#64748b', lineHeight: 1.6 }}>
        Customer workspaces live on web-main. After payment, open your project workspace with your intake ID.
      </p>
      <Link
        href={`${WEB}/get-concept`}
        style={{
          display: 'inline-block',
          marginTop: 20,
          padding: '12px 24px',
          background: '#7c3aed',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Start at Get Concept →
      </Link>
      <p style={{ marginTop: 24, fontSize: 13, color: '#94a3b8' }}>
        Example: <code>{WEB}/workspace/&lt;intakeId&gt;</code>
      </p>
    </main>
  )
}
