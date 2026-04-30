export default function Home() {
  const apps = [
    { name: 'Owner Portal', slug: 'portal-owner', description: 'Project intake and homeowner dashboard' },
    { name: 'Contractor Portal', slug: 'portal-contractor', description: 'Bid management and job tracking' },
    { name: 'Developer Portal', slug: 'portal-developer', description: 'Feasibility and development pipeline' },
    { name: 'Project Owner', slug: 'm-project-owner', description: 'Mobile-first project management' },
    { name: 'Marketplace', slug: 'm-marketplace', description: 'Services and contractor marketplace' },
    { name: 'Ops & Services', slug: 'm-ops-services', description: 'Operations and service delivery' },
    { name: 'Permits & Inspections', slug: 'm-permits-inspections', description: 'Permit tracking and inspections' },
    { name: 'Architect', slug: 'm-architect', description: 'Design and drawing management' },
    { name: 'Finance & Trust', slug: 'm-finance-trust', description: 'Payments, escrow, and financial tools' },
    { name: 'Admin', slug: 'os-admin', description: 'Platform administration' },
  ]

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc',
      padding: '60px 24px',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 8,
            padding: '4px 14px',
            fontSize: 13,
            color: '#a5b4fc',
            marginBottom: 20,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            v20
          </div>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            margin: '0 0 12px',
            background: 'linear-gradient(90deg, #e2e8f0 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Kealee Platform
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', margin: 0, maxWidth: 520 }}>
            Full-lifecycle construction development — from intake to certificate of occupancy.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {apps.map((app) => (
            <div
              key={app.slug}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '20px 24px',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 6 }}>
                {app.slug}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                {app.name}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {app.description}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', color: '#334155', fontSize: 13 }}>
          18 apps · 11 services · 34 packages · 13 AI bots
        </div>
      </div>
    </main>
  )
}
