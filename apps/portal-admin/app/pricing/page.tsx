import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default async function PricingAdminPage() {
  let data: unknown = null
  try {
    const res = await fetch(`${API}/v30/admin/pricing`, { cache: 'no-store' })
    if (res.ok) data = await res.json()
  } catch {
    /* offline */
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
      <Link href="/">← Admin</Link>
      <h1 style={{ fontSize: 22 }}>v30 pricing formula</h1>
      <pre style={{ fontSize: 12, background: '#f1f5f9', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <p style={{ fontSize: 13, color: '#64748b' }}>Live edits via Prisma <code>V30PricingFormula</code> (future).</p>
    </main>
  )
}
