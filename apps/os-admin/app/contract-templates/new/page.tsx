'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../lib/api'

export default function NewContractTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  // Prompt 2.1: Simple WYSIWYG editor (using textarea with HTML support)
  // In production, you'd use a library like TinyMCE, Quill, or TipTap
  const [showVariables, setShowVariables] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !body.trim()) {
      setError('Name and body are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const template = await api.createContractTemplate({
        orgId: orgId || null,
        name: name.trim(),
        body: body.trim(),
        isActive,
      })
      router.push(`/contract-templates/${template.template.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create template')
      setSaving(false)
    }
  }

  // Extract variables from body
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

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>New Contract Template</h1>
      <p style={{ color: '#52525b', marginBottom: 24 }}>
        Create a contract template with variable substitution. Use $&#123;project.name&#125;, $&#123;owner.name&#125;, etc.
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
            placeholder="Standard Contract"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontWeight: 500 }} htmlFor="body">
              Template Body (HTML) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowVariables(!showVariables)}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              {showVariables ? 'Hide' : 'Show'} Variables
            </button>
          </div>
          {showVariables && variables.length > 0 ? (
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
            placeholder={`<h1>Project Contract</h1>
<p>This agreement is between <strong>${'{'}owner.name{'}'}</strong> and the contractor.</p>
<p>Project: <strong>${'{'}project.name{'}'}</strong></p>
<p>Property: ${'{'}property.address{'}'}, ${'{'}property.city{'}'}, ${'{'}property.state{'}'}</p>
...`}
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
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            <strong>Available variables:</strong> project.name, project.description, project.category, owner.name,
            owner.email, property.address, property.city, property.state, property.zip
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }} htmlFor="orgId">
              Organization (optional, leave empty for global)
            </label>
            <input
              id="orgId"
              type="text"
              value={orgId || ''}
              onChange={(e) => setOrgId(e.target.value.trim() || null)}
              placeholder="UUID or leave empty"
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 500 }}>Active</span>
            </label>
          </div>
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
            {saving ? 'Creating...' : 'Create Template'}
          </button>
          <Link
            href="/contract-templates"
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  )
}
