'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/** Same-origin proxy — avoids CORS and fixes localhost:3020 → API */
const apiPath = (p: string) => `/api/v30/${p}`

export function BotPromptEditor({ botType }: { botType: string }) {
  const [prompt, setPrompt] = useState('')
  const [codeDefault, setCodeDefault] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(apiPath(`admin/bots/${botType}`), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setPrompt(data.activePrompt ?? data.codeDefaultPrompt ?? '')
        setCodeDefault(data.codeDefaultPrompt ?? '')
      })
      .finally(() => setLoading(false))
  }, [botType])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(apiPath(`admin/bots/${botType}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: prompt, enabled: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setMessage(`Saved v${json.version ?? 1} — live on next bot run`)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function resetToCode() {
    setPrompt(codeDefault)
    setMessage('Reset to code default (click Save to persist)')
  }

  if (loading) return <p>Loading prompt…</p>

  return (
    <div>
      <Link href="/" style={{ fontSize: 13, color: '#7c3aed' }}>← Admin</Link>
      <h1 style={{ fontSize: 22, marginTop: 8 }}>{botType} — live prompt editor</h1>
      <p style={{ fontSize: 13, color: '#64748b' }}>
        Overrides apply via <code>resolveV30SystemPrompt</code> on API/os-ai-orch. Image renders use Replicate, not Pascal.
      </p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
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
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
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
        <button type="button" onClick={resetToCode} style={{ padding: '10px 16px', borderRadius: 8 }}>
          Reset to code default
        </button>
      </div>
      {message && <p style={{ marginTop: 12, fontSize: 13, color: '#334155' }}>{message}</p>}
    </div>
  )
}
