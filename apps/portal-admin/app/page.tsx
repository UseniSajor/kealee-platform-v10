import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function fetchJson(path: string) {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PortalAdminPage() {
  const [bots, metrics] = await Promise.all([
    fetchJson('/v30/admin/bots'),
    fetchJson('/v30/admin/metrics'),
  ])

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.1em' }}>PORTAL ADMIN · V30</p>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Kealee v30 dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Bot registry, pricing formula, and execution metrics. API: <code>{API}/v30/admin/*</code>
      </p>

      <section style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Metrics</h2>
        {metrics ? (
          <pre style={{ fontSize: 12, overflow: 'auto' }}>{JSON.stringify(metrics, null, 2)}</pre>
        ) : (
          <p style={{ color: '#94a3b8' }}>Enable v30 on API and run migration to load metrics.</p>
        )}
      </section>

      <section style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Bots ({bots?.bots?.length ?? 0})</h2>
        <ul style={{ paddingLeft: 20, fontSize: 14 }}>
          {(bots?.bots ?? []).map((b: { displayName: string; botType: string; defaultModel: string }) => (
            <li key={b.botType}>
              <Link href={`/bots/${b.botType}`}>{b.displayName}</Link> — {b.defaultModel}
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24, fontSize: 13 }}>
        <Link href="/pricing">Pricing formula</Link> · <Link href="/analytics">Analytics</Link>
      </p>
    </main>
  )
}
