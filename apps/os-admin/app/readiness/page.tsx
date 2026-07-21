import Link from 'next/link'
import { api } from '../../lib/api'

export const dynamic = 'force-dynamic'

export default async function ReadinessAdminPage() {
  // Simple admin view: list templates (global + org-specific by query later)
  let templates: any[] = []
  try {
    const res = await api.getReadinessTemplates()
    templates = res.templates || []
  } catch {
    templates = []
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Readiness Templates</h1>
      <p style={{ marginTop: 8, color: '#52525b' }}>
        Configure default readiness checklist templates (per project category).
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href="/dashboard" style={{ textDecoration: 'underline' }}>
          Back to dashboard
        </Link>
      </div>

      <section style={{ marginTop: 16 }}>
        {templates.length === 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
            No templates found yet. Create them via API:
            <pre style={{ marginTop: 8, overflowX: 'auto', fontSize: 12 }}>
              {`POST /readiness/templates\nPOST /readiness/templates/:id/items`}
            </pre>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {templates.map((t: any) => (
              <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#52525b' }}>
                      category: {t.category ?? 'ALL'} • active: {String(t.isActive)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#52525b' }}>items: {t.items?.length ?? 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

