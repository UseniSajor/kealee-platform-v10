import Link from 'next/link'
import { api } from '../../lib/api'

export const dynamic = 'force-dynamic'

export default async function ContractTemplatesAdminPage() {
  let templates: any[] = []
  try {
    const res = await api.getContractTemplates({ activeOnly: false })
    templates = res.templates || []
  } catch {
    templates = []
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Contract Templates</h1>
          <p style={{ marginTop: 8, color: '#52525b' }}>
            Manage contract templates with variable substitution ($&#123;project.name&#125;, $&#123;owner.name&#125;, etc.)
          </p>
        </div>
        <Link
          href="/contract-templates/new"
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          New Template
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link href="/dashboard" style={{ textDecoration: 'underline' }}>
          Back to dashboard
        </Link>
      </div>

      <section style={{ marginTop: 16 }}>
        {templates.length === 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
            No templates found yet. Create your first template.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {templates.map((t: any) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        backgroundColor: t.isActive ? '#dcfce7' : '#f3f4f6',
                        color: t.isActive ? '#166534' : '#6b7280',
                      }}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                      }}
                    >
                      v{t.version}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#52525b', marginBottom: 8 }}>
                    {t.orgId ? `Org-specific` : 'Global template'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      maxHeight: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    dangerouslySetInnerHTML={{ __html: t.body.substring(0, 200) + '...' }}
                  />
                  {t.variables && Array.isArray(t.variables) && t.variables.length > 0 ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#52525b' }}>
                      Variables: {t.variables.map((v: any) => v.key || v).join(', ')}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/contract-templates/${t.id}`}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      textDecoration: 'none',
                      color: '#374151',
                      fontSize: 14,
                    }}
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/contract-templates/${t.id}/preview`}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      textDecoration: 'none',
                      color: '#374151',
                      fontSize: 14,
                    }}
                  >
                    Preview
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
