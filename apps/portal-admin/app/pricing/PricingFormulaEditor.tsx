'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const apiPath = (p: string) => `/api/v30/${p}`

export function PricingFormulaEditor() {
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(apiPath('admin/pricing'), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setJson(JSON.stringify(data.formula ?? data, null, 2))
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const body = JSON.parse(json) as Record<string, unknown>
      const res = await fetch(apiPath('admin/pricing'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error ?? 'Save failed')
      setMessage(`Saved v${out.version ?? 1} — live on next /get-concept quote`)
      if (out.formula) setJson(JSON.stringify(out.formula, null, 2))
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading formula…</p>

  return (
    <div>
      <Link href="/" style={{ fontSize: 13, color: '#7c3aed' }}>← Admin</Link>
      <h1 style={{ fontSize: 22, marginTop: 8 }}>v30 pricing formula (live)</h1>
      <p style={{ fontSize: 13, color: '#64748b' }}>
        Changes apply immediately to new intake quotes. Floorplan add-ons use{' '}
        <code>floorplanScopeCosts</code> (whole house scales with sqft).
      </p>
      <textarea
        value={json}
        onChange={e => setJson(e.target.value)}
        style={{
          width: '100%',
          minHeight: 420,
          marginTop: 12,
          fontFamily: 'monospace',
          fontSize: 11,
          padding: 12,
          borderRadius: 8,
          border: '1px solid #cbd5e1',
        }}
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          marginTop: 12,
          padding: '10px 20px',
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Save to database'}
      </button>
      {message && <p style={{ marginTop: 12, fontSize: 13 }}>{message}</p>}
    </div>
  )
}
