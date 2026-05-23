'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PortalAdminLoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') ?? '/'
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? 'Login failed')
      }
      router.push(next)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 22 }}>Kealee v30 Admin</h1>
      <p style={{ color: '#64748b', fontSize: 14 }}>Sign in to edit bot prompts and view metrics.</p>
      <form onSubmit={submit} style={{ marginTop: 20 }}>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
            width: '100%',
            padding: 12,
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {error && <p style={{ color: '#b91c1c', marginTop: 12, fontSize: 13 }}>{error}</p>}
    </main>
  )
}
