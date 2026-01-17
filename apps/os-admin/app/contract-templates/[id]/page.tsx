'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../lib/api'

export default function ContractTemplateEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [template, setTemplate] = useState<any>(null)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getContractTemplate(params.id)
        const t = res.template
        setTemplate(t)
        setName(t.name)
        setBody(t.body)
        setIsActive(t.isActive)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load template')
      } finally {
        setLoading(false)
      }
    })()
  }, [params.id])

  const handleSave = async () => {
    if (!name.trim() || !body.trim()) {
      setError('Name and body are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Update template (creates new version if body/variables change)
      const updated = await api.updateContractTemplate(params.id, {
        name: name.trim(),
        body: body.trim(),
        isActive,
      })
      router.push(`/contract-templates/${updated.template.id}`)
      // Reload to get updated template
      window.location.reload()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update template')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template? It will be deactivated if used by any contracts.')) {
      return
    }

    try {
      await api.deleteContractTemplate(params.id)
      router.push('/contract-templates')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete template')
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <div>Loading...</div>
      </main>
    )
  }

  if (!template) {
    return (
      <main style={{ padding: 24 }}>
        <div>Template not found</div>
        <Link href="/contract-templates">Back to templates</Link>
      </main>
    )
  }

  const extractVariables = (text: string): string[] => {
    const regex = /\$\{([^}]+)\}/g
    const matches = Array.from(text.matchAll(regex))
    return Array.from(new Set(matches.map((m) => m[1].trim())))
  }

  const variables = extractVariables(body)

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/contract-templates" style={{ textDecoration: 'underline' }}>
          ← Back to templates
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Edit Contract Template</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: template.isActive ? '#dcfce7' : '#f3f4f6',
              color: template.isActive ? '#166534' : '#6b7280',
            }}
          >
            {template.isActive ? 'Active' : 'Inactive'}
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: '#dbeafe',
              color: '#1e40af',
            }}
          >
            v{template.version}
          </span>
        </div>
      </div>
      <p style={{ color: '#52525b', marginBottom: 24 }}>
        {template.orgId ? 'Org-specific template' : 'Global template'}
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }} htmlFor="name">
            Template Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }} htmlFor="body">
            Template Body (HTML) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {variables.length > 0 ? (
            <div
              style={{
                marginBottom: 8,
                padding: 12,
                backgroundColor: '#f3f4f6',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <strong>Detected variables:</strong> {variables.join(', ')}
            </div>
          ) : null}
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={20}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 500 }}>Active</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: saving ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
          <Link
            href={`/contract-templates/${params.id}/preview`}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            Preview
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </main>
  )
}
